// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: 'Config inválida' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing auth' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Auth inválida' }, 401);
    const user = userData.user;

    const { caso_id } = await req.json();
    if (!caso_id) return json({ error: 'caso_id requerido' }, 400);

    // Perfil
    const { data: perfil } = await admin
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .maybeSingle();

    const isSuperAdmin = perfil?.role === 'abogado' && perfil?.tipo_abogado === 'super_admin';
    let hasAccess = isSuperAdmin;

    if (!hasAccess && perfil?.role === 'abogado' && perfil?.tipo_abogado === 'regular') {
      // Comprobar asignación activa o completada del abogado al caso
      const { data: asignacion } = await admin
        .from('asignaciones_casos')
        .select('id')
        .eq('caso_id', caso_id)
        .eq('abogado_id', user.id)
        .in('estado_asignacion', ['activa','completada'])
        .maybeSingle();
      hasAccess = !!asignacion;
    }

    if (!hasAccess) return json({ error: 'Acceso denegado' }, 403);

    const { data: pagos, error } = await admin
      .from('pagos')
      .select('*')
      .eq('caso_id', caso_id)
      .order('created_at', { ascending: false });

    if (error) return json({ error: error.message }, 500);

    return json({ pagos: pagos || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: 'Error listando pagos', details: msg }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

