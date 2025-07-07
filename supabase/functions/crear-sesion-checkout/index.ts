import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticar usuario
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuario no autenticado");
    }

    // Obtener datos del request
    const { plan_id, caso_id } = await req.json();
    
    if (!plan_id || !caso_id) {
      throw new Error("plan_id y caso_id son requeridos");
    }

    // Mapeo de planes internos a Price IDs de Stripe
    const planMapping = {
      'consulta-estrategica': {
        price_id: 'price_1Rc0kkI0mIGG72Op6Rk4GulG',
        mode: 'payment' as const,
        name: 'Consulta Estratégica'
      },
      'plan-asesoria': {
        price_id: 'price_1Rc0vCI0mIGG72OpSBXu3b2w',
        mode: 'subscription' as const,
        name: 'Plan Asesoría Mensual'
      }
    };

    const planConfig = planMapping[plan_id as keyof typeof planMapping];
    if (!planConfig) {
      throw new Error(`Plan no válido: ${plan_id}`);
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar si ya existe un customer de Stripe
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Crear sesión de checkout
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: planConfig.price_id,
          quantity: 1,
        },
      ],
      mode: planConfig.mode,
      client_reference_id: caso_id,
      metadata: {
        caso_id: caso_id,
        usuario_id: user.id,
        plan_id: plan_id,
        plan_name: planConfig.name
      },
      success_url: `${origin}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}`,
      cancel_url: `${origin}/pago-cancelado?caso_id=${caso_id}`,
    });

    console.log(`Sesión de checkout creada: ${session.id} para usuario ${user.email}, plan ${plan_id}, caso ${caso_id}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error en crear-sesion-checkout:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});