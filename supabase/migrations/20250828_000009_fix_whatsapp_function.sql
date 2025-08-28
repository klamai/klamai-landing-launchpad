-- Arreglar la función para que realmente envíe WhatsApp
-- La función actual solo actualiza la base de datos pero no envía el mensaje

-- 1. Primero habilitar la extensión http si no está disponible
CREATE EXTENSION IF NOT EXISTS "http" SCHEMA "extensions";

-- 2. Función que procesa casos pendientes de WhatsApp y ENVÍA el mensaje real
CREATE OR REPLACE FUNCTION procesar_whatsapp_presupuesto_pendiente()
RETURNS void AS $$
DECLARE
  caso_record RECORD;
  response_status INTEGER;
  response_body TEXT;
  whatsapp_url TEXT;
  whatsapp_body JSONB;
BEGIN
  -- Obtener la URL de la Edge Function desde variables de entorno
  whatsapp_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/enviar-mensaje-presupuesto-whatsapp';
  
  -- Si no hay URL configurada, usar una por defecto
  IF whatsapp_url IS NULL OR whatsapp_url = '' THEN
    whatsapp_url := 'https://vwnoznuznmrdaumjyctg.supabase.co/functions/v1/enviar-mensaje-presupuesto-whatsapp';
  END IF;
  
  -- Buscar casos que necesitan WhatsApp y no han sido procesados
  FOR caso_record IN 
    SELECT 
      c.id,
      c.telefono_borrador,
      com.id as comunicacion_id
    FROM casos c
    INNER JOIN comunicaciones com ON com.caso_id = c.id
    WHERE c.solicitud_presupuesto_whatsapp = TRUE
      AND c.estado = 'listo_para_propuesta'
      AND com.tipo = 'presupuesto_informativo'
      AND com.canal = 'whatsapp'
      AND com.estado = 'pendiente'
      AND com.enviado_at <= NOW() - INTERVAL '3 minutes' -- Solo casos de hace 3+ minutos
  LOOP
    BEGIN
      -- Preparar el body para la Edge Function
      whatsapp_body := jsonb_build_object(
        'caso_id', caso_record.id,
        'delaySecs', 0,
        'phone_override', caso_record.telefono_borrador
      );
      
      -- Llamar a la Edge Function para enviar WhatsApp
      SELECT 
        status,
        content::text
      INTO 
        response_status,
        response_body
      FROM extensions.http((
        'POST',
        whatsapp_url,
        ARRAY[
          extensions.http_header('Content-Type', 'application/json'),
          extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true))
        ],
        'application/json',
        whatsapp_body::text
      ));
      
      -- Verificar si la llamada fue exitosa
      IF response_status = 200 THEN
        -- WhatsApp enviado exitosamente
        UPDATE comunicaciones 
        SET 
          estado = 'enviado', 
          enviado_at = NOW(),
          cuerpo = 'WhatsApp enviado exitosamente - Status: ' || response_status
        WHERE id = caso_record.comunicacion_id;
        
        -- Marcar como procesado para evitar duplicados
        UPDATE casos 
        SET solicitud_presupuesto_whatsapp = FALSE 
        WHERE id = caso_record.id;
        
        RAISE NOTICE 'WhatsApp enviado exitosamente para caso % - Status: %', caso_record.id, response_status;
      ELSE
        -- Error al enviar WhatsApp
        UPDATE comunicaciones 
        SET 
          estado = 'fallo', 
          error = 'Error HTTP ' || response_status || ': ' || COALESCE(response_body, 'Sin respuesta')
        WHERE id = caso_record.comunicacion_id;
        
        RAISE WARNING 'Error enviando WhatsApp para caso % - Status: %, Error: %', 
          caso_record.id, response_status, response_body;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Error en la función
      UPDATE comunicaciones 
      SET 
        estado = 'fallo', 
        error = 'Error en función: ' || SQLERRM
      WHERE id = caso_record.comunicacion_id;
      
      RAISE WARNING 'Excepción enviando WhatsApp para caso %: %', caso_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Comentarios explicativos
COMMENT ON FUNCTION procesar_whatsapp_presupuesto_pendiente() IS 
'Función que procesa casos pendientes de WhatsApp cada minuto via cron job. 
Ahora realmente ENVÍA el WhatsApp llamando a la Edge Function.';

-- 4. Verificar que la extensión http esté disponible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    RAISE WARNING 'La extensión "http" no está disponible. El WhatsApp no se enviará.';
  END IF;
END $$;
