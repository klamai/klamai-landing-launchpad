import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;
// @ts-ignore - Deno import for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const auth = req.headers.get('Authorization') || '';
    const sb = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: auth } } });
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      proposal_token,
      caso_id: body_caso_id, // Renombramos para evitar conflicto de nombres
      solicitud_id = null, // NUEVO: Capturamos el ID de la solicitud
      consent_type = 'proposal_view',
      accepted_terms = false,
      accepted_privacy = false,
      accepted_marketing = false,
      policy_terms_version = 1,
      policy_privacy_version = 1,
      cookies_policy_version = null,
      link_only = false,
    } = body || {};

    let caso_id: string | null = body_caso_id || null; // Priorizamos el caso_id del body
    let user_id: string | null = null;

    // Si hay sesión, capturar user_id
    const { data: session } = await sb.auth.getUser();
    user_id = session?.user?.id || null;

    // Buscar caso por token si se envía Y AÚN NO TENEMOS un caso_id
    if (proposal_token && !caso_id) {
      const { data, error } = await sb.rpc('get_proposal_by_token', { p_token: proposal_token });
      if (!error && Array.isArray(data) && data.length > 0) {
        const row: any = data[0];
        caso_id = row?.caso_id || null;
      }
    }

    // Datos de trazabilidad
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
    const user_agent = req.headers.get('user-agent') || null;

    // Si el usuario está logueado y hay proposal_token, vincular consentimientos anónimos previos a su user_id
    if (user_id && proposal_token) {
      try {
        await sbAdmin
          .from('consent_logs')
          .update({ user_id })
          .is('user_id', null)
          .eq('proposal_token', proposal_token);
      } catch (_) {
        // no bloquear por errores de vinculación
      }
    }

    // Si solo se requiere vincular, evitar inserción de nuevo registro
    if (link_only) {
      return json({ ok: true, linked: Boolean(user_id && proposal_token) });
    }

    const insertPayload: any = {
      user_id,
      caso_id,
      solicitud_id, // NUEVO: Añadimos el ID de la solicitud al payload
      proposal_token: proposal_token || null,
      consent_type,
      accepted_terms,
      accepted_privacy,
      accepted_marketing,
      policy_terms_version,
      policy_privacy_version,
      cookies_policy_version,
      ip,
      user_agent,
    };

    const { error: insErr } = await sb.from('consent_logs').insert(insertPayload);
    if (insErr) return json({ error: 'No se pudo registrar el consentimiento', details: String(insErr.message || insErr) }, 400);

    // Si hay un usuario logueado, actualizar su perfil con el estado del consentimiento
    if (user_id && (accepted_terms || accepted_privacy)) {
      const profileUpdate: { [key: string]: unknown } = {
        // Si se aceptó cualquiera de las dos, marcamos que el usuario ha aceptado las políticas
        acepta_politicas: accepted_terms && accepted_privacy,
        politicas_aceptadas_at: new Date().toISOString(),
        // Guardamos la versión de las políticas que se acaban de aceptar
        politicas_version: `${policy_terms_version || 1};${policy_privacy_version || 1}`
      };

      await sbAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user_id);
    }

    // Marcar en caso (si aplica)
    if (caso_id && consent_type === 'proposal_view' && accepted_terms && accepted_privacy) {
      await sbAdmin.from('casos').update({ acepto_politicas_inicial: true }).eq('id', caso_id);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Fallo al registrar consentimiento', details: String(e) }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
}


