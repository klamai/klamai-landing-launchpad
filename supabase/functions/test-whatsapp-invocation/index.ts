import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { 
      "Content-Type": "application/json", 
      ...cors 
    } 
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    
    return json({ 
      ok: true, 
      message: "Función de prueba funcionando",
      received: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (e) {
    return json({ 
      error: "Error en función de prueba", 
      details: String(e) 
    }, 400);
  }
});
