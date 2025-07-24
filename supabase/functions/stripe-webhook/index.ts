import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature"
};
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    // Registrar el evento
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data,
      processed: false
    });
    let processingResult = {
      success: false,
      message: "Event type not handled"
    };
    // Procesar eventos específicos
    switch(event.type){
      case "checkout.session.completed":
        processingResult = await handleCheckoutCompleted(event, supabase);
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
async function handleCheckoutCompleted(event, supabase) {
  logStep("Processing checkout.session.completed");
  const session = event.data.object;
  const casoId = session.metadata?.caso_id;
  if (!casoId) {
    return {
      success: false,
      message: "No caso_id in session metadata"
    };
  }
  try {
    // Actualizar estado del caso a disponible
    const { error: caseError } = await supabase.from("casos").update({
      estado: "disponible",
      fecha_ultimo_contacto: new Date().toISOString()
    }).eq("id", casoId);
    if (caseError) {
      throw new Error(`Failed to update case: ${caseError.message}`);
    }
    // Crear registro de pago
    const { error: paymentError } = await supabase.from("pagos").insert({
      usuario_id: session.metadata?.user_id,
      stripe_payment_intent_id: session.payment_intent,
      monto: session.amount_total,
      moneda: session.currency,
      estado: "succeeded",
      descripcion: "Consulta Estratégica - Pago único",
      metadata_pago: {
        session_id: session.id,
        caso_id: casoId,
        customer_email: session.customer_details?.email
      }
    });
    if (paymentError) {
      logStep("Payment record creation failed", {
        error: paymentError
      });
    // No fallar completamente si no se puede crear el registro de pago
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
