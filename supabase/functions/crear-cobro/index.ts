// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Utilidades de sanitización para logs
const maskEmail = (email?: string) => {
  if (!email || typeof email !== 'string') return email;
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
};
const maskId = (id?: string) => {
  if (!id || typeof id !== 'string') return id;
  return `${id.slice(0, 6)}...`;
};
const sanitizeDetails = (value: any): any => {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 40 ? `${value.slice(0, 12)}...` : value;
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.toLowerCase().includes('email')) out[k] = maskEmail(v as string);
      else if (k.toLowerCase().includes('id')) out[k] = maskId(String(v));
      else if (k.toLowerCase().includes('url')) out[k] = typeof v === 'string' ? `${(v as string).split('?')[0]}?...` : v;
      else out[k] = sanitizeDetails(v);
    }
    return out;
  }
  return value;
};
const logStep = (step: string, details?: any) => {
  try {
    const detailsStr = details ? ` - ${JSON.stringify(sanitizeDetails(details))}` : '';
    console.log(`[CREAR-COBRO] ${step}${detailsStr}`);
  } catch {
    console.log(`[CREAR-COBRO] ${step}`);
  }
};

type ExencionTipo = 'none' | 'b2b_ue' | 'fuera_ue' | 'suplido' | 'ajg';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Función iniciada");

    // Entorno
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || req.headers.get("origin") || '').replace(/\/$/, '');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      return json({ error: "Variables de entorno requeridas no configuradas" }, 500);
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No se encontró token de autorización" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: "Error autenticando usuario" }, 401);
    }
    const user = userData.user;
    logStep("Usuario autenticado", { userId: user.id, email: user.email });

    // Input
    const body = await req.json();
    const caso_id: string = body?.caso_id;
    const concepto: string = (body?.concepto || '').toString().trim();
    const monto_base: number = Number(body?.monto_base);
    const exencion_tipo: ExencionTipo = (body?.exencion_tipo || 'none');

    if (!caso_id || !concepto || !isFinite(monto_base) || monto_base <= 0) {
      return json({ error: "Parámetros inválidos" }, 400);
    }

    // Perfil y permisos
    const { data: perfil } = await supabase
      .from('profiles')
      .select('id, role, tipo_abogado')
      .eq('id', user.id)
      .maybeSingle();

    const isAbogadoSuperAdmin = perfil?.role === 'abogado' && perfil?.tipo_abogado === 'super_admin';
    const isAbogadoRegular = perfil?.role === 'abogado' && perfil?.tipo_abogado === 'regular';
    const isLegacySuperadmin = perfil?.role === 'superadmin'; // compat

    if (!isAbogadoSuperAdmin && !isAbogadoRegular && !isLegacySuperadmin) {
      return json({ error: "Permisos insuficientes" }, 403);
    }

    // Caso válido y acceso del abogado si aplica
    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('id, cliente_id')
      .eq('id', caso_id)
      .single();
    if (casoError || !caso) {
      return json({ error: "Caso no encontrado" }, 404);
    }
    if (!caso.cliente_id) {
      return json({ error: "El caso no tiene cliente asociado (cliente_id)" }, 400);
    }

    if (isAbogadoRegular) {
      const { data: asignacion } = await supabase
        .from('asignaciones_casos')
        .select('id')
        .eq('caso_id', caso_id)
        .eq('abogado_id', user.id)
        .in('estado_asignacion', ['activa','completada'])
        .maybeSingle();
      if (!asignacion) {
        return json({ error: "Abogado no asignado al caso" }, 403);
      }
    }

    // Cálculo IVA
    const aplicaIva = exencion_tipo === 'none';
    const iva_tipo = aplicaIva ? 0.21 : 0;
    const iva_monto = round2(monto_base * iva_tipo);
    const monto_total = round2(monto_base + iva_monto);

    // Crear registro en pagos (pending)
    const solicitante_rol = isAbogadoSuperAdmin || isLegacySuperadmin ? 'superadmin' : 'abogado_regular';
    const { data: pagoInsert, error: pagoError } = await supabase
      .from('pagos')
      .insert({
        usuario_id: caso.cliente_id,
        caso_id,
        estado: 'processing',
        descripcion: `Cobro ad-hoc: ${concepto}`,
        concepto,
        tipo_cobro: 'ad_hoc',
        monto_base,
        iva_tipo,
        iva_monto,
        monto_total,
        // compat: algunas instalaciones aún requieren 'monto' (numeric)
        monto: monto_total,
        exento: !aplicaIva,
        exencion_motivo: exencion_tipo,
        solicitado_por: user.id,
        solicitante_rol,
        moneda: 'eur'
      })
      .select('id')
      .single();

    if (pagoError || !pagoInsert) {
      logStep('ERROR - insert pago', { error: pagoError?.message });
      return json({ error: 'No se pudo crear el registro de pago' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Email del cliente para prefijarlo en Checkout
    let customerEmail: string | undefined = undefined;
    try {
      const { data: perfilCliente } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', caso.cliente_id)
        .maybeSingle();
      customerEmail = perfilCliente?.email || undefined;
    } catch {}

    // Crear checkout con price_data (importe total con IVA)
    const extraMethods = (Deno.env.get('EXTRA_PAYMENT_METHODS') || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', ...extraMethods],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(monto_total * 100),
            product_data: {
              name: concepto,
              description: exencion_tipo === 'none' ? `Importe base: €${monto_base.toFixed(2)} + IVA 21% = Total €${monto_total.toFixed(2)}` : `Importe exento de IVA. Total €${monto_total.toFixed(2)}`
            },
          },
          quantity: 1,
        }
      ],
      client_reference_id: caso_id,
      success_url: `${appBaseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}&tipo=cobro&pago_id=${pagoInsert.id}`,
      cancel_url: `${appBaseUrl}/pago-cancelado?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}&tipo=cobro&pago_id=${pagoInsert.id}`,
      customer_email: customerEmail,
      custom_text: {
        submit: { message: 'Pago gestionado por klamAI. Guarda el comprobante.' },
        after_submit: { message: 'Gracias. Vuelve a tu caso para continuar.' }
      },
      metadata: {
        pago_id: pagoInsert.id,
        caso_id,
        solicitado_por: user.id,
        solicitante_rol,
        exencion_tipo,
      }
    });

    // Guardar stripe_session_id en pagos
    const { error: updError } = await supabase
      .from('pagos')
      .update({ stripe_session_id: session.id })
      .eq('id', pagoInsert.id);
    if (updError) {
      logStep('WARN - no se pudo guardar stripe_session_id', { error: updError.message });
    }

    logStep('Cobro creado', { pago_id: pagoInsert.id, sessionId: session.id });
    return json({ url: session.url, session_id: session.id, pago_id: pagoInsert.id });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep('ERROR crear-cobro', { message: msg });
    return json({ error: 'Error creando cobro', details: msg }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

