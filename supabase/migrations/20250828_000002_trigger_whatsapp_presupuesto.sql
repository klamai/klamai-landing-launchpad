-- Trigger para enviar WhatsApp automáticamente cuando se marca caso como listo para propuesta
-- Esto evita timeouts en Edge Functions y es más robusto

-- 1. Función que se ejecuta después de un delay
CREATE OR REPLACE FUNCTION trigger_whatsapp_presupuesto_delayed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el estado cambió a 'listo_para_propuesta'
  IF NEW.estado = 'listo_para_propuesta' AND OLD.estado != 'listo_para_propuesta' THEN
    
    -- Usar pg_sleep para el delay (en una transacción separada para no bloquear)
    -- Nota: pg_sleep es en segundos, no en milisegundos
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

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS trigger_whatsapp_presupuesto ON casos;
CREATE TRIGGER trigger_whatsapp_presupuesto
  AFTER UPDATE ON casos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_presupuesto_delayed();

-- 3. Comentario explicativo
COMMENT ON FUNCTION trigger_whatsapp_presupuesto_delayed() IS 
'Trigger que envía WhatsApp automáticamente 3 minutos después de marcar caso como listo para propuesta. 
Usa pg_sleep para el delay y llama a la Edge Function sin delay para evitar timeouts.';
