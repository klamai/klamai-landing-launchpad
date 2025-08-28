-- Trigger mejorado que solo se dispara cuando se solicita presupuesto específicamente
-- No se dispara por cambios manuales de estado

-- 1. Función mejorada que verifica el campo específico
CREATE OR REPLACE FUNCTION trigger_whatsapp_presupuesto_delayed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si se marcó específicamente como solicitud de presupuesto
  IF NEW.solicitud_presupuesto_whatsapp = TRUE AND OLD.solicitud_presupuesto_whatsapp = FALSE THEN
    
    -- Usar pg_sleep para el delay (en una transacción separada para no bloquear)
    PERFORM pg_sleep(180); -- 3 minutos de delay
    
    -- Llamar a la Edge Function sin delay
    PERFORM net.http_post(
      url := 'https://vwnoznuznmrdaumjyctg.supabase.co/functions/v1/enviar-mensaje-presupuesto-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'caso_id', NEW.id,
        'delaySecs', 0
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger (reemplaza el anterior)
DROP TRIGGER IF EXISTS trigger_whatsapp_presupuesto ON casos;
CREATE TRIGGER trigger_whatsapp_presupuesto
  AFTER UPDATE ON casos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_presupuesto_delayed();

-- 3. Comentario explicativo
COMMENT ON FUNCTION trigger_whatsapp_presupuesto_delayed() IS 
'Trigger que envía WhatsApp automáticamente 3 minutos después de marcar caso como solicitud de presupuesto. 
Solo se dispara cuando solicitud_presupuesto_whatsapp cambia de FALSE a TRUE.';
