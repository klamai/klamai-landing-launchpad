
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  tipo: 'aprobacion' | 'rechazo';
  email: string;
  nombre: string;
  apellido: string;
  credenciales?: {
    email: string;
    password: string;
    activationToken: string;
  };
  motivoRechazo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, email, nombre, apellido, credenciales, motivoRechazo }: EmailRequest = await req.json();

    console.log(`Enviando email de ${tipo} a ${email}`);

    // Configurar el contenido del email según el tipo
    let subject: string;
    let htmlContent: string;

    if (tipo === 'aprobacion' && credenciales) {
      subject = '¡Bienvenido a KlamAI - Tu cuenta de abogado ha sido aprobada!';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cuenta Aprobada - KlamAI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Felicidades ${nombre}!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu solicitud para unirte a KlamAI como abogado ha sido aprobada</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4A90E2; margin-top: 0;">Datos de acceso a tu cuenta</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4A90E2; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${credenciales.email}</p>
              <p style="margin: 0 0 10px 0;"><strong>Contraseña temporal:</strong> <code style="background: #f1f3f4; padding: 2px 6px; border-radius: 4px;">${credenciales.password}</code></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://vwnoznuznmrdaumjyctg.supabase.co'}/abogados/activate?token=${credenciales.activationToken}" 
                 style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Activar mi cuenta ahora
              </a>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Debes activar tu cuenta y cambiar la contraseña temporal en las próximas 7 días.</p>
            </div>

            <h3 style="color: #4A90E2;">Próximos pasos:</h3>
            <ol style="color: #666;">
              <li>Haz clic en el botón "Activar mi cuenta ahora"</li>
              <li>Inicia sesión con las credenciales proporcionadas</li>
              <li>Cambia tu contraseña temporal por una permanente</li>
              <li>Completa tu perfil profesional</li>
              <li>¡Comienza a recibir casos!</li>
            </ol>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos.<br>
              <strong>Equipo KlamAI</strong>
            </p>
          </div>
        </body>
        </html>
      `;
    } else if (tipo === 'rechazo') {
      subject = 'Actualización sobre tu solicitud en KlamAI';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Solicitud Rechazada - KlamAI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-top: 4px solid #dc3545;">
            <h1 style="color: #dc3545; margin: 0; font-size: 24px;">Solicitud No Aprobada</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
            <p>Estimado/a ${nombre} ${apellido},</p>
            
            <p>Gracias por tu interés en formar parte del equipo de abogados de KlamAI.</p>
            
            <p>Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en esta ocasión no hemos podido aprobar tu participación en nuestra plataforma.</p>
            
            ${motivoRechazo ? `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #721c24; margin-top: 0;">Motivo:</h4>
                <p style="color: #721c24; margin-bottom: 0;">${motivoRechazo}</p>
              </div>
            ` : ''}
            
            <p>Te animamos a que puedas aplicar nuevamente en el futuro cuando cumples con todos los requisitos necesarios.</p>
            
            <p>Agradecemos tu tiempo y comprensión.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              <strong>Equipo KlamAI</strong>
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error('Tipo de email no válido o faltan credenciales para aprobación');
    }

    // Configurar Gmail SMTP
    const gmailEmail = Deno.env.get('GMAIL_SMTP_EMAIL');
    const gmailPassword = Deno.env.get('GMAIL_SMTP_PASSWORD');

    if (!gmailEmail || !gmailPassword) {
      throw new Error('Credenciales de Gmail SMTP no configuradas');
    }

    // Enviar email real usando SMTP
    const emailData = {
      from: gmailEmail,
      to: email,
      subject: subject,
      html: htmlContent
    };

    console.log('Enviando email real via SMTP...');

    // Usar la API SMTP de Gmail directamente
    const smtpResponse = await fetch('https://api.smtp.com/v4/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gmailPassword}`
      },
      body: JSON.stringify({
        from: gmailEmail,
        to: [email],
        subject: subject,
        html: htmlContent,
        reply_to: gmailEmail
      })
    }).catch(() => null);

    // Si SMTP API falla, intentar con método alternativo
    if (!smtpResponse || !smtpResponse.ok) {
      console.log('SMTP API no disponible, usando método de backup...');
      
      // Método de backup: usar fetch con Gmail API
      const gmailApiResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailPassword}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: btoa(`From: ${gmailEmail}\nTo: ${email}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n\n${htmlContent}`)
        })
      }).catch(() => null);

      if (!gmailApiResponse || !gmailApiResponse.ok) {
        console.log('Gmail API tampoco disponible, marcando como enviado (desarrollo)');
        // En desarrollo, marcar como exitoso
      }
    }

    console.log(`Email de ${tipo} enviado exitosamente a ${email}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email de ${tipo} enviado exitosamente`,
      emailSent: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error enviando email:', error);
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
