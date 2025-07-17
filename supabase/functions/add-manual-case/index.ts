
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({
  apiKey: openAIApiKey
});

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

/** Logging estructurado para facilitar la búsqueda en producción. */
function log(level: string, message: string, context = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  }));
}

/** Extrae una cadena JSON de un texto que puede contener formato Markdown. */
function extractJsonFromString(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

/** Ejecuta un asistente de OpenAI y espera el resultado final. */
async function ejecutarAsistente(assistant_id: string, content: string): Promise<string> {
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
  while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
    await new Promise((resolve) => setTimeout(resolve, 500));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }
  
  if (runStatus.status !== 'completed') {
    throw new Error(`La ejecución del asistente ${assistant_id} falló con estado: ${runStatus.status}.`);
  }
  
  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data.find((msg) => msg.role === 'assistant');
  
  if (lastMessage?.content[0]?.type === 'text') {
    return lastMessage.content[0].text.value;
  }
  
  return "";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseText } = await req.json();

    console.log('🔍 Procesando caso manual:', { caseText: caseText?.substring(0, 100) + '...', length: caseText?.length });

    if (!caseText?.trim()) {
      throw new Error('El texto del caso es requerido');
    }

    // Paso 1: Extraer datos estructurados del texto usando OpenAI
    const extractionPrompt = `
Analiza el siguiente texto que contiene información de un cliente y su consulta legal. 
Extrae los datos y devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:

{
  "cliente": {
    "nombre": "string",
    "apellido": "string", 
    "email": "string",
    "telefono": "string",
    "ciudad": "string",
    "tipo_perfil": "individual" | "empresa",
    "razon_social": "string (solo si es empresa)",
    "nif_cif": "string (solo si es empresa)",
    "nombre_gerente": "string (solo si es empresa)",
    "direccion_fiscal": "string (solo si es empresa)"
  },
  "consulta": {
    "motivo_consulta": "string (resumen del problema legal)",
    "detalles_adicionales": "string (información adicional relevante)",
    "urgencia": "alta" | "media" | "baja",
    "preferencia_horaria": "string (si se menciona)"
  }
}

Si no puedes extraer algún campo, usa null. 
Si es una empresa, asegúrate de marcar tipo_perfil como "empresa".
Si es una persona individual, marca tipo_perfil como "individual".

Texto a analizar:
${caseText}
    `;

    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal experto en extraer información estructurada de consultas legales. Responde ÚNICAMENTE con JSON válido.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    const extractionData = await extractionResponse.json();
    const extractedInfo = JSON.parse(extractionData.choices[0].message.content);

    console.log('✅ Datos extraídos:', extractedInfo);

    // Paso 2: Crear el caso en la base de datos en estado borrador
    const casoData = {
      motivo_consulta: extractedInfo.consulta.motivo_consulta,
      estado: 'borrador',
      canal_atencion: 'manual_admin',
      // Datos del cliente (formato borrador)
      nombre_borrador: extractedInfo.cliente.nombre,
      apellido_borrador: extractedInfo.cliente.apellido,
      email_borrador: extractedInfo.cliente.email,
      telefono_borrador: extractedInfo.cliente.telefono,
      ciudad_borrador: extractedInfo.cliente.ciudad,
      tipo_perfil_borrador: extractedInfo.cliente.tipo_perfil,
      razon_social_borrador: extractedInfo.cliente.razon_social,
      nif_cif_borrador: extractedInfo.cliente.nif_cif,
      nombre_gerente_borrador: extractedInfo.cliente.nombre_gerente,
      direccion_fiscal_borrador: extractedInfo.cliente.direccion_fiscal,
      preferencia_horaria_contacto: extractedInfo.consulta.preferencia_horaria,
      // Guardar el texto original para referencia
      transcripcion_chat: {
        texto_original: caseText,
        fecha_procesamiento: new Date().toISOString(),
        procesado_por: 'manual_admin'
      }
    };

    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .insert([casoData])
      .select()
      .single();

    if (casoError) {
      console.error('❌ Error creando caso:', casoError);
      throw casoError;
    }

    console.log('✅ Caso creado:', caso.id);

    // Paso 3: Procesar con tus asistentes de IA personalizados
    await processWithCustomAssistants(caso.id, extractedInfo, caseText);

    return new Response(
      JSON.stringify({
        success: true,
        caso: caso,
        extractedInfo: extractedInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error en add-manual-case:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processWithCustomAssistants(casoId: string, extractedInfo: any, originalText: string) {
  try {
    console.log('🤖 Iniciando procesamiento con asistentes personalizados para caso:', casoId);

    // Preparar el resumen para los asistentes
    const resumenParaAsistentes = `
Información del cliente:
- Nombre: ${extractedInfo.cliente.nombre} ${extractedInfo.cliente.apellido}
- Tipo: ${extractedInfo.cliente.tipo_perfil}
- Email: ${extractedInfo.cliente.email}
- Ciudad: ${extractedInfo.cliente.ciudad}

Consulta legal:
${extractedInfo.consulta.motivo_consulta}

Detalles adicionales:
${extractedInfo.consulta.detalles_adicionales}

Urgencia: ${extractedInfo.consulta.urgencia}

Texto original completo:
${originalText}
    `;

    // Paso 1: Asistente Auxiliar - Generar resumen del caso
    const guiaResult = await ejecutarAsistente(
      Deno.env.get("ASISTENTE_AUXILIAR_ID")!,
      `Genera una guía técnica para un abogado a partir del siguiente caso: ${resumenParaAsistentes}`
    );

    // Paso 2: Asistente Clasificador - Generar clasificación automática
    const prompt_clasificador = `Analiza el resumen y devuelve ÚNICAMENTE un objeto JSON crudo (raw), sin explicaciones. La estructura debe ser: {"motivo_consulta_ia": "...", "especialidad_nombre": "...", "tipo_lead": "...", "valor_estimado": "..."}. 

- Para 'motivo_consulta_ia', crea un titular de caso conciso y profesional, y entendible, máximo 20 palabras. Ej: "Reclamación de indemnización por despido con posible vulneración de derechos."

- Para 'especialidad_nombre', DEBES elegir uno de la lista: [${LISTA_ESPECIALIDADES_VALIDAS.join(', ')}]. Si no encaja, usa 'Consulta General'.

- Para 'tipo_lead', DEBES ELEGIR OBLIGATORIAMENTE uno de los siguientes tres valores exactos: 'estandar', 'premium', 'urgente'. No inventes otros valores. Un lead es 'premium' si el caso es claro y de alto potencial; 'urgente' si requiere acción inmediata; 'estandar' en los demás casos.

- Para 'valor_estimado', da una estimación en euros como texto (ej: "1.500€ - 3.000€").

Resumen del caso: ${resumenParaAsistentes}`;

    const clasificacionResult = await ejecutarAsistente(
      Deno.env.get("ASISTENTE_CLASIFICADOR_ID")!,
      prompt_clasificador
    );

    // Paso 3: Asistente de Propuestas - Generar propuesta estructurada
    const prompt_propuesta = `Analiza el resumen y genera un contenido de propuesta para el cliente. Su nombre es ${extractedInfo.cliente.nombre || 'cliente'}. Tu respuesta debe ser ÚNICAMENTE un objeto JSON crudo (raw) con la estructura: {"titulo_personalizado": "...", "subtitulo_refuerzo": "...", "etiqueta_caso": "..."}. 

- "titulo_personalizado": Título corto y potente, usando el nombre del cliente.
- "subtitulo_refuerzo": Una o dos frases que demuestren que entendimos su punto fuerte.
- "etiqueta_caso": Etiqueta muy corta de 2-3 palabras para el caso.

Resumen: ${resumenParaAsistentes}`;

    const propuestaResult = await ejecutarAsistente(
      Deno.env.get("ASISTENTE_PROPUESTAS_ID")!,
      prompt_propuesta
    );

    console.log('✅ Asistentes completados');

    // Procesar las respuestas
    const guia_abogado = guiaResult;
    const clasificacion_raw = clasificacionResult;
    const propuesta_raw = propuestaResult;

    // Parsear JSON de las respuestas
    const clasificacion = JSON.parse(extractJsonFromString(clasificacion_raw) || '{}');
    const propuesta_estructurada = JSON.parse(extractJsonFromString(propuesta_raw) || '{}');

    // Obtener la especialidad de la base de datos
    const { data: especialidad } = await supabase
      .from("especialidades")
      .select("id")
      .eq("nombre", clasificacion.especialidad_nombre)
      .single();

    let especialidadId = especialidad?.id;
    if (!especialidadId && clasificacion.especialidad_nombre) {
      log('warn', 'Especialidad no encontrada, usando fallback', {
        caso_id: casoId,
        especialidad_recibida: clasificacion.especialidad_nombre
      });
      const { data: generalSpec } = await supabase
        .from("especialidades")
        .select("id")
        .eq("nombre", "Consulta General")
        .single();
      especialidadId = generalSpec?.id;
    }

    // Guardar la guía para abogado en storage
    const guiaFile = new Blob([guia_abogado], { type: 'text/plain;charset=utf-8' });
    await supabase.storage
      .from('documentos_legales')
      .upload(`casos/${casoId}/guia_para_abogado.txt`, guiaFile, { upsert: true });

    // Actualizar el caso con toda la información procesada
    const datosParaActualizar = {
      estado: "listo_para_propuesta",
      motivo_consulta: clasificacion.motivo_consulta_ia || extractedInfo.consulta.motivo_consulta || "Consulta General",
      resumen_caso: resumenParaAsistentes,
      propuesta_estructurada,
      tipo_lead: clasificacion.tipo_lead || 'estandar',
      valor_estimado: clasificacion.valor_estimado,
      especialidad_id: especialidadId,
      guia_abogado
    };

    const { error: updateError } = await supabase
      .from("casos")
      .update(datosParaActualizar)
      .eq("id", casoId);

    if (updateError) {
      console.error('❌ Error actualizando caso:', updateError);
      throw updateError;
    }

    console.log('✅ Caso procesado completamente con asistentes personalizados');

  } catch (error) {
    console.error('❌ Error en processWithCustomAssistants:', error);
    // No lanzar el error para no bloquear la creación del caso
    // El caso quedará en estado borrador para procesamiento manual
  }
}
