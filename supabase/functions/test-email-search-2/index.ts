// Edge Function: test-email-search-2
// Searches for a profile by email in the public.profiles table.
// If user not found, creates a new user in auth.users system.
// Expects a JSON payload: { "email": "user@example.com" }
// Returns the matching profile or creates a new one.

import { createClient } from "npm:@supabase/supabase-js@2.39.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceKey);

// Función para generar contraseña temporal aleatoria
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

console.info("test-email-search-2 function started");

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({
        error: "Invalid or missing email"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, apellido, email, role, created_at")
      .eq("email", email)
      .single();

    if (error) {
      // If no rows found, create the user in auth.users; otherwise return 500
      if (error.code === "PGRST116") {
        try {
          console.log(`Creating new user with email: ${email}`);
          
          // Crear nuevo usuario en auth.users usando la API de administración
          const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
            email: email,
            password: generateRandomPassword(), // Contraseña temporal
            email_confirm: true, // Confirmar email automáticamente
            user_metadata: {
              nombre: "",
              apellido: "",
              role: "cliente"
            }
          });

          if (createAuthError) {
            console.error("Error creating auth user:", createAuthError);
            return new Response(JSON.stringify({
              error: "Error al crear el usuario en el sistema de autenticación",
              details: createAuthError.message
            }), {
              status: 500,
              headers: {
                "Content-Type": "application/json"
              }
            });
          }

          console.log(`Auth user created successfully: ${newAuthUser.user.id}`);
          
          // Ahora buscar el perfil que se creó automáticamente por el trigger
          const { data: newProfile, error: profileError } = await supabase
            .from("profiles")
            .select("id, nombre, apellido, email, role, created_at")
            .eq("id", newAuthUser.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching created profile:", profileError);
            return new Response(JSON.stringify({
              error: "Usuario creado en auth pero error al obtener perfil",
              details: profileError.message
            }), {
              status: 500,
              headers: {
                "Content-Type": "application/json"
              }
            });
          }

          return new Response(JSON.stringify({
            message: "Usuario creado exitosamente en el sistema",
            user: newProfile,
            was_created: true,
            auth_user_id: newAuthUser.user.id
          }), {
            status: 201, // Created
            headers: {
              "Content-Type": "application/json"
            }
          });

        } catch (createException) {
          console.error("Exception while creating auth user:", createException);
          return new Response(JSON.stringify({
            error: "Error inesperado al crear el usuario",
            details: createException.message || String(createException)
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          });
        }
      } else {
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      error: e.message || "Unexpected error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
