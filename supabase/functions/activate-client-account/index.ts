import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { token, password } = await req.json()

    if (!token || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token y contraseña son requeridos' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔐 Activando cuenta de cliente:', {
      token: token.substring(0, 8) + '...',
      passwordLength: password.length
    })

    // 1. Verificar que el token existe y es válido
    const { data: tokenData, error: tokenError } = await supabase
      .from('client_activation_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      console.error('❌ Token inválido o expirado:', tokenError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido o expirado' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Token válido encontrado:', {
      email: tokenData.email?.substring(0, 3) + '***',
      casoId: tokenData.caso_id?.substring(0, 8)
    })

    // 2. Buscar el usuario por email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error listando usuarios:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error interno del servidor' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Encontrar el usuario por email
    const user = userData.users.find(u => u.email === tokenData.email)
    
    if (!user) {
      console.error('❌ Usuario no encontrado:', tokenData.email)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuario no encontrado' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Usuario encontrado:', {
      userId: user.id?.substring(0, 8),
      email: user.email?.substring(0, 3) + '***'
    })

    // 3. Actualizar la contraseña del usuario
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    )

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error al establecer la contraseña: ${updateError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Contraseña actualizada exitosamente')

    // 4. Marcar el token como usado
    const { error: tokenUpdateError } = await supabase
      .from('client_activation_tokens')
      .update({ 
        used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('token', token)

    if (tokenUpdateError) {
      console.warn('⚠️ Warning: No se pudo marcar token como usado:', tokenUpdateError)
      // No es crítico, continuar
    }

    // 5. Si hay un caso asociado, asegurar que esté en estado 'disponible'
    if (tokenData.caso_id) {
      const { error: casoUpdateError } = await supabase
        .from('casos')
        .update({ 
          estado: 'disponible',
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.caso_id)

      if (casoUpdateError) {
        console.warn('⚠️ Warning: No se pudo actualizar estado del caso:', casoUpdateError)
        // No es crítico, continuar
      } else {
        console.log('✅ Estado del caso actualizado a "disponible"')
      }
    }

    console.log('✅ Cuenta de cliente activada exitosamente')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cuenta activada exitosamente',
        userId: user.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error inesperado:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
