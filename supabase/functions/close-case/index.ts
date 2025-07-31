import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLOSE-CASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep("Función iniciada");

    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    logStep("Variables de entorno verificadas");

    // Create Supabase client with service role
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      logStep("ERROR - No se encontró header de autorización");
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      logStep("ERROR - Error autenticando usuario", { error: authError?.message });
      throw new Error('Invalid token')
    }

    logStep("Usuario autenticado", { userId: user.id, email: user.email });

    // Get request body
    const { caso_id } = await req.json()
    if (!caso_id) {
      logStep("ERROR - caso_id no proporcionado");
      throw new Error('caso_id is required')
    }

    logStep("Caso ID recibido", { caso_id });

    // Get user profile to verify permissions
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logStep("ERROR - Error obteniendo perfil", { error: profileError?.message });
      throw new Error('Error fetching user profile')
    }

    logStep("Perfil obtenido", { role: profile.role, tipo: profile.tipo_abogado });

    // Verify permissions
    let canClose = false;
    let isSuperAdmin = false;

    if (profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
      canClose = true;
      isSuperAdmin = true;
      logStep("Usuario es super admin - puede cerrar cualquier caso");
    } else if (profile.role === 'abogado' && profile.tipo_abogado === 'regular') {
      // Check if lawyer is assigned to this case
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('asignaciones_casos')
        .select('id, estado_asignacion')
        .eq('caso_id', caso_id)
        .eq('abogado_id', user.id)
        .eq('estado_asignacion', 'activa')
        .single()

      logStep("Verificando asignación", { 
        caso_id, 
        abogado_id: user.id, 
        assignment, 
        error: assignmentError?.message 
      });

      if (assignmentError) {
        logStep("ERROR - Error verificando asignación", { error: assignmentError.message });
        throw new Error('Error checking case assignment')
      }

      if (assignment) {
        canClose = true;
        logStep("Abogado regular asignado al caso - puede cerrarlo");
      } else {
        logStep("ERROR - Abogado regular no asignado al caso");
        throw new Error('No tienes permisos para cerrar este caso')
      }
    } else {
      logStep("ERROR - Usuario no tiene permisos para cerrar casos", { 
        role: profile.role, 
        tipo: profile.tipo_abogado 
      });
      throw new Error('No tienes permisos para cerrar casos')
    }

    // Check if case exists and is not already closed
    const { data: caso, error: casoError } = await supabaseClient
      .from('casos')
      .select('id, estado, motivo_consulta')
      .eq('id', caso_id)
      .single()

    if (casoError || !caso) {
      logStep("ERROR - Caso no encontrado", { error: casoError?.message });
      throw new Error('Caso no encontrado')
    }

    if (caso.estado === 'cerrado') {
      logStep("ERROR - Caso ya está cerrado");
      throw new Error('El caso ya está cerrado')
    }

    logStep("Caso verificado", { estado: caso.estado, motivo_consulta: caso.motivo_consulta });

    // Start transaction to close the case
    const { data: closeResult, error: closeError } = await supabaseClient
      .from('casos')
      .update({
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        cerrado_por: user.id
      })
      .eq('id', caso_id)
      .select('id, estado, fecha_cierre, cerrado_por')
      .single()

    if (closeError) {
      logStep("ERROR - Error cerrando caso", { error: closeError.message });
      throw new Error('Error closing case: ' + closeError.message)
    }

    logStep("Caso cerrado exitosamente", { 
      caso_id: closeResult.id, 
      estado: closeResult.estado,
      fecha_cierre: closeResult.fecha_cierre 
    });

    // Update case assignment status if it's a regular lawyer
    if (!isSuperAdmin) {
      const { error: assignmentUpdateError } = await supabaseClient
        .from('asignaciones_casos')
        .update({ estado_asignacion: 'completada' })
        .eq('caso_id', caso_id)
        .eq('abogado_id', user.id)
        .eq('estado_asignacion', 'activa')

      if (assignmentUpdateError) {
        logStep("WARNING - Error actualizando asignación", { error: assignmentUpdateError.message });
        // Don't throw error here, case is already closed
      } else {
        logStep("Asignación marcada como completada");
      }
    }

    // Add audit log
    const { error: auditError } = await supabaseClient
      .from('auditoria_seguridad')
      .insert({
        usuario_id: user.id,
        accion: 'CERRAR_CASO',
        tabla_afectada: 'casos',
        registro_id: caso_id,
        datos_nuevos: {
          caso_id: caso_id,
          fecha_cierre: closeResult.fecha_cierre,
          cerrado_por: user.id,
          motivo_consulta: caso.motivo_consulta,
          es_super_admin: isSuperAdmin
        }
      })

    if (auditError) {
      logStep("WARNING - Error agregando auditoría", { error: auditError.message });
      // Don't throw error here, case is already closed
    } else {
      logStep("Auditoría registrada exitosamente");
    }

    logStep("Proceso completado exitosamente");

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          caso_id: closeResult.id,
          estado: closeResult.estado,
          fecha_cierre: closeResult.fecha_cierre,
          cerrado_por: closeResult.cerrado_por,
          mensaje: 'Caso cerrado exitosamente'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en close-case", { message: errorMessage });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 