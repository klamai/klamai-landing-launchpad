// --- IMPORTACIONES ---
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

// ----- CONFIGURACIÓN Y CONSTANTES -----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// ----- FUNCIONES DE AYUDA -----
/** Logging estructurado para facilitar la búsqueda en producción. */
function log(level, message, context = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  }));
}

/** Extrae una cadena JSON de un texto que puede contener formato Markdown. */
function extractJsonFromString(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

// ----- INICIALIZACIÓN DE CLIENTES GLOBALES -----
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")
});

/** Ejecuta un asistente de OpenAI y espera el resultado final. */
async function ejecutarAsistente(assistant_id, content) {
  if (!assistant_id) throw new Error(`El ID para un asistente no está configurado.`);

  const thread = await openai.beta.threads.create();
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id
  });

  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  while(runStatus.status === 'in_progress' || runStatus.status === 'queued'){
    await new Promise((resolve)=>setTimeout(resolve, 500));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  if (runStatus.status !== 'completed') {
    throw new Error(`La ejecución del asistente ${assistant_id} falló con estado: ${runStatus.status}.`);
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data.find((msg)=>msg.role === 'assistant');
  
  if (lastMessage?.content[0]?.type === 'text') {
    return lastMessage.content[0].text.value;
  }
  
  return "";
}

// --- FUNCIÓN PRINCIPAL DEL SERVIDOR (HANDLER) ---
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let caso_id_logging = "unknown";
  try {
    const payload = await req.json();
    const { caso_id, resumen_caso, nombre_borrador } = payload;
    caso_id_logging = caso_id || "unknown";

    if (!caso_id || !resumen_caso || !nombre_borrador) {
      throw new Error("Faltan parámetros críticos: caso_id, resumen_caso y nombre_borrador son requeridos.");
    }

    log('info', 'Payload recibido para generar propuesta inmediata', { caso_id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const prompt_propuesta = `Analiza el resumen y genera un contenido de propuesta para el cliente. Su nombre es ${nombre_borrador || 'cliente'}. Tu respuesta debe ser ÚNICAMENTE un objeto JSON crudo (raw) con la estructura: {"titulo_personalizado": "...", "subtitulo_refuerzo": "...", "etiqueta_caso": "..."}. - "titulo_personalizado": Título corto y potente, usando el nombre del cliente. - "subtitulo_refuerzo": Una o dos frases que demuestren que entendimos su punto fuerte. - "etiqueta_caso": Etiqueta muy corta de 2-3 palabras para el caso. Resumen: ${resumen_caso}`;

    const propuesta_raw = await ejecutarAsistente(Deno.env.get("ASISTENTE_PROPUESTAS_ID"), prompt_propuesta);
    
    if (!propuesta_raw) {
      throw new Error("El asistente de propuestas no devolvió contenido.");
    }
    
    const propuesta_estructurada = JSON.parse(extractJsonFromString(propuesta_raw) || '{}');

    const datosParaActualizar = {
      propuesta_estructurada,
      estado: "listo_para_propuesta" // Marcamos el estado para que el frontend sepa que puede continuar
    };

    const { error: updateError } = await supabaseClient
      .from("casos")
      .update(datosParaActualizar)
      .eq("id", caso_id);

    if (updateError) throw updateError;

    log('info', 'Propuesta inmediata generada y guardada con éxito', { caso_id });

    return new Response(JSON.stringify({
      success: true,
      propuesta: propuesta_estructurada,
      message: "Propuesta generada con éxito."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    log('error', error.message, {
      caso_id: caso_id_logging,
      stack: error.stack
    });

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
