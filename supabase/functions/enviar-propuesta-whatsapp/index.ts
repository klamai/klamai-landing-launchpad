import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - Deno import for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID_PROPOSAL_WHATSAPP");
const OA_HEADERS = (apiKey)=>({
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
  });
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  try {
    if (!OPENAI_API_KEY) return json({
      error: "OPENAI_API_KEY no configurado"
    }, 400);
    if (!OPENAI_ASSISTANT_ID) return json({
      error: "OPENAI_ASSISTANT_ID_PROPOSAL_WHATSAPP no configurado"
    }, 400);
    const { caso_id, include_checkout_url = false, phone_override } = await req.json();
    if (!caso_id) return json({
      error: "caso_id requerido"
    }, 400);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(supabaseUrl, supabaseAnon, {
      global: {
        headers: {
          Authorization: auth
        }
      }
    });
    // 1) Datos del caso
    const { data: caso, error: casoErr } = await sb.from("casos").select("id, cliente_id, nombre_borrador, apellido_borrador, email_borrador, telefono_borrador, ciudad_borrador, propuesta_estructurada, resumen_caso, motivo_consulta, estado").eq("id", caso_id).single();
    if (casoErr || !caso) return json({
      error: "Caso no encontrado"
    }, 404);
    
    // LOGGING INMEDIATO después de la consulta a la BD
    console.log(`🔍 DEBUG - Datos del caso desde la BD:`);
    console.log(`   - ID: ${caso.id}`);
    console.log(`   - Motivo consulta: "${caso.motivo_consulta}"`);
    console.log(`   - Estado: "${caso.estado}"`);
    console.log(`   - Propuesta estructurada: "${caso.propuesta_estructurada?.etiqueta_caso}"`);
    console.log(`   - Nombre: "${caso.nombre_borrador}"`);
    console.log(`   - Apellido: "${caso.apellido_borrador}"`);
    
    const phone = (phone_override || caso.telefono_borrador || "").trim();
    if (!phone) return json({
      error: "Sin teléfono para WhatsApp en el caso"
    }, 400);
    // 2) Token/URL (TTL 72h)
    const siteUrl = (Deno.env.get("SITE_URL") || "http://localhost:8080").replace(/\/$/, "");
    const token = await generateToken();
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const { error: tokErr } = await sb.from("proposal_tokens").insert({
      token,
      caso_id,
      expires_at: expires
    });
    if (tokErr) return json({
      error: "No se pudo generar token",
      details: String(tokErr.message || tokErr)
    }, 400);
    const viewUrl = `${siteUrl}/p/${token}`;
    // 3) Checkout opcional
    let checkoutUrl;
    if (include_checkout_url) {
      // Intentar crear checkout directo usando el token de propuesta
      const { data: ckToken, error: ckTokErr } = await sb.functions.invoke("crear-sesion-checkout-por-token", {
        body: {
          proposal_token: token
        },
        headers: {
          Authorization: auth
        }
      });
      if (!ckTokErr && ckToken?.url) {
        checkoutUrl = ckToken.url;
      } else {
        // Fallback: intentar con la función tradicional si ya hay cliente_id
        const { data: ck, error: ckErr } = await sb.functions.invoke("crear-sesion-checkout", {
          body: {
            plan_id: "consulta-estrategica",
            caso_id
          },
          headers: {
            Authorization: auth
          }
        });
        if (!ckErr && ck?.url) checkoutUrl = ck.url;
      }
    }
    // 4) Preparar input para OpenAI
    const fullName = [
      caso.nombre_borrador,
      caso.apellido_borrador
    ].filter(Boolean).join(" ").trim() || "cliente";
    const resumen = caso.propuesta_estructurada ? JSON.stringify(caso.propuesta_estructurada) : caso.resumen_caso || "Resumen no disponible";
    const input = `Resumen Profesional del Caso para ${fullName}:\n${resumen}\nDatos:\n- Teléfono: ${phone}\n- Email: ${caso.email_borrador || "N/D"}\n- Ciudad: ${caso.ciudad_borrador || "N/D"}`;
    const extra = [
      "Formatea en markdown para WhatsApp.",
      "Usa emojis discretos, tono profesional/cercano.",
      "Negritas solo con *asteriscos* (no **).",
      `Incluye el enlace al análisis del caso: ${viewUrl}.`,
      checkoutUrl ? `Incluye una línea final con CTA breve al pago: ${checkoutUrl}.` : "No incluyas enlace de pago.",
      "El analisis debe ser muy detallado y estructurado, incluyendo algunos emojis formateado en markdown, dando el analisis del caso, las especialidades, puntos clave, recomendaciones, y documentos necesarios, etc",
      "Devuelve JSON con las claves 'mensaje_whatsapp' y 'analisis_caso' en 'output'."
    ].join("\n");
    const r = await runAssistant(OPENAI_API_KEY, OPENAI_ASSISTANT_ID, input, extra);
    if (r.error) return json({
      error: r.error,
      phase: r.phase,
      details: r.details
    }, 400);
    const raw = r.message || "";
    
    // VALIDACIÓN CRÍTICA: Asegurar que tenemos contenido para enviar
    let whatsappMessage: string;
    let analysisMd: string | null;
    
    if (!raw || raw.trim().length === 0) {
      // FALLBACK ROBUSTO: Generar mensaje mínimo si OpenAI falla
      console.warn("⚠️ OpenAI no devolvió contenido, generando mensaje de fallback...");
      whatsappMessage = `Hola ${fullName}, hemos analizado tu caso legal y hemos preparado una propuesta personalizada para ti. 

📋 **Análisis del caso:**
${caso.motivo_consulta || "Caso legal"}

🔗 **Ver análisis completo:** ${viewUrl}

${checkoutUrl ? `💳 **Pagar consulta:** ${checkoutUrl}` : ""}

Nuestro equipo legal está listo para ayudarte. ¡Contáctanos si tienes alguna pregunta!`;
      
      analysisMd = `# Análisis del Caso - ${fullName}\n\n**Motivo de consulta:** ${caso.motivo_consulta || "Caso legal"}\n\n**Estado:** Análisis en progreso\n\n**Recomendación:** Contactar al equipo legal para más detalles.`;
    } else {
      // 5) Parseo robusto del esquema
      whatsappMessage = raw;
      analysisMd = null;
      try {
        const parsed = JSON.parse(raw);
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        let payload = first;
        if (first && typeof first === 'object' && typeof first.output === 'string') {
          payload = JSON.parse(first.output);
        }
        if (payload && typeof payload === 'object') {
          if (typeof payload.mensaje_whatsapp === 'string') whatsappMessage = payload.mensaje_whatsapp;
          if (typeof payload.analisis_caso === 'string') analysisMd = payload.analisis_caso;
        }
      } catch  {
      // si no es JSON, se usa el texto completo como whatsappMessage
      }
      // Normalización: reemplazar placeholders (#) por URL real si aparecieran
      const normalizeLinks = (txt)=>txt.replace(/\]\(#\)/g, `](${viewUrl})`).replace(/\(\s*#\s*\)/g, `(${viewUrl})`);
      whatsappMessage = normalizeLinks(whatsappMessage);
      if (analysisMd) analysisMd = normalizeLinks(analysisMd);
      // Si hay toggle activo: si existe checkoutUrl úsalo; si no, usa fallback a la misma landing con intent=pay
      if (include_checkout_url) {
        const payUrl = checkoutUrl || `${viewUrl}?intent=pay`;
        if (!whatsappMessage.includes(payUrl)) {
          whatsappMessage += `\n\nPagar consulta: ${payUrl}`;
        }
      }
    }
    
    // VALIDACIÓN POST-PROCESAMIENTO: Asegurar que el mensaje final tenga contenido
    if (!whatsappMessage || whatsappMessage.trim().length === 0) {
      console.error("❌ ERROR CRÍTICO: El mensaje de WhatsApp está vacío después del procesamiento");
      return json({
        error: "El mensaje de WhatsApp está vacío después del procesamiento",
        phase: "post_processing_validation",
        details: "El mensaje generado no tiene contenido válido después del procesamiento"
      }, 400);
    }
    
    console.log(`✅ Mensaje de WhatsApp generado exitosamente (${whatsappMessage.length} caracteres)`);
    
    // 6) Guardar propuesta (assistant_message con ambas claves para la landing)
    const { data: last } = await sb.from("propuestas").select("version").eq("caso_id", caso_id).order("version", {
      ascending: false
    }).limit(1).single();
    const version = (last?.version || 0) + 1;
    const assistantMessageJson = JSON.stringify({
      mensaje_whatsapp: whatsappMessage,
      analisis_caso: analysisMd
    });
    const { error: insErr } = await sb.from("propuestas").insert({
      caso_id,
      version,
      content: {
        from: "assistant",
        phone,
        city: caso.ciudad_borrador || null,
        whatsapp_message: whatsappMessage,
        analysis_md: analysisMd
      },
      assistant_message: assistantMessageJson,
      sent_at: new Date().toISOString(),
      sent_via: "whatsapp",
      sent_to_email: null
    });
    if (insErr) return json({
      error: "No se pudo registrar la propuesta",
      details: String(insErr.message || insErr)
    }, 400);
    // 7) Enviar WhatsApp con el mensaje de texto
    console.log(`📱 Enviando mensaje de texto por WhatsApp a ${phone}...`);
    
    // VALIDACIÓN FINAL: Asegurar que el mensaje tenga contenido antes de enviarlo
    if (!whatsappMessage || whatsappMessage.trim().length === 0) {
      return json({
        error: "El mensaje de WhatsApp está vacío y no se puede enviar",
        phase: "whatsapp_validation",
        details: "El mensaje generado no tiene contenido válido"
      }, 400);
    }
    
    const { data: wsData, error: wsError } = await sb.functions.invoke("send-whatsapp", {
      body: {
        tipo: "texto",
        numero: phone,
        texto: whatsappMessage
      },
      headers: {
        Authorization: auth
      }
    });
    if (wsError) return json({
      error: "No se pudo enviar WhatsApp",
      details: String(wsError.message || wsError)
    }, 400);
    if (wsData && wsData.error) return json({
      error: "No se pudo enviar WhatsApp",
      details: wsData.error
    }, 400);
    // 7.5) Generar y enviar audio personalizado
    console.log(`🎵 Generando audio personalizado para ${phone}...`);
    
    try {
      const audioResult = await generateAndSendPersonalizedAudio(phone, caso, viewUrl, checkoutUrl, sb);
      if (audioResult.success) {
        console.log(`✅ Audio personalizado enviado exitosamente`);
      } else {
        console.warn(`⚠️ Audio personalizado falló: ${audioResult.error}`);
      }
    } catch (audioError) {
      console.warn(`⚠️ Error generando audio personalizado: ${audioError}`);
    // No fallamos la función principal si el audio falla
    }
    // 7.6) Enviar ubicación de la oficina
    console.log(`📍 Enviando ubicación de la oficina a ${phone}...`);
    try {
      const locationResult = await sendOfficeLocation(phone, sb);
      if (locationResult.success) {
        console.log(`✅ Ubicación enviada exitosamente`);
      } else {
        console.warn(`⚠️ Envío de ubicación falló: ${locationResult.error}`);
      }
    } catch (locationError) {
      console.warn(`⚠️ Error enviando ubicación: ${locationError}`);
    // No fallamos la función principal si la ubicación falla
    }
    // 8) Estado del caso
    await sb.from("casos").update({
      estado: "propuesta_enviada",
      propuesta_enviada_at: new Date().toISOString()
    }).eq("id", caso_id);
    return json({
      ok: true,
      token,
      whatsappMessage,
      analysisMd
    });
  } catch (e) {
    return json({
      error: "Fallo al enviar propuesta",
      details: String(e)
    }, 400);
  }
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...cors
    }
  });
}
async function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
async function runAssistant(apiKey, assistantId, input, extra) {
  try {
    const thRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: OA_HEADERS(apiKey),
      body: JSON.stringify({})
    });
    if (!thRes.ok) return {
      error: "create_thread_failed",
      phase: "threads.create",
      details: await thRes.text()
    };
    const th = await thRes.json();
    const thread_id = th.id;
    const full = `${input}\n\nInstrucciones adicionales:\n${extra}`;
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: "POST",
      headers: OA_HEADERS(apiKey),
      body: JSON.stringify({
        role: "user",
        content: full
      })
    });
    if (!msgRes.ok) return {
      error: "add_message_failed",
      phase: "threads.messages.create",
      details: await msgRes.text()
    };
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: "POST",
      headers: OA_HEADERS(apiKey),
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    if (!runRes.ok) return {
      error: "run_create_failed",
      phase: "threads.runs.create",
      details: await runRes.text()
    };
    const run = await runRes.json();
    let status = run.status;
    const run_id = run.id;
    while([
      "queued",
      "in_progress",
      "cancelling"
    ].includes(status)){
      await new Promise((r)=>setTimeout(r, 1000));
      const curRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, {
        headers: OA_HEADERS(apiKey)
      });
      if (!curRes.ok) return {
        error: "run_poll_failed",
        phase: "threads.runs.retrieve",
        details: await curRes.text()
      };
      const cur = await curRes.json();
      status = cur.status;
    }
    if (status !== "completed") return {
      error: "run_not_completed",
      phase: status,
      details: {
        status
      }
    };
    const listRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?limit=10`, {
      headers: OA_HEADERS(apiKey)
    });
    if (!listRes.ok) return {
      error: "messages_list_failed",
      phase: "threads.messages.list",
      details: await listRes.text()
    };
    const msgs = await listRes.json();
    const assistantMsg = (msgs?.data || []).find((m)=>m?.role === "assistant" && Array.isArray(m?.content) && m.content.some((c)=>c?.type === "text"));
    const content = assistantMsg?.content?.find((c)=>c?.type === "text");
    const value = content?.text?.value;
    if (typeof value === "string" && value.trim().length > 0) return {
      message: value.trim()
    };
    return {
      error: "no_text_message",
      phase: "extract_text",
      details: msgs
    };
  } catch (e) {
    return {
      error: "assistant_exception",
      phase: "exception",
      details: String(e)
    };
  }
}
// Función para generar y enviar audio personalizado
async function generateAndSendPersonalizedAudio(phone, caso, viewUrl, checkoutUrl, supabaseClient) {
  try {
    // 1. Generar texto personalizado para el audio con OpenAI
    const audioText = await generateAudioText(caso, viewUrl, checkoutUrl);
    if (!audioText) {
      return {
        success: false,
        error: "No se pudo generar texto para el audio"
      };
    }
    // 2. Generar audio con ElevenLabs
    const audioResult = await generateElevenLabsAudio(audioText, supabaseClient);
    if (!audioResult.success || !audioResult.audio_url) {
      return {
        success: false,
        error: `Error generando audio: ${audioResult.error}`
      };
    }
    // 3. Enviar audio por WhatsApp
    const whatsappResult = await sendAudioWhatsApp(phone, audioResult.audio_url, supabaseClient);
    if (!whatsappResult.success) {
      return {
        success: false,
        error: `Error enviando WhatsApp: ${whatsappResult.error}`
      };
    }
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}
// Función para generar texto personalizado para el audio
async function generateAudioText(caso, viewUrl, checkoutUrl) {
  try {
    // LOGGING DETALLADO del objeto caso recibido
    console.log(`🔍 DEBUG - generateAudioText recibió:`);
    console.log(`   - Caso completo:`, JSON.stringify(caso, null, 2));
    console.log(`   - motivo_consulta: "${caso?.motivo_consulta}"`);
    console.log(`   - estado: "${caso?.estado}"`);
    console.log(`   - propuesta_estructurada.etiqueta_caso: "${caso?.propuesta_estructurada?.etiqueta_caso}"`);
    console.log(`   - resumen_caso (primeros 100 chars): "${caso?.resumen_caso?.substring(0, 100)}..."`);
    
    const fullName = [
      caso.nombre_borrador,
      caso.apellido_borrador
    ].filter(Boolean).join(" ").trim() || "cliente";
    const lawyerName = Deno.env.get("LAWYER_NAME") || "José María Escribá";
    
    // CONTEXTO ESPECÍFICO DEL CASO - NO INVENTAR INFORMACIÓN
    const caseContext = [];
    
    // Usar campos que realmente existen en el objeto caso
    if (caso.propuesta_estructurada?.etiqueta_caso) {
      caseContext.push(`Tipo de caso: ${caso.propuesta_estructurada.etiqueta_caso}`);
    }
    if (caso.motivo_consulta && caso.motivo_consulta !== "undefined") {
      caseContext.push(`Motivo: ${caso.motivo_consulta}`);
    }
    if (caso.estado && caso.estado !== "undefined") {
      caseContext.push(`Estado actual: ${caso.estado}`);
    }
    if (caso.resumen_caso) {
      caseContext.push(`Resumen: ${caso.resumen_caso.substring(0, 100)}...`);
    }
    
    const caseInfo = caseContext.length > 0 ? caseContext.join(". ") : "caso legal";
    
    // LOGGING DETALLADO para debugging
    console.log(`🎵 Generando audio para caso: ${caseInfo}`);
    console.log(`📋 Contexto del caso: ${caseInfo}`);
    console.log(`👤 Cliente: ${fullName}`);
    console.log(`🔗 URL análisis: ${viewUrl}`);
    
    const prompt = `Genera un mensaje de audio personalizado y corto (máximo 30 segundos) para un abogado que acaba de enviar una propuesta por WhatsApp.

IMPORTANTE: Usa ÚNICAMENTE la información real del caso proporcionada. NO inventes ni agregues información que no esté en el contexto.

Contexto REAL del caso:
- Cliente: ${fullName}
- Abogado: ${lawyerName}
- Información del caso: ${caseInfo}
- Análisis enviado: ${viewUrl}
${checkoutUrl ? `- Enlace de pago: ${checkoutUrl}` : ""}

El mensaje debe:
1. Saludar personalmente al cliente por su nombre
2. Confirmar que se acaba de enviar el análisis del caso ESPECÍFICO (${caso.propuesta_estructurada?.etiqueta_caso || caso.motivo_consulta || "caso legal"})
3. Mencionar que incluye recomendaciones y documentos necesarios para ESTE caso
4. Confirmar que ya tienen la estrategia para ESTE caso específico
5. Recordar amablemente que debe pagar la visita para comenzar
6. Ser cálido, profesional y motivador
7. Duración: máximo 30 segundos de audio
8. Tono: confiable y cercano

RESTRICCIONES CRÍTICAS:
- Habla SOLO del caso ${caso.propuesta_estructurada?.etiqueta_caso || caso.motivo_consulta || "caso legal"}
- NO inventes tipo de caso diferente
- NO agregues información que no esté en el contexto
- Mantén coherencia con el análisis enviado
- Usa la información real: ${caso.resumen_caso ? `"${caso.resumen_caso.substring(0, 150)}..."` : "caso legal"}

Genera solo el texto que dirá el abogado, sin explicaciones adicionales.`;
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un asistente especializado en generar textos para audio de abogados. Genera mensajes concisos, cálidos y profesionales optimizados para text-to-speech."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });
    if (!completion.ok) {
      throw new Error(`OpenAI API error: ${completion.status}`);
    }
    const data = await completion.json();
    const generatedText = data.choices?.[0]?.message?.content?.trim();
    
    // LOGGING del resultado
    if (generatedText) {
      console.log(`✅ Texto generado para audio (${generatedText.length} caracteres):`);
      console.log(`�� "${generatedText}"`);
    } else {
      console.warn(`⚠️ OpenAI no generó texto para el audio`);
    }
    
    return generatedText || null;
  } catch (error) {
    console.error("Error generando texto para audio:", error);
    return null;
  }
}
// Función para generar audio con ElevenLabs
async function generateElevenLabsAudio(text, supabaseClient) {
  try {
    const elevenLabsVoiceId = Deno.env.get("ELEVENLABS_DEFAULT_VOICE_ID");
    if (!elevenLabsVoiceId) {
      return {
        success: false,
        error: "ELEVENLABS_DEFAULT_VOICE_ID no configurado"
      };
    }
    // Llamar a la función independiente de ElevenLabs
    const { data: audioData, error: audioError } = await supabaseClient.functions.invoke("generate-elevenlabs-audio", {
      body: {
        text: text,
        voice_id: elevenLabsVoiceId,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128"
      }
    });
    if (audioError) {
      throw new Error(`Error de invocación: ${audioError.message || audioError}`);
    }
    if (!audioData || !audioData.success) {
      throw new Error(audioData?.error || "Error desconocido en ElevenLabs");
    }
    return {
      success: true,
      audio_url: audioData.audio_url
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}
// Función para enviar audio por WhatsApp
async function sendAudioWhatsApp(phone, audioUrl, supabaseClient) {
  try {
    // Extraer solo el base64 puro del audio_url (sin el prefijo data:)
    let audioBase64 = audioUrl;
    if (audioUrl.startsWith('data:audio/')) {
      audioBase64 = audioUrl.split(',')[1]; // Extraer solo la parte base64
    }
    // Usar el nuevo tipo 'audio' para enviar audio directamente
    const { data: wsData, error: wsError } = await supabaseClient.functions.invoke("send-whatsapp", {
      body: {
        tipo: 'audio',
        numero: phone,
        audio_base64: audioBase64,
        delay: 0
      }
    });
    if (wsError) {
      throw new Error(`Error de invocación: ${wsError.message || wsError}`);
    }
    if (wsData && wsData.error) {
      throw new Error(wsData.error);
    }
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}
// Función para enviar ubicación de la oficina
async function sendOfficeLocation(phone, supabaseClient) {
  try {
    // Obtener coordenadas y datos de la oficina desde variables de entorno
    const latitude = Number(Deno.env.get("KLAMAI_OFFICE_LATITUDE"));
    const longitude = Number(Deno.env.get("KLAMAI_OFFICE_LONGITUDE"));
    const officeName = Deno.env.get("KLAMAI_OFFICE_NAME");
    const officeAddress = Deno.env.get("KLAMAI_OFFICE_ADDRESS");
    // Validar que las coordenadas estén configuradas
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Coordenadas de oficina no configuradas correctamente");
    }
    // Enviar ubicación usando el nuevo tipo 'ubicacion'
    const { data: wsData, error: wsError } = await supabaseClient.functions.invoke("send-whatsapp", {
      body: {
        tipo: 'ubicacion',
        numero: phone,
        latitude: latitude,
        longitude: longitude,
        name: officeName || "",
        address: officeAddress || undefined,
        delay: 2,
        linkPreview: true
      }
    });
    if (wsError) {
      throw new Error(`Error de invocación: ${wsError.message || wsError}`);
    }
    if (wsData && wsData.error) {
      throw new Error(wsData.error);
    }
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: String(error)
    };
  }
}
