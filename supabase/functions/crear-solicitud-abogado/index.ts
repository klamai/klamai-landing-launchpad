import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-version',
}

// Esquema de validación para los datos de entrada
const solicitudSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  colegio_profesional: z.string().min(3, 'El colegio profesional es requerido'),
  numero_colegiado: z.string().min(1, 'El número de colegiado es requerido'),
  especialidades: z.array(z.number()).min(1, 'Debes seleccionar al menos una especialidad'),
  experiencia_anos: z.number().min(0, 'La experiencia no puede ser negativa'),
  cv_url: z.string().optional(),
  carta_motivacion: z.string().min(50, 'La carta de motivación debe tener al menos 50 caracteres'),
  acepta_politicas: z.boolean().refine(val => val === true, 'Debes aceptar las políticas de privacidad'),
  acepta_comunicacion: z.boolean().optional(),
});

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }

    // Obtener y validar datos
    const body = await req.json()
    const validatedData = solicitudSchema.parse(body)

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuración de Supabase incompleta')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // PASO 1: Verificación de seguridad para evitar enumeración de usuarios
    // Comprobar si el email ya existe en 'profiles'
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    // Comprobar si ya existe una solicitud pendiente o aprobada
    const { data: existingSolicitud } = await supabase
      .from('solicitudes_abogado')
      .select('id')
      .eq('email', validatedData.email)
      .in('estado', ['pendiente', 'aprobada'])
      .single();

    // Si ya existe un perfil o una solicitud, retornar éxito para no dar pistas.
    if (existingProfile || existingSolicitud) {
      console.log(`Solicitud duplicada o email ya registrado para: ${validatedData.email}. Respondiendo con éxito genérico.`);
      // Opcional: Aquí se podría encolar un trabajo para enviar un email informativo.
      return new Response(JSON.stringify({
        success: true,
        message: 'Solicitud enviada correctamente',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Obtener información del cliente para auditoría
    let clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    // Si hay una lista de IPs, tomar solo la primera
    if (clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim()
    }
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Insertar solicitud en la base de datos
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes_abogado')
      .insert({
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        email: validatedData.email,
        telefono: validatedData.telefono,
        colegio_profesional: validatedData.colegio_profesional,
        numero_colegiado: validatedData.numero_colegiado,
        // CORRECCIÓN: Formatear el array de especialidades para PostgreSQL
        especialidades: `{${validatedData.especialidades.join(',')}}`,
        experiencia_anos: validatedData.experiencia_anos,
        cv_url: validatedData.cv_url || null,
        carta_motivacion: validatedData.carta_motivacion,
        acepta_politicas: validatedData.acepta_politicas,
        acepta_comunicacion: validatedData.acepta_comunicacion || false,
        estado: 'pendiente',
        // CORRECCIÓN: Usar el nombre de columna correcto de la tabla
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (solicitudError) {
      console.error('Error al insertar solicitud:', solicitudError)
      // Ya no se maneja el error de duplicado aquí, se hace en la verificación previa.
      throw new Error('Error al procesar la solicitud')
    }

    // Registrar auditoría para cumplimiento RGPD
    const { error: auditoriaError } = await supabase
      .from('auditoria_seguridad')
      .insert({
        accion: 'NUEVA_SOLICITUD_ABOGADO',
        tabla_afectada: 'solicitudes_abogado',
        registro_id: solicitud.id, // CORRECCIÓN
        datos_anteriores: null,
        datos_nuevos: {
          consentimiento_politicas: validatedData.acepta_politicas,
          consentimiento_comunicacion: validatedData.acepta_comunicacion,
          especialidades_seleccionadas: validatedData.especialidades,
        },
        ip_address: clientIP, // CORRECCIÓN
        user_agent: userAgent,
        usuario_id: null, // Usuario no autenticado
        created_at: new Date().toISOString(), // CORRECCIÓN
      })

    if (auditoriaError) {
      console.error('Error al registrar auditoría:', auditoriaError)
      // No fallamos la solicitud por un error de auditoría, pero lo registramos
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Solicitud enviada correctamente',
      solicitud_id: solicitud.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error interno en la lógica de la función:', error)
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  } catch (e) {
    // Catch de emergencia para cualquier error inesperado
    console.error('Error catastrófico en la Edge Function:', e)
    return new Response(JSON.stringify({ error: 'Error inesperado en el servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
