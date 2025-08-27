// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// --- CONFIGURACIÓN Y CABECERAS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-client-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// --- UTILIDADES DE LOGGING Y SANITIZACIÓN (RGPD) ---
const maskEmail = (email)=>{
  if (!email || typeof email !== "string") return email;
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
};
const maskId = (id)=>{
  if (!id || typeof id !== "string") return id;
  return `${id.slice(0, 6)}...`;
};
const sanitizeDetails = (value)=>{
  if (value == null) return value;
  if (typeof value === "string") return value.length > 40 ? `${value.slice(0, 12)}...` : value;
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.toLowerCase().includes("email")) {
        out[k] = maskEmail(v);
      } else if (k.toLowerCase().includes("id")) {
        out[k] = maskId(String(v));
      } else if (k.toLowerCase().includes("url")) {
        out[k] = typeof v === "string" ? `${v.split("?")[0]}?...` : v;
      } else {
        out[k] = sanitizeDetails(v);
      }
    }
    return out;
  }
  return value;
};
const logStep = (step, details)=>{
  try {
    const detailsStr = details ? ` - ${JSON.stringify(sanitizeDetails(details))}` : '';
    console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
  } catch {
    console.log(`[STRIPE-WEBHOOK] ${step}`);
  }
};

// --- SERVIDOR PRINCIPAL ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) throw new Error("Missing Stripe configuration");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false }
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature");

    logStep("Verifying webhook signature");
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id });
    
    // Lógica de prevención de duplicados existente
    const { data: existingEvent } = await supabase.from("stripe_webhook_events").select("id").eq("stripe_event_id", event.id).single();
    if (existingEvent) {
      logStep("Event already processed", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, status: "already_processed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // Registrar evento (se mueve aquí para asegurar que todos los eventos se registran)
    await supabase.from("stripe_webhook_events").insert({ stripe_event_id: event.id, event_type: event.type, data_sanitizada: sanitizeDetails(event.data.object), processed: false });

    let processingResult = { success: false, message: "Event type not handled" };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const flujoOrigen = session.metadata?.flujo_origen || null;
      
      switch (flujoOrigen) {
        case 'chat_anonimo':
        case 'propuesta_publica':
          logStep("Processing anonymous/public flow", { casoId: session.metadata?.caso_id });
          processingResult = await handleAnonymousPayment(session, supabase);
        break;
        
        case 'dashboard_registrado':
          logStep("Processing registered user flow", { userId: session.metadata?.user_id });
          processingResult = await handleRegisteredUserPayment(session, supabase, stripe);
        break;
          
      default:
          if (session.metadata?.user_id) {
            logStep("Processing legacy registered user flow", { userId: session.metadata?.user_id });
            processingResult = await handleRegisteredUserPayment(session, supabase, stripe);
          } else if (session.metadata?.caso_id) {
            logStep("Processing legacy anonymous flow", { casoId: session.metadata?.caso_id });
            processingResult = await handleAnonymousPayment(session, supabase);
          } else {
            processingResult = { success: false, message: "Webhook session is missing user_id or caso_id in metadata" };
          }
      }
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      
      // Verificar si el payment_intent tiene metadata con caso_id
      if (paymentIntent.metadata?.caso_id) {
        logStep("Processing payment intent for anonymous flow", { casoId: paymentIntent.metadata.caso_id });
        
        // Para payment_intent, necesitamos obtener la sesión de checkout para obtener el email del cliente
        try {
          // Obtener el charge para luego obtener la sesión de checkout
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          if (charge && charge.payment_intent) {
            // Obtener la sesión de checkout a partir del payment intent
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntent.id,
              limit: 1
            });
            
            if (sessions.data.length > 0 && sessions.data[0].customer_details?.email) {
              const session = sessions.data[0];
              // Crear un objeto de sesión simulado para usar con la función existente
              const simulatedSession = {
                metadata: session.metadata || paymentIntent.metadata,
                customer_details: {
                  email: session.customer_details.email
                }
              };
              processingResult = await handleAnonymousPayment(simulatedSession, supabase);
            } else {
              processingResult = { success: false, message: "Could not retrieve customer email from checkout session" };
            }
          } else {
            processingResult = { success: false, message: "Could not retrieve charge from payment intent" };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logStep("Error retrieving checkout session", { message: errorMessage });
          processingResult = { success: false, message: `Error retrieving checkout session: ${errorMessage}` };
        }
      } else {
        processingResult = { success: false, message: "Payment intent is missing caso_id in metadata" };
      }
    } else {
        // Aquí puedes añadir el manejo de otros eventos si es necesario
        processingResult = { success: true, message: `Event type ${event.type} acknowledged but not handled.` };
    }

    // Actualizar estado del evento
    await supabase.from("stripe_webhook_events").update({
      processed: processingResult.success,
      processed_at: new Date().toISOString(),
      error_message: processingResult.success ? null : processingResult.message
    }).eq("stripe_event_id", event.id);

    return new Response(JSON.stringify({ received: true, ...processingResult }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// --- LÓGICA PARA PAGOS ANÓNIMOS (CORREGIDA Y COMPLETA) ---
async function handleAnonymousPayment(session, supabase) {
  const casoId = session.metadata?.caso_id;
  const customerEmail = session.customer_details?.email;

  if (!casoId || !customerEmail) {
    return { success: false, message: "Anonymous payment requires caso_id and customer_email" };
  }
  
  try {
    // Buscar si existe un usuario con el email exacto proporcionado en la página de pago
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers({
      filter: {
        email: customerEmail,
      },
    });

    if (listUsersError) {
      throw new Error(`Error listing users: ${listUsersError.message}`);
    }
    
    // Buscar el email exacto en la lista de usuarios devueltos
    const existingUser = users.find(user => user.email === customerEmail) || null;

    if (!existingUser) {
      // --- FLUJO A: USUARIO NUEVO ---
      logStep("User not found, creating new account", { email: maskEmail(customerEmail) });
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
      });

      if (createUserError) throw new Error(`Failed to create user: ${createUserError.message}`);
      
      await linkCaseToUser(supabase, casoId, newUser.user.id);

      const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
      });
      if (linkError) throw new Error(`Failed to generate recovery link: ${linkError.message}`);
      
      const emailText = `¡Bienvenido a Klam.ai!\n\nGracias por tu confianza. Para acceder a tu consulta y gestionar tu caso, por favor, establece tu contraseña a través del siguiente enlace:\n\n${link.properties.action_link}\n\nUna vez establecida, podrás iniciar sesión con tu email.\n\nEl equipo de Klam.ai`;
      const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: { to: customerEmail, subject: "Bienvenido a Klam.ai - Accede a tu consulta", text: emailText }
      });
      if (sendError) logStep("Failed to send welcome email", { error: sendError.message });
      else logStep("Welcome email sent successfully", { userId: newUser.user.id });

    } else {
      // --- FLUJO B: USUARIO EXISTENTE ---
      logStep("Existing user found, linking case", { userId: maskId(existingUser.id) });
      await linkCaseToUser(supabase, casoId, existingUser.id);
      
      const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
      const emailText = `Hola,\n\nHemos añadido una nueva consulta a tu cuenta de Klam.ai.\n\nPuedes ver los detalles iniciando sesión y accediendo a tu dashboard:\n\n${siteUrl}/dashboard\n\nGracias por seguir confiando en nosotros.\n\nEl equipo de Klam.ai`;
      const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: { to: existingUser.email, subject: "Nueva consulta añadida a tu cuenta de Klam.ai", text: emailText }
      });
      if (sendError) logStep("Failed to send notification email", { error: sendError.message });
      else logStep("Notification email sent successfully", { userId: existingUser.id });

    }

    return { success: true, message: "Anonymous payment processed successfully" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
      logStep("Error in handleAnonymousPayment", { message: errorMessage });
      return { success: false, message: errorMessage };
  }
}

// --- LÓGICA PARA PAGOS DE USUARIOS REGISTRADOS ---
async function handleRegisteredUserPayment(session, supabase, stripe) {
  const casoId = session.metadata?.caso_id;
  const userId = session.metadata?.user_id;
  
  if (!casoId || !userId) {
    return { success: false, message: "Registered payment requires caso_id and user_id" };
  }

  try {
    await linkCaseToUser(supabase, casoId, userId);

    const { error: notificacionError } = await supabase
      .from("notificaciones")
      .insert({
        usuario_id: userId,
        mensaje: `Tu pago para el caso #${casoId.toString().slice(0, 8)} ha sido procesado.`,
        url_destino: `/dashboard/casos/${casoId}`,
        caso_id: casoId
      });
    if (notificacionError) logStep("Notification creation failed", { error: notificacionError.message });
    
    return { success: true, message: "Registered user payment processed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
      logStep("Error in handleRegisteredUserPayment", { message: errorMessage });
      return { success: false, message: errorMessage };
  }
}

// --- FUNCIÓN AUXILIAR REUTILIZABLE ---
async function linkCaseToUser(supabase, casoId, userId) {
  const { error } = await supabase
    .from("casos")
      .update({
      cliente_id: userId,
      estado: "disponible",
      fecha_pago: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", casoId);

  if (error) {
    throw new Error(`Failed to link case ${casoId} to user ${userId}: ${error.message}`);
  }
  logStep("Case linked to user successfully", { casoId: maskId(casoId), userId: maskId(userId) });
}
