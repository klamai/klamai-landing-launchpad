
-- Función mejorada para confirmar automáticamente emails de abogados activados
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
          -- Crear perfil de abogado con datos de la solicitud
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
            acepta_comunicacion
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
            solicitud_data.acepta_comunicacion
          );

          -- Marcar token como usado
          UPDATE public.lawyer_activation_tokens
          SET used_at = now()
          WHERE token = NEW.raw_user_meta_data ->> 'activation_token';

          -- CONFIRMAR EMAIL AUTOMÁTICAMENTE para abogados activados
          -- Esto se hace actualizando el registro en auth.users directamente
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
              'auto_confirmed', true
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
