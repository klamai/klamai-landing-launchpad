import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || req.headers.get('origin') || '').replace(/\/$/, '');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return json({ error: 'Variables de entorno requeridas no configuradas' }, 500);
    }

    const { proposal_token } = await req.json();
    if (!proposal_token || typeof proposal_token !== 'string') {
      return json({ error: 'proposal_token requerido' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // 1. Validar token de propuesta
    const { data: tokenData, error: tokenError } = await supabase
      .from('proposal_tokens')
      .select('caso_id, expires_at')
      .eq('token', proposal_token)
      .single();

    if (tokenError || !tokenData) {
      return json({ error: 'Token de propuesta inválido' }, 400);
    }

    if (!tokenData.expires_at || new Date(tokenData.expires_at).getTime() < Date.now()) {
      return json({ error: 'Token de propuesta expirado' }, 400);
    }

    const casoId = tokenData.caso_id as string;

    // 2. Obtener datos del caso
    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single();

    if (casoError || !caso) {
      return json({ error: 'Caso no encontrado' }, 404);
    }

    // 3. Verificar que el caso esté en estado válido para pago
    const allowedStates = ['listo_para_propuesta', 'propuesta_enviada', 'esperando_pago'];
    if (!allowedStates.includes(caso.estado)) {
      return json({ 
        error: 'Estado del caso no permite checkout', 
        estado_actual: caso.estado 
      }, 400);
    }

    // 4. Crear sesión de Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const priceId = Deno.env.get('STRIPE_PRICE_ID_CONSULTA_ESTRATEGICA') || 'price_1Rc0kkI0mIGG72Op6Rk4GulG';
    
    const idempotencyKey = `propuesta_anonima:${proposal_token}:${Math.floor(Date.now()/60000)}`;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: 'payment',
      client_reference_id: casoId,
      success_url: `${appBaseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&caso_id=${casoId}`,
      cancel_url: `${appBaseUrl}/pago-cancelado?session_id={CHECKOUT_SESSION_ID}&caso_id=${casoId}`,
      metadata: { 
        caso_id: casoId,
        flujo_origen: 'propuesta_anonima',
        proposal_token: proposal_token
      },
    }, { idempotencyKey });

    // 5. Actualizar estado del caso
    await supabase
      .from('casos')
      .update({ 
        stripe_session_id: session.id, 
        estado: 'esperando_pago',
        updated_at: new Date().toISOString()
      })
      .eq('id', casoId);

    console.log(`✅ Sesión de checkout creada para propuesta anónima - Caso: ${casoId}, Session: ${session.id}`);

    return json({ 
      url: session.url, 
      session_id: session.id,
      caso_id: casoId
    });

  } catch (error) {
    console.error('Error creando checkout anónimo por token:', error);
    return json({ 
      error: 'Error creando sesión de checkout', 
      details: String(error) 
    }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json' 
    } 
  });
}

