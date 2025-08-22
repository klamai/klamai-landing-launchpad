import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// --- FUNCIÓN PRINCIPAL DEL SERVIDOR (HANDLER) ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let caso_id_logging = "unknown";
  try {
    const payload = await req.json();
    const { caso_id, resumen_caso, nombre_borrador, transcripcion_chat, motivo_consulta, files } = payload;
    caso_id_logging = caso_id || "unknown";

    if (!caso_id || !resumen_caso || !nombre_borrador || !transcripcion_chat) {
      throw new Error("Faltan parámetros críticos del payload de Typebot.");
    }
    
    log('info', 'Iniciando procesamiento orquestado para Typebot', { caso_id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // --- FASE 1: Generación de propuesta síncrona (respuesta rápida) ---
    const { data: propuestaData, error: propuestaError } = await supabaseClient.functions.invoke(
      'generar-propuesta-inmediata',
      { 
        body: { caso_id, resumen_caso, nombre_borrador }
      }
    );

    if (propuestaError) {
      throw new Error(`Error al invocar 'generar-propuesta-inmediata': ${propuestaError.message}`);
    }

    log('info', 'Propuesta inmediata generada, devolviendo a Typebot.', { caso_id });

    // Devolver la respuesta a Typebot inmediatamente
    setTimeout(() => {
        supabaseClient.functions.invoke('procesar-analisis-background', {
            body: { caso_id, resumen_caso, transcripcion_chat, motivo_consulta, files }
        }).then(({ error }) => {
            if (error) {
                log('error', `Error en la invocación asíncrona de 'procesar-analisis-background': ${error.message}`, { caso_id });
            } else {
                log('info', 'Invocación asíncrona de background procesada.', { caso_id });
            }
        });
    }, 0);
    
    return new Response(JSON.stringify(propuestaData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    log('error', `Error en el orquestador 'iniciar-procesamiento-typebot': ${error.message}`, {
      caso_id: caso_id_logging,
      stack: error.stack
    });

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
