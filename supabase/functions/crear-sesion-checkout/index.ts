
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREAR-SESION-CHECKOUT] ${step}${detailsStr}`);
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

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    logStep("Variables de entorno verificadas");

    // Obtener datos del request
    const { plan_id, caso_id } = await req.json();

    if (!plan_id || !caso_id) {
      logStep("ERROR - Parámetros faltantes", { plan_id, caso_id });
      throw new Error("Se requieren plan_id y caso_id");
    }

    logStep("Parámetros recibidos", { plan_id, caso_id });

    // Inicializar Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Obtener información del usuario autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR - No se encontró header de autorización");
      throw new Error("No se encontró token de autorización");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("ERROR - Error autenticando usuario", { error: userError?.message });
      throw new Error("Error autenticando usuario");
    }

    const user = userData.user;
    logStep("Usuario autenticado", { userId: user.id, email: user.email });

    // Verificar que el caso existe y pertenece al usuario
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("*")
      .eq("id", caso_id)
      .eq("cliente_id", user.id)
      .single();

    if (casoError || !caso) {
      logStep("ERROR - Caso no encontrado", { error: casoError?.message });
      throw new Error("Caso no encontrado o sin permisos");
    }

    logStep("Caso verificado", { casoId: caso.id, estado: caso.estado });

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar si ya existe un customer de Stripe para este usuario
    let customerId = null;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      logStep("Customer existente encontrado", { customerId });
    } else {
      // Crear nuevo customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: `${caso.nombre_borrador || ''} ${caso.apellido_borrador || ''}`.trim() || undefined,
        phone: caso.telefono_borrador || undefined,
      });
      customerId = newCustomer.id;
      logStep("Nuevo customer creado", { customerId });
    }

    // Configurar el producto según el plan
    let productName = "Consulta Estratégica con Abogado Especialista";
    let unitAmount = 3750; // 37.50€ en centavos
    let priceId = "price_1Rc0kkI0mIGG72Op6Rk4GulG"; // Price ID real de Stripe

    if (plan_id === "consulta-estrategica") {
      // Usar configuración por defecto
      logStep("Plan seleccionado", { plan_id, productName, unitAmount });
    } else {
      logStep("ERROR - Plan no reconocido", { plan_id });
      throw new Error("Plan no reconocido");
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}`,
      cancel_url: `${req.headers.get("origin")}/pago-cancelado?session_id={CHECKOUT_SESSION_ID}&caso_id=${caso_id}`,
      metadata: {
        caso_id: caso_id,
        user_id: user.id,
        plan_id: plan_id,
      },
    });

    logStep("Sesión de checkout creada", { sessionId: session.id, url: session.url });

    // Guardar el session_id en el caso
    const { error: updateError } = await supabase
      .from("casos")
      .update({
        stripe_session_id: session.id,
        estado: "esperando_pago",
        updated_at: new Date().toISOString()
      })
      .eq("id", caso_id);

    if (updateError) {
      logStep("ERROR - Error actualizando caso", { error: updateError.message });
      throw new Error(`Error actualizando caso: ${updateError.message}`);
    }

    logStep("Caso actualizado con session_id", { casoId: caso_id, sessionId: session.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en crear-sesion-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: "Error creando sesión de checkout", 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
