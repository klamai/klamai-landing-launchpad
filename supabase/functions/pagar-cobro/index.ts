// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const sanitizeDetails = (value: any): any => {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 40 ? `${value.slice(0, 12)}...` : value;
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.toLowerCase().includes('email')) out[k] = '***@***';
      else if (k.toLowerCase().includes('id')) out[k] = typeof v === 'string' ? `${(v as string).slice(0, 6)}...` : v;
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
    console.log(`[PAGAR-COBRO] ${step}${detailsStr}`);
  } catch {
    console.log(`[PAGAR-COBRO] ${step}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Función iniciada");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || req.headers.get("origin") || '').replace(/\/$/, '');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      return json({ error: "Variables de entorno requeridas no configuradas" }, 500);
    }

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

    const body = await req.json();
    const pago_id: string = body?.pago_id;
    if (!pago_id) {
      return json({ error: "Parámetros inválidos" }, 400);
    }

    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select('id, usuario_id, caso_id, concepto, monto_total, moneda, stripe_session_id')
      .eq('id', pago_id)
      .single();

    if (pagoError || !pago) {
      return json({ error: "Pago no encontrado" }, 404);
    }

    if (pago.usuario_id !== user.id) {
      return json({ error: "Acceso denegado al pago" }, 403);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Prefijar email del cliente
    let customerEmail: string | undefined = undefined;
    try {
      const { data: perfilCliente } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', pago.usuario_id)
        .maybeSingle();
      customerEmail = perfilCliente?.email || undefined;
    } catch {}

    if (pago.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(pago.stripe_session_id);
        const isOpen = existing?.status === "open";
        const notExpired = typeof existing?.expires_at === "number" ? (existing.expires_at * 1000) > Date.now() : true;
        if (isOpen && notExpired && existing?.url) {
          logStep("Reutilizando sesión existente", { sessionId: existing.id, expires_at: existing.expires_at });
          return json({ url: existing.url, session_id: existing.id });
        }
      } catch (e) {
        logStep("No se pudo recuperar sesión existente", { error: (e as Error)?.message });
      }
    }

    const montoTotal = Number(pago.monto_total);
    if (!isFinite(montoTotal) || montoTotal <= 0) {
      return json({ error: "Monto inválido en el pago" }, 400);
    }

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
            currency: (pago.moneda || 'eur'),
            unit_amount: Math.round(montoTotal * 100),
            product_data: {
              name: pago.concepto || 'Pago',
              description: pago.descripcion || undefined
            },
          },
          quantity: 1,
        }
      ],
      client_reference_id: pago.caso_id,
      success_url: `${appBaseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${pago.caso_id}&tipo=cobro&pago_id=${pago.id}`,
      cancel_url: `${appBaseUrl}/pago-cancelado?session_id={CHECKOUT_SESSION_ID}&caso_id=${pago.caso_id}&tipo=cobro&pago_id=${pago.id}`,
      customer_email: customerEmail,
      custom_text: {
        submit: { message: 'Pago gestionado por klamAI.' },
        after_submit: { message: 'Gracias. Vuelve a tu caso para continuar.' }
      },
      metadata: {
        pago_id: pago.id,
        caso_id: pago.caso_id,
      }
    });

    const { error: updError } = await supabase
      .from('pagos')
      .update({ stripe_session_id: session.id })
      .eq('id', pago.id);
    if (updError) {
      logStep('WARN - no se pudo guardar stripe_session_id', { error: updError.message });
    }

    logStep('Sesión creada', { pago_id: pago.id, sessionId: session.id });
    return json({ url: session.url, session_id: session.id, pago_id: pago.id });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep('ERROR pagar-cobro', { message: msg });
    return json({ error: 'Error iniciando pago de cobro', details: msg }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

