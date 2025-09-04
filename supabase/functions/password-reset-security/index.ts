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
    )

    const { email, ip_address, user_agent } = await req.json()

    // Detectar IP real desde headers (prioridad: X-Forwarded-For, CF-Connecting-IP, X-Real-IP)
    const xff = req.headers.get('x-forwarded-for') || ''
    const cfIp = req.headers.get('cf-connecting-ip') || ''
    const realIp = req.headers.get('x-real-ip') || ''
    const headerIp = (xff.split(',')[0] || cfIp || realIp || '').trim() || null
    const clientIp = headerIp || ip_address || null

    // User-Agent de headers si no viene en body
    const ua = user_agent || req.headers.get('user-agent') || 'unknown'
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar rate limiting
    const { data: canProceed, error: rateLimitError } = await supabaseClient
      .rpc('check_password_reset_rate_limit', {
        p_email: email,
        p_ip_address: clientIp
      })

    if (rateLimitError) {
      console.error('Error checking rate limit:', rateLimitError)
      // Respuesta genérica para evitar enumeración
      await new Promise((r) => setTimeout(r, 350))
      return new Response(
        JSON.stringify({ success: true, message: 'Si el email existe, te enviaremos un enlace' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!canProceed) {
      // Registrar intento bloqueado
      await supabaseClient.rpc('log_password_reset_attempt', {
        p_email: email,
        p_ip_address: clientIp,
        p_user_agent: ua,
        p_success: false
      })

      // Respuesta genérica uniforme (evita enumeración)
      await new Promise((r) => setTimeout(r, 350))
      return new Response(
        JSON.stringify({ success: true, message: 'Si el email existe, te enviaremos un enlace' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Determinar la URL de redirección correcta basada en el referer
    const origin = req.headers.get('origin') || 'https://localhost:5173';
    const referer = req.headers.get('referer') || '';
    
    let redirectPath = '/auth?tab=reset-password';
    
    // Detectar si viene de rutas de abogados o admin
    if (referer.includes('/abogados/auth')) {
      redirectPath = '/abogados/auth?tab=reset-password';
    } else if (referer.includes('/admin/auth')) {
      redirectPath = '/admin/auth?tab=reset-password';
    }
    
    const redirectTo = `${origin}${redirectPath}`;
    console.log('Redirect URL:', redirectTo); // Para debugging
    
    // Proceder con el reset de contraseña
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectTo
      }
    )

    // Registrar el intento
    await supabaseClient.rpc('log_password_reset_attempt', {
      p_email: email,
      p_ip_address: clientIp,
      p_user_agent: ua,
      p_success: !resetError
    })

    if (resetError) {
      console.error('Error sending reset email:', resetError)
      // Respuesta genérica uniforme (evita enumeración)
      await new Promise((r) => setTimeout(r, 350))
      return new Response(
        JSON.stringify({ success: true, message: 'Si el email existe, te enviaremos un enlace' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Respuesta genérica uniforme
    await new Promise((r) => setTimeout(r, 350))
    return new Response(
      JSON.stringify({ success: true, message: 'Si el email existe, te enviaremos un enlace' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
