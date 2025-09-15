import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

const logStep = (step: string, details?: unknown) => {
  try {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[TEST-PAYMENT-FLOW-FIX] ${step}${detailsStr}`);
  } catch {
    console.log(`[TEST-PAYMENT-FLOW-FIX] ${step}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando prueba del flujo de pago corregido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { test_scenario = "general_check" } = await req.json().catch(() => ({}));
    
    logStep("Escenario de prueba", { scenario: test_scenario });

    let testResults = {
      scenario: test_scenario,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total_tests: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };

    // Test 1: Verificar eventos de webhook no procesados
    logStep("Test 1: Verificando eventos de webhook no procesados");
    try {
      const { data: unprocessedEvents, error: eventsError } = await supabase
        .from("stripe_webhook_events")
        .select("id, stripe_event_id, event_type, processed, error_message, created_at")
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(10);

      const testResult = {
        name: "Eventos no procesados",
        status: eventsError ? "failed" : "passed",
        data: {
          count: unprocessedEvents?.length || 0,
          events: unprocessedEvents || []
        },
        error: eventsError?.message,
        recommendations: []
      };

      if (unprocessedEvents && unprocessedEvents.length > 0) {
        testResult.recommendations.push("Hay eventos de webhook sin procesar. Revisar logs de errores.");
      }

      testResults.tests.push(testResult);
      testResults.summary.total_tests++;
      if (testResult.status === "passed") testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.summary.errors.push(`Test 1 error: ${error.message}`);
    }

    // Test 2: Verificar casos en estado esperando_pago
    logStep("Test 2: Verificando casos en estado esperando_pago");
    try {
      const { data: waitingCases, error: casesError } = await supabase
        .from("casos")
        .select("id, estado, cliente_id, email_borrador, stripe_session_id, created_at")
        .eq("estado", "esperando_pago")
        .order("created_at", { ascending: false })
        .limit(10);

      const testResult = {
        name: "Casos esperando pago",
        status: casesError ? "failed" : "passed",
        data: {
          count: waitingCases?.length || 0,
          cases: waitingCases || []
        },
        error: casesError?.message,
        recommendations: []
      };

      if (waitingCases && waitingCases.length > 0) {
        testResult.recommendations.push("Hay casos en estado 'esperando_pago'. Verificar si los pagos se completaron.");
      }

      testResults.tests.push(testResult);
      testResults.summary.total_tests++;
      if (testResult.status === "passed") testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.summary.errors.push(`Test 2 error: ${error.message}`);
    }

    // Test 3: Verificar pagos recientes sin usuario vinculado
    logStep("Test 3: Verificando pagos sin usuario vinculado");
    try {
      const { data: orphanPayments, error: paymentsError } = await supabase
        .from("pagos")
        .select("id, usuario_id, caso_id, monto, estado, stripe_session_id, created_at")
        .is("usuario_id", null)
        .order("created_at", { ascending: false })
        .limit(10);

      const testResult = {
        name: "Pagos sin usuario vinculado",
        status: paymentsError ? "failed" : "passed",
        data: {
          count: orphanPayments?.length || 0,
          payments: orphanPayments || []
        },
        error: paymentsError?.message,
        recommendations: []
      };

      if (orphanPayments && orphanPayments.length > 0) {
        testResult.recommendations.push("Hay pagos sin usuario vinculado. Esto indica problemas en el flujo de pago.");
      }

      testResults.tests.push(testResult);
      testResults.summary.total_tests++;
      if (testResult.status === "passed") testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.summary.errors.push(`Test 3 error: ${error.message}`);
    }

    // Test 4: Verificar usuarios recientes creados por pago
    logStep("Test 4: Verificando usuarios creados por pago");
    try {
      const { data: recentUsers, error: usersError } = await supabase.auth.admin.listUsers();
      
      const paymentUsers = recentUsers?.users?.filter(user => 
        user.user_metadata?.source === 'stripe_payment'
      ).slice(0, 10) || [];

      const testResult = {
        name: "Usuarios creados por pago",
        status: usersError ? "failed" : "passed",
        data: {
          count: paymentUsers.length,
          users: paymentUsers.map(user => ({
            id: user.id,
            email: user.email,
            email_confirmed: !!user.email_confirmed_at,
            created_at: user.created_at,
            source: user.user_metadata?.source
          }))
        },
        error: usersError?.message,
        recommendations: []
      };

      testResults.tests.push(testResult);
      testResults.summary.total_tests++;
      if (testResult.status === "passed") testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.summary.errors.push(`Test 4 error: ${error.message}`);
    }

    // Test 5: Verificar coherencia entre pagos y casos
    logStep("Test 5: Verificando coherencia entre pagos y casos");
    try {
      const { data: recentPayments, error: paymentsError } = await supabase
        .from("pagos")
        .select(`
          id, 
          usuario_id, 
          caso_id, 
          estado,
          casos!inner(id, estado, cliente_id)
        `)
        .eq("estado", "succeeded")
        .order("created_at", { ascending: false })
        .limit(10);

      let inconsistencies = 0;
      const inconsistentPayments = [];

      if (recentPayments) {
        for (const payment of recentPayments) {
          if (payment.usuario_id !== payment.casos.cliente_id) {
            inconsistencies++;
            inconsistentPayments.push({
              payment_id: payment.id,
              payment_user_id: payment.usuario_id,
              case_client_id: payment.casos.cliente_id,
              case_id: payment.caso_id
            });
          }
        }
      }

      const testResult = {
        name: "Coherencia pagos-casos",
        status: paymentsError ? "failed" : (inconsistencies > 0 ? "warning" : "passed"),
        data: {
          total_checked: recentPayments?.length || 0,
          inconsistencies: inconsistencies,
          inconsistent_payments: inconsistentPayments
        },
        error: paymentsError?.message,
        recommendations: []
      };

      if (inconsistencies > 0) {
        testResult.recommendations.push(`Se encontraron ${inconsistencies} inconsistencias entre pagos y casos.`);
      }

      testResults.tests.push(testResult);
      testResults.summary.total_tests++;
      if (testResult.status === "passed") testResults.summary.passed++;
      else testResults.summary.failed++;
    } catch (error) {
      testResults.summary.errors.push(`Test 5 error: ${error.message}`);
    }

    // Generar resumen final
    testResults.summary.success_rate = testResults.summary.total_tests > 0 
      ? (testResults.summary.passed / testResults.summary.total_tests * 100).toFixed(2) + '%'
      : '0%';

    logStep("Pruebas completadas", { 
      total: testResults.summary.total_tests,
      passed: testResults.summary.passed,
      failed: testResults.summary.failed,
      success_rate: testResults.summary.success_rate
    });

    return new Response(JSON.stringify(testResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en test-payment-flow-fix", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});