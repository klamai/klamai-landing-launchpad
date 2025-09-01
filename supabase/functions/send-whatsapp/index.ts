import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
/* global Deno */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

type TextPayload = {
  numero: string
  texto: string
  delay?: number
  // Los siguientes campos ya no se usan; la función toma secretos de env
  apikey?: string
  instancia?: string
  server_url?: string
}

type MediaPayload = {
  numero: string
  url_media: string
  mediatype: 'image' | 'video' | 'audio' | 'document'
  mimetype: string
  caption?: string
  fileName?: string
  delay?: number
  // Los siguientes campos ya no se usan; la función toma secretos de env
  apikey?: string
  instancia?: string
  server_url?: string
}

type AudioPayload = {
  numero: string
  audio_base64: string
  delay?: number
  // Los siguientes campos ya no se usan; la función toma secretos de env
  apikey?: string
  instancia?: string
  server_url?: string
}

type LocationPayload = {
  numero: string
  latitude: number
  longitude: number
  name?: string
  address?: string
  delay?: number
  // Los siguientes campos ya no se usan; la función toma secretos de env
  apikey?: string
  instancia?: string
  server_url?: string
}

type InputPayload =
  | (TextPayload & { tipo: 'texto' })
  | (MediaPayload & { tipo: 'media' })
  | (AudioPayload & { tipo: 'audio' })
  | (LocationPayload & { tipo: 'ubicacion' })

function sanitizePhone(number: string): string {
  return number.replace(/[^0-9+]/g, '').trim()
}

function sanitizeText(text: string): string {
  // Eliminar caracteres de control no imprimibles excepto \n, \r y \t (para conservar saltos de línea en WhatsApp)
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
}

function formatWhatsAppText(raw: string): string {
  let formatted = raw
    // Normalizar saltos de línea a \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // Convertir enlaces Markdown [Texto](https://url) a "Texto: https://url"
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2')

    // Compactar espacios múltiples alrededor de saltos de línea
    .replace(/[ \t]*\n[ \t]*/g, '\n')

    // Evitar más de 2 saltos de línea consecutivos
    .replace(/\n{3,}/g, '\n\n')

  return formatted
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isUnsafeHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (lower === 'localhost' || lower === '::1') return true
  // IPv4 privadas
  if (/^127\./.test(lower)) return true
  if (/^10\./.test(lower)) return true
  if (/^192\.168\./.test(lower)) return true
  if (/^169\.254\./.test(lower)) return true
  // RFC 1918 172.16.0.0 – 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) return true
  return false
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const body = (await req.json()) as Partial<InputPayload>

    const tipo = body?.tipo

    // Secretos desde entorno (obligatorio)
    const envServerUrl = (Deno.env.get('EVOLUTION_API_SERVER_URL') || '').trim()
    const envInstance = (Deno.env.get('EVOLUTION_API_INSTANCE') || '').trim()
    const envApiKey = (Deno.env.get('EVOLUTION_API_KEY') || '').trim()

    if (!tipo || !envServerUrl || !envInstance || !envApiKey) {
      return new Response(JSON.stringify({ error: 'Configuración faltante: tipo y/o secrets EVOLUTION_API_SERVER_URL, EVOLUTION_API_INSTANCE, EVOLUTION_API_KEY' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Validación de server URL desde env (HTTPS y no local)
    if (!isValidUrl(envServerUrl)) {
      return new Response(JSON.stringify({ error: 'EVOLUTION_API_SERVER_URL inválido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
    try {
      const { protocol, hostname } = new URL(envServerUrl)
      if (protocol !== 'https:') {
        return new Response(JSON.stringify({ error: 'EVOLUTION_API_SERVER_URL debe usar HTTPS' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      if (isUnsafeHost(hostname)) {
        return new Response(JSON.stringify({ error: 'EVOLUTION_API_SERVER_URL no puede apuntar a host local/privado' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
    } catch {
      return new Response(JSON.stringify({ error: 'EVOLUTION_API_SERVER_URL inválido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Validaciones comunes
    const numero = sanitizePhone((body as any)?.numero || '')
    if (!numero) {
      return new Response(JSON.stringify({ error: 'Número destino inválido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const delay = typeof (body as any)?.delay === 'number' && (body as any).delay! >= 0 ? (body as any).delay! : 0

    if (tipo === 'texto') {
      const texto = formatWhatsAppText(sanitizeText((body as any)?.texto || ''))
      if (!texto) {
        return new Response(JSON.stringify({ error: 'Texto requerido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const url = `${envServerUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(envInstance)}`
      const payload = {
        number: numero,
        text: texto,
        delay,
      }

      const evoRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: envApiKey,
        },
        body: JSON.stringify(payload),
      })

      const evoText = await evoRes.text()
      if (!evoRes.ok) {
        return new Response(JSON.stringify({ error: 'Evolution API error', details: safeJson(evoText) }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response(evoText, { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    if (tipo === 'media') {
      const urlMedia = sanitizeText((body as any)?.url_media || '')
      const mediatype = sanitizeText((body as any)?.mediatype || '') as MediaPayload['mediatype']
      const mimetype = sanitizeText((body as any)?.mimetype || '')
      const caption = sanitizeText(((body as any)?.caption || ''))
      const fileName = sanitizeText(((body as any)?.fileName || 'media'))

      if (!isValidUrl(urlMedia)) {
        return new Response(JSON.stringify({ error: 'URL de media inválida' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      if (!['image', 'video', 'audio', 'document'].includes(mediatype)) {
        return new Response(JSON.stringify({ error: 'mediatype inválido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      if (!mimetype) {
        return new Response(JSON.stringify({ error: 'mimetype requerido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const url = `${envServerUrl.replace(/\/$/, '')}/message/sendMedia/${encodeURIComponent(envInstance)}`
      const payload = {
        number: numero,
        mediatype,
        mimetype,
        caption: caption || undefined,
        media: urlMedia,
        fileName,
        delay,
      }

      const evoRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: envApiKey,
        },
        body: JSON.stringify(payload),
      })
      const evoText = await evoRes.text()
      if (!evoRes.ok) {
        return new Response(JSON.stringify({ error: 'Evolution API error', details: safeJson(evoText) }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response(evoText, { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    if (tipo === 'audio') {
      const audioBase64 = sanitizeText((body as any)?.audio_base64 || '')
      if (!audioBase64) {
        return new Response(JSON.stringify({ error: 'audio_base64 requerido' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const url = `${envServerUrl.replace(/\/$/, '')}/message/sendWhatsAppAudio/${encodeURIComponent(envInstance)}`
      const payload = {
        number: numero,
        audio: audioBase64,
        delay,
      }

      const evoRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: envApiKey,
        },
        body: JSON.stringify(payload),
      })
      const evoText = await evoRes.text()
      if (!evoRes.ok) {
        return new Response(JSON.stringify({ error: 'Evolution API error', details: safeJson(evoText) }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response(evoText, { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    if (tipo === 'ubicacion') {
      const latitude = (body as any)?.latitude
      const longitude = (body as any)?.longitude
      const name = sanitizeText((body as any)?.name || '')
      const address = sanitizeText((body as any)?.address || '')

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return new Response(JSON.stringify({ error: 'Latitud y longitud requeridas para ubicaciones' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      // Validar rangos de coordenadas
      if (latitude < -90 || latitude > 90) {
        return new Response(JSON.stringify({ error: 'Latitud debe estar entre -90 y 90' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      if (longitude < -180 || longitude > 180) {
        return new Response(JSON.stringify({ error: 'Longitud debe estar entre -180 y 180' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const url = `${envServerUrl.replace(/\/$/, '')}/message/sendLocation/${encodeURIComponent(envInstance)}`
      const payload = {
        number: numero,
        latitude,
        longitude,
        name: name, // Preservar strings vacíos
        address: address || undefined,
        delay,
        linkPreview: true
      }

      const evoRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: envApiKey,
        },
        body: JSON.stringify(payload),
      })
      const evoText = await evoRes.text()
      if (!evoRes.ok) {
        return new Response(JSON.stringify({ error: 'Evolution API error', details: safeJson(evoText) }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      return new Response(evoText, { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ error: 'tipo inválido. Use "texto", "media", "audio" o "ubicacion".' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: (e as Error)?.message ?? String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

