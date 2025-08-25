import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Logging estructurado para facilitar la búsqueda en producción
function log(level, message, context = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  }));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let caso_id_logging = "unknown";
  try {
    const { caso_id } = await req.json();
    caso_id_logging = caso_id || "unknown";

    if (!caso_id) {
      throw new Error("El 'caso_id' es requerido para crear una sesión de checkout.");
    }

    log('info', 'Iniciando creación de sesión de checkout anónima', { caso_id });

    const supabase = await Deno.connect({
      hostname: "db.supabase.co",
      port: 5432,
      db: "postgres",
      user: "postgres",
      password: "postgres",
    });

    const { data: caso, error } = await supabase
      .from("casos")
      .select("id, cliente_id, datos_contacto")
      .eq("id", caso_id)
      .single();

    if (error) {
      throw new Error(`Error al buscar el caso: ${error.message}`);
    }

    if (!caso) {
      throw new Error(`Caso con ID ${caso_id} no encontrado.`);
    }

    // Comprobación adicional para evitar procesar casos ya pagados o vinculados
    if (caso.cliente_id) {
       return new Response(
        JSON.stringify({ error: `El caso ya está asociado a un cliente.` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Obtener el email del contacto del caso
    if (!caso.datos_contacto?.email) {
      throw new Error(`El caso con ID ${caso_id} no tiene un email de contacto registrado.`);
    }
    const customerEmail = caso.datos_contacto.email;


    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_ID_CONSULTA_ESTRATEGICA");
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

    if (!stripeKey || !priceId) {
      throw new Error("Las variables de entorno STRIPE_SECRET_KEY y STRIPE_PRICE_ID_CONSULTA_ESTRATEGICA son requeridas.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // <-- AÑADIDO: Especificamos solo tarjeta
      customer_email: customerEmail, // <-- AÑADIDO: Pre-rellenamos el email
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/pago-exitoso`,
      cancel_url: `${siteUrl}/chat?caso_id=${caso_id}&pago=cancelado`,
      metadata: {
        caso_id: caso_id,
        flujo_origen: 'chat_anonimo'
      },
      // Hacemos que Stripe pida el email, ya que no tenemos un usuario logueado
      customer_creation: "always", 
    });
    
    if (!session.url) {
        throw new Error("Stripe no devolvió una URL de sesión.");
    }

    log('info', 'Sesión de checkout anónima creada exitosamente', { caso_id });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log('error', error.message, {
      caso_id: caso_id_logging,
      stack: error.stack
    });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
