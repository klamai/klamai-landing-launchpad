
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Función para limpiar y parsear JSON de OpenAI
function cleanAndParseJSON(content: string) {
  try {
    // Remover bloques de código markdown
    let cleanContent = content.trim();
    
    // Si empieza con ```json y termina con ```, remover esos marcadores
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Limpiar saltos de línea y espacios extras
    cleanContent = cleanContent.trim();
    
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('❌ Error parsing JSON:', content);
    throw new Error(`Error al parsear JSON de OpenAI: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { caseText } = await req.json();
    
    console.log('🔍 Procesando caso manual:', {
      caseText: caseText?.substring(0, 100) + '...'
    });

    if (!caseText || caseText.trim().length === 0) {
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
    "preferencia_horaria": "string (si se menciona)",
    "especialidad_legal": "laboral" | "civil" | "penal" | "administrativo" | "fiscal" | "mercantil" | "familia" | "otra",
    "tipo_lead": "estandar" | "premium" | "urgente"
  }
}

Si no puedes extraer algún campo, usa null.
Si es una empresa, asegúrate de marcar tipo_perfil como "empresa".
Si es una persona individual, marca tipo_perfil como "individual".
Para tipo_lead, considera:
- "urgente": Casos que requieren acción inmediata (24-48h)
- "premium": Casos de alta complejidad o valor económico
- "estandar": Casos normales que no requieren urgencia especial

Texto a analizar:
${caseText}
`;

    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal experto en extraer información estructurada de consultas legales. Responde ÚNICAMENTE con JSON válido sin bloques de código markdown.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!extractionResponse.ok) {
      throw new Error(`Error en OpenAI API: ${extractionResponse.status}`);
    }

    const extractionData = await extractionResponse.json();
    
    if (!extractionData.choices || !extractionData.choices[0] || !extractionData.choices[0].message) {
      throw new Error('Respuesta inválida de OpenAI API');
    }

    let extractedInfo;
    try {
      extractedInfo = cleanAndParseJSON(extractionData.choices[0].message.content);
    } catch (parseError) {
      console.error('❌ Error parsing JSON from OpenAI:', extractionData.choices[0].message.content);
      throw new Error('Error al procesar la respuesta de IA');
    }

    console.log('✅ Datos extraídos:', extractedInfo);

    // Obtener todas las especialidades de la base de datos
    const { data: especialidades, error: especialidadesError } = await supabase
      .from('especialidades')
      .select('id, nombre');

    if (especialidadesError) {
      console.error('❌ Error obteniendo especialidades:', especialidadesError);
      throw especialidadesError;
    }

    // Mapear la especialidad extraída a su ID
    let especialidadId = null;
    if (extractedInfo.consulta?.especialidad_legal) {
      // Buscar por similitud (no case sensitive)
      const especialidadEncontrada = especialidades?.find(esp => 
        esp.nombre.toLowerCase().includes(extractedInfo.consulta.especialidad_legal.toLowerCase()) ||
        extractedInfo.consulta.especialidad_legal.toLowerCase().includes(esp.nombre.toLowerCase())
      );
      
      if (especialidadEncontrada) {
        especialidadId = especialidadEncontrada.id;
      } else {
        // Si no encuentra coincidencia exacta, usar una por defecto
        especialidadId = especialidades?.[0]?.id || null;
      }
    }

    // Obtener el tipo de lead desde la extracción o usar el valor por defecto
    const tipoLead = extractedInfo.consulta?.tipo_lead || 'estandar';

    // Paso 2: Crear el caso en la base de datos
    const casoData = {
      motivo_consulta: extractedInfo.consulta?.motivo_consulta || 'Consulta manual sin detalles específicos',
      especialidad_id: especialidadId,
      tipo_lead: tipoLead,
      estado: 'borrador',
      canal_atencion: 'manual_admin',
      // Datos del cliente (formato borrador)
      nombre_borrador: extractedInfo.cliente?.nombre || null,
      apellido_borrador: extractedInfo.cliente?.apellido || null,
      email_borrador: extractedInfo.cliente?.email || null,
      telefono_borrador: extractedInfo.cliente?.telefono || null,
      ciudad_borrador: extractedInfo.cliente?.ciudad || null,
      tipo_perfil_borrador: extractedInfo.cliente?.tipo_perfil || 'individual',
      razon_social_borrador: extractedInfo.cliente?.razon_social || null,
      nif_cif_borrador: extractedInfo.cliente?.nif_cif || null,
      nombre_gerente_borrador: extractedInfo.cliente?.nombre_gerente || null,
      direccion_fiscal_borrador: extractedInfo.cliente?.direccion_fiscal || null,
      preferencia_horaria_contacto: extractedInfo.consulta?.preferencia_horaria || null,
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

    // Paso 3: Procesar con asistentes de IA (similar al flujo normal)
    await processWithAIAssistants(caso.id, extractedInfo, caseText);

    return new Response(JSON.stringify({
      success: true,
      caso: caso,
      extractedInfo: extractedInfo
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error en add-manual-case:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function processWithAIAssistants(casoId: string, extractedInfo: any, originalText: string) {
  try {
    console.log('🤖 Iniciando procesamiento con asistentes de IA para caso:', casoId);

    // Paso 1: Asistente Auxiliar - Generar resumen del caso
    const auxiliarPrompt = `
Analiza la siguiente consulta legal y genera un resumen profesional del caso:

Información del cliente:
- Nombre: ${extractedInfo.cliente?.nombre || 'No especificado'} ${extractedInfo.cliente?.apellido || ''}
- Tipo: ${extractedInfo.cliente?.tipo_perfil || 'individual'}
- Email: ${extractedInfo.cliente?.email || 'No especificado'}
- Ciudad: ${extractedInfo.cliente?.ciudad || 'No especificada'}

Consulta legal:
${extractedInfo.consulta?.motivo_consulta || 'Sin detalles específicos'}

Detalles adicionales:
${extractedInfo.consulta?.detalles_adicionales || 'No especificados'}

Texto original:
${originalText}

Genera un resumen profesional del caso que incluya:
1. Descripción clara del problema legal
2. Hechos relevantes
3. Posibles áreas del derecho involucradas
4. Información relevante del cliente
`;

    const auxiliarResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal experto en analizar consultas legales y generar resúmenes profesionales para abogados.'
          },
          {
            role: 'user',
            content: auxiliarPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    const auxiliarData = await auxiliarResponse.json();
    const resumenCaso = auxiliarData.choices?.[0]?.message?.content || 'No se pudo generar resumen';

    // Paso 2: Asistente Clasificador - Generar guía para el abogado
    const clasificadorPrompt = `
Basándote en el siguiente caso legal, genera una guía profesional para el abogado que lo trabajará:

Resumen del caso:
${resumenCaso}

Información del cliente:
- Tipo de cliente: ${extractedInfo.cliente?.tipo_perfil || 'individual'}
- Urgencia: ${extractedInfo.consulta?.urgencia || 'media'}

Genera una guía que incluya:
1. Estrategia legal recomendada
2. Documentos que se deberían solicitar al cliente
3. Pasos a seguir para el caso
4. Posibles riesgos o consideraciones especiales
5. Estimación de tiempo de resolución
`;

    const clasificadorResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal experto en generar guías estratégicas para abogados.'
          },
          {
            role: 'user',
            content: clasificadorPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const clasificadorData = await clasificadorResponse.json();
    const guiaAbogado = clasificadorData.choices?.[0]?.message?.content || 'No se pudo generar guía';

    // Paso 3: Asistente de Propuestas - Generar valor estimado
    const propuestasPrompt = `
Basándote en el siguiente caso legal, genera una estimación del valor del caso:

Resumen del caso:
${resumenCaso}

Guía del abogado:
${guiaAbogado}

Tipo de cliente: ${extractedInfo.cliente?.tipo_perfil || 'individual'}
Urgencia: ${extractedInfo.consulta?.urgencia || 'media'}

Genera una estimación que incluya:
1. Valor económico estimado del caso
2. Complejidad del caso (baja/media/alta)
3. Justificación del valor
4. Tiempo estimado de resolución
`;

    const propuestasResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente legal experto en valorar casos legales.'
          },
          {
            role: 'user',
            content: propuestasPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    const propuestasData = await propuestasResponse.json();
    const valorEstimado = propuestasData.choices?.[0]?.message?.content || 'No se pudo generar valoración';

    // Actualizar el caso con toda la información procesada
    const { error: updateError } = await supabase
      .from('casos')
      .update({
        resumen_caso: resumenCaso,
        guia_abogado: guiaAbogado,
        valor_estimado: valorEstimado,
        estado: 'disponible' // Cambiar a disponible después del procesamiento
      })
      .eq('id', casoId);

    if (updateError) {
      console.error('❌ Error actualizando caso:', updateError);
      throw updateError;
    }

    console.log('✅ Caso procesado completamente con IA');

  } catch (error) {
    console.error('❌ Error en processWithAIAssistants:', error);
    // No lanzar el error para no bloquear la creación del caso
    // El caso quedará en estado borrador para procesamiento manual
  }
}
