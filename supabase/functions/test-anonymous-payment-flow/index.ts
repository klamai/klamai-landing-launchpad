import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", 
      {
        auth: {
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const casoId = url.searchParams.get("caso_id") || "test-caso-123";
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Testing anonymous payment flow with email: ${email}, caso_id: ${casoId}`);

    const result = await testAnonymousPaymentFlow(supabase, email, casoId);

    return new Response(
      JSON.stringify(result), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error", 
        details: errorMessage 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function testAnonymousPaymentFlow(supabase: any, customerEmail: string, casoId: string) {
  const logStep = (step: string, data?: any) => {
    console.log(`[${step}]`, data || '');
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  };

  const maskId = (id: string) => {
    return `${id.substring(0, 8)}...`;
  };

  try {
    logStep("Starting anonymous payment flow", { 
      email: maskEmail(customerEmail), 
      casoId 
    });

    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      throw new Error(`Error listing users: ${listUsersError.message}`);
    }

    logStep("Users retrieved", { total_users: users.length });
    
    const existingUser = users.find(user => user.email === customerEmail);

    if (!existingUser) {
      logStep("User not found, would create new account", { 
        email: maskEmail(customerEmail),
        total_users_checked: users.length
      });
      
      const simulatedUser = {
        id: "simulated-new-user-id",
        email: customerEmail,
        email_confirmed_at: new Date().toISOString()
      };

      logStep("Would create user", { 
        userId: maskId(simulatedUser.id),
        email_confirmed: simulatedUser.email_confirmed_at ? true : false
      });

      logStep("Would generate recovery link for new user");

      const welcomeEmailText = "Welcome to Klam.ai! Please set your password to access your consultation.";
      
      logStep("Would send welcome email", { 
        to: maskEmail(customerEmail),
        subject: "Welcome to Klam.ai - Access your consultation",
        email_length: welcomeEmailText.length
      });

      return {
        success: true,
        message: "Anonymous payment flow simulation completed - NEW USER",
        flow_type: "new_user",
        user_created: true,
        email_sent: "welcome_email",
        user_details: {
          id: simulatedUser.id,
          email: maskEmail(customerEmail),
          email_confirmed: true
        },
        caso_linked: true,
        total_users_checked: users.length,
        exact_match_found: false
      };

    } else {
      logStep("Existing user found, would link case", { 
        userId: maskId(existingUser.id),
        email_confirmed: existingUser.email_confirmed_at ? true : false
      });

      const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
      const notificationEmailText = `Hello, we have added a new consultation to your Klam.ai account. You can view details by logging in and accessing your dashboard: ${siteUrl}/dashboard`;
      
      logStep("Would send notification email", { 
        to: maskEmail(existingUser.email),
        subject: "New consultation added to your Klam.ai account",
        email_length: notificationEmailText.length
      });

      return {
        success: true,
        message: "Anonymous payment flow simulation completed - EXISTING USER",
        flow_type: "existing_user",
        user_created: false,
        email_sent: "new_consultation_notification",
        user_details: {
          id: existingUser.id,
          email: maskEmail(existingUser.email),
          email_confirmed: existingUser.email_confirmed_at ? true : false,
          email_confirmed_at: existingUser.email_confirmed_at
        },
        caso_linked: true,
        total_users_checked: users.length,
        exact_match_found: true
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in testAnonymousPaymentFlow", { message: errorMessage });
    return {
      success: false,
      message: errorMessage,
      flow_type: "error",
      user_created: false,
      email_sent: null,
      user_details: null,
      caso_linked: false,
      total_users_checked: 0,
      exact_match_found: false
    };
  }
}
