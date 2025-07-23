
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    // Inicializar Resend con la API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    const resend = new Resend(resendApiKey);

    // Obtener la URL base desde la request para generar la URL de activación correcta
    const origin = req.headers.get('origin') || 'https://vwnoznuznmrdaumjyctg.supabase.co';
    
    // Configurar el contenido del email según el tipo
    let subject: string;
    let htmlContent: string;

    if (tipo === 'aprobacion' && credenciales) {
      subject = '¡Bienvenido a KlamAI - Tu cuenta de abogado ha sido aprobada!';
      
      // Generar la URL de activación correcta
      const activationUrl = `${origin}/abogados/activate?token=${credenciales.activationToken}`;
      
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
              <a href="${activationUrl}" 
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
              <li>Configura tu nueva contraseña</li>
              <li>Completa tu perfil profesional</li>
              <li>¡Comienza a recibir casos!</li>
            </ol>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos.<br>
              <strong>Equipo KlamAI</strong>
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              URL de activación: ${activationUrl}
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

    // Enviar email usando Resend
    console.log('Enviando email a través de Resend...');
    console.log('URL de activación generada:', tipo === 'aprobacion' ? `${origin}/abogados/activate?token=${credenciales?.activationToken}` : 'N/A');
    
    const emailResponse = await resend.emails.send({
      from: 'KlamAI <noreply@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email enviado exitosamente:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email de ${tipo} enviado exitosamente`,
      emailSent: true,
      emailId: emailResponse.data?.id,
      activationUrl: tipo === 'aprobacion' ? `${origin}/abogados/activate?token=${credenciales?.activationToken}` : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en función de email:', error);
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
