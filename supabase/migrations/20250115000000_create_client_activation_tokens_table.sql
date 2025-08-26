-- Crear tabla para tokens de activación de clientes que pagan
CREATE TABLE IF NOT EXISTS public.client_activation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  resend_count INTEGER DEFAULT 0,
  max_resends INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_client_activation_tokens_token ON public.client_activation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_activation_tokens_caso_id ON public.client_activation_tokens(caso_id);
CREATE INDEX IF NOT EXISTS idx_client_activation_tokens_email ON public.client_activation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_client_activation_tokens_expires_at ON public.client_activation_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE client_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_activation_tokens
-- Solo el sistema puede crear tokens (a través de Edge Functions)
CREATE POLICY "Sistema puede crear tokens de activación" ON client_activation_tokens
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Solo el sistema puede ver tokens
CREATE POLICY "Sistema puede ver tokens de activación" ON client_activation_tokens
  FOR SELECT TO authenticated
  USING (true);

-- Solo el sistema puede actualizar tokens
CREATE POLICY "Sistema puede actualizar tokens de activación" ON client_activation_tokens
  FOR UPDATE TO authenticated
  USING (true);

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_client_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.client_activation_tokens
  WHERE expires_at < now() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Comentarios
COMMENT ON TABLE public.client_activation_tokens IS 'Tokens de activación para clientes que pagan consultas anónimas';
COMMENT ON COLUMN public.client_activation_tokens.resend_count IS 'Número de veces que se ha reenviado el token';
COMMENT ON COLUMN public.client_activation_tokens.max_resends IS 'Máximo número de reenvíos permitidos';
