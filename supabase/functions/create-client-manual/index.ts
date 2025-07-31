import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is super admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo super administradores pueden crear clientes.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get request body
    const { 
      nombre, 
      apellido, 
      email, 
      telefono, 
      ciudad, 
      tipo_perfil, 
      razon_social, 
      nif_cif, 
      nombre_gerente, 
      direccion_fiscal, 
      mensaje_invitacion 
    } = await req.json()

    // Validate required fields
    if (!nombre || !apellido || !email) {
      return new Response(
        JSON.stringify({ error: 'Nombre, apellido y email son obligatorios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un usuario con este email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate a unique invitation token
    const invitationToken = crypto.randomUUID()
    const invitationExpiry = new Date()
    invitationExpiry.setHours(invitationExpiry.getHours() + 72) // 72 hours expiry

    // Create the client profile
    const { data: newProfile, error: profileCreateError } = await supabaseClient
      .from('profiles')
      .insert({
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        ciudad: ciudad || null,
        tipo_perfil: tipo_perfil || 'individual',
        razon_social: razon_social || null,
        nif_cif: nif_cif || null,
        nombre_gerente: nombre_gerente || null,
        direccion_fiscal: direccion_fiscal || null,
        role: 'cliente',
        acepta_politicas: false, // Will be set to true when they accept invitation
        acepta_comunicacion: false,
        creditos_disponibles: 0,
        invitation_token: invitationToken,
        invitation_expiry: invitationExpiry.toISOString(),
        invitation_sent_by: user.id,
        invitation_sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileCreateError) {
      console.error('Error creating profile:', profileCreateError)
      return new Response(
        JSON.stringify({ error: 'Error al crear el perfil del cliente' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate invitation link
    const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    const invitationLink = `${baseUrl}/auth/invitation?token=${invitationToken}`

    // Send invitation email (you can implement this with your email service)
    try {
      // For now, we'll just log the invitation
      console.log('Invitation sent:', {
        to: email,
        link: invitationLink,
        message: mensaje_invitacion || 'Te invitamos a unirte a nuestra plataforma legal.'
      })

      // TODO: Implement actual email sending here
      // You can use services like SendGrid, Resend, or your preferred email provider
      
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cliente creado exitosamente',
        client_id: newProfile.id,
        invitation_link: invitationLink,
        invitation_token: invitationToken
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-client-manual:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 