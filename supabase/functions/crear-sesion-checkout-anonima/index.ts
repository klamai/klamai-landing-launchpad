import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
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
const sanitizeDetails = (value: unknown): unknown => {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 40 ? `${value.slice(0, 12)}...` : value;
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
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
const logStep = (step: string, details?: unknown) => {
  try {
    const detailsStr = details ? ` - ${JSON.stringify(sanitizeDetails(details))}` : '';
    console.log(`[CREAR-SESION-CHECKOUT-ANONIMA] ${step}${detailsStr}`);
  } catch {
    console.log(`[CREAR-SESION-CHECKOUT-ANONIMA] ${step}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Función iniciada");

    // Verificar variables de entorno
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_ID_CONSULTA_ESTRATEGICA");
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !priceId) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    logStep("Variables de entorno verificadas");

    // Obtener datos del request
    const { caso_id, customer_email } = await req.json();

    if (!caso_id) {
      logStep("ERROR - Parámetro caso_id faltante");
      throw new Error("Se requiere caso_id");
    }

    logStep("Parámetros recibidos", { caso_id, customer_email: customer_email ? maskEmail(customer_email) : "no proporcionado" });

    // Inicializar Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verificar que el caso existe y está en estado permitido
    logStep("Buscando caso en la base de datos", { caso_id });
    
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("id, cliente_id, email_borrador, estado, stripe_session_id")
      .eq("id", caso_id)
      .single();

    if (casoError || !caso) {
      logStep("ERROR - Caso no encontrado", {
        error: casoError?.message,
        caso_id,
        error_details: casoError
      });
      throw new Error("Caso no encontrado");
    }

    logStep("Caso encontrado exitosamente", {
      casoId: caso.id,
      estado: caso.estado,
      tieneClienteId: !!caso.cliente_id,
      tieneStripeSessionId: !!caso.stripe_session_id
    });

    // Comprobación adicional para evitar procesar casos ya pagados o vinculados
    if (caso.cliente_id) {
      logStep("ERROR - Caso ya vinculado a un cliente", { casoId: caso_id });
      return new Response(JSON.stringify({ error: "El caso ya está asociado a un cliente." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validar estados permitidos para crear sesión
    const allowedStates = ["borrador", "listo_para_propuesta", "esperando_pago"];
    if (!allowedStates.includes(caso.estado)) {
      logStep("ERROR - Estado de caso no permitido para pago", { estado: caso.estado });
      return new Response(JSON.stringify({
        error: "Estado del caso no permite iniciar pago",
        estado_actual: caso.estado
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // ✅ CORREGIDO: No pre-rellenar email, dejar que el usuario lo escriba en Stripe
    logStep("Configurando sesión de checkout sin email pre-rellenado", {
      email_provided: customer_email ? maskEmail(customer_email) : "no proporcionado",
      email_caso: maskEmail(caso.email_borrador),
      strategy: "user_input_in_stripe"
    });

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Reutilizar sesión existente si sigue abierta y no expirada
    if (caso.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(caso.stripe_session_id);
        const isOpen = existing?.status === "open";
        const notExpired = typeof existing?.expires_at === "number" ? (existing.expires_at * 1000) > Date.now() : true;
        if (isOpen && notExpired && existing?.url) {
          logStep("Reutilizando sesión de checkout existente", { sessionId: existing.id, expires_at: existing.expires_at });
          return new Response(JSON.stringify({ checkoutUrl: existing.url, session_id: existing.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          });
        } else {
          logStep("Sesión existente no reutilizable (completada/expirada/sin url)", { sessionId: existing?.id, status: existing?.status, expires_at: existing?.expires_at });
        }
      } catch (e) {
        logStep("No se pudo recuperar sesión existente, se creará nueva", { error: (e as Error)?.message });
      }
    }

    // ✅ CORREGIDO: Crear sesión de checkout SIN pre-rellenar email
    // El usuario podrá escribir libremente su email en la página de Stripe
    const idempotencyKey = `${caso_id}:${Math.floor(Date.now()/60000)}`; // por minuto para evitar duplicaciones
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      // ✅ NO pre-rellenar customer_email - dejar que el usuario lo escriba
      success_url: `${siteUrl}/pago-exitoso?caso_id=${caso_id}`,
      cancel_url: `${siteUrl}/chat?caso_id=${caso_id}&pago=cancelado`,
      metadata: {
        caso_id: caso_id,
        flujo_origen: 'chat_anonimo'
        // ✅ NO incluir email_contacto en metadata - se obtendrá de Stripe después del pago
      },
      payment_intent_data: {
        metadata: {
          caso_id: caso_id,
          flujo_origen: 'chat_anonimo'
          // ✅ NO incluir email_contacto en metadata - se obtendrá de Stripe después del pago
        }
      }
    }, {
      // Evita duplicaciones ante reintentos rápidos
      idempotencyKey
    });
    
    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de sesión.");
    }

    // Guardar el session_id en el caso para futuras reutilizaciones
    const { error: updateError } = await supabase
      .from("casos")
      .update({
        stripe_session_id: session.id,
        estado: "esperando_pago",
        updated_at: new Date().toISOString()
      })
      .eq("id", caso_id);

    if (updateError) {
      logStep("ERROR - Error actualizando caso con session_id", { error: updateError.message });
      throw new Error(`Error actualizando caso: ${updateError.message}`);
    }

    // ✅ CORREGIDO: No registramos email aquí - se obtendrá del webhook de Stripe
    // El usuario escribirá su email real en la página de Stripe
    logStep("Sesión creada sin email pre-rellenado - usuario escribirá email en Stripe");

    logStep("Sesión de checkout anónima creada exitosamente", {
      sessionId: session.id,
      casoId: caso_id
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en crear-sesion-checkout-anonima", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
