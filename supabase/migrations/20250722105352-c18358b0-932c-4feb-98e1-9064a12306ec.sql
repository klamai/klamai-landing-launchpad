
-- Corregir funciones de seguridad fijando search_path y mejorando validaciones

-- 1. Corregir función handle_new_user con search_path fijo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo crear perfil si no existe ya
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      nombre, 
      apellido, 
      role,
      acepta_politicas,
      acepta_comunicacion
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'nombre', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 1)),
      COALESCE(NEW.raw_user_meta_data ->> 'apellido', split_part(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), ' ', 2)),
      -- CRÍTICO: Verificar si es una solicitud de abogado aprobada
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'role' = 'abogado' 
        AND NEW.raw_user_meta_data ->> 'approved_by_admin' = 'true' 
        THEN 'abogado'::profile_role_enum
        ELSE 'cliente'::profile_role_enum
      END,
      COALESCE((NEW.raw_user_meta_data ->> 'acepta_politicas')::boolean, false),
      COALESCE((NEW.raw_user_meta_data ->> 'acepta_comunicacion')::boolean, false)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Corregir función get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Corregir función get_current_user_lawyer_type
CREATE OR REPLACE FUNCTION public.get_current_user_lawyer_type()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path TO 'public'
AS $$
  SELECT tipo_abogado::text FROM public.profiles 
  WHERE id = auth.uid() AND role = 'abogado'::profile_role_enum;
$$;

-- 4. Crear tabla para solicitudes de abogado
CREATE TABLE IF NOT EXISTS public.solicitudes_abogado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  colegio_profesional TEXT,
  numero_colegiado TEXT,
  especialidades INTEGER[],
  experiencia_anos INTEGER,
  cv_url TEXT,
  carta_motivacion TEXT,
  documentos_verificacion JSONB DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
  motivo_rechazo TEXT,
  revisado_por UUID REFERENCES public.profiles(id),
  fecha_revision TIMESTAMP WITH TIME ZONE,
  notas_admin TEXT,
  acepta_politicas BOOLEAN NOT NULL DEFAULT false,
  acepta_comunicacion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en solicitudes_abogado
ALTER TABLE public.solicitudes_abogado ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para solicitudes_abogado
CREATE POLICY "Super admin puede ver todas las solicitudes" 
ON public.solicitudes_abogado 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  )
);

CREATE POLICY "Cualquiera puede crear solicitudes" 
ON public.solicitudes_abogado 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Super admin puede actualizar solicitudes" 
ON public.solicitudes_abogado 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  )
);

-- 6. Función para aprobar solicitud de abogado
CREATE OR REPLACE FUNCTION public.aprobar_solicitud_abogado(
  p_solicitud_id UUID,
  p_notas_admin TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  solicitud_data RECORD;
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

  -- Actualizar estado de la solicitud
  UPDATE public.solicitudes_abogado 
  SET 
    estado = 'aprobada',
    revisado_por = auth.uid(),
    fecha_revision = now(),
    notas_admin = p_notas_admin,
    updated_at = now()
  WHERE id = p_solicitud_id;

  RETURN true;
END;
$$;

-- 7. Función para rechazar solicitud
CREATE OR REPLACE FUNCTION public.rechazar_solicitud_abogado(
  p_solicitud_id UUID,
  p_motivo_rechazo TEXT,
  p_notas_admin TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que el usuario actual es super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  ) THEN
    RAISE EXCEPTION 'Solo los super administradores pueden rechazar solicitudes';
  END IF;

  -- Actualizar estado de la solicitud
  UPDATE public.solicitudes_abogado 
  SET 
    estado = 'rechazada',
    motivo_rechazo = p_motivo_rechazo,
    revisado_por = auth.uid(),
    fecha_revision = now(),
    notas_admin = p_notas_admin,
    updated_at = now()
  WHERE id = p_solicitud_id AND estado IN ('pendiente', 'en_revision');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  RETURN true;
END;
$$;

-- 8. Tabla de auditoría para cambios críticos
CREATE TABLE IF NOT EXISTS public.auditoria_seguridad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID,
  accion TEXT NOT NULL,
  tabla_afectada TEXT NOT NULL,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en auditoría
ALTER TABLE public.auditoria_seguridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo super admin puede ver auditoría" 
ON public.auditoria_seguridad 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  )
);

-- 9. Trigger para auditoría en solicitudes_abogado
CREATE OR REPLACE FUNCTION public.audit_solicitudes_abogado()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
    INSERT INTO public.auditoria_seguridad (
      usuario_id,
      accion,
      tabla_afectada,
      registro_id,
      datos_anteriores,
      datos_nuevos
    ) VALUES (
      auth.uid(),
      'UPDATE_ESTADO_SOLICITUD',
      'solicitudes_abogado',
      NEW.id,
      jsonb_build_object('estado', OLD.estado),
      jsonb_build_object('estado', NEW.estado, 'motivo_rechazo', NEW.motivo_rechazo)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_solicitudes_abogado ON public.solicitudes_abogado;
CREATE TRIGGER trigger_audit_solicitudes_abogado
  AFTER UPDATE ON public.solicitudes_abogado
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_solicitudes_abogado();

-- 10. Función para crear cuenta de abogado desde solicitud aprobada
CREATE OR REPLACE FUNCTION public.crear_abogado_desde_solicitud(
  p_solicitud_id UUID,
  p_password TEXT,
  p_tipo_abogado abogado_tipo_enum DEFAULT 'regular'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  solicitud_data RECORD;
  nuevo_user_id UUID;
BEGIN
  -- Verificar que el usuario actual es super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado'::profile_role_enum 
    AND tipo_abogado = 'super_admin'::abogado_tipo_enum
  ) THEN
    RAISE EXCEPTION 'Solo los super administradores pueden crear cuentas de abogado';
  END IF;

  -- Obtener datos de la solicitud aprobada
  SELECT * INTO solicitud_data 
  FROM public.solicitudes_abogado 
  WHERE id = p_solicitud_id AND estado = 'aprobada';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no está aprobada';
  END IF;

  -- Crear usuario en auth.users (esto requiere service role, por lo que se hará desde el frontend)
  -- Esta función retornará el ID de la solicitud para procesamiento posterior
  
  RETURN p_solicitud_id;
END;
$$;
