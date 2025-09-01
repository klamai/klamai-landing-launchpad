import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Configuración de la API de HeyGen
const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
const HEYGEN_DEFAULT_AVATAR_ID = Deno.env.get('HEYGEN_DEFAULT_AVATAR_ID');
const HEYGEN_DEFAULT_VOICE_ID = Deno.env.get('HEYGEN_DEFAULT_VOICE_ID');
const HEYGEN_API_BASE_URL = 'https://api.heygen.com';

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Interfaces TypeScript
interface VideoGenerationRequest {
  text: string;
  avatar_id?: string;
  voice_id?: string;
  background?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface VideoGenerationResponse {
  success: boolean;
  video_id?: string;
  status?: string;
  video_url?: string;
  error?: string;
}

interface VideoStatusResponse {
  success: boolean;
  status?: string;
  video_url?: string;
  error?: string;
}

// Función principal
Deno.serve(async (req: Request) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET - Mostrar instrucciones
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          message: 'API de Generación de Videos HeyGen',
          usage: 'POST / con {"text": "tu texto"} para generar video',
          endpoints: {
            'POST /': 'Generar video con texto',
            'GET /status?video_id=X': 'Consultar estado del video'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Generar video
    if (req.method === 'POST') {
      // Verificar API key
      if (!HEYGEN_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'API key de HeyGen no configurada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parsear request
      const { text, avatar_id, voice_id, background, dimensions }: VideoGenerationRequest = await req.json();

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'El campo "text" es requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generar video
      const result = await generateVideo(text, avatar_id, voice_id, background, dimensions);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Método no soportado
    return new Response(
      JSON.stringify({ error: 'Método no permitido. Usa GET o POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en generate-heygen-video:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Función para generar video
async function generateVideo(
  text: string, 
  avatar_id?: string, 
  voice_id?: string, 
  background?: string, 
  dimensions?: { width: number; height: number }
): Promise<VideoGenerationResponse> {
  try {
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: avatar_id || HEYGEN_DEFAULT_AVATAR_ID || "Lina_Dress_Sitting_Side_public",
              avatar_style: "normal"
            },
            voice: {
              type: "text",
              input_text: text,
              voice_id: voice_id || HEYGEN_DEFAULT_VOICE_ID || "119caed25533477ba63822d5d1552d25",
              speed: 1.0
            }
          }
        ],
        dimension: {
          width: dimensions?.width || 1280,
          height: dimensions?.height || 720
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error HeyGen API: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      video_id: data.data.video_id,
      status: 'processing',
      message: 'Video en proceso de generación. Usa /status?video_id=' + data.data.video_id + ' para verificar el estado.'
    };

  } catch (error) {
    console.error('Error generando video:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para verificar estado del video
async function checkVideoStatus(videoId: string): Promise<VideoStatusResponse> {
  try {
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY!,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error verificando estado: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data.status === 'completed') {
      return {
        success: true,
        status: 'completed',
        video_url: data.data.video_url
      };
    } else if (data.data.status === 'failed') {
      return {
        success: false,
        status: 'failed',
        error: 'La generación del video falló'
      };
    } else {
      return {
        success: true,
        status: data.data.status,
        message: 'Video aún en proceso'
      };
    }

  } catch (error) {
    console.error('Error verificando estado del video:', error);
    return {
      success: false,
      error: error.message
    };
  }
}