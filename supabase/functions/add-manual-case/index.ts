// @ts-nocheck
/* eslint-disable */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-client-version, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const openai = new OpenAI({ apiKey: openAIApiKey });

const LISTA_ESPECIALIDADES_VALIDAS = [
  'Derecho Administrativo',
  'Derecho Ambiental',
  'Derecho Civil',
  'Derecho Concursal',
  'Derecho de Extranjería',
  'Derecho de la Seguridad Social',
  'Derecho de Propiedad Intelectual',
  'Derecho de Seguros',
  'Derecho Familiar',
  'Derecho Fiscal',
  'Derecho Inmobiliario',
  'Derecho Laboral',
  'Derecho Mercantil',
  'Derecho Penal',
  'Derecho Sanitario',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { caseText, caseData } = await req.json();
    // Normalizar especialidad del formulario si viene informada
    const preselectedEspecialidadId: number | null = (caseData?.especialidad_id != null && !Number.isNaN(Number(caseData.especialidad_id)))
      ? Number(caseData.especialidad_id)
      : null;

    // Utilidad: normalizar teléfono con prefijo 34 por defecto
    const normalizePhone = (raw?: string | null): string | null => {
      if (!raw) return null;
      const digits = String(raw).replace(/\D+/g, '');
      if (!digits) return null;
      if (digits.startsWith('34')) return digits;
      // Si ya tiene 0034, normalizar a 34
      if (digits.startsWith('0034')) return digits.slice(2);
      // Añadir prefijo 34 si no está presente
      return `34${digits}`;
    };
    
    // Determinar el modo de operación
    const isFormMode = caseData && !caseText;
    const isTextMode = caseText && !caseData;
    
    if (!isFormMode && !isTextMode) {
      throw new Error('Debe proporcionar caseText (modo texto libre) o caseData (modo formulario)');
    }

    let extractedInfo: ExtractedInfo;
    let originalText: string;

    if (isFormMode) {
      // Modo formulario: usar datos proporcionados directamente
      extractedInfo = {
        cliente: {
          nombre: caseData.nombre,
          apellido: caseData.apellido,
          email: caseData.email,
          telefono: caseData.telefono,
          ciudad: caseData.ciudad,
          tipo_perfil: caseData.tipo_perfil,
          razon_social: caseData.razon_social,
          nif_cif: caseData.nif_cif,
          nombre_gerente: caseData.nombre_gerente,
          direccion_fiscal: caseData.direccion_fiscal
        },
        consulta: {
          motivo_consulta: caseData.motivo_consulta,
          tipo_lead: caseData.tipo_lead,
          preferencia_horaria: caseData.preferencia_horaria_contacto
        }
      };
      originalText = `Caso creado manualmente: ${caseData.motivo_consulta}`;
    } else {
      // Modo texto libre: extraer información con IA
      log('info', 'Procesando texto libre con IA', { textLength: caseText.length });
      
      const extractionPrompt = `Extrae la información del siguiente texto de consulta legal y devuelve ÚNICAMENTE una cadena JSON válida, sin explicaciones ni texto adicional. IMPORTANTE: Debes devolver SOLO la cadena JSON, no un objeto JavaScript. La estructura debe ser: {"cliente": {"nombre": "...", "apellido": "...", "email": "...", "telefono": "...", "ciudad": "...", "tipo_perfil": "individual|empresa", "razon_social": "...", "nif_cif": "...", "nombre_gerente": "...", "direccion_fiscal": "..."}, "consulta": {"motivo_consulta": "...", "detalles_adicionales": "...", "urgencia": "alta|media|baja", "preferencia_horaria": "...", "especialidad_legal": "...", "tipo_lead": "estandar|premium|urgente"}}. Si no encuentras algún dato, déjalo vacío. Texto: ${caseText}`;
      
      const extractionResult = await ejecutarAsistente("ASISTENTE_AUXILIAR_ID", extractionPrompt);
      const jsonString = extractJsonFromString(extractionResult);
      
      if (!jsonString) {
        throw new Error('No se pudo extraer información válida del texto');
      }
      
      extractedInfo = cleanAndParseJSON(jsonString);
      originalText = caseText;
    }

    // Validar información mínima requerida
    if (!extractedInfo.consulta?.motivo_consulta) {
      throw new Error('Se requiere el motivo de la consulta');
    }

    // Validar información del cliente (más flexible)
    if (!extractedInfo.cliente?.nombre && !extractedInfo.cliente?.apellido && !extractedInfo.cliente?.email) {
      throw new Error('Se requiere al menos un dato de contacto del cliente (nombre, apellido o email)');
    }

    // Resolver especialidad para inserción: usar formulario o 'Consulta General'
    let insertEspecialidadId: number | null = preselectedEspecialidadId;
    if (insertEspecialidadId == null) {
      const { data: generalSpec, error: generalErr } = await supabase
        .from('especialidades')
        .select('id')
        .eq('nombre', 'Consulta General')
        .single();
      if (generalErr) {
        log('error', 'No se pudo obtener id de Consulta General', { error: generalErr.message });
      }
      insertEspecialidadId = generalSpec?.id ?? null;
    }
    if (insertEspecialidadId == null) {
      throw new Error("No se encontró la especialidad 'Consulta General'.");
    }

    // Crear el caso en la base de datos
    const casoData = {
      motivo_consulta: extractedInfo.consulta.motivo_consulta,
      estado: "borrador",
      canal_atencion: "manual_admin",
      nombre_borrador: extractedInfo.cliente.nombre || null,
      apellido_borrador: extractedInfo.cliente.apellido || null,
      email_borrador: extractedInfo.cliente.email || null,
      telefono_borrador: normalizePhone(extractedInfo.cliente.telefono) || null,
      ciudad_borrador: extractedInfo.cliente.ciudad || null,
      tipo_perfil_borrador: extractedInfo.cliente.tipo_perfil || null,
      razon_social_borrador: extractedInfo.cliente.razon_social || null,
      nif_cif_borrador: extractedInfo.cliente.nif_cif || null,
      nombre_gerente_borrador: extractedInfo.cliente.nombre_gerente || null,
      direccion_fiscal_borrador: extractedInfo.cliente.direccion_fiscal || null,
      preferencia_horaria_contacto: extractedInfo.consulta.preferencia_horaria || null,
      tipo_lead: extractedInfo.consulta.tipo_lead || null,
      valor_estimado: caseData?.valor_estimado || null,
      especialidad_id: insertEspecialidadId
    };

    const { data: caso, error: insertError } = await supabase.from("casos").insert(casoData).select().single();
    
    if (insertError) {
      log('error', 'Error al insertar caso', { error: insertError.message });
      throw insertError;
    }

    log('info', 'Caso creado exitosamente', { casoId: caso.id, modo: isFormMode ? 'formulario' : 'texto' });

    // Paso 3: Iniciar procesamiento asíncrono (NO esperar)
    processWithAIAssistantsAsync(caso.id, originalText, extractedInfo, insertEspecialidadId).catch(error => {
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
async function processWithAIAssistantsAsync(
  casoId: string,
  originalText: string,
  extractedInfo: ExtractedInfo,
  preselectedEspecialidadId: number | null = null
) {
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
    let especialidadId: number | null = null;
    if (clasificacion?.especialidad_nombre) {
      const { data: especialidad } = await supabase
        .from("especialidades")
        .select("id")
        .eq("nombre", clasificacion.especialidad_nombre)
        .single();
      if (especialidad?.id != null) especialidadId = Number(especialidad.id);
    }
    if (especialidadId == null) {
      const { data: generalSpec } = await supabase
        .from("especialidades")
        .select("id")
        .eq("nombre", "Consulta General")
        .single();
      if (generalSpec?.id != null) especialidadId = Number(generalSpec.id);
    }
    if (especialidadId == null && preselectedEspecialidadId != null) {
      especialidadId = Number(preselectedEspecialidadId);
    }
        
    // Guardar guía del abogado en storage
    const guiaFile = new Blob([guia_abogado], { type: 'text/plain;charset=utf-8' });
    await supabase.storage.from('documentos_legales').upload(`casos/${casoId}/guia_para_abogado.txt`, guiaFile, { upsert: true });

    // 5. Actualizar el caso con todos los datos procesados
    const datosParaActualizar: Record<string, unknown> = {
      estado: "listo_para_propuesta",
      resumen_caso: resumenCaso,
      guia_abogado: guia_abogado, // Guardar contenido de la guía directamente
      propuesta_estructurada,
      motivo_consulta: clasificacion.motivo_consulta_ia || extractedInfo.consulta?.motivo_consulta,
      tipo_lead: clasificacion.tipo_lead,
      valor_estimado: clasificacion.valor_estimado,
    };
    if (especialidadId != null) datosParaActualizar.especialidad_id = especialidadId;

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
