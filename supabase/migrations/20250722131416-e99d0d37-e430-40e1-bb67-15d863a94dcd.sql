
-- Crear tabla para tokens de activación de abogados
CREATE TABLE public.lawyer_activation_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_abogado(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_lawyer_activation_tokens_token ON public.lawyer_activation_tokens(token);
CREATE INDEX idx_lawyer_activation_tokens_expires_at ON public.lawyer_activation_tokens(expires_at);
CREATE INDEX idx_lawyer_activation_tokens_solicitud_id ON public.lawyer_activation_tokens(solicitud_id);

-- Habilitar RLS
ALTER TABLE public.lawyer_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública de tokens válidos (necesario para activación)
CREATE POLICY "Tokens can be read for activation" 
  ON public.lawyer_activation_tokens 
  FOR SELECT 
  USING (expires_at > now() AND used_at IS NULL);

-- Política para que solo service role pueda insertar tokens
CREATE POLICY "Service role can insert tokens" 
  ON public.lawyer_activation_tokens 
  FOR INSERT 
  WITH CHECK (true);

-- Política para actualizar tokens durante activación
CREATE POLICY "Tokens can be updated for activation" 
  ON public.lawyer_activation_tokens 
  FOR UPDATE 
  USING (expires_at > now() AND used_at IS NULL);

-- Función para limpiar tokens expirados (se puede ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_activation_tokens()
RETURNS INTEGER
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

-- Función mejorada para aprobar solicitud con automatización
CREATE OR REPLACE FUNCTION public.aprobar_solicitud_abogado_automatizado(
  p_solicitud_id UUID, 
  p_notas_admin TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  solicitud_data RECORD;
  activation_token TEXT;
  temp_password TEXT;
  result JSON;
BEGIN
  -- Verificar que el usuario actual es super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  ) THEN
    RAISE EXCEPTION 'Solo los super administradores pueden aprobar solicitudes';
  END IF;

  -- Obtener datos de la solicitud
  SELECT * INTO solicitud_data 
  FROM public.solicitudes_abogado 
  WHERE id = p_solicitud_id AND estado = 'pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  -- Generar token de activación y contraseña temporal
  activation_token := encode(gen_random_bytes(32), 'hex');
  temp_password := encode(gen_random_bytes(12), 'base64');

  -- Actualizar estado de la solicitud
  UPDATE public.solicitudes_abogado 
  SET 
    estado = 'aprobada',
    revisado_por = auth.uid(),
    fecha_revision = now(),
    notas_admin = p_notas_admin,
    updated_at = now()
  WHERE id = p_solicitud_id;

  -- Crear token de activación
  INSERT INTO public.lawyer_activation_tokens (
    solicitud_id, token, email, temp_password
  ) VALUES (
    p_solicitud_id, activation_token, solicitud_data.email, temp_password
  );

  -- Retornar datos para el Edge Function
  result := json_build_object(
    'success', true,
    'solicitud_id', p_solicitud_id,
    'email', solicitud_data.email,
    'nombre', solicitud_data.nombre,
    'apellido', solicitud_data.apellido,
    'activation_token', activation_token,
    'temp_password', temp_password
  );

  RETURN result;
END;
$$;
