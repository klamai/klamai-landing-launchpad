import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Función de prueba para client_activation_tokens');
    
    // Crear cliente Supabase con service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Verificar que la tabla existe y tiene datos
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('client_activation_tokens')
      .select('*')
      .limit(10);

    if (tokensError) {
      console.error('❌ Error consultando tokens:', tokensError);
      return new Response(JSON.stringify({
        success: false,
        error: `Error consultando tokens: ${tokensError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Tokens encontrados:', tokens.length);

    // 2. Verificar casos recientes
    const { data: casos, error: casosError } = await supabaseAdmin
      .from('casos')
      .select('id, estado, email_borrador, cliente_id, fecha_pago')
      .order('created_at', { ascending: false })
      .limit(5);

    if (casosError) {
      console.error('❌ Error consultando casos:', casosError);
    } else {
      console.log('✅ Casos encontrados:', casos.length);
    }

    // 3. Generar un token de prueba
    const testToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const testExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data: newTestToken, error: insertError } = await supabaseAdmin
      .from('client_activation_tokens')
      .insert({
        caso_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
        email: 'test@example.com',
        token: testToken,
        expires_at: testExpires,
        resend_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando token de prueba:', insertError);
    } else {
      console.log('✅ Token de prueba insertado:', newTestToken.token.substring(0, 8) + '...');
    }

    return new Response(JSON.stringify({
      success: true,
      tokens_count: tokens.length,
      casos_count: casos?.length || 0,
      test_token_inserted: !insertError,
      message: 'Prueba completada'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error en función de prueba:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);

