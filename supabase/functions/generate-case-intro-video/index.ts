import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

// Configuración de APIs
const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
const HEYGEN_DEFAULT_AVATAR_ID = Deno.env.get('HEYGEN_DEFAULT_AVATAR_ID');
const HEYGEN_DEFAULT_VOICE_ID = Deno.env.get('HEYGEN_DEFAULT_VOICE_ID');

// Configuración de Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Configuración de OpenAI
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Configuración del abogado principal
const LAWYER_NAME = Deno.env.get('LAWYER_NAME') || 'José María Escribá';

// Crear cliente de OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || ''
});

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Interfaces TypeScript
interface CaseIntroRequest {
  caso_id: string;
  phone_number?: string;
}

interface CaseData {
  id: string;
  titulo: string;
  descripcion: string;
  cliente_nombre: string;
  estado: string;
  created_at: string;
  cliente_telefono?: string;
}

interface VideoGenerationResponse {
  success: boolean;
  video_id?: string;
  status?: string;
  video_url?: string;
  error?: string;
}

interface WhatsAppResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

// Función principal
Deno.serve(async (req: Request) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar configuraciones requeridas
    if (!HEYGEN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      const missing = [];
      if (!HEYGEN_API_KEY) missing.push('HEYGEN_API_KEY');
      if (!SUPABASE_URL) missing.push('SUPABASE_URL');
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');

      return new Response(
        JSON.stringify({
          error: 'Configuración incompleta',
          details: `Faltan secrets: ${missing.join(', ')}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsear request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Request body recibido:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Error parseando JSON del request:', parseError);
      return new Response(
        JSON.stringify({
          error: 'JSON inválido en el request',
          details: parseError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { caso_id, phone_number }: CaseIntroRequest = requestBody;

    if (!caso_id) {
      return new Response(
        JSON.stringify({
          error: 'caso_id es requerido'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Iniciando proceso para caso: ${caso_id}`);

    // 1. Obtener datos del caso desde la tabla 'casos'
    console.log(`📋 Paso 1: Obteniendo datos del caso...`);
    const caseData = await getCaseData(caso_id);
    if (!caseData) {
      return new Response(
        JSON.stringify({ error: 'Caso no encontrado en la tabla casos' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Caso encontrado: "${caseData.titulo}" para cliente: ${caseData.cliente_nombre}`);

    // 2. Generar texto personalizado
    console.log(`📝 Paso 2: Generando texto personalizado...`);
    const personalizedText = await generatePersonalizedText(caseData);
    console.log(`✅ Texto generado (${personalizedText.length} caracteres)`);

    // 3. Generar video con HeyGen
    console.log(`🎬 Paso 3: Generando video con HeyGen...`);
    const videoResult = await generateHeyGenVideo(personalizedText);

    if (!videoResult.success || !videoResult.video_id) {
      return new Response(
        JSON.stringify({
          error: 'Error generando video',
          details: videoResult.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Video iniciado - ID: ${videoResult.video_id}`);

    // 4. Esperar a que el video esté listo
    console.log(`⏳ Paso 4: Esperando a que el video esté listo...`);
    const finalVideoUrl = await pollVideoStatus(videoResult.video_id);

    if (!finalVideoUrl) {
      return new Response(
        JSON.stringify({
          error: 'El video no se completó en el tiempo esperado',
          video_id: videoResult.video_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Video completado - URL: ${finalVideoUrl}`);

    // 5. Enviar video por WhatsApp
    const phoneToUse = phone_number || caseData.cliente_telefono;
    let whatsappResult = null;

    if (phoneToUse) {
      console.log(`📱 Paso 5: Enviando video por WhatsApp a: ${phoneToUse}`);
      whatsappResult = await sendVideoWhatsApp(phoneToUse, finalVideoUrl, caseData);

      if (whatsappResult.success) {
        console.log(`✅ Video enviado exitosamente por WhatsApp`);
      } else {
        console.error(`❌ Error enviando WhatsApp: ${whatsappResult.error}`);
      }
    } else {
      console.log(`⚠️ No se proporcionó número de teléfono para WhatsApp`);
    }

    // 6. Respuesta final
    const response = {
      success: true,
      caso_id,
      case_title: caseData.titulo,
      client_name: caseData.cliente_nombre,
      steps_completed: {
        case_data_retrieved: true,
        text_generated: true,
        video_generated: true,
        video_completed: true,
        whatsapp_sent: !!whatsappResult?.success
      },
      data: {
        personalized_text: personalizedText,
        video_id: videoResult.video_id,
        video_url: finalVideoUrl,
        whatsapp_recipient: phoneToUse,
        whatsapp_result: whatsappResult
      },
      message: whatsappResult?.success
        ? 'Video generado y enviado por WhatsApp exitosamente'
        : 'Video generado exitosamente (sin envío WhatsApp)'
    };

    console.log(`🎉 Proceso completado exitosamente para caso ${caso_id}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en generate-case-intro-video:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Función para obtener datos del caso SOLO de la tabla 'casos'
async function getCaseData(casoId: string): Promise<CaseData | null> {
  try {
    console.log(`🔍 Consultando caso ${casoId} en tabla 'casos'...`);

    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single();

    if (casoError) {
      console.error(`❌ Error consultando caso ${casoId}:`, casoError);
      
      if (casoError.code === 'PGRST116') {
        console.log(`❌ Caso ${casoId} no existe en la tabla 'casos'`);
        return null;
      }
      
      throw casoError;
    }

    if (!caso) {
      console.log(`❌ Caso ${casoId} no encontrado`);
      return null;
    }

    console.log(`✅ Caso encontrado:`, {
      id: caso.id,
      titulo: caso.motivo_consulta,
      cliente: `${caso.nombre_borrador} ${caso.apellido_borrador || ''}`.trim(),
      estado: caso.estado
    });

    // Mapear los datos del caso al formato esperado
    return {
      id: caso.id,
      titulo: caso.motivo_consulta || 'Caso sin título',
      descripcion: caso.resumen_caso || 'Sin descripción',
      cliente_nombre: `${caso.nombre_borrador} ${caso.apellido_borrador || ''}`.trim() || 'Cliente sin nombre',
      estado: caso.estado || 'desconocido',
      created_at: caso.created_at || new Date().toISOString(),
      cliente_telefono: caso.telefono_borrador
    };

  } catch (error) {
    console.error('❌ Error obteniendo datos del caso:', error);
    return null;
  }
}

// Función para generar texto personalizado con OpenAI
async function generatePersonalizedText(caseData: CaseData): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI no configurado, usando texto por defecto');
      return generateFallbackText(caseData);
    }

    // Crear el prompt para OpenAI
    const prompt = `Genera un texto corto y personalizado (máximo 150 palabras) para un video introductorio de un abogado.

Contexto del caso:
- Cliente: ${caseData.cliente_nombre}
- Abogado: ${LAWYER_NAME}
- Tipo de caso: ${caseData.titulo}
- Descripción: ${caseData.descripcion}
- Estado: ${caseData.estado}

El texto debe:
1. Saludar personalmente al cliente mencionando el nombre del abogado
2. Presentarse como ${LAWYER_NAME} de Klamai
3. Mencionar que estamos trabajando en su caso específico
4. Transmitir confianza y profesionalismo
5. Mencionar que prepararemos un análisis y presupuesto
6. Ser corto (30-45 segundos de video)
7. Tener un tono cálido y confiable
8. Terminar con una despedida profesional

Genera solo el texto que dirá el abogado en el video, sin explicaciones adicionales.`;

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un asistente especializado en generar textos profesionales para abogados. Genera textos concisos, cálidos y profesionales." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const generatedText = completion.choices[0]?.message?.content?.trim();
    
    if (generatedText) {
      console.log(`✅ Texto generado con OpenAI (${generatedText.length} caracteres)`);
      return generatedText;
    } else {
      console.log('⚠️ OpenAI no generó texto, usando fallback');
      return generateFallbackText(caseData);
    }

  } catch (error) {
    console.error('❌ Error generando texto con OpenAI:', error);
    console.log('⚠️ Usando texto fallback debido al error');
    return generateFallbackText(caseData);
  }
}

// Función fallback para cuando OpenAI no está disponible
function generateFallbackText(caseData: CaseData): string {
  console.log('📝 Generando texto fallback con nombre del abogado...');

  const textoFallback = `Hola ${caseData.cliente_nombre}.

Soy ${LAWYER_NAME}, abogado principal de Klamai, y quiero saludarte personalmente.

He revisado tu caso "${caseData.titulo}" y me complace decirte que ya estamos trabajando activamente en él.

Estoy preparando un análisis detallado y un presupuesto personalizado que te enviaré muy pronto.

Tenemos un equipo legal altamente experimentado listo para ayudarte. Te mantendré informado de cada avance.

Gracias por elegir Klamai. Estamos aquí para apoyarte.

Atentamente,
${LAWYER_NAME}
Abogado Principal de Klamai`;

  return textoFallback;
}

// Función para generar video con HeyGen (usando la estructura que funciona)
async function generateHeyGenVideo(text: string): Promise<VideoGenerationResponse> {
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
              avatar_id: HEYGEN_DEFAULT_AVATAR_ID || "Lina_Dress_Sitting_Side_public",
              avatar_style: "normal"
            },
            voice: {
              type: "text",
              input_text: text,
              voice_id: HEYGEN_DEFAULT_VOICE_ID || "119caed25533477ba63822d5d1552d25",
              speed: 1.0
            }
          }
        ],
        dimension: {
          width: 1280,
          height: 720
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error HeyGen API: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('🔍 Respuesta completa de HeyGen:', JSON.stringify(data, null, 2));
    
    if (!data.data || !data.data.video_id) {
      console.error('❌ Estructura de respuesta inválida:', data);
      throw new Error('Respuesta inválida de HeyGen API - falta data.video_id');
    }

    console.log(`✅ Video iniciado correctamente - ID: ${data.data.video_id}`);
    return {
      success: true,
      video_id: data.data.video_id,
      status: 'processing',
      message: 'Video en proceso de generación'
    };

  } catch (error) {
    console.error('❌ Error generando video con HeyGen:', error);
    console.error('❌ Tipo de error:', typeof error);
    console.error('❌ Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}

// Función para verificar el estado del video (usando la estructura que funciona)
async function checkVideoStatus(videoId: string): Promise<VideoGenerationResponse> {
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
    console.error('❌ Error verificando estado del video:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para esperar a que el video esté listo
async function pollVideoStatus(videoId: string): Promise<string | null> {
  const maxAttempts = 30; // Máximo 5 minutos (30 * 10 segundos)
  let attempts = 0;

  console.log(`⏳ Iniciando polling para video ${videoId}...`);

  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 Intento ${attempts + 1}/${maxAttempts} - Verificando estado...`);
      
      const statusResult = await checkVideoStatus(videoId);
      
      if (!statusResult.success) {
        console.error(`❌ Error en intento ${attempts + 1}:`, statusResult.error);
        attempts++;
        continue;
      }

      const status = statusResult.status;
      console.log(`📊 Estado del video: ${status}`);

      if (status === 'completed' && statusResult.video_url) {
        console.log(`✅ Video completado exitosamente`);
        return statusResult.video_url;
      }

      if (status === 'failed') {
        throw new Error('La generación del video falló');
      }

      if (status === 'processing' || status === 'pending') {
        console.log(`⏳ Video aún en proceso, esperando...`);
      }

      // Esperar 10 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;

    } catch (error) {
      console.error(`Error en intento ${attempts + 1}:`, error);
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Tiempo de espera agotado para la generación del video');
      }
    }
  }

  throw new Error('Tiempo de espera agotado para la generación del video');
}

// Función para enviar video por WhatsApp usando el patrón correcto
async function sendVideoWhatsApp(phoneNumber: string, videoUrl: string, caseData: CaseData): Promise<WhatsAppResponse> {
  try {
    console.log(`📱 Enviando video por WhatsApp a ${phoneNumber}...`);

    // Preparar el mensaje de WhatsApp con el nombre del abogado real
    const mensajeWhatsApp = `¡Hola! Soy ${LAWYER_NAME}, tu abogado de Klamai.

Te envío este video personalizado sobre tu caso "${caseData.titulo}".

Estamos trabajando activamente para resolverlo. Te mantendré informado de cada avance.

Si tienes alguna pregunta, no dudes en contactarme.

Atentamente,
${LAWYER_NAME}
Abogado Principal de Klamai`;

    console.log(`📝 Mensaje preparado:`, mensajeWhatsApp);

    // Usar el patrón correcto como en otras funciones que funcionan
    const { data: wsData, error: wsError } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        tipo: 'media',
        numero: phoneNumber,
        url_media: videoUrl,
        mediatype: 'video',
        mimetype: 'video/mp4',
        caption: mensajeWhatsApp,
        fileName: `video-caso-${caseData.id}.mp4`
      }
    });

    if (wsError) {
      console.error(`❌ Error invocando función WhatsApp:`, wsError);
      return {
        success: false,
        error: `Error de invocación: ${wsError.message || wsError}`
      };
    }

    if (wsData && (wsData as any).error) {
      console.error(`❌ Error en respuesta de WhatsApp:`, (wsData as any).error);
      return {
        success: false,
        error: (wsData as any).error
      };
    }

    console.log(`✅ Video enviado exitosamente por WhatsApp`);
    console.log(`📊 Detalles WhatsApp:`, wsData);

    return {
      success: true,
      message_id: (wsData as any)?.id || (wsData as any)?.message_id,
      message: 'Video enviado por WhatsApp correctamente'
    };

  } catch (error) {
    console.error('❌ Error enviando video por WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}