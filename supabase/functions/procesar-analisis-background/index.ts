// --- IMPORTACIONES ---
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import { Client as MinioClient } from 'npm:minio';
import { basename } from "https://deno.land/std@0.168.0/path/mod.ts";
import { Buffer } from "node:buffer";
// ----- CONFIGURACIÓN Y CONSTANTES -----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const LISTA_ESPECIALIDADES_VALIDAS = [
  'Derecho Civil',
  'Derecho Penal',
  'Derecho Laboral',
  'Derecho Mercantil',
  'Derecho Administrativo',
  'Derecho Fiscal',
  'Derecho Familiar',
  'Derecho Inmobiliario',
  'Derecho de Extranjería',
  'Derecho de la Seguridad Social',
  'Derecho Sanitario',
  'Derecho de Seguros',
  'Derecho Concursal',
  'Derecho de Propiedad Intelectual',
  'Derecho Ambiental',
  'Consulta General'
];
// --- INICIALIZACIÓN DE CLIENTES GLOBALES ---
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")
});
// ----- FUNCIONES DE AYUDA -----
/** Logging estructurado para facilitar la búsqueda en producción. */ function log(level, message, context = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  }));
}
/** Extrae una cadena JSON de un texto que puede contener formato Markdown. */ function extractJsonFromString(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
/** 
 * CORREGIDO: Convierte una URL de MinIO a su clave de objeto (ruta interna)
 * y la decodifica para manejar espacios y caracteres especiales.
 */ function convertUrlToKey(url, bucketName) {
  if (!url || !bucketName) return "";
  try {
    const path = new URL(url).pathname;
    const bucketPrefix = `/${bucketName}/`;
    const keyIndex = path.indexOf(bucketPrefix);
    const extractedKey = keyIndex === -1 ? path.substring(1) : path.substring(keyIndex + bucketPrefix.length);
    // Decodifica la clave para convertir "%20" en espacios, etc.
    return decodeURIComponent(extractedKey);
  } catch (e) {
    log('warn', 'URL inválida al intentar convertir a clave', {
      url
    });
    return "";
  }
}
/** Ejecuta un asistente de OpenAI y espera el resultado final. */ async function ejecutarAsistente(assistant_id, content) {
  // (Sin cambios, idéntico a la versión anterior)
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
  if (runStatus.status !== 'completed') throw new Error(`La ejecución del asistente ${assistant_id} falló con estado: ${runStatus.status}.`);
  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data.find((msg)=>msg.role === 'assistant');
  if (lastMessage?.content[0]?.type === 'text') return lastMessage.content[0].text.value;
  return "";
}
/** 
 * VERSIÓN FINAL: Descarga un archivo de MinIO y lo sube a Supabase Storage.
 */ async function transferirArchivo(archivo_key, caso_id, supabaseClient) {
  // (Sin cambios, idéntico a la versión anterior)
  log('info', 'Iniciando transferencia de archivo', {
    caso_id,
    archivo_key
  });
  const minioClient = new MinioClient({
    endPoint: Deno.env.get('MINIO_ENDPOINT'),
    port: parseInt(Deno.env.get('MINIO_PORT') || "443", 10),
    useSSL: true,
    accessKey: Deno.env.get('MINIO_ACCESS_KEY_ID'),
    secretKey: Deno.env.get('MINIO_SECRET_ACCESS_KEY'),
    forcePathStyle: true
  });
  const bucketName = Deno.env.get('MINIO_BUCKET_NAME');
  try {
    const stat = await minioClient.statObject(bucketName, archivo_key);
    const contentType = stat.contentType || 'application/octet-stream';
    const nodeStream = await minioClient.getObject(bucketName, archivo_key);
    const chunks = [];
    for await (const chunk of nodeStream)chunks.push(chunk);
    const concatenatedBuffer = Buffer.concat(chunks);
    const arrayBuffer = concatenatedBuffer.buffer.slice(concatenatedBuffer.byteOffset, concatenatedBuffer.byteOffset + concatenatedBuffer.byteLength);
    const fileName = basename(archivo_key);
    const supabasePath = `casos/${caso_id}/documentos_cliente/${fileName}`;
    const { error: uploadError } = await supabaseClient.storage.from('documentos_legales').upload(supabasePath, arrayBuffer, {
      upsert: true,
      contentType: contentType
    });
    if (uploadError) throw new Error(`Error al subir a Supabase Storage: ${uploadError.message}`);
    log('info', 'Archivo transferido con éxito a Supabase', {
      caso_id,
      supabasePath
    });
    return supabasePath;
  } catch (error) {
    log('error', `Falló la transferencia del archivo ${archivo_key}`, {
      caso_id,
      error: error.message
    });
    throw error;
  }
}
// --- FUNCIÓN PRINCIPAL DEL SERVIDOR (HANDLER) ---
serve(async (req)=>{
  // (Sin cambios, idéntico a la versión anterior)
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  let caso_id_logging = "unknown";
  try {
    const payload = await req.json();
    const { caso_id, resumen_caso, transcripcion_chat, motivo_consulta: motivo_inicial, files: filesValue } = payload;
    caso_id_logging = caso_id || "unknown";
    if (!caso_id || !transcripcion_chat) throw new Error("Faltan parámetros críticos: caso_id y transcripcion_chat son requeridos.");
    const MINIO_BUCKET_NAME = Deno.env.get("MINIO_BUCKET_NAME");
    if (!MINIO_BUCKET_NAME) throw new Error("La variable de entorno MINIO_BUCKET_NAME no está configurada.");
    let fileUrls = [];
    let sourceArray = [];
    if (Array.isArray(filesValue)) {
      sourceArray = filesValue;
    } else if (typeof filesValue === 'string' && filesValue.trim().startsWith('[')) {
      try {
        sourceArray = JSON.parse(filesValue);
      } catch (e) {
        log('error', 'Falló el parseo del string de "files"', {
          filesString: filesValue,
          error: e.message
        });
      }
    }
    if (Array.isArray(sourceArray)) fileUrls = sourceArray.filter((item)=>typeof item === 'string' && item.trim() !== '');
    const archivos_keys = fileUrls.map((url)=>convertUrlToKey(url, MINIO_BUCKET_NAME)).filter(Boolean);
    log('info', 'Payload recibido para procesamiento en background', {
      caso_id,
      archivos_detectados: archivos_keys.length
    });
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const prompt_clasificador = `Analiza el resumen y devuelve ÚNICAMENTE un objeto JSON crudo (raw), sin explicaciones. La estructura debe ser: {"motivo_consulta_ia": "...", "especialidad_nombre": "...", "tipo_lead": "...", "valor_estimado": "..."}. - Para 'motivo_consulta_ia', crea un titular de caso conciso y profesional, y entendible, máximo 20 palabras. Ej: "Reclamación de indemnización por despido con posible vulneración de derechos. - Para 'especialidad_nombre', DEBES elegir uno de la lista: [${LISTA_ESPECIALIDADES_VALIDAS.join(', ')}]. Si no encaja claramente en ninguna, usa 'Consulta General'. - Para 'tipo_lead', DEBES ELEGIR OBLIGATORIAMENTE uno de los siguientes tres valores exactos: 'estandar', 'premium', 'urgente'. No inventes otros valores. Un lead es 'premium' si el caso es claro y de alto potencial; 'urgente' si requiere acción inmediata; 'estandar' en los demás casos. - Para 'valor_estimado', da una estimación en euros como texto (ej: "1.500€ - 3.000€"). Resumen del caso: ${resumen_caso}`;
    
    const promesas = [
      ejecutarAsistente(Deno.env.get("ASISTENTE_AUXILIAR_ID"), `Genera una guía técnica para un abogado a partir del siguiente resumen: ${resumen_caso}`),
      ejecutarAsistente(Deno.env.get("ASISTENTE_CLASIFICADOR_ID"), prompt_clasificador),
      ...archivos_keys.map((key)=>transferirArchivo(key, caso_id, supabaseClient))
    ];

    const [guiaResult, clasificacionResult, ...archivosResults] = await Promise.allSettled(promesas);

    if (guiaResult.status === 'rejected') throw new Error(`Asistente AUXILIAR falló: ${guiaResult.reason.message}`);
    if (clasificacionResult.status === 'rejected') throw new Error(`Asistente CLASIFICADOR falló: ${clasificacionResult.reason.message}`);

    const guia_abogado = guiaResult.value;
    const clasificacion_raw = clasificacionResult.value;
    const documentosAdjuntos = archivosResults.filter((r)=>r.status === 'fulfilled').map((r)=>r.value);
    
    archivosResults.forEach((result, index)=>{
      if (result.status === 'rejected') log('error', 'Falló la transferencia de un archivo', {
        caso_id,
        archivo_key: archivos_keys[index],
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
    });
    log('info', 'Tareas en paralelo de background completadas', {
      caso_id,
      archivos_transferidos: documentosAdjuntos.length
    });
    const clasificacion = JSON.parse(extractJsonFromString(clasificacion_raw) || '{}');
    const { data: especialidad } = await supabaseClient.from("especialidades").select("id").eq("nombre", clasificacion.especialidad_nombre).single();
    let especialidadId = especialidad?.id;
    if (!especialidadId && clasificacion.especialidad_nombre) {
      log('warn', 'Especialidad no encontrada, usando fallback', {
        caso_id,
        especialidad_recibida: clasificacion.especialidad_nombre
      });
      const { data: generalSpec } = await supabaseClient.from("especialidades").select("id").eq("nombre", "Consulta General").single();
      especialidadId = generalSpec?.id;
    }
    const guiaFile = new Blob([
      guia_abogado
    ], {
      type: 'text/plain;charset=utf-8'
    });
    await supabaseClient.storage.from('documentos_legales').upload(`casos/${caso_id}/guia_para_abogado.txt`, guiaFile, {
      upsert: true
    });
    const datosParaActualizar = {
      motivo_consulta: clasificacion.motivo_consulta_ia || motivo_inicial || "Consulta General",
      resumen_caso,
      guia_abogado: guia_abogado,
      tipo_lead: clasificacion.tipo_lead,
      valor_estimado: clasificacion.valor_estimado,
      especialidad_id: especialidadId,
      transcripcion_chat,
      documentos_adjuntos: documentosAdjuntos.length > 0 ? documentosAdjuntos : null
    };
    const { error: updateError } = await supabaseClient.from("casos").update(datosParaActualizar).eq("id", caso_id);
    if (updateError) throw updateError;
    log('info', 'Proceso de background finalizado con éxito', {
      caso_id
    });
    return new Response(JSON.stringify({
      success: true,
      message: "El análisis en background del caso ha sido procesado."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    log('error', error.message, {
      caso_id: caso_id_logging,
      stack: error.stack
    });
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
