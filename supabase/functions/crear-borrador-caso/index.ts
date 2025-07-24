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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { motivo_consulta, session_token } = await req.json()

    if (!motivo_consulta) {
      return new Response(
        JSON.stringify({ error: 'motivo_consulta es requerido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!session_token) {
      return new Response(
        JSON.stringify({ error: 'session_token es requerido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Creando caso borrador con:', { motivo_consulta, session_token })

    // Crear caso borrador en la base de datos
    const { data: caso, error: casoError } = await supabaseClient
      .from('casos')
      .insert({
        motivo_consulta,
        session_token,
        estado: 'borrador',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (casoError) {
      console.error('Error al crear caso:', casoError)
      return new Response(
        JSON.stringify({ error: 'Error al crear el caso' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Nota: La carpeta de documentos se creará automáticamente cuando se suba el primer archivo
    console.log('Caso creado - la carpeta de documentos se creará cuando sea necesaria:', caso.id)

    console.log('Caso creado exitosamente:', caso.id)

    return new Response(
      JSON.stringify({ 
        caso_id: caso.id,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error en crear-borrador-caso:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})