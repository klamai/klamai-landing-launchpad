// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-client-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};
// Utilidades de sanitización de logs para cumplir RGPD y evitar PII en registros
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
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    logStep("Webhook received");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });
    // Supabase client con service role para operaciones administrativas
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: {
        persistSession: false
      }
    });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }
    logStep("Verifying webhook signature");
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event verified", {
      type: event.type,
      id: event.id
    });
    // Verificar si ya procesamos este evento
    const { data: existingEvent } = await supabase.from("stripe_webhook_events").select("id").eq("stripe_event_id", event.id).single();
    if (existingEvent) {
      logStep("Event already processed", {
        eventId: event.id
      });
      return new Response(JSON.stringify({
        received: true,
        status: "already_processed"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    // Registrar evento con metadatos normalizados y payload sanitizado
    const payload = event.data?.object || {};
    const sanitized = sanitizeDetails(payload);
    let stripeSessionId: string | null = null;
    let stripePaymentIntentId: string | null = null;
    let amountTotalCents: number | null = null;
    let currency: string | null = null;
    let userId: string | null = null;
    let casoIdMeta: string | null = null;

    if (payload?.object === 'checkout.session') {
      stripeSessionId = typeof payload?.id === 'string' ? payload.id : null;
      stripePaymentIntentId = typeof payload?.payment_intent === 'string' ? payload.payment_intent : null;
      amountTotalCents = typeof payload?.amount_total === 'number' ? payload.amount_total : null;
      currency = payload?.currency ?? null;
      userId = payload?.metadata?.user_id ?? null;
      casoIdMeta = payload?.metadata?.caso_id ?? null;
    } else if (payload?.object === 'payment_intent') {
      stripePaymentIntentId = typeof payload?.id === 'string' ? payload.id : null;
      // Para payment_intent el monto puede venir en amount o amount_received
      amountTotalCents = typeof payload?.amount === 'number' ? payload.amount : (typeof payload?.amount_received === 'number' ? payload.amount_received : null);
      currency = payload?.currency ?? null;
      // metadata puede no contener caso_id/user_id en este evento
      userId = payload?.metadata?.user_id ?? null;
      casoIdMeta = payload?.metadata?.caso_id ?? null;
    }

    const { error: insertEventError } = await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data_sanitizada: sanitized,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      amount_total_cents: amountTotalCents,
      currency: currency,
      user_id: userId,
      caso_id: casoIdMeta,
      processed: false
    });
    if (insertEventError) {
      logStep("Webhook event insert failed", { error: insertEventError.message });
    }
    let processingResult = {
      success: false,
      message: "Event type not handled"
    };
    // Procesar eventos específicos
    switch(event.type){
      case "checkout.session.completed":
        processingResult = await handleCheckoutCompleted(event, supabase, stripe);
        break;
      case "payment_intent.succeeded":
        processingResult = await handlePaymentSucceeded(event, supabase);
        break;
      case "payment_intent.payment_failed":
        processingResult = await handlePaymentFailed(event, supabase);
        break;
      default:
        logStep("Unhandled event type", {
          type: event.type
        });
        processingResult = {
          success: true,
          message: "Event type not handled but acknowledged"
        };
    }
    // Actualizar estado del evento
    await supabase.from("stripe_webhook_events").update({
      processed: processingResult.success,
      processed_at: new Date().toISOString(),
      error_message: processingResult.success ? null : processingResult.message
    }).eq("stripe_event_id", event.id);
    logStep("Event processing completed", {
      success: processingResult.success
    });
    return new Response(JSON.stringify({
      received: true,
      processed: processingResult.success,
      message: processingResult.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", {
      message: errorMessage
    });
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
async function handleCheckoutCompleted(event, supabase, stripe) {
  logStep("Processing checkout.session.completed");
  const session = event.data.object;
  let casoId = session.metadata?.caso_id;
  const pagoId = session.metadata?.pago_id || null;
  const solicitanteRol = session.metadata?.solicitante_rol || null;
  
  // Si no hay caso_id en metadatos, buscar por stripe_session_id
  if (!casoId) {
    logStep("No caso_id in metadata, searching by stripe_session_id", { sessionId: session.id });
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();
    
    if (casoError || !caso) {
      logStep("No case found with stripe_session_id", { sessionId: session.id, error: casoError?.message });
      return {
        success: false,
        message: "No case found for this session"
      };
    }
    casoId = caso.id;
  }
  
  try {
    // Comprobación de idempotencia adicional a nivel de caso
    const { data: casoRow, error: casoRowError } = await supabase
      .from("casos")
      .select("estado, stripe_payment_intent_id, fecha_pago")
      .eq("id", casoId)
      .single();
    if (!casoRowError && casoRow) {
      const alreadyProcessedByIntent = casoRow.stripe_payment_intent_id && session.payment_intent && (casoRow.stripe_payment_intent_id === session.payment_intent);
      const alreadyPaidState = ["disponible", "asignado", "cerrado"].includes(casoRow.estado);
      if (alreadyProcessedByIntent || alreadyPaidState) {
        logStep("Case already processed, skipping update", { casoId: maskId(casoId), estado: casoRow.estado, payment_intent: maskId(String(session.payment_intent || '')) });
        // Aunque el caso ya esté procesado, si venimos de un pago ad-hoc, intentar completar el registro de pago
        if (pagoId) {
          await finalizeAdHocPaymentIfNeeded(supabase, session, pagoId, solicitanteRol);
        }
        return {
          success: true,
          message: "Case already processed"
        };
      }
    }

    // Actualizar estado del caso a disponible
    const { error: caseError } = await supabase.from("casos").update({
      estado: "disponible",
      fecha_pago: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent,
      updated_at: new Date().toISOString()
    }).eq("id", casoId);
    
    if (caseError) {
      throw new Error(`Failed to update case: ${caseError.message}`);
    }
    
    // Expandir sesión para obtener price/product
    let priceId: string | null = null;
    let productId: string | null = null;
    try {
        const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items.data.price.product'] });
      const line = expanded?.line_items?.data?.[0];
      priceId = line?.price?.id ?? null;
      productId = line?.price?.product?.id ?? null;
    } catch (e) {
      logStep('Expand failed (non-critical)', { error: (e as Error)?.message });
    }

    // Intentar actualizar el evento con price/product y caso_id por trazabilidad
    try {
      await supabase
        .from("stripe_webhook_events")
        .update({ price_id: priceId, product_id: productId, caso_id: casoId })
        .eq("stripe_event_id", event.id);
    } catch (e) {
      logStep("Failed to update webhook event with price/product", { error: (e as Error)?.message });
    }

    // Registrar pago para flujo de "plan" (legacy) solo si NO es ad-hoc con pago_id
    if (!pagoId) {
      const amountTotalCents = typeof session.amount_total === "number" ? session.amount_total : 0;
      const amountTotalEur = amountTotalCents / 100;
      const { error: paymentError } = await supabase.from("pagos").insert({
        usuario_id: session.metadata?.user_id,
        stripe_payment_intent_id: session.payment_intent,
        caso_id: casoId,
        monto: amountTotalEur,
        moneda: session.currency || 'eur',
        estado: "succeeded",
        descripcion: `Pago para caso ${casoId.toString().slice(0, 8)}`,
        metadata_pago: {
          session_id: session.id,
          caso_id: casoId,
          customer_email: session.customer_details?.email,
          plan_id: session.metadata?.plan_id || 'consulta-estrategica',
          price_id: priceId,
          product_id: productId
        }
      });
      if (paymentError) {
        logStep("Payment record creation failed", { error: paymentError });
      }
    } else {
      // Completar pago ad-hoc existente
      await finalizeAdHocPaymentIfNeeded(supabase, session, pagoId, solicitanteRol);
    }
    
    // Crear notificación para el cliente si hay user_id
    if (session.metadata?.user_id) {
      const { error: notificacionError } = await supabase
        .from("notificaciones")
        .insert({
          usuario_id: session.metadata.user_id,
          mensaje: `Tu pago para el caso #${casoId.toString().slice(0, 8)} ha sido procesado exitosamente. El caso está ahora disponible para revisión por nuestros abogados.`,
          url_destino: `/dashboard/casos/${casoId}`,
          caso_id: casoId
        });
      
      if (notificacionError) {
        logStep("Notification creation failed", { error: notificacionError.message });
      }
    }
    
    logStep("Checkout completed successfully", {
      casoId
    });
    return {
      success: true,
      message: "Case updated and payment recorded"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error processing checkout completion", {
      error: errorMessage
    });
    return {
      success: false,
      message: errorMessage
    };
  }
}
async function handlePaymentSucceeded(event, supabase) {
  logStep("Processing payment_intent.succeeded");
  const paymentIntent = event.data.object;
  try {
    // Actualizar estado del pago si existe
    const { error } = await supabase.from("pagos").update({
      estado: "succeeded",
      metadata_pago: {
        ...(await supabase.from("pagos").select("metadata_pago").eq("stripe_payment_intent_id", paymentIntent.id).single()).data?.metadata_pago || {},
        payment_method: paymentIntent.payment_method,
        charges: paymentIntent.charges?.data?.[0]
      }
    }).eq("stripe_payment_intent_id", paymentIntent.id);
    if (error) {
      logStep("Payment update failed", {
        error
      });
    }
    return {
      success: true,
      message: "Payment updated successfully"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: errorMessage
    };
  }
}
async function handlePaymentFailed(event, supabase) {
  logStep("Processing payment_intent.payment_failed");
  const paymentIntent = event.data.object;
  try {
    // Actualizar estado del pago si existe
    const { error } = await supabase.from("pagos").update({
      estado: "failed",
      metadata_pago: {
        ...(await supabase.from("pagos").select("metadata_pago").eq("stripe_payment_intent_id", paymentIntent.id).single()).data?.metadata_pago || {},
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message
      }
    }).eq("stripe_payment_intent_id", paymentIntent.id);
    if (error) {
      logStep("Payment update failed", {
        error
      });
    }
    // También podríamos revertir el estado del caso a "esperando_pago"
    // pero depende de la lógica de negocio deseada
    return {
      success: true,
      message: "Payment failure recorded"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: errorMessage
    };
  }
}

// Completa un pago ad-hoc existente, aplica comisión si el solicitante fue abogado regular
async function finalizeAdHocPaymentIfNeeded(supabase, session, pagoId, solicitanteRol) {
  try {
    // Idempotencia: si ya está en succeeded, salir
    const { data: pago, error: fetchError } = await supabase
      .from('pagos')
      .select('id, estado, monto_total, comision')
      .eq('id', pagoId)
      .single();
    if (fetchError || !pago) {
      logStep('Ad-hoc payment not found', { pagoId });
      return;
    }
    if (pago.estado === 'succeeded') return;

    const total = typeof pago.monto_total === 'number' ? pago.monto_total : ((typeof session.amount_total === 'number' ? session.amount_total : 0) / 100);
    let comision = pago.comision || 0;

    if (solicitanteRol === 'abogado_regular') {
      const pctEnv = Deno.env.get('PLATFORM_COMMISSION_REGULAR_PCT');
      const pct = pctEnv ? Number(pctEnv) : 0.15;
      if (isFinite(pct) && pct > 0) {
        comision = Math.round(total * pct * 100) / 100;
      }
    }

    const { error: upd } = await supabase
      .from('pagos')
      .update({
        estado: 'succeeded',
        stripe_payment_intent_id: session.payment_intent,
        comision,
        monto_neto: Math.round((total - comision) * 100) / 100,
        metadata_pago: {
          ...(await supabase.from('pagos').select('metadata_pago').eq('id', pagoId).single()).data?.metadata_pago || {},
          session_id: session.id,
          price_id: undefined,
          product_id: undefined,
        }
      })
      .eq('id', pagoId);
    if (upd) {
      logStep('Ad-hoc payment update failed', { pagoId, error: upd.message });
    }
  } catch (e) {
    logStep('Ad-hoc finalization error', { pagoId, message: (e as Error)?.message });
  }
}
