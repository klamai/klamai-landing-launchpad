
-- 1. Crear el trigger faltante para ejecutar handle_new_user automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Corregir la expiración de tokens a 7 días en lugar de 24 horas
ALTER TABLE public.lawyer_activation_tokens 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '7 days');

-- 3. Función auxiliar para limpiar tokens expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_activation_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.lawyer_activation_tokens
  WHERE expires_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
