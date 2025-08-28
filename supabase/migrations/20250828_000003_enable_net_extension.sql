-- Habilitar extensión net para hacer llamadas HTTP desde PostgreSQL
-- Esto es necesario para que el trigger pueda llamar a la Edge Function

CREATE EXTENSION IF NOT EXISTS "net" SCHEMA "extensions";

-- Comentario explicativo
COMMENT ON EXTENSION "net" IS 
'Extensión que permite hacer llamadas HTTP desde PostgreSQL. 
Necesaria para que el trigger pueda invocar la Edge Function.';
