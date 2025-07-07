
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    console.log('Webhook received, validating...');
    
    // Verificar la firma del webhook
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    let event;
    try {
      // Usar constructEventAsync en lugar de constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook event type:', event.type);

    // Crear cliente de Supabase con service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Manejar diferentes tipos de eventos
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout session:', session.id);

      const casoId = session.metadata?.caso_id || session.client_reference_id;
      const usuarioId = session.metadata?.usuario_id;
      const planId = session.metadata?.plan_id;

      if (!casoId) {
        console.error('No caso_id found in session metadata');
        return new Response('No caso_id found', { status: 400 });
      }

      console.log('Updating case status:', { casoId, usuarioId, planId });

      // Actualizar el estado del caso a 'disponible' después del pago exitoso
      const { error: updateError } = await supabase
        .from('casos')
        .update({
          estado: 'disponible',
          fecha_ultimo_contacto: new Date().toISOString()
        })
        .eq('id', casoId);

      if (updateError) {
        console.error('Error updating case status:', updateError);
        throw updateError;
      }

      // Registrar el pago en la tabla de pagos
      if (usuarioId && session.amount_total) {
        const { error: pagoError } = await supabase
          .from('pagos')
          .insert({
            usuario_id: usuarioId,
            stripe_payment_intent_id: session.payment_intent as string || session.id,
            monto: session.amount_total,
            moneda: session.currency || 'eur',
            estado: 'succeeded',
            descripcion: `Pago por ${planId || 'consulta legal'} - Caso ${casoId.substring(0, 8)}`,
            metadata_pago: {
              session_id: session.id,
              caso_id: casoId,
              plan_id: planId
            }
          });

        if (pagoError) {
          console.error('Error registering payment:', pagoError);
          // No lanzar error aquí para no fallar el webhook completo
        }
      }

      console.log('Case status updated successfully to disponible');
    }

    // Otros eventos de Stripe que podríamos manejar en el futuro
    else if (event.type === 'payment_intent.succeeded') {
      console.log('Payment intent succeeded:', event.data.object.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
