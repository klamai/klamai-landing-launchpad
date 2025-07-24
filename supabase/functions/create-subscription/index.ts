// Follow the Deno deploy guide: https://deno.com/deploy/docs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16'
});
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405
    });
  }
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { casoId, isYearly = false } = await req.json();
    if (!casoId) {
      return Response.json({
        error: 'caso_id es requerido'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }
    // Verificar que el caso existe y está en estado correcto
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: caso, error: casoError } = await supabase.from('casos').select('id, estado, cliente_id').eq('id', casoId).single();
    if (casoError || !caso) {
      return Response.json({
        error: 'Caso no encontrado'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }
    if (caso.estado !== 'listo_para_propuesta') {
      return Response.json({
        error: 'El caso no está listo para procesar el pago'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }
    // Crear sesión de suscripción en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card'
      ],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Asesoría Legal Premium - klamAI',
              description: 'Consultas legales ilimitadas con soporte prioritario'
            },
            unit_amount: isYearly ? 7900 : 9900,
            recurring: {
              interval: isYearly ? 'year' : 'month'
            }
          },
          quantity: 1
        }
      ],
      success_url: `${req.headers.get('origin')}/chat?caso_id=${casoId}&payment=success&subscription=true`,
      cancel_url: `${req.headers.get('origin')}/chat?caso_id=${casoId}&payment=cancelled`,
      metadata: {
        caso_id: casoId,
        payment_type: 'subscription',
        billing_cycle: isYearly ? 'yearly' : 'monthly'
      }
    });
    return Response.json({
      checkout_url: session.url
    }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return Response.json({
      error: 'Error interno del servidor'
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});
