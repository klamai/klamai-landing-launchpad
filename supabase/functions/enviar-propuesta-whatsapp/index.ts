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

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID_PROPOSAL_WHATSAPP");

const OA_HEADERS = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v2"
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY no configurado" }, 400);
    if (!OPENAI_ASSISTANT_ID) return json({ error: "OPENAI_ASSISTANT_ID_PROPOSAL_WHATSAPP no configurado" }, 400);

    const { caso_id, include_checkout_url = false, phone_override } = await req.json();
    if (!caso_id) return json({ error: "caso_id requerido" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: auth } } });

    // 1) Datos del caso
    const { data: caso, error: casoErr } = await sb
      .from("casos")
      .select("id, cliente_id, nombre_borrador, apellido_borrador, email_borrador, telefono_borrador, ciudad_borrador, propuesta_estructurada, resumen_caso")
      .eq("id", caso_id)
      .single();
    if (casoErr || !caso) return json({ error: "Caso no encontrado" }, 404);

    const phone = (phone_override || caso.telefono_borrador || "").trim();
    if (!phone) return json({ error: "Sin teléfono para WhatsApp en el caso" }, 400);

    // 2) Token/URL (TTL 72h)
    const siteUrl = (Deno.env.get("SITE_URL") || "http://localhost:5173").replace(/\/$/, "");
    const token = await generateToken();
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const { error: tokErr } = await sb.from("proposal_tokens").insert({ token, caso_id, expires_at: expires });
    if (tokErr) return json({ error: "No se pudo generar token", details: String(tokErr.message || tokErr) }, 400);
    const viewUrl = `${siteUrl}/p/${token}`;

    // 3) Checkout opcional
    let checkoutUrl: string | undefined;
    if (include_checkout_url) {
      // Intentar crear checkout directo usando el token de propuesta
      const { data: ckToken, error: ckTokErr } = await sb.functions.invoke("crear-sesion-checkout-por-token", {
        body: { proposal_token: token },
        headers: { Authorization: auth }
      });
      if (!ckTokErr && ckToken?.url) {
        checkoutUrl = ckToken.url as string;
      } else {
        // Fallback: intentar con la función tradicional si ya hay cliente_id
        const { data: ck, error: ckErr } = await sb.functions.invoke("crear-sesion-checkout", {
          body: { plan_id: "consulta-estrategica", caso_id },
          headers: { Authorization: auth }
        });
        if (!ckErr && ck?.url) checkoutUrl = ck.url as string;
      }
    }

    // 4) Preparar input para OpenAI
    const fullName = [caso.nombre_borrador, caso.apellido_borrador].filter(Boolean).join(" ").trim() || "cliente";
    const resumen = caso.propuesta_estructurada ? JSON.stringify(caso.propuesta_estructurada) : (caso.resumen_caso || "Resumen no disponible");
    const input = `Resumen Profesional del Caso para ${fullName}:\n${resumen}\nDatos:\n- Teléfono: ${phone}\n- Email: ${caso.email_borrador || "N/D"}\n- Ciudad: ${caso.ciudad_borrador || "N/D"}`;
    const extra = [
      "Formatea en markdown para WhatsApp.",
      "Usa emojis discretos, tono profesional/cercano.",
      "Negritas solo con *asteriscos* (no **).",
      `Incluye el enlace al análisis del caso: ${viewUrl}.`,
      checkoutUrl ? `Incluye una línea final con CTA breve al pago: ${checkoutUrl}.` : "No incluyas enlace de pago.",
      "El analisis debe ser detallado",
      "Devuelve JSON con las claves 'mensaje_whatsapp' y 'analisis_caso' en 'output'."
    ].join("\n");

    const r = await runAssistant(OPENAI_API_KEY, OPENAI_ASSISTANT_ID, input, extra);
    if ((r as any).error) return json({ error: (r as any).error, phase: (r as any).phase, details: (r as any).details }, 400);
    const raw = (r as any).message || "";

    // 5) Parseo robusto del esquema
    let whatsappMessage: string = raw;
    let analysisMd: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      const first = Array.isArray(parsed) ? parsed[0] : parsed;
      let payload: any = first;
      if (first && typeof first === 'object' && typeof (first as any).output === 'string') {
        payload = JSON.parse((first as any).output);
      }
      if (payload && typeof payload === 'object') {
        if (typeof payload.mensaje_whatsapp === 'string') whatsappMessage = payload.mensaje_whatsapp;
        if (typeof payload.analisis_caso === 'string') analysisMd = payload.analisis_caso;
      }
    } catch {
      // si no es JSON, se usa el texto completo como whatsappMessage
    }

    // Normalización: reemplazar placeholders (#) por URL real si aparecieran
    const normalizeLinks = (txt: string) => txt.replace(/\]\(#\)/g, `](${viewUrl})`).replace(/\(\s*#\s*\)/g, `(${viewUrl})`);
    whatsappMessage = normalizeLinks(whatsappMessage);
    if (analysisMd) analysisMd = normalizeLinks(analysisMd);

    // Si hay toggle activo: si existe checkoutUrl úsalo; si no, usa fallback a la misma landing con intent=pay
    if (include_checkout_url) {
      const payUrl = checkoutUrl || `${viewUrl}?intent=pay`;
      if (!whatsappMessage.includes(payUrl)) {
        whatsappMessage += `\n\nPagar consulta: ${payUrl}`;
      }
    }

    // 6) Guardar propuesta (assistant_message con ambas claves para la landing)
    const { data: last } = await sb
      .from("propuestas")
      .select("version")
      .eq("caso_id", caso_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    const version = ((last as any)?.version || 0) + 1;

    const assistantMessageJson = JSON.stringify({ mensaje_whatsapp: whatsappMessage, analisis_caso: analysisMd });

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
    if (insErr) return json({ error: "No se pudo registrar la propuesta", details: String((insErr as any).message || insErr) }, 400);

    // 7) Enviar WhatsApp
    const { data: wsData, error: wsError } = await sb.functions.invoke("send-whatsapp", {
      body: { tipo: "texto", numero: phone, texto: whatsappMessage },
      headers: { Authorization: auth }
    });
    if (wsError) return json({ error: "No se pudo enviar WhatsApp", details: String((wsError as any).message || wsError) }, 400);
    if (wsData && (wsData as any).error) return json({ error: "No se pudo enviar WhatsApp", details: (wsData as any).error }, 400);

    // 8) Estado del caso
    await sb.from("casos").update({ estado: "propuesta_enviada", propuesta_enviada_at: new Date().toISOString() }).eq("id", caso_id);

    return json({ ok: true, token, whatsappMessage, analysisMd });
  } catch (e) {
    return json({ error: "Fallo al enviar propuesta", details: String(e) }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
}

async function generateToken(): Promise<string> {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function runAssistant(apiKey: string, assistantId: string, input: string, extra: string): Promise<{ message?: string; error?: string; phase?: string; details?: unknown; }> {
  try {
    const thRes = await fetch("https://api.openai.com/v1/threads", { method: "POST", headers: OA_HEADERS(apiKey), body: JSON.stringify({}) });
    if (!thRes.ok) return { error: "create_thread_failed", phase: "threads.create", details: await thRes.text() };
    const th = await thRes.json();
    const thread_id = th.id as string;

    const full = `${input}\n\nInstrucciones adicionales:\n${extra}`;
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, { method: "POST", headers: OA_HEADERS(apiKey), body: JSON.stringify({ role: "user", content: full }) });
    if (!msgRes.ok) return { error: "add_message_failed", phase: "threads.messages.create", details: await msgRes.text() };

    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, { method: "POST", headers: OA_HEADERS(apiKey), body: JSON.stringify({ assistant_id: assistantId }) });
    if (!runRes.ok) return { error: "run_create_failed", phase: "threads.runs.create", details: await runRes.text() };
    const run = await runRes.json();
    let status = run.status as string;
    const run_id = run.id as string;

    while (["queued", "in_progress", "cancelling"].includes(status)) {
      await new Promise((r) => setTimeout(r, 1000));
      const curRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, { headers: OA_HEADERS(apiKey) });
      if (!curRes.ok) return { error: "run_poll_failed", phase: "threads.runs.retrieve", details: await curRes.text() };
      const cur = await curRes.json();
      status = cur.status as string;
    }

    if (status !== "completed") return { error: "run_not_completed", phase: status, details: { status } };

    const listRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?limit=10`, { headers: OA_HEADERS(apiKey) });
    if (!listRes.ok) return { error: "messages_list_failed", phase: "threads.messages.list", details: await listRes.text() };
    const msgs = await listRes.json();

    const assistantMsg = (msgs?.data || []).find((m: any) => m?.role === "assistant" && Array.isArray(m?.content) && m.content.some((c: any) => c?.type === "text"));
    const content = assistantMsg?.content?.find((c: any) => c?.type === "text");
    const value = content?.text?.value as string | undefined;
    if (typeof value === "string" && value.trim().length > 0) return { message: value.trim() };
    return { error: "no_text_message", phase: "extract_text", details: msgs };
  } catch (e) {
    return { error: "assistant_exception", phase: "exception", details: String(e) };
  }
}


