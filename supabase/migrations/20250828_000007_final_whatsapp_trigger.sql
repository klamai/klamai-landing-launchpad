-- Implementación final del trigger para WhatsApp diferido
-- Usa pg_cron para procesar casos pendientes cada minuto

-- 1. Función que se ejecuta inmediatamente cuando se marca solicitud de presupuesto
CREATE OR REPLACE FUNCTION trigger_whatsapp_presupuesto_immediate()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si se marcó específicamente como solicitud de presupuesto
  IF NEW.solicitud_presupuesto_whatsapp = TRUE AND OLD.solicitud_presupuesto_whatsapp = FALSE THEN
    
    -- Registrar en comunicaciones como "pendiente" para procesamiento diferido
    INSERT INTO comunicaciones (
      canal, tipo, caso_id, destinatario_numero, 
      cuerpo, estado, enviado_at
    ) VALUES (
      'whatsapp',
      'presupuesto_informativo',
      NEW.id,
      COALESCE(NEW.telefono_borrador, ''),
      'Solicitud de presupuesto registrada - WhatsApp pendiente de envío',
      'pendiente',
      NOW()
    );
    
    RAISE NOTICE 'Caso % marcado para WhatsApp diferido', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger (reemplaza cualquier trigger anterior)
DROP TRIGGER IF EXISTS trigger_whatsapp_presupuesto ON casos;
CREATE TRIGGER trigger_whatsapp_presupuesto
  AFTER UPDATE ON casos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_presupuesto_immediate();

-- 3. Función que procesa casos pendientes de WhatsApp (se ejecuta via cron)
CREATE OR REPLACE FUNCTION procesar_whatsapp_presupuesto_pendiente()
RETURNS void AS $$
DECLARE
  caso_record RECORD;
BEGIN
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
    -- Actualizar estado de la comunicación
    UPDATE comunicaciones 
    SET estado = 'enviado', enviado_at = NOW()
    WHERE id = caso_record.comunicacion_id;
    
    -- Marcar como procesado para evitar duplicados
    UPDATE casos 
    SET solicitud_presupuesto_whatsapp = FALSE 
    WHERE id = caso_record.id;
    
    RAISE NOTICE 'Caso % procesado para WhatsApp - ID comunicación: %', caso_record.id, caso_record.comunicacion_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear cron job que se ejecute cada minuto
SELECT cron.schedule(
  'whatsapp-presupuesto-diferido',
  '* * * * *', -- Cada minuto
  'SELECT procesar_whatsapp_presupuesto_pendiente();'
);

-- 5. Comentarios explicativos
COMMENT ON FUNCTION trigger_whatsapp_presupuesto_immediate() IS 
'Trigger que se ejecuta inmediatamente cuando solicitud_presupuesto_whatsapp cambia a TRUE. 
Registra la solicitud en comunicaciones como "pendiente" para procesamiento diferido.';

COMMENT ON FUNCTION procesar_whatsapp_presupuesto_pendiente() IS 
'Función que procesa casos pendientes de WhatsApp cada minuto via cron job. 
Marca casos como procesados después de 3 minutos de delay.';
