-- Agregar campos específicos de abogados a la tabla profiles
-- Estos campos se copiarán desde solicitudes_abogado cuando se active la cuenta

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS colegio_profesional TEXT,
ADD COLUMN IF NOT EXISTS numero_colegiado TEXT,
ADD COLUMN IF NOT EXISTS experiencia_anos INTEGER,
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS carta_motivacion TEXT,
ADD COLUMN IF NOT EXISTS documentos_verificacion JSONB DEFAULT '[]'::jsonb;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN public.profiles.colegio_profesional IS 'Colegio profesional al que pertenece el abogado';
COMMENT ON COLUMN public.profiles.numero_colegiado IS 'Número de colegiado del abogado';
COMMENT ON COLUMN public.profiles.experiencia_anos IS 'Años de experiencia profesional del abogado';
COMMENT ON COLUMN public.profiles.cv_url IS 'URL del currículum vitae del abogado';
COMMENT ON COLUMN public.profiles.carta_motivacion IS 'Carta de motivación presentada por el abogado';
COMMENT ON COLUMN public.profiles.documentos_verificacion IS 'Documentos de verificación adicionales en formato JSON';

-- Actualizar la función handle_new_user para copiar todos los campos de la solicitud
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_data RECORD;
  solicitud_data RECORD;
BEGIN
  -- Solo crear perfil si no existe ya
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN

    -- Verificar si es una activación de abogado
    IF NEW.raw_user_meta_data ->> 'activation_token' IS NOT NULL THEN
      -- Obtener datos del token de activación
      SELECT * INTO token_data
      FROM public.lawyer_activation_tokens
      WHERE token = NEW.raw_user_meta_data ->> 'activation_token'
        AND email = NEW.email
        AND expires_at > now()
        AND used_at IS NULL;

      IF FOUND THEN
        -- Obtener datos de la solicitud original
        SELECT * INTO solicitud_data
        FROM public.solicitudes_abogado
        WHERE id = token_data.solicitud_id;

        IF FOUND THEN
          -- Crear perfil de abogado con TODOS los datos de la solicitud
          INSERT INTO public.profiles (
            id,
            email,
            nombre,
            apellido,
            telefono,
            especialidades,
            role,
            tipo_abogado,
            acepta_politicas,
            acepta_comunicacion,
            -- Campos específicos de abogados
            colegio_profesional,
            numero_colegiado,
            experiencia_anos,
            cv_url,
            carta_motivacion,
            documentos_verificacion
          )
          VALUES (
            NEW.id,
            NEW.email,
            solicitud_data.nombre,
            solicitud_data.apellido,
            solicitud_data.telefono,
            solicitud_data.especialidades,
            'abogado'::profile_role_enum,
            'regular'::abogado_tipo_enum,
            solicitud_data.acepta_politicas,
            solicitud_data.acepta_comunicacion,
            -- Copiar campos específicos de abogados
            solicitud_data.colegio_profesional,
            solicitud_data.numero_colegiado,
            solicitud_data.experiencia_anos,
            solicitud_data.cv_url,
            solicitud_data.carta_motivacion,
            solicitud_data.documentos_verificacion
          );

          -- Marcar token como usado
          UPDATE public.lawyer_activation_tokens
          SET used_at = now()
          WHERE token = NEW.raw_user_meta_data ->> 'activation_token';

          -- CONFIRMAR EMAIL AUTOMÁTICAMENTE para abogados activados
          UPDATE auth.users
          SET
            email_confirmed_at = now(),
            confirmation_sent_at = now()
          WHERE id = NEW.id;

          -- Log de auditoría
          INSERT INTO public.auditoria_seguridad (
            usuario_id,
            accion,
            tabla_afectada,
            registro_id,
            datos_nuevos
          ) VALUES (
            NEW.id,
            'CONFIRMACION_EMAIL_AUTOMATICA_ABOGADO',
            'auth.users',
            NEW.id,
            jsonb_build_object(
              'email', NEW.email,
              'activation_token', NEW.raw_user_meta_data ->> 'activation_token',
              'auto_confirmed', true,
              'campos_copiados', jsonb_build_object(
                'colegio_profesional', solicitud_data.colegio_profesional,
                'numero_colegiado', solicitud_data.numero_colegiado,
                'experiencia_anos', solicitud_data.experiencia_anos,
                'cv_url', solicitud_data.cv_url,
                'carta_motivacion_length', length(solicitud_data.carta_motivacion)
              )
            )
          );

          RETURN NEW;
        END IF;
      END IF;
    END IF;

    -- Crear perfil normal (cliente) si no es activación de abogado
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
      'cliente'::profile_role_enum,
      COALESCE((NEW.raw_user_meta_data ->> 'acepta_politicas')::boolean, false),
      COALESCE((NEW.raw_user_meta_data ->> 'acepta_comunicacion')::boolean, false)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Agregar índices para los nuevos campos para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_colegio_profesional ON public.profiles(colegio_profesional);
CREATE INDEX IF NOT EXISTS idx_profiles_numero_colegiado ON public.profiles(numero_colegiado);
CREATE INDEX IF NOT EXISTS idx_profiles_experiencia_anos ON public.profiles(experiencia_anos);

-- Actualizar permisos RLS para los nuevos campos
-- Los abogados pueden ver sus propios campos, super admins pueden ver todo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política existente para abogados ver su propio perfil
DROP POLICY IF EXISTS "Abogados pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Abogados pueden ver su propio perfil" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id AND role = 'abogado'::profile_role_enum
  );

-- Política existente para super admins ver todos los perfiles
DROP POLICY IF EXISTS "Super admins pueden gestionar todos los perfiles" ON public.profiles;
CREATE POLICY "Super admins pueden gestionar todos los perfiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'abogado'::profile_role_enum
        AND tipo_abogado = 'super_admin'::abogado_tipo_enum
    )
  );