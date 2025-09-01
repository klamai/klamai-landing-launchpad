import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

// Configuración de Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Configuración del abogado principal
const LAWYER_NAME = Deno.env.get('LAWYER_NAME') || 'José María Escribá';

// Voice ID por defecto para ElevenLabs (se puede configurar o usar el de la función independiente)
const ELEVENLABS_DEFAULT_VOICE_ID = Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID');

// Configuración de OpenAI
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Crear cliente de OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Función principal
Deno.serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Método no permitido. Use POST.'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Verificar configuraciones requeridas
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      const missing = [];
      if (!SUPABASE_URL) missing.push('SUPABASE_URL');
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');

      return new Response(JSON.stringify({
        error: 'Configuración incompleta',
        details: `Faltan secrets: ${missing.join(', ')}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parsear request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Request body recibido:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Error parseando JSON del request:', parseError);
      return new Response(JSON.stringify({
        error: 'JSON inválido en el request',
        details: parseError.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { caso_id, phone_number } = requestBody;
    if (!caso_id) {
      return new Response(JSON.stringify({
        error: 'caso_id es requerido'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validar formato del phone_number si se proporciona
    if (phone_number && typeof phone_number === 'string') {
      // Limpiar el número (quitar espacios, guiones, etc.)
      const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 8) {
        return new Response(JSON.stringify({
          error: 'phone_number debe tener al menos 8 dígitos',
          details: `Número proporcionado: ${phone_number}`
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    console.log(`🚀 Iniciando proceso para caso: ${caso_id}`);

    // 1. Obtener datos del caso desde la tabla 'casos'
    console.log(`📋 Paso 1: Obteniendo datos del caso...`);
    const caseData = await getCaseData(caso_id);
    if (!caseData) {
      return new Response(JSON.stringify({
        error: 'Caso no encontrado en la tabla casos'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`✅ Caso encontrado: "${caseData.titulo}" para cliente: ${caseData.cliente_nombre}`);

    // 2. Generar texto personalizado
    console.log(`📝 Paso 2: Generando texto personalizado...`);
    const personalizedText = await generatePersonalizedText(caseData);
    console.log(`✅ Texto generado (${personalizedText.length} caracteres)`);

    // 3. Generar audio con ElevenLabs
    console.log(`🎵 Paso 3: Generando audio con ElevenLabs...`);
    
    // Verificar que tenemos un voice_id válido
    if (!ELEVENLABS_DEFAULT_VOICE_ID) {
      return new Response(JSON.stringify({
        error: 'ELEVENLABS_DEFAULT_VOICE_ID no está configurado',
        details: 'Configura este secret para poder generar audio'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log(`🔑 Usando voice_id: ${ELEVENLABS_DEFAULT_VOICE_ID}`);
    const audioResult = await generateElevenLabsAudio(personalizedText);

    if (!audioResult.success || !audioResult.audio_url) {
      return new Response(JSON.stringify({
        error: 'Error generando audio',
        details: audioResult.error
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`✅ Audio generado exitosamente - URL: ${audioResult.audio_url}`);

    // 4. Enviar audio por WhatsApp
    const phoneToUse = phone_number || caseData.cliente_telefono;
    let whatsappResult = null;

    if (phoneToUse) {
      console.log(`📱 Paso 4: Enviando audio por WhatsApp a: ${phoneToUse}`);
      whatsappResult = await sendAudioWhatsApp(phoneToUse, audioResult.audio_url, caseData);

      if (whatsappResult.success) {
        console.log(`✅ Audio enviado exitosamente por WhatsApp`);
      } else {
        console.error(`❌ Error enviando WhatsApp: ${whatsappResult.error}`);
      }
    } else {
      console.log(`⚠️ No se puede enviar WhatsApp: número de teléfono no disponible`);
      console.log(`📋 Opciones disponibles:`);
      console.log(`   - phone_number en request: ${phone_number || 'NO PROPORCIONADO'}`);
      console.log(`   - telefono_borrador en caso: ${caseData.cliente_telefono || 'NO DISPONIBLE'}`);
    }

    // 5. Respuesta final
    const response = {
      success: true,
      caso_id,
      case_title: caseData.titulo,
      client_name: caseData.cliente_nombre,
      steps_completed: {
        case_data_retrieved: true,
        text_generated: true,
        audio_generated: true,
        whatsapp_sent: !!whatsappResult?.success
      },
      data: {
        personalized_text: personalizedText,
        audio_url: audioResult.audio_url,
        whatsapp_recipient: phoneToUse,
        whatsapp_result: whatsappResult,
        phone_number_info: {
          provided_in_request: phone_number || null,
          from_case_data: caseData.cliente_telefono || null,
          used_for_whatsapp: phoneToUse || null
        }
      },
      message: whatsappResult?.success 
        ? 'Audio generado y enviado por WhatsApp exitosamente' 
        : phoneToUse 
          ? 'Audio generado exitosamente pero falló el envío por WhatsApp' 
          : 'Audio generado exitosamente (sin envío WhatsApp - número no disponible)'
    };

    console.log(`🎉 Proceso completado exitosamente para caso ${caso_id}`);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error en generate-case-intro-audio:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

// Función para obtener datos del caso SOLO de la tabla 'casos'
async function getCaseData(casoId) {
  try {
    console.log(`🔍 Consultando caso ${casoId} en tabla 'casos'...`);

    const { data: caso, error: casoError } = await supabase.from('casos').select('*').eq('id', casoId).single();
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
async function generatePersonalizedText(caseData) {
  try {
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI no configurado, usando texto por defecto');
      return generateFallbackText(caseData);
    }

    // Crear el prompt para OpenAI
    const prompt = `Genera un texto corto y personalizado (máximo 150 palabras) para un audio introductorio de un abogado.

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
6. Ser corto (30-45 segundos de audio)
7. Tener un tono cálido y confiable
8. Terminar con una despedida profesional

El tipo de caso o descripcion debes adecuarlos para el audio. 

Genera solo el texto que dirá el abogado en el audio, sin explicaciones adicionales.`;

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente especializado en generar textos profesionales para abogados, optimizados para audio (text to speech). Genera textos concisos, cálidos y profesionales. Comportate como un humano. Haz pausas y respiraciones como si fueras un humano"
        },
        {
          role: "user",
          content: prompt
        }
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
function generateFallbackText(caseData) {
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

// Función para generar audio con ElevenLabs usando la función independiente
async function generateElevenLabsAudio(text) {
  try {
    console.log(`🎵 Generando audio con ElevenLabs para texto: "${text.substring(0, 100)}..."`);

    // Llamar a la función independiente de ElevenLabs
    const { data: audioData, error: audioError } = await supabase.functions.invoke("generate-elevenlabs-audio", {
      body: {
        text: text,
        voice_id: ELEVENLABS_DEFAULT_VOICE_ID,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128"
      }
    });

    if (audioError) {
      console.error('❌ Error invocando función ElevenLabs:', audioError);
      throw new Error(`Error de invocación: ${audioError.message || audioError}`);
    }

    if (!audioData || !audioData.success) {
      console.error('❌ Error en respuesta de ElevenLabs:', audioData);
      throw new Error(audioData?.error || 'Error desconocido en ElevenLabs');
    }

    console.log(`✅ Audio generado exitosamente: ${audioData.audio_size} bytes`);
    
    return {
      success: true,
      audio_url: audioData.audio_url,
      audio_size: audioData.audio_size,
      message: 'Audio generado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error generando audio con ElevenLabs:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido en ElevenLabs'
    };
  }
}

// Función para enviar audio por WhatsApp usando el patrón correcto
async function sendAudioWhatsApp(phoneNumber, audioUrl, caseData) {
  try {
    console.log(`📱 Enviando audio por WhatsApp a ${phoneNumber}...`);

    // Preparar el mensaje de WhatsApp con el nombre del abogado real
    const mensajeWhatsApp = `¡Hola! Soy ${LAWYER_NAME}, tu abogado de Klamai.

Te envío este audio personalizado sobre tu caso "${caseData.titulo}".

Estamos trabajando activamente para resolverlo. Te mantendré informado de cada avance.

Si tienes alguna pregunta, no dudes en contactarme.

Atentamente,
${LAWYER_NAME}
Abogado Principal de Klamai`;

    console.log(`📝 Mensaje preparado:`, mensajeWhatsApp);

    // Extraer solo el base64 puro del audio_url (sin el prefijo data:)
    let audioBase64 = audioUrl;
    if (audioUrl.startsWith('data:audio/')) {
      audioBase64 = audioUrl.split(',')[1]; // Extraer solo la parte base64
    }

    console.log(`🔧 Audio base64 extraído: ${audioBase64.length} caracteres`);

    // Usar el nuevo tipo 'audio' para enviar audio directamente
    const { data: wsData, error: wsError } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        tipo: 'audio',
        numero: phoneNumber,
        audio_base64: audioBase64,
        delay: 0
      }
    });

    if (wsError) {
      console.error(`❌ Error invocando función WhatsApp:`, wsError);
      return {
        success: false,
        error: `Error de invocación: ${wsError.message || wsError}`
      };
    }

    if (wsData && wsData.error) {
      console.error(`❌ Error en respuesta de WhatsApp:`, wsData.error);
      return {
        success: false,
        error: wsData.error
      };
    }

    console.log(`✅ Audio enviado exitosamente por WhatsApp`);
    console.log(`📊 Detalles WhatsApp:`, wsData);

    return {
      success: true,
      message_id: wsData?.id || wsData?.message_id,
      message: 'Audio enviado por WhatsApp correctamente'
    };

  } catch (error) {
    console.error('❌ Error enviando audio por WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
