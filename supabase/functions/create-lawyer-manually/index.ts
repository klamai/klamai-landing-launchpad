import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No se proporcionó token de autenticación');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuración de Supabase incompleta');
    }

    // Cliente para verificar permisos del usuario actual (usa anon key)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Cliente administrativo para operaciones de auth (usa service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar que el usuario actual es super admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
      throw new Error('Acceso denegado: Solo los super administradores pueden crear abogados manualmente');
    }

    const {
      nombre,
      apellido,
      email,
      telefono,
      colegio_profesional,
      numero_colegiado,
      experiencia_anos,
      ciudad,
      especialidades
    } = await req.json();

    // Validar campos requeridos
    if (!nombre || !apellido || !email) {
      throw new Error('Nombre, apellido y email son campos obligatorios');
    }

    console.log(`Iniciando creación manual de abogado: ${email}`);

    // Verificar que no existe ya un usuario con este email
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === email);

    if (userExists) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Crear usuario en auth.users sin contraseña (para magic link)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: false, // No confirmar automáticamente, usaremos magic link
      user_metadata: {
        nombre: nombre,
        apellido: apellido,
        role: 'abogado',
        tipo_abogado: 'regular'
      }
    });

    if (authError || !authUser.user) {
      console.error('Error creando usuario en auth:', authError);
      throw new Error(`Error creando usuario: ${authError?.message || 'Error desconocido'}`);
    }

    console.log('Usuario creado en auth exitosamente:', authUser.user.id);

    // Generar magic link para activación de cuenta
    const origin = req.headers.get('origin') || 'https://klamai.com';
    console.log('Generating magic link for email:', email);
    console.log('Redirect URL:', `${origin}/auth/complete-setup`);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${origin}/auth/complete-setup`
      }
    });

    console.log('Magic link generation result:', {
      success: !linkError,
      hasActionLink: linkData?.properties?.action_link ? true : false,
      error: linkError?.message
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('Error generando magic link:', linkError);
      // Si falla el magic link, intentar eliminar el usuario creado
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error('Error generando enlace de activación');
    }

    console.log('Magic link generado exitosamente');

    // Actualizar perfil en profiles (el trigger handle_new_user ya lo creó)
    const { data: profileData, error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({
        nombre: nombre,
        apellido: apellido,
        email: email,
        telefono: telefono || null,
        role: 'abogado',
        tipo_abogado: 'regular',
        colegio_profesional: colegio_profesional || null,
        numero_colegiado: numero_colegiado || null,
        experiencia_anos: experiencia_anos ? parseInt(experiencia_anos) : null,
        ciudad: ciudad || null,
        especialidades: especialidades && especialidades.length > 0 ? especialidades : null,
        creditos_disponibles: 100, // Créditos iniciales
        acepta_politicas: true,
        acepta_comunicacion: true,
        politicas_aceptadas_at: new Date().toISOString(),
        configuracion_completada: false // Indica que necesita completar configuración
      })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('Error actualizando perfil:', profileUpdateError);
      // Si falla la actualización del perfil, intentar eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Error actualizando perfil: ${profileUpdateError.message}`);
    }

    console.log('Perfil actualizado exitosamente');

    // Enviar email de bienvenida con magic link
    try {
      await supabaseClient.functions.invoke('send-lawyer-welcome-email', {
        body: {
          tipo: 'creacion_manual',
          email: email,
          nombre: nombre,
          apellido: apellido,
          magicLink: linkData.properties.action_link
        }
      });
      console.log('Email de bienvenida enviado exitosamente');
    } catch (emailError) {
      console.warn('Error enviando email de bienvenida:', emailError);
      // No fallar toda la operación si solo falla el email
    }

    // Agregar entrada de auditoría
    await supabaseClient
      .from('auditoria_seguridad')
      .insert({
        usuario_id: user.id,
        accion: 'CREAR_ABOGADO_MANUALMENTE',
        tabla_afectada: 'profiles',
        registro_id: authUser.user.id,
        datos_nuevos: {
          email: email,
          nombre: nombre,
          apellido: apellido,
          role: 'abogado',
          tipo_abogado: 'regular'
        }
      });

    const response = {
      success: true,
      user_id: authUser.user.id,
      email: email,
      nombre: nombre,
      apellido: apellido,
      magic_link: linkData.properties.action_link
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });

  } catch (error: any) {
    console.error('Error fatal en create-lawyer-manually:', error);

    const errorResponse = {
      success: false,
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });
  }
};

serve(handler);