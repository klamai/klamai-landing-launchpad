// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const log = (step: string, details?: any) => {
  try {
    console.log(`[CSCP-TOKEN] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
  } catch {
    console.log(`[CSCP-TOKEN] ${step}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || req.headers.get('origin') || '').replace(/\/$/, '');
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return json({ error: 'Variables de entorno requeridas no configuradas' }, 500);
    }

    const { proposal_token } = await req.json();
    if (!proposal_token || typeof proposal_token !== 'string') return json({ error: 'proposal_token requerido' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // Validar usuario autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Usuario no autenticado' }, 401);
    const userId = userData.user.id;

    // Resolver token → caso
    const { data: tok, error: tokErr } = await admin
      .from('proposal_tokens')
      .select('caso_id, expires_at')
      .eq('token', proposal_token)
      .single();
    if (tokErr || !tok) return json({ error: 'Token inválido' }, 400);
    if (!tok.expires_at || new Date(tok.expires_at).getTime() < Date.now()) return json({ error: 'Token expirado' }, 400);
    const casoId = tok.caso_id as string;

    // Cargar caso
    const { data: caso, error: casoErr } = await admin
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single();
    if (casoErr || !caso) return json({ error: 'Caso no encontrado' }, 404);

    // Autorización: superadmin o abogado asignado
    const { data: profile } = await admin
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', userId)
      .single();
    let authorized = false;
    if (profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin') authorized = true;
    if (!authorized) {
      const { data: asign } = await admin
        .from('asignaciones_casos')
        .select('id')
        .eq('caso_id', casoId)
        .eq('abogado_id', userId)
        .in('estado_asignacion', ['activa', 'completada']);
      authorized = Array.isArray(asign) && asign.length > 0;
    }
    if (!authorized) return json({ error: 'No autorizado para generar checkout de este caso' }, 403);

    // Estados permitidos
    const allowedStates = ['listo_para_propuesta', 'propuesta_enviada', 'esperando_pago'];
    if (!allowedStates.includes(caso.estado)) return json({ error: 'Estado del caso no permite checkout', estado_actual: caso.estado }, 400);

    // Stripe customer por email_borrador
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    let customerId: string | null = null;
    if (caso.email_borrador) {
      const existing = await stripe.customers.list({ email: caso.email_borrador, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
    }
    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: caso.email_borrador || undefined,
        name: `${caso.nombre_borrador || ''} ${caso.apellido_borrador || ''}`.trim() || undefined,
        phone: caso.telefono_borrador || undefined,
      });
      customerId = newCustomer.id;
    }

    // Config del plan
    const priceId = Deno.env.get('STRIPE_PRICE_ID_CONSULTA_ESTRATEGICA') || 'price_1Rc0kkI0mIGG72Op6Rk4GulG';
    const idempotencyKey = `token:${proposal_token}:${Math.floor(Date.now()/60000)}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      client_reference_id: casoId,
      success_url: `${appBaseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${casoId}`,
      cancel_url: `${appBaseUrl}/pago-cancelado?session_id={CHECKOUT_SESSION_ID}&caso_id=${casoId}`,
      metadata: { caso_id: casoId, via: 'proposal_token' },
    }, { idempotencyKey });

    await admin.from('casos').update({ stripe_session_id: session.id, estado: 'esperando_pago', updated_at: new Date().toISOString() }).eq('id', casoId);

    return json({ url: session.url, session_id: session.id });
  } catch (e) {
    return json({ error: 'Error creando checkout por token', details: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}


