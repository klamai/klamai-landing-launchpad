
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook recibido", { method: req.method, url: req.url });

    // Obtener las variables de entorno
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    logStep("Variables de entorno verificadas");

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Obtener la firma del header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR - No se encontró la firma de Stripe");
      throw new Error("No se encontró la firma de Stripe");
    }

    logStep("Signature encontrada", { signature: signature.substring(0, 20) + "..." });

    // Leer el cuerpo del request como ArrayBuffer y convertir a string
    const body = await req.arrayBuffer();
    const payload = new TextDecoder().decode(body);

    logStep("Payload recibido", { payloadLength: payload.length });

    let event;
    try {
      // Verificar el webhook usando la firma
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      logStep("Webhook verificado exitosamente", { type: event.type });
    } catch (err) {
      logStep("ERROR - Error verificando webhook", { error: err.message });
      return new Response(JSON.stringify({ 
        error: "Error verificando webhook", 
        details: err.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inicializar cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Procesar solo eventos de checkout completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Procesando checkout completado", {
        sessionId: session.id,
        customerId: session.customer,
        paymentStatus: session.payment_status
      });

      // Buscar el caso asociado con esta sesión
      const { data: caso, error: casoError } = await supabase
        .from("casos")
        .select("*")
        .eq("stripe_session_id", session.id)
        .single();

      if (casoError) {
        logStep("ERROR - No se encontró el caso", { error: casoError.message });
        throw new Error(`No se encontró el caso: ${casoError.message}`);
      }

      logStep("Caso encontrado", { casoId: caso.id, clienteId: caso.cliente_id });

      // Actualizar el estado del caso a "pagado" y luego a "disponible"
      const { error: updateError } = await supabase
        .from("casos")
        .update({
          estado: "disponible", // Cambiar directamente a disponible
          fecha_pago: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString()
        })
        .eq("id", caso.id);

      if (updateError) {
        logStep("ERROR - Error actualizando caso", { error: updateError.message });
        throw new Error(`Error actualizando caso: ${updateError.message}`);
      }

      logStep("Caso actualizado exitosamente", { casoId: caso.id, nuevoEstado: "disponible" });

      // Crear registro de pago en la tabla pagos
      const { error: pagoError } = await supabase
        .from("pagos")
        .insert({
          usuario_id: caso.cliente_id,
          stripe_payment_intent_id: session.payment_intent || session.id,
          monto: Math.round((session.amount_total || 0) / 100), // Convertir de centavos a euros
          moneda: session.currency || 'eur',
          estado: 'succeeded',
          descripcion: `Pago para caso ${caso.id.toString().slice(0, 8)}`,
          metadata_pago: {
            stripe_session_id: session.id,
            caso_id: caso.id,
            plan_id: session.metadata?.plan_id || 'consulta-estrategica'
          }
        });

      if (pagoError) {
        logStep("ERROR - Error creando registro de pago", { error: pagoError.message });
        // No lanzamos error aquí porque el caso ya se actualizó correctamente
        console.error("Error creando registro de pago:", pagoError);
      } else {
        logStep("Registro de pago creado exitosamente");
      }

      // Crear notificación para el cliente
      if (caso.cliente_id) {
        const { error: notificacionError } = await supabase
          .from("notificaciones")
          .insert({
            usuario_id: caso.cliente_id,
            mensaje: `Tu pago para el caso #${caso.id.toString().slice(0, 8)} ha sido procesado exitosamente. El caso está ahora disponible para revisión por nuestros abogados.`,
            url_destino: `/dashboard/casos/${caso.id}`,
            tipo: "pago_exitoso"
          });

        if (notificacionError) {
          logStep("ERROR - Error creando notificación", { error: notificacionError.message });
          console.error("Error creando notificación:", notificacionError);
        } else {
          logStep("Notificación creada exitosamente");
        }
      }
    } else {
      logStep("Evento no procesado", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: "Error procesando webhook", 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
