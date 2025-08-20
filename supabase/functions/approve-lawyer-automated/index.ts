import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuración de Supabase incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
      throw new Error('Acceso denegado: Solo los super administradores pueden aprobar solicitudes');
    }

    const { solicitud_id } = await req.json();
    
    if (!solicitud_id) {
      throw new Error('ID de solicitud requerido');
    }

    console.log(`Iniciando aprobación automática para solicitud: ${solicitud_id}`);

    const { data: approvalData, error: approvalError } = await supabase.rpc(
      'aprobar_solicitud_abogado_automatizado',
      { 
        p_solicitud_id: solicitud_id,
        p_notas_admin: 'Aprobación automática realizada por super admin'
      }
    );

    if (approvalError) {
      throw new Error(`Error en la base de datos al aprobar: ${approvalError.message}`);
    }

    if (!approvalData || !approvalData.success) {
      throw new Error('La función de la base de datos no retornó éxito o no devolvió datos.');
    }

    console.log('Solicitud aprobada en BD exitosamente:', approvalData);

    // Nota: El envío de email se ha centralizado aquí. El frontend ya no lo llama.
    try {
      await supabase.functions.invoke('send-lawyer-approval-email', {
        body: {
          tipo: 'aprobacion',
          email: approvalData.email,
          nombre: approvalData.nombre,
          apellido: approvalData.apellido,
          activationToken: approvalData.activation_token
        }
      });
      console.log('Invocación para enviar email de aprobación realizada.');
    } catch (emailError) {
      console.warn('Error al invocar la función de envío de email (la aprobación en BD fue exitosa):', emailError);
      // No relanzamos el error para no fallar toda la operación si solo falla el email
    }

    const response = {
      success: true,
      solicitud_id: approvalData.solicitud_id,
      email: approvalData.email,
      nombre: approvalData.nombre,
      apellido: approvalData.apellido,
      activation_token: approvalData.activation_token,
      profile_created: approvalData.profile_created || false
    };

    // SOLUCIÓN FINAL: Aplicar headers CORS a la respuesta de éxito
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error: any) {
    console.error('Error fatal en approve-lawyer-automated:', error);
    
    const errorResponse = {
      success: false,
      error: error.message
    };

    // SOLUCIÓN FINAL: Aplicar headers CORS a la respuesta de error
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
