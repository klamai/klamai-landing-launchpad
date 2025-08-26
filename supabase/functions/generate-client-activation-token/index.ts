import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTokenRequest {
  caso_id: string;
  email: string;
  force_new?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caso_id, email, force_new = false }: GenerateTokenRequest = await req.json();

    console.log('🔧 Generando token de activación para cliente...', { caso_id, email: email.substring(0, 3) + '***' });
    
    // Crear cliente Supabase con service role para operaciones administrativas
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

    // Verificar que el caso existe y tiene el estado correcto
    const { data: caso, error: casoError } = await supabaseAdmin
      .from('casos')
      .select('id, estado, email_borrador')
      .eq('id', caso_id)
      .single();

    if (casoError || !caso) {
      throw new Error('Caso no encontrado');
    }

    if (caso.estado !== 'pago_realizado_pendiente_registro') {
      throw new Error('El caso no está en estado de pago realizado pendiente de registro');
    }

    // Verificar si ya existe un token válido para este caso
    if (!force_new) {
      const { data: existingToken, error: tokenError } = await supabaseAdmin
        .from('client_activation_tokens')
        .select('*')
        .eq('caso_id', caso_id)
        .eq('email', email)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (existingToken && !tokenError) {
        console.log('✅ Token existente válido encontrado');
        return new Response(JSON.stringify({
          success: true,
          token: existingToken.token,
          expires_at: existingToken.expires_at,
          resend_count: existingToken.resend_count,
          message: 'Token existente válido'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generar nuevo token único
    const token = generateUniqueToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Insertar nuevo token
    const { data: newToken, error: insertError } = await supabaseAdmin
      .from('client_activation_tokens')
      .insert({
        caso_id,
        email,
        token,
        expires_at,
        resend_count: 0
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al crear token: ${insertError.message}`);
    }

    console.log('✅ Token de activación generado exitosamente');

    return new Response(JSON.stringify({
      success: true,
      token: newToken.token,
      expires_at: newToken.expires_at,
      resend_count: newToken.resend_count,
      message: 'Nuevo token generado'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error generando token:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

function generateUniqueToken(): string {
  // Generar token único (igual formato que abogados: 64 caracteres)
  const uuid1 = crypto.randomUUID().replace(/-/g, '');
  const uuid2 = crypto.randomUUID().replace(/-/g, '');
  return uuid1 + uuid2;
}

serve(handler);
