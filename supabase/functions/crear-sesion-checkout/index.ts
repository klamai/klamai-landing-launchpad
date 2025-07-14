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
    console.log('=== CREAR SESION CHECKOUT ===');
    
    const { plan_id, caso_id } = await req.json();
    console.log('Datos recibidos:', { plan_id, caso_id });

    if (!plan_id || !caso_id) {
      throw new Error('Faltan parámetros: plan_id y caso_id son requeridos');
    }

    // Verificar autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No se proporcionó token de autorización');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('Usuario autenticado:', userData.user.id);

    // Inicializar Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurado');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Price IDs de Stripe (productos ya creados en producción)
    const priceIds = {
      'consulta-estrategica': 'price_1Rc0kkI0mIGG72Op6Rk4GulG', // Pago único €37.50
      'plan-asesoria': 'price_1Rc0vCI0mIGG72OpSBXu3b2w'        // Suscripción mensual (futuro)
    };

    if (!priceIds[plan_id as keyof typeof priceIds]) {
      throw new Error(`Plan no válido: ${plan_id}`);
    }

    const selectedPriceId = priceIds[plan_id as keyof typeof priceIds];
    console.log('Price ID seleccionado:', selectedPriceId);

    // Verificar si ya existe un customer de Stripe para este usuario
    const customers = await stripe.customers.list({
      email: userData.user.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Customer existente encontrado:', customerId);
    } else {
      console.log('Creando nuevo customer de Stripe');
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          user_id: userData.user.id,
          caso_id: caso_id
        }
      });
      customerId = customer.id;
      console.log('Nuevo customer creado:', customerId);
    }

    // Determinar el modo según el Price ID (consulta-estrategica es pago único)
    const sessionMode = plan_id === 'consulta-estrategica' ? 'payment' : 'subscription';
    
    // Usar Price ID directo en lugar de price_data
    const lineItems = [{
      price: selectedPriceId,
      quantity: 1,
    }];

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: sessionMode,
      success_url: `${req.headers.get('origin')}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}`,
      cancel_url: `${req.headers.get('origin')}/pago-cancelado?caso_id=${caso_id}`,
      metadata: {
        user_id: userData.user.id,
        caso_id: caso_id,
        plan_id: plan_id
      }
    });

    console.log('Sesión de checkout creada:', session.id);
    console.log('URL de redirección:', session.url);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en crear-sesion-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'No hay detalles adicionales'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});