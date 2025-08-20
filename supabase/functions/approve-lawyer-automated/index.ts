import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vwnoznuznmrdaumjyctg.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
      console.error('Error en aprobación automática:', approvalError);
      throw new Error(`Error en aprobación automática: ${approvalError.message}`);
    }

    if (!approvalData || !approvalData.success) {
      throw new Error('La función de aprobación no retornó éxito');
    }

    console.log('Solicitud aprobada exitosamente:', approvalData);

    try {
      await supabase.functions.invoke('send-lawyer-approval-email', {
        body: {
          tipo: 'aprobacion',
          email: approvalData.email,
          nombre: approvalData.nombre,
          apellido: approvalData.apellido,
          // Se elimina el objeto anidado 'credenciales' y la contraseña temporal
          activationToken: approvalData.activation_token
        }
      });
      console.log('Email de aprobación enviado');
    } catch (emailError) {
      console.warn('Error enviando email (pero la aprobación fue exitosa):', emailError);
    }

    const response = {
      success: true,
      solicitud_id: approvalData.solicitud_id,
      email: approvalData.email,
      nombre: approvalData.nombre,
      apellido: approvalData.apellido,
      activation_token: approvalData.activation_token,
      // Se elimina la contraseña temporal de la respuesta
      profile_created: approvalData.profile_created || false
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en approve-lawyer-automated:', error);
    
    const errorResponse = {
      success: false,
      solicitud_id: '',
      email: '',
      nombre: '',
      apellido: '',
      activation_token: '',
      // Se elimina la contraseña temporal de la respuesta de error
      profile_created: false,
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
