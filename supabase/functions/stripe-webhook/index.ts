// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// --- CONFIGURACIÓN Y CABECERAS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-client-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};
// --- UTILIDADES DE LOGGING Y SANITIZACIÓN (RGPD) ---
const maskEmail = (email)=>{
  if (!email || typeof email !== "string") return email;
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
};
const maskId = (id)=>{
  if (!id || typeof id !== "string") return id;
  return `${id.slice(0, 6)}...`;
};
const sanitizeDetails = (value)=>{
  if (value == null) return value;
  if (typeof value === "string") return value.length > 40 ? `${value.slice(0, 12)}...` : value;
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)){
      if (k.toLowerCase().includes("email")) {
        out[k] = maskEmail(v);
      } else if (k.toLowerCase().includes("id")) {
        out[k] = maskId(String(v));
      } else if (k.toLowerCase().includes("url")) {
        out[k] = typeof v === "string" ? `${v.split("?")[0]}?...` : v;
      } else {
        out[k] = sanitizeDetails(v);
      }
    }
    return out;
  }
  return value;
};
const logStep = (step, details)=>{
  try {
    const detailsStr = details ? ` - ${JSON.stringify(sanitizeDetails(details))}` : '';
    console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
  } catch  {
    console.log(`[STRIPE-WEBHOOK] ${step}`);
  }
};
// --- SERVIDOR PRINCIPAL ---
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    logStep("Webhook received");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) throw new Error("Missing Stripe configuration");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: {
        persistSession: false
      }
    });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature");
    logStep("Verifying webhook signature");
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event verified", {
      type: event.type,
      id: event.id
    });
    // Lógica de prevención de duplicados existente
    const { data: existingEvent } = await supabase.from("stripe_webhook_events").select("id").eq("stripe_event_id", event.id).single();
    if (existingEvent) {
      logStep("Event already processed", {
        eventId: event.id
      });
      return new Response(JSON.stringify({
        received: true,
        status: "already_processed"
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Registrar evento con campos específicos extraídos del evento de Stripe
    const eventData = event.data.object;
    const webhookEventData = {
      stripe_event_id: event.id,
      event_type: event.type,
      data_sanitizada: sanitizeDetails(eventData),
      processed: false,
      // Extraer campos específicos según el tipo de evento
      caso_id: eventData.metadata?.caso_id || null,
      stripe_session_id: event.type === "checkout.session.completed" ? eventData.id : null,
      stripe_payment_intent_id: event.type === "payment_intent.succeeded" ? eventData.id : eventData.payment_intent || null,
      amount_total_cents: eventData.amount_total || eventData.amount || null,
      currency: eventData.currency || null,
      user_id: eventData.metadata?.user_id || null,
      price_id: eventData.line_items?.data?.[0]?.price?.id || null,
      product_id: eventData.line_items?.data?.[0]?.price?.product || null
    };
    await supabase.from("stripe_webhook_events").insert(webhookEventData);
    let processingResult = {
      success: false,
      message: "Event type not handled"
    };
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const flujoOrigen = session.metadata?.flujo_origen || null;
      switch(flujoOrigen){
        case 'chat_anonimo':
        case 'propuesta_anonima':
          logStep("Processing anonymous flow", {
            casoId: session.metadata?.caso_id,
            flujoOrigen: flujoOrigen
          });
          processingResult = await handleAnonymousPayment(session, supabase);
          break;
        case 'dashboard_registrado':
          logStep("Processing registered user flow", {
            userId: session.metadata?.user_id
          });
          processingResult = await handleRegisteredUserPayment(session, supabase, stripe);
          break;
        default:
          if (session.metadata?.user_id) {
            logStep("Processing legacy registered user flow", {
              userId: session.metadata?.user_id
            });
            processingResult = await handleRegisteredUserPayment(session, supabase, stripe);
          } else if (session.metadata?.caso_id) {
            logStep("Processing legacy anonymous flow", {
              casoId: session.metadata?.caso_id
            });
            processingResult = await handleAnonymousPayment(session, supabase);
          } else {
            processingResult = {
              success: false,
              message: "Webhook session is missing user_id or caso_id in metadata"
            };
          }
      }
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      // ✅ MODIFICACIÓN: Solo procesar payment_intent.succeeded para flujos NO anónimos
      // Para flujos anónimos, checkout.session.completed ya procesó todo correctamente
      if (paymentIntent.metadata?.caso_id && !paymentIntent.metadata?.flujo_origen) {
        logStep("Processing payment intent for non-anonymous flow", {
          casoId: paymentIntent.metadata.caso_id
        });
        // Para payment_intent, necesitamos obtener la sesión de checkout para obtener el email del cliente
        try {
          // Obtener el charge para luego obtener la sesión de checkout
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          if (charge && charge.payment_intent) {
            // Obtener la sesión de checkout a partir del payment intent
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntent.id,
              limit: 1
            });
            if (sessions.data.length > 0 && sessions.data[0].customer_details?.email) {
              const session = sessions.data[0];
              // Crear un objeto de sesión simulado para usar con la función existente
              const simulatedSession = {
                metadata: session.metadata || paymentIntent.metadata,
                customer_details: {
                  email: session.customer_details.email
                }
              };
              processingResult = await handleAnonymousPayment(simulatedSession, supabase);
            } else {
              processingResult = {
                success: false,
                message: "Could not retrieve customer email from checkout session"
              };
            }
          } else {
            processingResult = {
              success: false,
              message: "Could not retrieve charge from payment intent"
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logStep("Error retrieving checkout session", {
            message: errorMessage
          });
          processingResult = {
            success: false,
            message: `Error retrieving checkout session: ${errorMessage}`
          };
        }
      } else if (paymentIntent.metadata?.caso_id && paymentIntent.metadata?.flujo_origen) {
        // ✅ MODIFICACIÓN: Para flujos anónimos, solo marcar como procesado sin hacer nada
        logStep("Skipping payment_intent.succeeded for anonymous flow", {
          casoId: paymentIntent.metadata?.caso_id,
          flujoOrigen: paymentIntent.metadata?.flujo_origen
        });
        processingResult = {
          success: true,
          message: "Payment intent skipped for anonymous flow (already processed by checkout.session.completed)"
        };
      } else {
        processingResult = {
          success: false,
          message: "Payment intent is missing caso_id in metadata"
        };
      }
    } else {
      // Aquí puedes añadir el manejo de otros eventos si es necesario
      processingResult = {
        success: true,
        message: `Event type ${event.type} acknowledged but not handled.`
      };
    }
    // Actualizar estado del evento
    await supabase.from("stripe_webhook_events").update({
      processed: processingResult.success,
      processed_at: new Date().toISOString(),
      error_message: processingResult.success ? null : processingResult.message
    }).eq("stripe_event_id", event.id);
    return new Response(JSON.stringify({
      received: true,
      ...processingResult
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", {
      message: errorMessage
    });
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
// --- LÓGICA PARA PAGOS ANÓNIMOS (REFACTORIZADA Y SIMPLIFICADA) ---
// ✅ REFACTORIZACIÓN COMPLETADA:
// - Eliminada lógica compleja de búsqueda en auth.users
// - Unificado método de búsqueda: solo profiles (método probado)
// - Simplificada lógica de manejo de usuarios existentes
// - Eliminadas funciones duplicadas y complejas
// - Mantenida funcionalidad completa con código más limpio
async function handleAnonymousPayment(session, supabase) {
  const casoId = session.metadata?.caso_id;
  const customerEmail = session.customer_details?.email;
  const proposalToken = session.metadata?.proposal_token;
  
  if (!casoId || !customerEmail) {
    return {
      success: false,
      message: "Anonymous payment requires caso_id and customer_email"
    };
  }

  try {
    logStep("Processing anonymous payment", {
      sessionId: maskId(session.id),
      customerEmail: maskEmail(customerEmail),
      casoId: maskId(casoId)
    });

    // ✅ SIMPLIFICADO: Usar solo el método que funciona - búsqueda en profiles
    let foundUser = null;
    try {
      const { data: userData, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('email', customerEmail)
        .single();
      
      if (userCheckError) {
        if (userCheckError.code === 'PGRST116') {
          logStep("User not found in profiles (will create new user)", {
            email: maskEmail(customerEmail)
          });
        } else {
          logStep("Error searching for user in profiles", {
            error: userCheckError.message,
          email: maskEmail(customerEmail)
        });
          // Continuar con la creación de nuevo usuario
        }
      } else {
        foundUser = userData;
        logStep("Found existing user in profiles", {
          userId: maskId(foundUser.id),
          email: maskEmail(customerEmail),
          role: foundUser.role
        });
      }
    } catch (searchError) {
      logStep("Error in user search, proceeding with user creation", {
        error: searchError.message,
          email: maskEmail(customerEmail)
        });
      // Continuar con la creación de nuevo usuario
      }

    if (foundUser) {
      // Usuario existente → vincular caso y notificar
      return await handleExistingUser(supabase, foundUser.id, casoId, session);
    }

    // ✅ SIMPLIFICADO: Crear nuevo usuario usando el método probado
    logStep("Creating new user with Stripe email", {
      email: maskEmail(customerEmail),
      casoId: maskId(casoId)
    });

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        role: 'cliente',
        source: 'stripe_payment',
        caso_id: casoId,
        created_via_payment: true,
        stripe_session_id: session.id
      }
    });

    if (createError) {
      logStep("ERROR: Failed to create new user", {
        error: createError.message,
        email: maskEmail(customerEmail)
      });
      throw new Error(`Failed to create new user: ${createError.message}`);
    }

    logStep("New user created successfully", {
      userId: maskId(newUser.user.id),
      email: maskEmail(customerEmail)
    });

    // ✅ SIMPLIFICADO: Esperar a que el trigger cree el perfil
    logStep("Waiting for profile creation via trigger", {
      delay: '2 seconds'
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ✅ SIMPLIFICADO: Verificar que el perfil se creó correctamente
    const { data: profileCheck, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', newUser.user.id)
      .single();

    if (profileError || !profileCheck) {
      logStep("ERROR: Profile not created by trigger", {
        error: profileError?.message,
        userId: maskId(newUser.user.id)
      });
      throw new Error(`Profile not created by trigger: ${profileError?.message || 'Profile not found'}`);
    }

    logStep("Profile created successfully via trigger", {
      userId: maskId(newUser.user.id),
      profileId: maskId(profileCheck.id)
    });

    // ✅ SIMPLIFICADO: Vincular caso al nuevo usuario
    const { error: linkError } = await supabase.from('casos').update({
      cliente_id: newUser.user.id,
      estado: 'disponible',
      updated_at: new Date().toISOString()
    }).eq('id', casoId);

    // Si hay token de propuesta, vincular también usando el token (idempotente)
    if (proposalToken) {
      try {
        const { error: tokenLinkError } = await supabase.rpc('link_case_by_proposal_token', { 
          p_token: proposalToken 
        });
        if (tokenLinkError) {
          logStep("Warning: Failed to link case by proposal token", {
            error: tokenLinkError.message,
            token: maskId(proposalToken)
          });
        } else {
          logStep("Case linked by proposal token successfully", {
            token: maskId(proposalToken)
          });
        }
      } catch (tokenError) {
        logStep("Warning: Error linking case by proposal token", {
          error: tokenError.message,
          token: maskId(proposalToken)
        });
      }
    }

    if (linkError) {
      logStep("ERROR: Failed to link case to new user", {
        error: linkError.message,
        casoId: maskId(casoId),
        userId: maskId(newUser.user.id)
      });
      throw new Error(`Failed to link case to new user: ${linkError.message}`);
    }

    logStep("Case linked to new user successfully", {
      casoId: maskId(casoId),
      userId: maskId(newUser.user.id),
      newEstado: 'disponible'
    });

    // ✅ SIMPLIFICADO: Registrar el pago
    const paymentAmount = session.amount_total ? session.amount_total / 100 : 37.50;
    const { error: pagoError } = await supabase.from("pagos").insert({
      usuario_id: newUser.user.id,
      caso_id: casoId,
      monto: paymentAmount,
      moneda: session.currency || 'eur',
      estado: 'succeeded',
      descripcion: `Pago para caso ${casoId.toString().slice(0, 8)}`,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      metadata_pago: {
        stripe_session_id: session.id,
        caso_id: casoId,
        plan_id: 'consulta-estrategica',
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      }
    });

    if (pagoError) {
      logStep("Warning: Failed to create payment record", {
        error: pagoError.message
      });
    } else {
      logStep("Payment record created successfully", {
        pagoId: casoId
      });
    }

    // ✅ SIMPLIFICADO: Generar token de activación
    logStep("Generating activation token for new user", {
      casoId: maskId(casoId),
      email: maskEmail(customerEmail)
    });

    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('generate-client-activation-token', {
          body: {
            caso_id: casoId,
            email: customerEmail,
        force_new: true
      }
    });

    if (tokenError || !tokenData?.token) {
      logStep("ERROR: Failed to generate activation token", {
        error: tokenError?.message,
        tokenData
      });
      throw new Error(`Failed to generate activation token: ${tokenError?.message || 'Invalid token response'}`);
    }

    logStep("Activation token generated successfully", {
      token: maskId(tokenData.token),
      expiresAt: tokenData.expires_at
    });

    // ✅ SIMPLIFICADO: Enviar email de bienvenida
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
    const activationUrl = `${siteUrl}/client-activation?token=${tokenData.token}`;
    
    const emailSubject = "¡Bienvenido a Klamai.com - Activa tu cuenta y accede a tu consulta";
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a Klamai.com</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Klamai.com!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu consulta legal está lista, solo necesitas activar tu cuenta</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4A90E2; margin-top: 0;">Tu consulta está esperando</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4A90E2; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="margin: 0 0 10px 0;"><strong>Estado:</strong> Pago procesado exitosamente</p>
            <p style="margin: 0 0 10px 0;"><strong>Consulta:</strong> Consulta legal</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Activar mi cuenta ahora
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Debes activar tu cuenta en las próximas 7 días para acceder a tu consulta.</p>
          </div>

          <h3 style="color: #4A90E2;">Próximos pasos:</h3>
          <ol style="color: #666;">
            <li>Haz clic en "Activar mi cuenta ahora"</li>
            <li>Establece tu contraseña</li>
            <li>Accede a tu consulta legal</li>
            <li>¡Recibe asesoramiento de abogados especialistas!</li>
          </ol>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Si tienes alguna pregunta, no dudes en contactarnos.<br>
            <strong>Equipo Klamai.com</strong>
          </p>
        </div>
      </body>
      </html>
    `;

    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: customerEmail,
        subject: emailSubject,
        html: emailHtml,
        text: `¡Bienvenido a Klamai.com!\n\nGracias por tu confianza. Para acceder a tu consulta y gestionar tu caso, por favor, establece tu contraseña a través del siguiente enlace:\n\n${activationUrl}\n\nUna vez establecida, podrás iniciar sesión con tu email.\n\nEl equipo de Klamai.com`
      }
    });

    if (sendError) {
      logStep("ERROR: Failed to send welcome email", {
        error: sendError.message,
        email: maskEmail(customerEmail)
      });
    } else {
      logStep("Welcome email sent successfully", {
        userId: newUser.user.id,
        email: maskEmail(customerEmail),
        activationUrl: maskId(activationUrl)
      });
    }

    return {
      success: true,
      message: "New user payment processed successfully"
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Anonymous payment processing failed", {
      error: errorMessage,
      casoId: maskId(casoId)
    });
    throw error;
  }
}
// --- LÓGICA PARA PAGOS DE USUARIOS REGISTRADOS ---
async function handleRegisteredUserPayment(session, supabase, stripe) {
  const casoId = session.metadata?.caso_id;
  const userId = session.metadata?.user_id;
  if (!casoId || !userId) {
    return {
      success: false,
      message: "Registered payment requires caso_id and user_id"
    };
  }
  try {
    await linkCaseToUser(supabase, casoId, userId, false);
    // ✅ CORREGIDO: Registrar el pago en la tabla pagos con monto real de Stripe
    const paymentAmount = session.amount_total ? session.amount_total / 100 : 37.50; // Convertir de centavos
    const { error: pagoError } = await supabase.from("pagos").insert({
      usuario_id: userId,
      caso_id: casoId,
      monto: paymentAmount,
      moneda: session.currency || 'eur',
      estado: 'succeeded',
      descripcion: `Pago para caso ${casoId.toString().slice(0, 8)}`,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      metadata_pago: {
        stripe_session_id: session.id,
        caso_id: casoId,
        plan_id: 'consulta-estrategica',
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      }
    });
    if (pagoError) {
      logStep("Warning: Failed to create payment record", {
        error: pagoError.message
      });
    } else {
      logStep("Payment record created successfully", {
        pagoId: casoId
      });
    }
    const { error: notificacionError } = await supabase.from("notificaciones").insert({
      usuario_id: userId,
      mensaje: `Tu pago para el caso #${casoId.toString().slice(0, 8)} ha sido procesado.`,
      url_destino: `/dashboard/casos/${casoId}`,
      caso_id: casoId
    });
    if (notificacionError) logStep("Notification creation failed", {
      error: notificacionError.message
    });
    // ✅ CORREGIDO: Enviar email personalizado para usuarios registrados
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
    // Obtener el email del usuario registrado
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      logStep("Warning: Could not get user email for confirmation email", {
        error: userError?.message,
        userId: maskId(userId)
      });
    } else {
      const userEmail = userData.user.email;
      const emailSubject = "Consulta procesada en Klamai.com - Tu pago ha sido confirmado";
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Consulta procesada - Klamai.com</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Consulta procesada!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu pago ha sido confirmado exitosamente</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #4A90E2; margin-top: 0;">Pago confirmado</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4A90E2; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 0 0 10px 0;"><strong>ID Caso:</strong> ${casoId.toString().slice(0, 8)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Estado:</strong> Pago procesado exitosamente</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/dashboard/casos/${casoId}" 
                 style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Ver mi consulta
              </a>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>✅ Listo:</strong> Tu consulta ha sido procesada y está disponible en tu dashboard.</p>
            </div>

            <h3 style="color: #4A90E2;">Próximos pasos:</h3>
            <ol style="color: #666;">
              <li>Accede a tu dashboard</li>
              <li>Ve a la sección de casos</li>
              <li>Revisa los detalles de tu consulta</li>
              <li>¡Recibe asesoramiento de abogados especialistas!</li>
            </ol>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Gracias por confiar en Klamai.com.<br>
              <strong>Equipo Klamai.com</strong>
            </p>
          </div>
        </body>
        </html>
      `;
      // Enviar email usando la función send-email
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
          text: `Tu pago para el caso #${casoId.toString().slice(0, 8)} ha sido procesado.\n\nPuedes ver los detalles en tu dashboard:\n\n${siteUrl}/dashboard/casos/${casoId}\n\nGracias por confiar en Klamai.com.\n\nEl equipo de Klamai.com`
        }
      });
      if (emailError) {
        logStep("Warning: Failed to send confirmation email", {
          error: emailError.message,
          userId: maskId(userId),
          email: maskEmail(userEmail)
        });
      } else {
        logStep("Confirmation email sent successfully", {
          userId: maskId(userId),
          email: maskEmail(userEmail),
          casoId: maskId(casoId)
        });
      }
    }
    return {
      success: true,
      message: "Registered user payment processed"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in handleRegisteredUserPayment", {
      message: errorMessage
    });
    return {
      success: false,
      message: errorMessage
    };
  }
}
// --- FUNCIÓN AUXILIAR REUTILIZABLE ---
async function linkCaseToUser(supabase, casoId, userId, isNewUser = false) {
  // Para usuarios nuevos, el caso debe quedar en estado "disponible"
  // Para usuarios existentes no confirmados, el caso debe quedar en "pago_realizado_pendiente_registro"
  const estadoFinal = isNewUser ? "disponible" : "pago_realizado_pendiente_registro";
  const { error } = await supabase.from("casos").update({
    cliente_id: userId,
    estado: estadoFinal,
    fecha_pago: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", casoId);
  if (error) {
    throw new Error(`Failed to link case ${casoId} to user ${userId}: ${error.message}`);
  }
  logStep("Case linked to user successfully", {
    casoId: maskId(casoId),
    userId: maskId(userId),
    estado: estadoFinal
  });
}
// --- FUNCIÓN SIMPLIFICADA PARA USUARIOS EXISTENTES ---
async function handleExistingUser(supabase, userId, casoId, session) {
  try {
    logStep("Processing existing user payment", {
      userId: maskId(userId),
      casoId: maskId(casoId)
    });

    // Vincular caso al usuario existente
    const { error: linkError } = await supabase.from('casos').update({
      cliente_id: userId,
      estado: 'disponible',
      updated_at: new Date().toISOString()
    }).eq('id', casoId);

    // Si hay token de propuesta, vincular también usando el token (idempotente)
    if (proposalToken) {
      try {
        const { error: tokenLinkError } = await supabase.rpc('link_case_by_proposal_token', { 
          p_token: proposalToken 
        });
        if (tokenLinkError) {
          logStep("Warning: Failed to link case by proposal token", {
            error: tokenLinkError.message,
            token: maskId(proposalToken)
          });
        } else {
          logStep("Case linked by proposal token successfully", {
            token: maskId(proposalToken)
          });
        }
      } catch (tokenError) {
        logStep("Warning: Error linking case by proposal token", {
          error: tokenError.message,
          token: maskId(proposalToken)
        });
      }
    }

    if (linkError) {
      logStep("ERROR: Failed to link case to existing user", {
        error: linkError.message,
        casoId: maskId(casoId),
        userId: maskId(userId)
      });
      throw new Error(`Failed to link case to existing user: ${linkError.message}`);
    }

    logStep("Case linked to existing user successfully", {
      casoId: maskId(casoId),
      userId: maskId(userId),
      newEstado: 'disponible'
    });

    // Registrar el pago
    const paymentAmount = session.amount_total ? session.amount_total / 100 : 37.50;
    const { error: pagoError } = await supabase.from("pagos").insert({
      usuario_id: userId,
      caso_id: casoId,
      monto: paymentAmount,
      moneda: session.currency || 'eur',
      estado: 'succeeded',
      descripcion: `Pago para caso ${casoId.toString().slice(0, 8)}`,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      metadata_pago: {
        stripe_session_id: session.id,
        caso_id: casoId,
        plan_id: 'consulta-estrategica',
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      }
    });

    if (pagoError) {
      logStep("Warning: Failed to create payment record", {
        error: pagoError.message
      });
    } else {
      logStep("Payment record created successfully", {
        pagoId: casoId
      });
    }

    // Obtener email del usuario para enviar notificación
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      logStep("Warning: Could not get user email for notification", {
        error: userError?.message,
        userId: maskId(userId)
      });
      return {
        success: true,
        message: "Existing user payment processed (email notification skipped)"
      };
    }

    const userEmail = userData.user.email;

    // Enviar email informativo
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
    const emailSubject = "Nueva consulta añadida a tu cuenta de Klamai.com";
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nueva consulta - Klamai.com</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Nueva consulta añadida!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu pago ha sido procesado exitosamente</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #4A90E2; margin-top: 0;">Consulta procesada</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4A90E2; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 0 0 10px 0;"><strong>Estado:</strong> Pago procesado exitosamente</p>
            <p style="margin: 0 0 10px 0;"><strong>Consulta:</strong> Nueva consulta añadida a tu cuenta</p>
            <p style="margin: 0 0 10px 0;"><strong>ID Caso:</strong> ${casoId.toString().slice(0, 8)}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/dashboard" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Ver mi consulta
            </a>
          </div>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;"><strong>✅ Listo:</strong> Tu consulta ha sido procesada y está disponible en tu dashboard.</p>
          </div>

          <h3 style="color: #4A90E2;">Próximos pasos:</h3>
          <ol style="color: #666;">
            <li>Inicia sesión en tu cuenta</li>
            <li>Ve a tu dashboard</li>
            <li>Accede a la nueva consulta</li>
            <li>¡Recibe asesoramiento de abogados especialistas!</li>
          </ol>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Gracias por seguir confiando en nosotros.<br>
            <strong>Equipo Klamai.com</strong>
          </p>
        </div>
      </body>
      </html>
    `;

    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: userEmail,
        subject: emailSubject,
        html: emailHtml,
        text: `Hola,\n\nHemos añadido una nueva consulta a tu cuenta de Klamai.com.\n\nPuedes ver los detalles iniciando sesión y accediendo a tu dashboard:\n\n${siteUrl}/dashboard\n\nGracias por seguir confiando en nosotros.\n\nEl equipo de Klamai.com`
      }
    });

    if (sendError) {
      logStep("ERROR: Failed to send notification email", {
        error: sendError.message,
        userId: maskId(userId),
        email: maskEmail(userEmail)
      });
    } else {
      logStep("Notification email sent successfully", {
        userId: maskId(userId),
        email: maskEmail(userEmail),
        dashboardUrl: `${siteUrl}/dashboard`
      });
    }

    return {
      success: true,
      message: "Existing user payment processed"
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Existing user payment processing failed", {
      error: errorMessage,
      userId: maskId(userId),
      casoId: maskId(casoId)
    });
    throw error;
  }
}
