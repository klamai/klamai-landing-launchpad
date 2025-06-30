
-- Crear la tabla de especialidades primero (no tiene dependencias)
CREATE TABLE public.especialidades (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL
);

-- Actualizar la tabla profiles existente para que coincida con tu esquema
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS apellido TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Hacer que email sea único y no nulo si aún no lo es
ALTER TABLE public.profiles 
ALTER COLUMN email SET NOT NULL;

-- Agregar constraint único para email si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Crear la tabla casos
CREATE TABLE public.casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  especialidad_id INTEGER REFERENCES public.especialidades(id),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'esperando_pago', 'activo', 'completado')),
  motivo_consulta TEXT,
  resumen_caso TEXT,
  guia_abogado TEXT,
  transcripcion_chat JSONB,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear la tabla pagos
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  monto INTEGER NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'eur',
  estado TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar algunas especialidades básicas para empezar
INSERT INTO public.especialidades (nombre) VALUES
('Derecho Civil'),
('Derecho Penal'),
('Derecho Laboral'),
('Derecho Mercantil'),
('Derecho Administrativo'),
('Derecho Familiar'),
('Derecho Inmobiliario'),
('Derecho Fiscal'),
('Derecho de la Seguridad Social'),
('Derecho de Extranjería');

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para especialidades (lectura pública)
CREATE POLICY "Cualquiera puede leer especialidades" ON public.especialidades
  FOR SELECT USING (true);

-- Políticas RLS para casos (solo el propietario puede ver/modificar sus casos)
CREATE POLICY "Los usuarios pueden ver sus propios casos" ON public.casos
  FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Los usuarios pueden crear sus propios casos" ON public.casos
  FOR INSERT WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios casos" ON public.casos
  FOR UPDATE USING (auth.uid() = cliente_id);

-- Políticas RLS para pagos (solo el propietario puede ver sus pagos)
CREATE POLICY "Los usuarios pueden ver sus propios pagos" ON public.pagos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden crear sus propios pagos" ON public.pagos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_casos_cliente_id ON public.casos(cliente_id);
CREATE INDEX idx_casos_estado ON public.casos(estado);
CREATE INDEX idx_casos_created_at ON public.casos(created_at);
CREATE INDEX idx_pagos_usuario_id ON public.pagos(usuario_id);
CREATE INDEX idx_pagos_caso_id ON public.pagos(caso_id);
CREATE INDEX idx_pagos_stripe_payment_intent_id ON public.pagos(stripe_payment_intent_id);

-- Actualizar la función handle_new_user para incluir los nuevos campos requeridos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 2))
  );
  RETURN NEW;
END;
$$;
