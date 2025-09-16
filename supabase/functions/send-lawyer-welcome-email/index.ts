import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-version',
};

interface EmailRequest {
  tipo: 'creacion_manual';
  email: string;
  nombre: string;
  apellido: string;
  magicLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, email, nombre, apellido, magicLink }: EmailRequest = await req.json();

    console.log(`Enviando email de bienvenida a ${email}`);

    // Inicializar Resend con la API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    const resend = new Resend(resendApiKey);

    // Obtener la dirección de email configurada
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'KlamAI <noreply@klamai.com>';

    // Obtener la URL base
    const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://klamai.com';

    let subject: string;
    let htmlContent: string;

    if (tipo === 'creacion_manual') {
      subject = '¡Bienvenido a KlamAI! Activa tu cuenta de abogado';

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenido a KlamAI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido ${nombre}!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu cuenta de abogado en KlamAI ha sido creada. Actívala ahora.</p>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4A90E2; margin-top: 0;">Datos de acceso a tu cuenta</h2>

            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4A90E2; margin: 20px 0;">
              <p style="margin: 0 0 15px 0;"><strong>Email registrado:</strong> ${email}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">Haz clic en el enlace de abajo para activar tu cuenta y establecer tu contraseña.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}"
                 style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Activar mi cuenta
              </a>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>✅ Seguro y privado:</strong> Este enlace es único para ti y expira en 7 días por seguridad.</p>
            </div>

            <h3 style="color: #4A90E2;">Próximos pasos:</h3>
            <ol style="color: #666;">
              <li>Haz clic en el botón "Activar mi cuenta"</li>
              <li>Serás redirigido a la página de configuración</li>
              <li>Establece tu contraseña segura</li>
              <li>Completa tu perfil profesional si es necesario</li>
              <li>¡Comienza a recibir casos!</li>
            </ol>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>💡 Información útil:</strong> Has recibido 100 créditos iniciales para comenzar a trabajar en la plataforma.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos.<br>
              <strong>Equipo KlamAI</strong>
            </p>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Este email fue enviado automáticamente por el sistema de KlamAI
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error('Tipo de email no válido');
    }

    // Enviar email usando Resend
    console.log('Enviando email de bienvenida a través de Resend...');
    console.log('Enviando desde:', fromEmail);

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email de bienvenida enviado exitosamente:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email de bienvenida enviado exitosamente',
      emailSent: true,
      emailId: emailResponse.data?.id,
      fromEmail: fromEmail
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en función de email de bienvenida:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      emailSent: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);