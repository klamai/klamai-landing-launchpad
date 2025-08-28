-- Habilitar extensión pg_cron para cron jobs
-- Esto es necesario para procesar casos pendientes de WhatsApp cada minuto

CREATE EXTENSION IF NOT EXISTS "pg_cron" SCHEMA "extensions";

-- Comentario explicativo
COMMENT ON EXTENSION "pg_cron" IS 
'Extensión que permite programar tareas SQL para ejecutarse automáticamente. 
Necesaria para procesar casos pendientes de WhatsApp cada minuto.';
