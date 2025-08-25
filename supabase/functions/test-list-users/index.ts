import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false }
    });

    // Obtener el email de los parámetros de consulta
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Testing listUsers with email: ${email}`);

    // Probar la función listUsers con el parámetro email
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    });

    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
      return new Response(
        JSON.stringify({
          error: "Error listing users",
          details: listUsersError.message,
          email_tested: email
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Probar también con el método antiguo para comparar
    const { data: { users: usersOldMethod }, error: listUsersOldError } = await supabase.auth.admin.listUsers({
      email: email,
    });

    // Buscar el email exacto en la lista de usuarios devueltos
    const exactUser = users.find(user => user.email === email);
    const exactUserOldMethod = usersOldMethod.find(user => user.email === email);

    const result = {
      email_tested: email,
      exact_match_found: {
        new_method: exactUser ? true : false,
        old_method: exactUserOldMethod ? true : false
      },
      exact_user: {
        new_method: exactUser ? { id: exactUser.id, email: exactUser.email, email_confirmed_at: exactUser.email_confirmed_at } : null,
        old_method: exactUserOldMethod ? { id: exactUserOldMethod.id, email: exactUserOldMethod.email, email_confirmed_at: exactUserOldMethod.email_confirmed_at } : null
      },
      new_method: {
        users_found: users.length,
        users: users.map(u => ({ id: u.id, email: u.email, email_confirmed_at: u.email_confirmed_at }))
      },
      old_method: {
        users_found: usersOldMethod.length,
        users: usersOldMethod.map(u => ({ id: u.id, email: u.email, email_confirmed_at: u.email_confirmed_at })),
        error: listUsersOldError ? listUsersOldError.message : null
      }
    };

    console.log("Test result:", JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result), 
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});