-- Implementar WhatsApp diferido usando cron jobs de Supabase
-- Esto es más robusto que triggers y no requiere extensiones externas

-- 1. Crear función que procese casos pendientes de WhatsApp
CREATE OR REPLACE FUNCTION procesar_whatsapp_presupuesto_pendiente()
RETURNS void AS $$
DECLARE
  caso_record RECORD;
  resultado JSONB;
BEGIN
  -- Buscar casos que necesitan WhatsApp y no han sido procesados
  FOR caso_record IN 
    SELECT 
      c.id,
      c.telefono_borrador,
      c.solicitud_presupuesto_whatsapp,
      c.estado
    FROM casos c
    WHERE c.solicitud_presupuesto_whatsapp = TRUE
      AND c.estado = 'listo_para_propuesta'
      AND NOT EXISTS (
        SELECT 1 FROM comunicaciones com 
        WHERE com.caso_id = c.id 
          AND com.tipo = 'presupuesto_informativo'
          AND com.canal = 'whatsapp'
      )
      AND c.created_at <= NOW() - INTERVAL '3 minutes' -- Solo casos de hace 3+ minutos
  LOOP
    -- Marcar como procesado para evitar duplicados
    UPDATE casos 
    SET solicitud_presupuesto_whatsapp = FALSE 
    WHERE id = caso_record.id;
    
    -- Aquí se podría llamar a la Edge Function
    -- Por ahora solo registramos en comunicaciones
    INSERT INTO comunicaciones (
      canal, tipo, caso_id, destinatario_numero, 
      cuerpo, estado, enviado_at
    ) VALUES (
      'whatsapp',
      'presupuesto_informativo',
      caso_record.id,
      caso_record.telefono_borrador,
      'WhatsApp programado para envío diferido',
      'pendiente',
      NOW()
    );
    
    RAISE NOTICE 'Caso % marcado para WhatsApp diferido', caso_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear cron job que se ejecute cada minuto
SELECT cron.schedule(
  'whatsapp-presupuesto-diferido',
  '* * * * *', -- Cada minuto
  'SELECT procesar_whatsapp_presupuesto_pendiente();'
);

-- 3. Comentarios explicativos
COMMENT ON FUNCTION procesar_whatsapp_presupuesto_pendiente() IS 
'Función que procesa casos pendientes de WhatsApp cada minuto via cron job. 
Marca casos como procesados y los registra en comunicaciones para envío posterior.';

COMMENT ON TABLE comunicaciones IS 
'Tabla que registra todas las comunicaciones (WhatsApp, email, etc.) para tracking y evitar duplicados.';
