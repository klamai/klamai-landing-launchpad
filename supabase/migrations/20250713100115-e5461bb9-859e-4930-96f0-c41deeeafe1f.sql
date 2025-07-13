-- Agregar campo session_token a la tabla casos
ALTER TABLE public.casos 
ADD COLUMN session_token TEXT;

-- Crear función segura para asignar casos anónimos
CREATE OR REPLACE FUNCTION public.assign_anonymous_case_to_user(
  p_caso_id UUID,
  p_session_token TEXT,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caso_encontrado RECORD;
BEGIN
  -- Buscar el caso y validar que sea anónimo y tenga el token correcto
  SELECT * INTO caso_encontrado
  FROM public.casos
  WHERE id = p_caso_id
    AND cliente_id IS NULL
    AND session_token = p_session_token
    AND created_at > NOW() - INTERVAL '24 hours'; -- Token válido por 24 horas
  
  -- Si no se encuentra el caso con las condiciones correctas, retornar false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Asignar el caso al usuario
  UPDATE public.casos
  SET 
    cliente_id = p_user_id,
    estado = 'esperando_pago',
    session_token = NULL -- Limpiar el token después de la asignación
  WHERE id = p_caso_id;
  
  -- Retornar éxito
  RETURN TRUE;
END;
$$;

-- Crear índice para mejorar performance de búsquedas por session_token
CREATE INDEX idx_casos_session_token ON public.casos(session_token) 
WHERE session_token IS NOT NULL;

-- Función para limpiar casos anónimos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_anonymous_cases()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.casos
  WHERE cliente_id IS NULL
    AND session_token IS NOT NULL
    AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;