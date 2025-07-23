
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LawyerActivationRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: LawyerActivationRequest = await req.json();

    console.log('🔧 Iniciando activación de cuenta de abogado...');

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

    // Verificar y obtener datos del token de activación
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('lawyer_activation_tokens')
      .select(`
        *,
        solicitudes_abogado (
          nombre,
          apellido,
          telefono,
          especialidades,
          acepta_politicas,
          acepta_comunicacion
        )
      `)
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ Token inválido o expirado:', tokenError);
      throw new Error('Token de activación inválido o expirado');
    }

    console.log('✅ Token válido encontrado:', tokenData.email);

    // Verificar que no existe ya un usuario con este email
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(tokenData.email);
    
    if (existingUser.user) {
      console.error('❌ Usuario ya existe:', tokenData.email);
      throw new Error('Ya existe una cuenta con este email');
    }

    // Crear usuario directamente en auth.users con email confirmado
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: tokenData.email,
      password: password,
      email_confirm: true, // CRÍTICO: Confirmar email automáticamente
      user_metadata: {
        role: 'abogado',
        approved_by_admin: 'true',
        activation_token: token // Para que el trigger lo procese
      }
    });

    if (createUserError || !authUser.user) {
      console.error('❌ Error creando usuario:', createUserError);
      throw new Error('Error al crear la cuenta: ' + createUserError?.message);
    }

    console.log('✅ Usuario auth creado y confirmado:', authUser.user.id);

    // Esperar un momento para que el trigger procese
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que el perfil se creó correctamente
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .eq('role', 'abogado')
      .single();

    if (profileError || !profileData) {
      console.error('❌ Error verificando perfil:', profileError);
      throw new Error('Error: El perfil no se creó automáticamente. Contacta al administrador.');
    }

    console.log('✅ Perfil de abogado creado automáticamente:', profileData.id);

    // Marcar token como usado
    const { error: updateTokenError } = await supabaseAdmin
      .from('lawyer_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (updateTokenError) {
      console.error('⚠️ Error marcando token como usado:', updateTokenError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cuenta activada exitosamente',
      user_id: authUser.user.id,
      email: tokenData.email
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error en activación de abogado:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
