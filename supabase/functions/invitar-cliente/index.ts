import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { profileId, casoId } = await req.json()

    if (!profileId || !casoId) {
      throw new Error('Faltan datos requeridos: profileId y casoId')
    }

    // Obtener datos del perfil del cliente
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      throw new Error('Perfil no encontrado')
    }

    // Obtener datos del caso
    const { data: caso, error: casoError } = await supabaseClient
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single()

    if (casoError || !caso) {
      throw new Error('Caso no encontrado')
    }

    // Generar token único para la invitación
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 72) // Expira en 72 horas

    // Guardar token en la base de datos
    const { error: tokenError } = await supabaseClient
      .from('invitaciones_clientes')
      .insert({
        token,
        profile_id: profileId,
        caso_id: casoId,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      throw new Error('Error al crear token de invitación')
    }

    // URL de activación
    const activationUrl = `${Deno.env.get('FRONTEND_URL')}/activar-cliente?token=${token}`

    // Enviar email usando la función existente
    const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: profile.email,
        subject: 'Invitación para acceder a tu caso legal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a Klamai!</h2>
            
            <p>Hola ${profile.nombre} ${profile.apellido},</p>
            
            <p>Tu abogado ha creado un perfil para ti en nuestra plataforma para gestionar tu caso legal.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalles del caso:</h3>
              <p><strong>Motivo:</strong> ${caso.motivo_consulta}</p>
              <p><strong>Estado:</strong> ${caso.estado}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(caso.created_at).toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Para acceder a tu caso y gestionar tu información legal, necesitas activar tu cuenta:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Activar mi cuenta
              </a>
            </div>
            
            <p><strong>Importante:</strong> Este enlace expira en 72 horas por seguridad.</p>
            
            <p>Si no esperabas este email, puedes ignorarlo de forma segura.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #6b7280;">
              Este email fue enviado por Klamai. Para más información, visita nuestra 
              <a href="${Deno.env.get('FRONTEND_URL')}/politica-privacidad">Política de Privacidad</a>.
            </p>
          </div>
        `
      }
    })

    if (emailError) {
      throw new Error('Error al enviar email')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de invitación enviado correctamente' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 