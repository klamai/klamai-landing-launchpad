import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_DEFAULT_VOICE_ID = Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID');

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Método no permitido. Use POST.'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar configuración
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({
        error: 'ELEVENLABS_API_KEY no está configurada'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parsear request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Request body recibido:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: 'JSON inválido en el request',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { text, voice_id, model_id, output_format } = requestBody;

    if (!text) {
      return new Response(JSON.stringify({
        error: 'text es requerido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Usar valores por defecto si no se proporcionan
    const finalVoiceId = voice_id || ELEVENLABS_DEFAULT_VOICE_ID;
    const finalModelId = model_id || "eleven_multilingual_v2";
    const finalOutputFormat = output_format || "mp3_44100_128";

    if (!finalVoiceId) {
      return new Response(JSON.stringify({
        error: 'voice_id es requerido (proporciona uno o configura ELEVENLABS_DEFAULT_VOICE_ID)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎵 Generando audio con ElevenLabs...`);
    console.log(`📝 Texto: "${text.substring(0, 100)}..."`);
    console.log(`🔑 Voice ID: ${finalVoiceId}`);
    console.log(`🤖 Model: ${finalModelId}`);
    console.log(`📊 Output Format: ${finalOutputFormat}`);

    // Generar audio
    const audioResult = await generateElevenLabsAudio(text, finalVoiceId, finalModelId, finalOutputFormat);

    if (!audioResult.success) {
      return new Response(JSON.stringify({
        error: 'Error generando audio',
        details: audioResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Respuesta exitosa
    const response = {
      success: true,
      audio_url: audioResult.audio_url,
      audio_size: audioResult.audio_size,
      voice_id: finalVoiceId,
      model_id: finalModelId,
      output_format: finalOutputFormat,
      text_length: text.length,
      message: 'Audio generado exitosamente'
    };

    console.log(`✅ Audio generado: ${audioResult.audio_size} bytes`);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en generate-elevenlabs-audio:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Función para generar audio con ElevenLabs usando la API REST directa
async function generateElevenLabsAudio(text, voiceId, modelId, outputFormat) {
  try {
    console.log(`🎵 Generando audio con ElevenLabs API REST...`);
    console.log(`🔑 Voice ID: ${voiceId}`);
    console.log(`🤖 Model: ${modelId}`);
    console.log(`📊 Output Format: ${outputFormat}`);

    // Usar la API REST de ElevenLabs directamente
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        output_format: outputFormat,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    console.log(`📡 Respuesta de ElevenLabs: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error en ElevenLabs API:', response.status, errorData);
      throw new Error(`Error en ElevenLabs: ${response.status} - ${errorData}`);
    }

    // Obtener el audio como ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`📦 Audio recibido: ${audioBuffer.byteLength} bytes`);
    
    // Convertir a base64 de forma segura
    const uint8Array = new Uint8Array(audioBuffer);
    let audioBase64 = '';
    
    // Convertir en chunks para evitar problemas de memoria
    const chunkSize = 1000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      audioBase64 += String.fromCharCode.apply(null, chunk);
    }
    
    // Convertir a base64
    const base64Audio = btoa(audioBase64);
    
    // Crear una URL temporal para el audio
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log(`✅ Audio convertido a base64: ${base64Audio.length} caracteres`);
    
    return {
      success: true,
      audio_url: audioUrl,
      audio_size: audioBuffer.byteLength,
      message: 'Audio generado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error generando audio con ElevenLabs API:', error);
    console.error('❌ Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Error desconocido en ElevenLabs'
    };
  }
}
