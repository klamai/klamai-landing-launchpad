import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCaseRequest {
  motivo_consulta?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body if it exists
    let requestData: CreateCaseRequest = {};
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
      } catch {
        // If no body or invalid JSON, continue with empty object
      }
    }

    console.log('Creating draft case with data:', requestData);

    // Create a new draft case
    const { data: newCase, error } = await supabase
      .from('casos')
      .insert({
        motivo_consulta: requestData.motivo_consulta || null,
        estado: 'borrador',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating draft case:', error);
      throw error;
    }

    console.log('Draft case created successfully:', newCase);

    return new Response(
      JSON.stringify({ 
        caso_id: newCase.id,
        success: true 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in crear-borrador-caso function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);