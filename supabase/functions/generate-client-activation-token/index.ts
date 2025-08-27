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
      .select('id, estado, email_borrador, cliente_id')
      .eq('id', caso_id)
      .single();

    if (casoError || !caso) {
      throw new Error('Caso no encontrado');
    }

    console.log('🔍 Caso encontrado:', { 
      caso_id, 
      estado: caso.estado, 
      email_borrador: caso.email_borrador?.substring(0, 3) + '***',
      email_solicitado: email.substring(0, 3) + '***'
    });

    // ✅ CORREGIDO: Aceptar estados válidos para casos pagados y casos recién vinculados
    const validStates = ['pago_realizado_pendiente_registro', 'disponible', 'asignado'];
    console.log('🔍 Verificando estado del caso:', {
      caso_id,
      estado_actual: caso.estado,
      estados_validos: validStates,
      email: email.substring(0, 3) + '***',
      tiene_cliente_id: !!caso.cliente_id
    });

    if (!validStates.includes(caso.estado)) {
      console.log('⚠️ Caso en estado inesperado:', {
        caso_id,
        estado_actual: caso.estado,
        estados_validos: validStates,
        email: email.substring(0, 3) + '***',
        tiene_cliente_id: !!caso.cliente_id
      });

      // ✅ CORREGIDO: Intentar corregir el estado si es necesario
      if (caso.cliente_id) {
        console.log('🔧 Corrigiendo estado del caso a disponible');
        const { error: updateError } = await supabaseAdmin
          .from('casos')
          .update({ 
            estado: 'disponible',
            updated_at: new Date().toISOString()
          })
          .eq('id', caso_id);

        if (updateError) {
          console.error('❌ Error corrigiendo estado del caso:', updateError);
          throw new Error(`Error corrigiendo estado del caso: ${updateError.message}`);
        }

        console.log('✅ Estado del caso corregido a disponible');
        caso.estado = 'disponible'; // Actualizar el objeto local
      } else {
        console.error('❌ Caso sin cliente_id y en estado inválido:', caso.estado);
        throw new Error(`El caso no está en estado válido para generar token de activación. Estado actual: ${caso.estado}`);
      }
    }

    console.log('✅ Estado del caso verificado correctamente:', {
      caso_id,
      estado_final: caso.estado,
      email: email.substring(0, 3) + '***'
    });

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

    console.log('✅ Token de activación generado exitosamente', { 
      token: newToken.token.substring(0, 8) + '...',
      caso_id,
      email: email.substring(0, 3) + '***',
      expires_at: newToken.expires_at
    });

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
