-- Añadir campo específico para solicitudes de presupuesto del usuario
-- Esto permite distinguir entre casos marcados manualmente y solicitudes reales de presupuesto

-- 1. Añadir el campo
ALTER TABLE casos 
ADD COLUMN IF NOT EXISTS solicitud_presupuesto_whatsapp BOOLEAN DEFAULT FALSE;

-- 2. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_casos_solicitud_presupuesto 
ON casos(solicitud_presupuesto_whatsapp) 
WHERE solicitud_presupuesto_whatsapp = TRUE;

-- 3. Comentario explicativo
COMMENT ON COLUMN casos.solicitud_presupuesto_whatsapp IS 
'Flag que indica si el usuario solicitó presupuesto desde el frontend. 
Solo cuando este campo es TRUE se debe enviar el WhatsApp informativo.';
