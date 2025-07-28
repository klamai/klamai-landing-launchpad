import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-CLIENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep("Función iniciada");

    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR - Variables de entorno faltantes");
      throw new Error("Variables de entorno requeridas no configuradas");
    }

    logStep("Variables de entorno verificadas");

    // Create Supabase client with service role
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      logStep("ERROR - No se encontró header de autorización");
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      logStep("ERROR - Error autenticando usuario", { error: authError?.message });
      throw new Error('Invalid token')
    }

    logStep("Usuario autenticado", { userId: user.id, email: user.email });

    // Verify user is super admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
      logStep("ERROR - Usuario no es super admin", { role: profile?.role, tipo: profile?.tipo_abogado });
      throw new Error('Unauthorized: Only super admins can access this endpoint')
    }

    logStep("Usuario verificado como super admin");

    // Get all clients with their basic information
    const { data: clients, error: clientsError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        nombre,
        apellido,
        email,
        created_at,
        telefono,
        ciudad,
        tipo_perfil,
        razon_social,
        nif_cif
      `)
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })

    if (clientsError) {
      logStep("ERROR - Error obteniendo clientes", { error: clientsError.message });
      throw new Error('Error fetching clients: ' + clientsError.message)
    }

    logStep("Clientes obtenidos", { count: clients?.length || 0 });

    // Get payment information for all clients
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('pagos')
      .select('id, usuario_id, monto, estado, created_at, descripcion')
      .order('created_at', { ascending: false })

    if (paymentsError) {
      logStep("ERROR - Error obteniendo pagos", { error: paymentsError.message });
      throw new Error('Error fetching payments: ' + paymentsError.message)
    }

    logStep("Pagos obtenidos", { count: payments?.length || 0 });

    // Group payments by client
    const paymentsByClient = payments?.reduce((acc, payment) => {
      if (!acc[payment.usuario_id]) {
        acc[payment.usuario_id] = []
      }
      acc[payment.usuario_id].push(payment)
      return acc
    }, {} as Record<string, any[]>) || {}

    // Combine clients with their payments
    const clientsWithPayments = clients?.map(client => ({
      ...client,
      pagos: paymentsByClient[client.id] || [],
      total_pagos: paymentsByClient[client.id]?.length || 0,
      total_monto: paymentsByClient[client.id]?.reduce((sum, p) => sum + p.monto, 0) || 0
    })) || []

    logStep("Datos combinados exitosamente", { finalCount: clientsWithPayments.length });

    return new Response(
      JSON.stringify({
        success: true,
        data: clientsWithPayments,
        count: clientsWithPayments.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR en get-clients", { message: errorMessage });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 