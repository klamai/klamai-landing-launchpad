
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  solicitudId: string;
  tipo: 'aprobada' | 'rechazada';
  motivoRechazo?: string;
  notasAdmin?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { solicitudId, tipo, motivoRechazo, notasAdmin }: ApprovalEmailRequest = await req.json();

    if (tipo === 'aprobada') {
      // Llamar a la función automatizada para aprobación
      const { data: result, error } = await supabaseAdmin
        .rpc('aprobar_solicitud_abogado_automatizado', {
          p_solicitud_id: solicitudId,
          p_notas_admin: notasAdmin
        });

      if (error) throw error;

      const { email, nombre, apellido, activation_token, temp_password } = result;

      // Crear usuario en Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: temp_password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellido,
          role: 'abogado',
          approved_by_admin: 'true',
          activation_required: 'true'
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      // Enviar email de aprobación
      const activationUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/abogados/activate?token=${activation_token}`;

      const emailResponse = await resend.emails.send({
        from: "KLAMAI <noreply@klamai.com>",
        to: [email],
        subject: "¡Felicitaciones! Tu solicitud ha sido aprobada - KLAMAI",
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">¡Bienvenido a KLAMAI!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tu solicitud ha sido aprobada</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <p style="font-size: 16px; color: #111827; margin-bottom: 20px;">
                Estimado/a <strong>${nombre} ${apellido}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #111827; line-height: 1.6; margin-bottom: 20px;">
                Nos complace informarte que tu solicitud para unirte a nuestra plataforma de asesoría legal ha sido <strong>aprobada exitosamente</strong>.
              </p>
              
              <div style="background-color: #F3F4F6; border-left: 4px solid #4A90E2; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #4A90E2; margin: 0 0 15px; font-size: 18px;">Próximos pasos para activar tu cuenta:</h3>
                <ol style="color: #111827; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Haz clic en el botón de activación que aparece abajo</li>
                  <li style="margin-bottom: 8px;">Establece tu contraseña definitiva</li>
                  <li style="margin-bottom: 8px;">Completa tu perfil profesional</li>
                  <li>Comienza a recibir casos cualificados</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${activationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); 
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(74, 144, 226, 0.3);">
                  Activar Mi Cuenta
                </a>
              </div>
              
              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  <strong>Importante:</strong> Este enlace de activación expira en 24 horas. Si necesitas un nuevo enlace, contacta con nuestro equipo de soporte.
                </p>
              </div>
              
              ${notasAdmin ? `
                <div style="background-color: #EBF8FF; border-left: 4px solid #50E3C2; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <h4 style="color: #50E3C2; margin: 0 0 10px;">Notas del administrador:</h4>
                  <p style="color: #1F2937; margin: 0; font-style: italic;">${notasAdmin}</p>
                </div>
              ` : ''}
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                Si tienes alguna pregunta, no dudes en contactarnos en 
                <a href="mailto:soporte@klamai.com" style="color: #4A90E2;">soporte@klamai.com</a>
              </p>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">
                © 2024 KLAMAI - Plataforma de Asesoría Legal con IA
              </p>
            </div>
          </div>
        `,
      });

      console.log("Approval email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Solicitud aprobada y email enviado exitosamente",
        user_id: authUser.user?.id 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (tipo === 'rechazada') {
      // Solo enviar email de rechazo (sin crear usuario)
      const { data: solicitud } = await supabaseAdmin
        .from('solicitudes_abogado')
        .select('*')
        .eq('id', solicitudId)
        .single();

      if (!solicitud) {
        throw new Error('Solicitud no encontrada');
      }

      const emailResponse = await resend.emails.send({
        from: "KLAMAI <noreply@klamai.com>",
        to: [solicitud.email],
        subject: "Actualización sobre tu solicitud - KLAMAI",
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Actualización de Solicitud</h1>
            </div>
            
            <div style="padding: 40px 20px;">
              <p style="font-size: 16px; color: #111827; margin-bottom: 20px;">
                Estimado/a <strong>${solicitud.nombre} ${solicitud.apellido}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #111827; line-height: 1.6; margin-bottom: 20px;">
                Gracias por tu interés en formar parte de nuestra plataforma de asesoría legal KLAMAI.
              </p>
              
              <p style="font-size: 16px; color: #111827; line-height: 1.6; margin-bottom: 30px;">
                Después de revisar cuidadosamente tu solicitud, lamentablemente no podemos aprobarla en este momento.
              </p>
              
              ${motivoRechazo ? `
                <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <h4 style="color: #EF4444; margin: 0 0 10px;">Motivo del rechazo:</h4>
                  <p style="color: #1F2937; margin: 0;">${motivoRechazo}</p>
                </div>
              ` : ''}
              
              <p style="font-size: 16px; color: #111827; line-height: 1.6; margin-bottom: 20px;">
                Te animamos a que vuelvas a presentar tu solicitud en el futuro cuando cumplas con todos los requisitos necesarios.
              </p>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                Si tienes alguna pregunta sobre esta decisión, puedes contactarnos en 
                <a href="mailto:soporte@klamai.com" style="color: #4A90E2;">soporte@klamai.com</a>
              </p>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">
                © 2024 KLAMAI - Plataforma de Asesoría Legal con IA
              </p>
            </div>
          </div>
        `,
      });

      console.log("Rejection email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email de rechazo enviado exitosamente" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in send-lawyer-approval-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
