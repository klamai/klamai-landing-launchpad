import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Obtener todos los posibles datos del cuerpo de la solicitud
    const body = await req.json();
    const { caso_id } = body;

    if (!caso_id) {
      throw new Error("El ID del caso es requerido.");
    }
    
    // 2. Crear el cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Crear el objeto con los datos a actualizar dinámicamente
    // Solo incluimos los campos que vienen en el payload, los demás no se tocarán
    const datosParaActualizar: { [key: string]: any } = {
        nombre_borrador: body.nombre_borrador,
        apellido_borrador: body.apellido_borrador,
        email_borrador: body.email_borrador,
        telefono_borrador: body.telefono_borrador,
        tipo_perfil_borrador: body.tipo_perfil_borrador,
        ciudad_borrador: body.ciudad_borrador,
        preferencia_horaria_contacto: body.preferencia_horaria_contacto,
        // Campos específicos de empresa (serán 'undefined' si no vienen y no se actualizarán)
        razon_social_borrador: body.razon_social_borrador,
        nif_cif_borrador: body.nif_cif_borrador,
        direccion_fiscal_borrador: body.direccion_fiscal_borrador,
        nombre_gerente_borrador: body.nombre_gerente_borrador,
    };
    
    // Opcional: Limpiar claves 'undefined' para una consulta más limpia
    Object.keys(datosParaActualizar).forEach(key => datosParaActualizar[key] === undefined && delete datosParaActualizar[key]);

    // 4. Ejecutar la actualización en la base de datos
    const { error } = await supabaseClient
      .from("casos")
      .update(datosParaActualizar)
      .eq("id", caso_id);

    if (error) {
      console.error("Error al actualizar el caso:", error.message);
      throw error;
    }

    console.log(`Datos de contacto (incluyendo empresa si aplica) actualizados para el caso: ${caso_id}`);

    // 5. Devolver una respuesta exitosa a Typebot
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});