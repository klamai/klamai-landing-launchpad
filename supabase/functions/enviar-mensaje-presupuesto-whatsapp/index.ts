import "jsr:@supabase/functions-js/edge-runtime.d.ts";
/* global Deno */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;
// @ts-ignore - Deno import for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { caso_id, delaySecs = 180, video_url, caption_override, text_override, phone_override } = await req.json();
    if (!caso_id) return json({ error: "caso_id requerido" }, 400);

    // Espera opcional diferida
    if (delaySecs && Number(delaySecs) > 0) {
      await new Promise((r) => setTimeout(r, Number(delaySecs) * 1000));
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: auth } } });

    // 1) Obtener datos del caso
    const { data: caso, error: casoErr } = await sb
      .from("casos")
      .select("id, telefono_borrador")
      .eq("id", caso_id)
      .single();
    if (casoErr || !caso) return json({ error: "Caso no encontrado" }, 404);

    const numero = (phone_override || caso.telefono_borrador || "").trim();
    if (!numero) return json({ error: "Sin teléfono para WhatsApp en el caso" }, 400);

    // 2) Intentar insertar log (anti-duplicado por índice único)
    const defaultVideo = video_url || Deno.env.get("WHATSAPP_VIDEO_PRESUPUESTO_URL") || "";
    const defaultCaption = caption_override || "Hola, soy su abogado. Analizaré tu caso y te enviaré un presupuesto en 24-48h.";
    const defaultText = text_override || "*Seguimiento de tu solicitud*\n\n✅ Recibimos tu petición de presupuesto.\n⏰ Estamos analizando tu caso.\n📊 Te enviaremos el presupuesto por email.\n\nSi necesitas añadir información, responde a este mensaje.";

    const { data: preLog, error: preErr } = await sb
      .from('comunicaciones')
      .insert({
        canal: 'whatsapp',
        tipo: 'presupuesto_informativo',
        caso_id,
        destinatario_numero: numero,
        cuerpo: defaultText,
        media_url: defaultVideo || null,
        estado: 'enviado'
      })
      .select()
      .single();

    if (preErr) {
      // Si es duplicado, salimos idempotente
      const msg = String((preErr as any).message || preErr);
      if (/duplicate|unique/i.test(msg)) {
        return json({ ok: true, skipped: 'ya_enviado' });
      }
      return json({ error: 'No se pudo registrar log', details: msg }, 400);
    }

    // 3) Enviar video si hay URL
    if (defaultVideo) {
      const { error: mediaErr, data: mediaData } = await sb.functions.invoke('send-whatsapp', {
        body: {
          tipo: 'media',
          numero,
          url_media: defaultVideo,
          mediatype: 'video',
          mimetype: 'video/mp4',
          caption: defaultCaption
        },
        headers: { Authorization: auth }
      });
      if (mediaErr || (mediaData as any)?.error) {
        await sb.from('comunicaciones').update({ estado: 'fallo', error: String((mediaErr as any)?.message || (mediaData as any)?.error || 'send-media-failed') }).eq('id', preLog.id);
        return json({ error: 'No se pudo enviar media' }, 502);
      }
    }

    // 4) Enviar texto
    const { error: textErr, data: textData } = await sb.functions.invoke('send-whatsapp', {
      body: { tipo: 'texto', numero, texto: defaultText },
      headers: { Authorization: auth }
    });
    if (textErr || (textData as any)?.error) {
      await sb.from('comunicaciones').update({ estado: 'fallo', error: String((textErr as any)?.message || (textData as any)?.error || 'send-text-failed') }).eq('id', preLog.id);
      return json({ error: 'No se pudo enviar texto' }, 502);
    }

    // 5) Actualizar log a enviado
    await sb.from('comunicaciones').update({ estado: 'enviado', enviado_at: new Date().toISOString(), cuerpo: defaultText }).eq('id', preLog.id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Fallo al enviar mensaje de presupuesto", details: String(e) }, 400);
  }
});


