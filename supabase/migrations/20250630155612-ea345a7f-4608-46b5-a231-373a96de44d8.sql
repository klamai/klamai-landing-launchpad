
-- =================================================================
-- Script de Creación de Base de Datos para Plataforma de Leads Legales
-- Versión: Final y Completa
-- Fecha: 2025-06-30
-- =================================================================

-- -----------------------------------------------------------------
-- 1. CREACIÓN DE TIPOS ENUM PERSONALIZADOS
-- Esto asegura la consistencia de los datos en los campos de estado y rol.
-- -----------------------------------------------------------------

CREATE TYPE public.profile_role_enum AS ENUM ('cliente', 'abogado');
CREATE TYPE public.profile_type_enum AS ENUM ('individual', 'empresa');
CREATE TYPE public.caso_estado_enum AS ENUM ('borrador', 'esperando_pago', 'disponible', 'agotado', 'cerrado');
CREATE TYPE public.caso_tipo_lead_enum AS ENUM ('estandar', 'premium', 'urgente');
CREATE TYPE public.pago_estado_enum AS ENUM ('succeeded', 'processing', 'failed');
CREATE TYPE public.suscripcion_estado_enum AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE public.transaccion_credito_tipo_enum AS ENUM ('compra_paquete', 'asignacion_suscripcion', 'gasto_lead');

-- -----------------------------------------------------------------
-- 2. CREACIÓN DE TABLAS
-- -----------------------------------------------------------------

-- Tabla 1: especialidades (Catálogo)
CREATE TABLE public.especialidades (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.especialidades IS 'Catálogo de especialidades legales para clasificar los casos.';

-- Tabla 2: profiles (Maestra de Usuarios)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.profile_role_enum NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    acepta_politicas BOOLEAN NOT NULL DEFAULT false,
    acepta_comunicacion BOOLEAN NOT NULL DEFAULT false,
    tipo_perfil public.profile_type_enum NOT NULL DEFAULT 'individual',
    razon_social TEXT,
    nif_cif TEXT,
    especialidades INTEGER[],
    creditos_disponibles INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Perfiles de todos los usuarios (clientes y abogados), sincronizados con auth.users.';

-- Tabla 3: casos (Entidad de Consulta Legal)
CREATE TABLE public.casos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    especialidad_id INTEGER REFERENCES public.especialidades(id) ON DELETE SET NULL,
    estado public.caso_estado_enum NOT NULL DEFAULT 'borrador',
    tipo_lead public.caso_tipo_lead_enum,
    motivo_consulta TEXT,
    resumen_caso TEXT,
    guia_abogado TEXT,
    transcripcion_chat JSONB,
    canal_atencion TEXT DEFAULT 'web',
    costo_en_creditos INTEGER NOT NULL DEFAULT 10,
    compras_realizadas INTEGER NOT NULL DEFAULT 0,
    limite_compras INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.casos IS 'Almacena cada consulta o caso legal.';
CREATE INDEX idx_casos_cliente_id ON public.casos(cliente_id);
CREATE INDEX idx_casos_estado ON public.casos(estado);

-- Tabla 4: casos_comprados (Relación N-a-N Casos/Abogados)
CREATE TABLE public.casos_comprados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
    abogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fecha_compra TIMESTAMPTZ DEFAULT NOW(),
    precio_compra_creditos INTEGER NOT NULL,
    CONSTRAINT unique_caso_abogado UNIQUE (caso_id, abogado_id)
);
COMMENT ON TABLE public.casos_comprados IS 'Registra qué abogado compró qué caso.';

-- Tabla 5: pagos (Transacciones Puntuales)
CREATE TABLE public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    monto INTEGER NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'eur',
    estado public.pago_estado_enum NOT NULL,
    descripcion TEXT NOT NULL,
    metadata_pago JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.pagos IS 'Registra pagos únicos (consultas, paquetes de créditos).';
CREATE INDEX idx_pagos_usuario_id ON public.pagos(usuario_id);

-- Tabla 6: suscripciones_clientes
CREATE TABLE public.suscripciones_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    estado public.suscripcion_estado_enum NOT NULL,
    limite_consultas_ciclo INTEGER NOT NULL,
    consultas_usadas_ciclo INTEGER NOT NULL DEFAULT 0,
    fecha_inicio_ciclo TIMESTAMPTZ NOT NULL,
    fecha_fin_ciclo TIMESTAMPTZ NOT NULL,
    fecha_cancelacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.suscripciones_clientes IS 'Gestiona los planes de suscripción para clientes.';

-- Tabla 7: suscripciones_abogados
CREATE TABLE public.suscripciones_abogados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    estado public.suscripcion_estado_enum NOT NULL,
    creditos_otorgados_ciclo INTEGER NOT NULL,
    fecha_inicio_ciclo TIMESTAMPTZ NOT NULL,
    fecha_fin_ciclo TIMESTAMPTZ NOT NULL,
    fecha_cancelacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.suscripciones_abogados IS 'Gestiona los planes de suscripción de créditos para abogados.';

-- Tabla 8: transacciones_creditos (Libro de Contabilidad/Auditoría)
CREATE TABLE public.transacciones_creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo_transaccion public.transaccion_credito_tipo_enum NOT NULL,
    cantidad INTEGER NOT NULL,
    descripcion TEXT,
    referencia_id UUID, -- Referencia a caso_id o pago_id
    saldo_anterior INTEGER NOT NULL,
    saldo_posterior INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.transacciones_creditos IS 'Auditoría de todos los movimientos de créditos de los abogados.';
CREATE INDEX idx_transacciones_abogado_id ON public.transacciones_creditos(abogado_id);

-- -----------------------------------------------------------------
-- 3. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- -----------------------------------------------------------------

ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_comprados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_abogados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_creditos ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- 4. CREAR POLÍTICAS RLS
-- -----------------------------------------------------------------

-- Políticas para especialidades (lectura pública)
CREATE POLICY "Cualquiera puede leer especialidades" ON public.especialidades
  FOR SELECT USING (true);

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para casos
CREATE POLICY "Los usuarios pueden ver sus propios casos" ON public.casos
  FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Los usuarios pueden crear sus propios casos" ON public.casos
  FOR INSERT WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios casos" ON public.casos
  FOR UPDATE USING (auth.uid() = cliente_id);

-- Políticas para casos_comprados
CREATE POLICY "Los abogados pueden ver sus compras de casos" ON public.casos_comprados
  FOR SELECT USING (auth.uid() = abogado_id);

CREATE POLICY "Los abogados pueden crear compras de casos" ON public.casos_comprados
  FOR INSERT WITH CHECK (auth.uid() = abogado_id);

-- Políticas para pagos
CREATE POLICY "Los usuarios pueden ver sus propios pagos" ON public.pagos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden crear sus propios pagos" ON public.pagos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para suscripciones_clientes
CREATE POLICY "Los clientes pueden ver sus propias suscripciones" ON public.suscripciones_clientes
  FOR SELECT USING (auth.uid() = cliente_id);

-- Políticas para suscripciones_abogados
CREATE POLICY "Los abogados pueden ver sus propias suscripciones" ON public.suscripciones_abogados
  FOR SELECT USING (auth.uid() = abogado_id);

-- Políticas para transacciones_creditos
CREATE POLICY "Los abogados pueden ver sus propias transacciones" ON public.transacciones_creditos
  FOR SELECT USING (auth.uid() = abogado_id);

-- -----------------------------------------------------------------
-- 5. CREAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 2)),
    'cliente'
  );
  RETURN NEW;
END;
$$;

-- Crear trigger para nuevos usuarios
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------
-- 6. INSERCIÓN DE DATOS INICIALES
-- -----------------------------------------------------------------

-- Inserción de especialidades iniciales
INSERT INTO public.especialidades (nombre) VALUES
('Derecho Civil'),
('Derecho Penal'),
('Derecho Laboral'),
('Derecho Mercantil'),
('Derecho Administrativo'),
('Derecho Fiscal'),
('Derecho Familiar'),
('Derecho Inmobiliario'),
('Derecho de Extranjería'),
('Derecho de la Seguridad Social'),
('Derecho Sanitario'),
('Derecho de Seguros'),
('Derecho Concursal'),
('Derecho de Propiedad Intelectual'),
('Derecho Ambiental');

-- -----------------------------------------------------------------
-- 7. CREAR BUCKET DE STORAGE PARA DOCUMENTOS
-- -----------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES ('documentos_legales', 'documentos_legales', false);

-- Políticas de Storage para documentos legales
CREATE POLICY "Los usuarios pueden subir sus propios archivos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos_legales' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Los usuarios pueden ver sus propios archivos" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos_legales' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Los usuarios pueden actualizar sus propios archivos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documentos_legales' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Los usuarios pueden eliminar sus propios archivos" ON storage.objects
  FOR DELETE USING (bucket_id = 'documentos_legales' AND auth.uid()::text = (storage.foldername(name))[1]);

-- -----------------------------------------------------------------
-- FIN DEL SCRIPT
-- -----------------------------------------------------------------
