import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const openai = new OpenAI({ apiKey: openAIApiKey });

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

// --- TIPOS E INTERFACES ---

interface ClienteInfo {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  tipo_perfil?: 'individual' | 'empresa';
  razon_social?: string;
  nif_cif?: string;
  nombre_gerente?: string;
  direccion_fiscal?: string;
}

interface ConsultaInfo {
  motivo_consulta?: string;
  detalles_adicionales?: string;
  urgencia?: 'alta' | 'media' | 'baja';
  preferencia_horaria?: string;
  especialidad_legal?: string;
  tipo_lead?: 'estandar' | 'premium' | 'urgente';
}

interface ExtractedInfo {
  cliente: ClienteInfo;
  consulta: ConsultaInfo;
}


// --- FUNCIONES DE AYUDA ---

function log(level: 'info' | 'warn' | 'error', message: string, context = {}) {
  console.log(JSON.stringify({ level, message, ...context, timestamp: new Date().toISOString() }));
}

function extractJsonFromString(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function ejecutarAsistente(assistant_id: string, content: string): Promise<string> {
    const assistantId = Deno.env.get(assistant_id);
    if (!assistantId) throw new Error(`El ID para el asistente ${assistant_id} no está configurado.`);
    
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, { role: "user", content });
    
    const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistantId });
    
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


function cleanAndParseJSON(content: string) {
  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    cleanContent = cleanContent.trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    log('error', 'Error parsing JSON', { content, error: (error as Error).message });
    throw new Error(`Error al parsear JSON de OpenAI: ${(error as Error).message}`);
  }
}

// --- FUNCIÓN PRINCIPAL ---

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseText } = await req.json();
    log('info', 'Procesando caso manual', { caseText: caseText?.substring(0, 100) + '...' });

    if (!caseText || caseText.trim().length === 0) {
      throw new Error('El texto del caso es requerido');
    }

    // Paso 1: Extracción inicial de datos (mantener esto síncrono para validación básica)
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
        "preferencia_horaria": "string (si se menciona)",
        "especialidad_legal": "laboral" | "civil" | "penal" | "administrativo" | "fiscal" | "mercantil" | "familia" | "otra",
        "tipo_lead": "estandar" | "premium" | "urgente"
      }
    }

    Si no puedes extraer algún campo, usa null.
    Si es una empresa, asegúrate de marcar tipo_perfil como "empresa".
    Si es una persona individual, marca tipo_perfil como "individual".

    Texto a analizar:
    ${caseText}
    `;

    const extractionResult = await ejecutarAsistente("ASISTENTE_AUXILIAR_ID", extractionPrompt);
    const extractedInfo: ExtractedInfo = cleanAndParseJSON(extractionResult);

    // Paso 2: Crear el caso en estado 'borrador'
    const casoData = {
      motivo_consulta: extractedInfo.consulta?.motivo_consulta || 'Consulta manual',
      estado: 'borrador',
      canal_atencion: 'manual_admin',
      nombre_borrador: extractedInfo.cliente?.nombre,
      apellido_borrador: extractedInfo.cliente?.apellido,
      email_borrador: extractedInfo.cliente?.email,
      telefono_borrador: extractedInfo.cliente?.telefono,
      ciudad_borrador: extractedInfo.cliente?.ciudad,
      tipo_perfil_borrador: extractedInfo.cliente?.tipo_perfil,
      razon_social_borrador: extractedInfo.cliente?.razon_social,
      nif_cif_borrador: extractedInfo.cliente?.nif_cif,
      nombre_gerente_borrador: extractedInfo.cliente?.nombre_gerente,
      direccion_fiscal_borrador: extractedInfo.cliente?.direccion_fiscal,
      preferencia_horaria_contacto: extractedInfo.consulta?.preferencia_horaria,
      transcripcion_chat: {
        texto_original: caseText,
      }
    };

    const { data: caso, error: casoError } = await supabase.from('casos').insert([casoData]).select().single();
    if (casoError) throw casoError;
    log('info', 'Caso creado en estado borrador', { casoId: caso.id });

    // Paso 3: Iniciar procesamiento asíncrono (NO esperar)
    processWithAIAssistantsAsync(caso.id, caseText, extractedInfo).catch(error => {
      log('error', 'Error en procesamiento asíncrono', { casoId: caso.id, error: error.message });
    });

    // Retornar inmediatamente con el caso creado
    return new Response(JSON.stringify({ 
      success: true, 
      caso: caso,
      message: "Caso creado exitosamente. Se está procesando con IA en segundo plano."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    log('error', 'Error en add-manual-case', { message: (error as Error).message, stack: (error as Error).stack });
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Nueva función asíncrona para procesar con IA
async function processWithAIAssistantsAsync(casoId: string, originalText: string, extractedInfo: ExtractedInfo) {
    log('info', 'Iniciando procesamiento asíncrono con asistentes de IA', { casoId });

    try {
        // 1. Generar resumen profesional a partir de los datos extraídos
        const resumenPrompt = `Genera un resumen profesional del caso a partir de la siguiente información.
        Información del cliente: ${JSON.stringify(extractedInfo.cliente)}
        Consulta: ${JSON.stringify(extractedInfo.consulta)}
        Texto original: ${originalText}`;
        
        const resumenCaso = await ejecutarAsistente("ASISTENTE_AUXILIAR_ID", resumenPrompt);
        log('info', 'Resumen del caso generado', { casoId });

        // 2. Preparar prompts para los otros asistentes usando el resumen
        const prompt_clasificador = `Analiza el resumen y devuelve ÚNICAMENTE un objeto JSON crudo (raw), sin explicaciones. La estructura debe ser: {"motivo_consulta_ia": "...", "especialidad_nombre": "...", "tipo_lead": "...", "valor_estimado": "..."}. - Para 'motivo_consulta_ia', crea un titular de caso conciso y profesional, y entendible, máximo 20 palabras. Ej: "Reclamación de indemnización por despido con posible vulneración de derechos. - Para 'especialidad_nombre', DEBES elegir uno de la lista: [${LISTA_ESPECIALIDADES_VALIDAS.join(', ')}]. Si no encaja, usa 'Consulta General'. - Para 'tipo_lead', DEBES ELEGIR OBLIGATORIAMENTE uno de los siguientes tres valores exactos: 'estandar', 'premium', 'urgente'. No inventes otros valores. Un lead es 'premium' si el caso es claro y de alto potencial; 'urgente' si requiere acción inmediata; 'estandar' en los demás casos. - Para 'valor_estimado', da una estimación en euros como texto (ej: "1.500€ - 3.000€"). Resumen del caso: ${resumenCaso}`;
        const prompt_propuesta = `Analiza el resumen y genera un contenido de propuesta para el cliente. Su nombre es ${extractedInfo.cliente?.nombre || 'cliente'}. Tu respuesta debe ser ÚNICAMENTE un objeto JSON crudo (raw) con la estructura: {"titulo_personalizado": "...", "subtitulo_refuerzo": "...", "etiqueta_caso": "..."}. Resumen: ${resumenCaso}`;
        const prompt_guia = `Genera una guía técnica para un abogado a partir del siguiente resumen: ${resumenCaso}`;

        // 3. Ejecutar asistentes en paralelo
        const [guiaResult, propuestaResult, clasificacionResult] = await Promise.allSettled([
          ejecutarAsistente("ASISTENTE_AUXILIAR_ID", prompt_guia),
          ejecutarAsistente("ASISTENTE_PROPUESTAS_ID", prompt_propuesta),
          ejecutarAsistente("ASISTENTE_CLASIFICADOR_ID", prompt_clasificador)
        ]);

        if (guiaResult.status === 'rejected') throw new Error(`Asistente AUXILIAR (guía) falló: ${guiaResult.reason.message}`);
        if (propuestaResult.status === 'rejected') throw new Error(`Asistente PROPUESTAS falló: ${propuestaResult.reason.message}`);
        if (clasificacionResult.status === 'rejected') throw new Error(`Asistente CLASIFICADOR falló: ${clasificacionResult.reason.message}`);
        
        log('info', 'Asistentes ejecutados en paralelo', { casoId });

        // 4. Procesar resultados
        const guia_abogado = guiaResult.value;
        const clasificacion = JSON.parse(extractJsonFromString(clasificacionResult.value) || '{}');
        const propuesta_estructurada = JSON.parse(extractJsonFromString(propuestaResult.value) || '{}');

        // Mapear especialidad
        const { data: especialidad } = await supabase.from("especialidades").select("id").eq("nombre", clasificacion.especialidad_nombre).single();
        let especialidadId = especialidad?.id;
        if (!especialidadId) {
          const { data: generalSpec } = await supabase.from("especialidades").select("id").eq("nombre", "Consulta General").single();
          especialidadId = generalSpec?.id;
        }
        
        // Guardar guía del abogado en storage
        const guiaFile = new Blob([guia_abogado], { type: 'text/plain;charset=utf-8' });
        await supabase.storage.from('documentos_legales').upload(`casos/${casoId}/guia_para_abogado.txt`, guiaFile, { upsert: true });

        // 5. Actualizar el caso con todos los datos procesados
        const datosParaActualizar = {
          estado: "disponible",
          resumen_caso: resumenCaso,
          guia_abogado: guia_abogado, // Guardar contenido de la guía directamente
          propuesta_estructurada,
          motivo_consulta: clasificacion.motivo_consulta_ia || extractedInfo.consulta?.motivo_consulta,
          tipo_lead: clasificacion.tipo_lead,
          valor_estimado: clasificacion.valor_estimado,
          especialidad_id: especialidadId,
        };

        const { error: updateError } = await supabase.from("casos").update(datosParaActualizar).eq("id", casoId);
        if (updateError) throw updateError;
        
        log('info', 'Caso procesado y actualizado completamente', { casoId });

    } catch (error) {
        log('error', 'Error en procesamiento asíncrono', { casoId, error: (error as Error).message });
        // Opcional: Actualizar el caso con estado de error
        await supabase.from("casos").update({ 
          estado: "borrador",
          resumen_caso: "Error en procesamiento con IA"
        }).eq("id", casoId);
    }
}
