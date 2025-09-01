import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-client-version, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// Utilidades de sanitización para logs
const maskEmail = (email?: string) => {
  if (!email || typeof email !== 'string') return email;
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
};

const maskId = (id?: string) => {
  if (!id || typeof id !== 'string') return id;
  return `${id.slice(0, 6)}...`;
};

const logStep = (step: string, details?: unknown) => {
  try {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[TEST-EMAIL-SEARCH] ${step}${detailsStr}`);
  } catch {
    console.log(`[TEST-EMAIL-SEARCH] ${step}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Función de prueba iniciada");

    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    // Obtener datos del request
    const { test_email } = await req.json();

    if (!test_email) {
      logStep("ERROR - Parámetro test_email faltante");
      throw new Error("Se requiere test_email");
    }

    logStep("Email a probar", { test_email: maskEmail(test_email) });

    // Inicializar Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // ✅ PRUEBA 1: LÓGICA ACTUAL DEL WEBHOOK (PROBLEMÁTICA)
    logStep("=== PRUEBA 1: LÓGICA ACTUAL DEL WEBHOOK (PROBLEMÁTICA) ===");
    
    try {
      logStep("Llamando a supabase.auth.admin.listUsers()");
      const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers();
      
      if (userCheckError) {
        logStep("ERROR en listUsers", { error: userCheckError.message });
        throw userCheckError;
      }

      logStep("listUsers exitoso", { 
        totalUsers: existingUsers.users.length,
        testEmail: maskEmail(test_email)
      });

      // Buscar usuario por email (igual que en el webhook actual)
      const foundUser = existingUsers.users.find(user => 
        user.email?.toLowerCase() === test_email.toLowerCase()
      );

      if (foundUser) {
        logStep("✅ Usuario encontrado con listUsers", { 
          userId: maskId(foundUser.id),
          email: maskEmail(foundUser.email),
          emailConfirmed: foundUser.email_confirmed_at ? 'yes' : 'no',
          createdAt: foundUser.created_at
        });
      } else {
        logStep("❌ Usuario NO encontrado con listUsers", { 
          testEmail: maskEmail(test_email),
          totalUsersChecked: existingUsers.users.length
        });
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 1", { error: error instanceof Error ? error.message : String(error) });
    }

    // ✅ PRUEBA 2: LÓGICA ANTERIOR QUE FUNCIONABA (SOLUCIÓN)
    logStep("=== PRUEBA 2: LÓGICA ANTERIOR QUE FUNCIONABA (SOLUCIÓN) ===");
    
    try {
      logStep("Usando método anterior que funcionaba");
      
      // ✅ MÉTODO CORREGIDO: Obtener usuarios y buscar manualmente
      const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

      if (listUsersError) {
        logStep("ERROR en listUsers (método anterior)", { error: listUsersError.message });
        throw listUsersError;
      }
      
      logStep("listUsers exitoso (método anterior)", { 
        totalUsers: users.length,
        testEmail: maskEmail(test_email)
      });

      // ✅ BÚSQUEDA MANUAL: Encontrar usuario exacto por email
      const existingUser = users.find(user => user.email === test_email);

      if (existingUser) {
        logStep("✅ Usuario encontrado con lógica anterior", { 
          userId: maskId(existingUser.id),
          email: maskEmail(existingUser.email),
          emailConfirmed: existingUser.email_confirmed_at ? 'yes' : 'no',
          createdAt: existingUser.created_at
        });
      } else {
        logStep("❌ Usuario NO encontrado con lógica anterior", { 
          testEmail: maskEmail(test_email),
          totalUsersChecked: users.length
        });
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 2", { error: error instanceof Error ? error.message : String(error) });
    }

    // ✅ PRUEBA 3: NUEVA LÓGICA PROPUESTA (TABLA PROFILES)
    logStep("=== PRUEBA 3: NUEVA LÓGICA PROPUESTA (TABLA PROFILES) ===");
    
    try {
      logStep("Buscando usuario en tabla profiles (nueva lógica)");
      const { data: existingUser, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('email', test_email)
        .single();

      if (userCheckError) {
        if (userCheckError.code === 'PGRST116') {
          logStep("❌ Usuario NO encontrado con nueva lógica", { 
            testEmail: maskEmail(test_email),
            error: 'No rows returned'
          });
        } else {
          logStep("ERROR en nueva lógica", { error: userCheckError.message });
        }
      } else {
        logStep("✅ Usuario encontrado con nueva lógica", { 
          userId: maskId(existingUser.id),
          email: maskEmail(existingUser.email),
          role: existingUser.role,
          createdAt: existingUser.created_at
        });
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 3", { error: error instanceof Error ? error.message : String(error) });
    }

    // ✅ PRUEBA 4: COMPARACIÓN DE LOS TRES MÉTODOS
    logStep("=== PRUEBA 4: COMPARACIÓN DE LOS TRES MÉTODOS ===");
    
    try {
      // Método 1: Lógica actual (problemática)
      const { data: currentUsers, error: currentError } = await supabase.auth.admin.listUsers();
      let currentFound = false;
      let currentUserId = null;
      
      if (!currentError && currentUsers?.users) {
        const foundInCurrent = currentUsers.users.find(user => 
          user.email?.toLowerCase() === test_email.toLowerCase()
        );
        if (foundInCurrent) {
          currentFound = true;
          currentUserId = foundInCurrent.id;
        }
      }

      // Método 2: Lógica anterior (funcional)
      const { data: { users: oldUsers }, error: oldError } = await supabase.auth.admin.listUsers();
      let oldFound = false;
      let oldUserId = null;
      
      if (!oldError && oldUsers) {
        const foundInOld = oldUsers.find(user => user.email === test_email);
        if (foundInOld) {
          oldFound = true;
          oldUserId = foundInOld.id;
        }
      }

      // Método 3: Tabla profiles
      const { data: profilesResult, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', test_email)
        .single();
      
      let profilesFound = false;
      let profilesUserId = null;
      
      if (!profilesError && profilesResult) {
        profilesFound = true;
        profilesUserId = profilesResult.id;
      }

      // Comparar resultados
      logStep("Comparación de los tres métodos", {
        testEmail: maskEmail(test_email),
        metodoActual: {
          encontrado: currentFound,
          userId: currentUserId ? maskId(currentUserId) : null
        },
        metodoAnterior: {
          encontrado: oldFound,
          userId: oldUserId ? maskId(oldUserId) : null
        },
        metodoProfiles: {
          encontrado: profilesFound,
          userId: profilesUserId ? maskId(profilesUserId) : null
        }
      });

      // Análisis de discrepancias
      if (currentFound !== oldFound) {
        logStep("⚠️ DISCREPANCIA: Método actual vs Método anterior", {
          actual: currentFound,
          anterior: oldFound,
          recomendacion: "El método anterior es más confiable"
        });
      }

      if (oldFound !== profilesFound) {
        logStep("⚠️ DISCREPANCIA: Método anterior vs Tabla profiles", {
          anterior: oldFound,
          profiles: profilesFound,
          recomendacion: "Verificar sincronización entre auth.users y profiles"
        });
      }

      // Recomendación final
      if (oldFound && !currentFound) {
        logStep("🎯 RECOMENDACIÓN FINAL", {
          problema: "Método actual no encuentra usuarios que SÍ existen",
          solucion: "Usar método anterior (users.find(user => user.email === customerEmail))",
          razon: "Más directo y confiable"
        });
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 4", { error: error instanceof Error ? error.message : String(error) });
    }

    // ✅ PRUEBA 5: SIMULACIÓN DEL FLUJO COMPLETO CON MÉTODO ANTERIOR
    logStep("=== PRUEBA 5: SIMULACIÓN DEL FLUJO COMPLETO CON MÉTODO ANTERIOR ===");
    
    try {
      logStep("Simulando flujo del webhook con método anterior (funcional)");
      
      // Simular la lógica que funcionaba en el webhook anterior
      const customerEmail = test_email;
      
      // ✅ MÉTODO ANTERIOR: Obtener usuarios y buscar manualmente
      const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

      if (listUsersError) {
        logStep("❌ FLUJO: Error al listar usuarios", { 
          error: listUsersError.message,
          email: maskEmail(customerEmail)
        });
      } else {
        // ✅ BÚSQUEDA MANUAL: Encontrar usuario exacto por email
        const existingUser = users.find(user => user.email === customerEmail);

        if (existingUser) {
          logStep("✅ FLUJO: Usuario existe, se debe vincular caso", { 
            userId: maskId(existingUser.id),
            email: maskEmail(existingUser.email),
            emailConfirmed: existingUser.email_confirmed_at ? 'yes' : 'no',
            accion: "Vincular caso a usuario existente"
          });
        } else {
          logStep("✅ FLUJO: Usuario NO existe, se debe crear nuevo", { 
            email: maskEmail(customerEmail),
            accion: "Crear nuevo usuario"
          });
        }
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 5", { error: error instanceof Error ? error.message : String(error) });
    }

    // ✅ PRUEBA 6: VERIFICACIÓN DE PERMISOS
    logStep("=== PRUEBA 6: VERIFICACIÓN DE PERMISOS ===");
    
    try {
      logStep("Verificando permisos del service role");
      
      // Intentar obtener información básica del sistema
      const { data: systemInfo, error: systemError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (systemError) {
        logStep("ERROR en verificación de permisos", { error: systemError.message });
      } else {
        logStep("✅ Permisos verificados correctamente", { 
          puedeAcceder: true,
          totalProfiles: systemInfo.length
        });
      }

    } catch (error) {
      logStep("ERROR en PRUEBA 6", { error: error instanceof Error ? error.message : String(error) });
    }

    logStep("=== RESUMEN DE PRUEBAS ===");
    logStep("Función de prueba completada exitosamente");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Pruebas completadas",
      test_email: maskEmail(test_email),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en función de prueba", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
