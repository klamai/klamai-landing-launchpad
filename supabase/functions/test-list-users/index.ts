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

    // Obtener el email de los parámetros de consulta
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Testing user lookup methods with email: ${email}`);

    // ✅ MÉTODO 1: listUsers con filter.email (actual - problemático)
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });

    if (listUsersError) {
      console.error("Error listing users with filter:", listUsersError);
      return new Response(
        JSON.stringify({
          error: "Error listing users with filter",
          details: listUsersError.message,
          email_tested: email
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // ✅ MÉTODO 2: listUsers con email directo (método antiguo)
    const { data: { users: usersOldMethod }, error: listUsersOldError } = await supabase.auth.admin.listUsers({
      email: email
    });

    // ✅ MÉTODO 3: listUsers sin filtro y búsqueda manual
    const { data: { users: allUsers }, error: allUsersError } = await supabase.auth.admin.listUsers();

    // ✅ MÉTODO 4: Probar diferentes formatos de filtro
    const { data: { users: usersFilter2 }, error: filter2Error } = await supabase.auth.admin.listUsers({
      filter: {
        email: {
          eq: email
        }
      }
    });

    // ✅ MÉTODO 5: Probar con contains
    const { data: { users: usersContains }, error: containsError } = await supabase.auth.admin.listUsers({
      filter: {
        email: {
          contains: email.split('@')[0] // Solo la parte antes del @
        }
      }
    });

    // Buscar el email exacto en la lista de usuarios devueltos
    const exactUser = users.find((user) => user.email === email);
    const exactUserOldMethod = usersOldMethod.find((user) => user.email === email);
    const exactUserAll = allUsers.find((user) => user.email === email);
    const exactUserFilter2 = usersFilter2.find((user) => user.email === email);
    const exactUserContains = usersContains.find((user) => user.email === email);

    const result = {
      email_tested: email,
      exact_match_found: {
        filter_method: exactUser ? true : false,
        old_method: exactUserOldMethod ? true : false,
        all_users_search: exactUserAll ? true : false,
        filter_eq_method: exactUserFilter2 ? true : false,
        filter_contains_method: exactUserContains ? true : false
      },
      exact_user: {
        filter_method: exactUser ? {
          id: exactUser.id,
          email: exactUser.email,
          email_confirmed_at: exactUser.email_confirmed_at
        } : null,
        old_method: exactUserOldMethod ? {
          id: exactUserOldMethod.id,
          email: exactUserOldMethod.email,
          email_confirmed_at: exactUserOldMethod.email_confirmed_at
        } : null,
        all_users_search: exactUserAll ? {
          id: exactUserAll.id,
          email: exactUserAll.email,
          email_confirmed_at: exactUserAll.email_confirmed_at
        } : null,
        filter_eq_method: exactUserFilter2 ? {
          id: exactUserFilter2.id,
          email: exactUserFilter2.email,
          email_confirmed_at: exactUserFilter2.email_confirmed_at
        } : null,
        filter_contains_method: exactUserContains ? {
          id: exactUserContains.id,
          email: exactUserContains.email,
          email_confirmed_at: exactUserContains.email_confirmed_at
        } : null
      },
      filter_method: {
        users_found: users.length,
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at
        }))
      },
      old_method: {
        users_found: usersOldMethod.length,
        users: usersOldMethod.map((u) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at
        })),
        error: listUsersOldError ? listUsersOldError.message : null
      },
      all_users_search: {
        users_found: allUsers.length,
        exact_user_found: exactUserAll ? true : false,
        error: allUsersError ? allUsersError.message : null
      },
      filter_eq_method: {
        users_found: usersFilter2.length,
        users: usersFilter2.map((u) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at
        })),
        error: filter2Error ? filter2Error.message : null
      },
      filter_contains_method: {
        users_found: usersContains.length,
        users: usersContains.map((u) => ({
          id: u.id,
          email: u.email,
          email_confirmed_at: u.email_confirmed_at
        })),
        error: containsError ? containsError.message : null
      },
      recommendation: {
        filter_method_working: users.length > 0 && users.length < 50,
        old_method_working: usersOldMethod.length > 0 && usersOldMethod.length < 50,
        all_users_search_working: exactUserAll ? true : false,
        filter_eq_method_working: usersFilter2.length > 0 && usersFilter2.length < 50,
        filter_contains_method_working: usersContains.length > 0 && usersContains.length < 50,
        best_method: exactUserAll ? "all_users_search" : "filter_method_if_working"
      }
    };

    console.log("Test result:", JSON.stringify(result, null, 2));

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