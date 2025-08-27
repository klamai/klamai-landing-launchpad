import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';
// Esta es la dirección de correo configurada y verificada en tu cuenta de Resend
const FROM_EMAIL = 'info@klamai.com'; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not set in environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    try {
      const { to, subject, text, html } = await req.json();

      if (!to || !subject || (!text && !html)) {
        return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, and text or html.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const payload = {
        from: `Klamai.com <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        text: text,
        html: html,
      };

      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Failed to send email: ${response.statusText} - ${JSON.stringify(errorBody)}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify({ message: 'Email sent successfully!', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } else {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
});