
-- Modificar la función aprobar_solicitud_abogado_automatizado para crear automáticamente el perfil del abogado
CREATE OR REPLACE FUNCTION public.aprobar_solicitud_abogado_automatizado(p_solicitud_id uuid, p_notas_admin text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  solicitud_data RECORD;
  activation_token TEXT;
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

  -- Verificar que no existe ya un perfil con este email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = solicitud_data.email) THEN
    RAISE EXCEPTION 'Ya existe un perfil con este email';
  END IF;

  -- Generar token de activación usando gen_random_uuid
  activation_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
  -- ELIMINADO: Generación de contraseña temporal
  -- temp_password := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12));

  -- YA NO SE GENERA UUID NI SE CREA EL PERFIL AQUÍ
  -- -- Generar un UUID para el futuro usuario auth
  -- nuevo_auth_user_id := gen_random_uuid();

  -- Actualizar estado de la solicitud
  UPDATE public.solicitudes_abogado 
  SET 
    estado = 'aprobada',
    revisado_por = auth.uid(),
    fecha_revision = now(),
    notas_admin = p_notas_admin,
    updated_at = now()
  WHERE id = p_solicitud_id;

  -- ELIMINADO: Bloque de inserción en public.profiles
  -- Se creará a través del trigger 'handle_new_user' cuando el abogado active su cuenta.

  -- Crear token de activación
  INSERT INTO public.lawyer_activation_tokens (
    solicitud_id, 
    token, 
    email, 
    created_at,
    expires_at
  ) VALUES (
    p_solicitud_id, 
    activation_token, 
    solicitud_data.email, 
    now(),
    now() + INTERVAL '7 days'
  );

  -- Agregar entrada de auditoría
  INSERT INTO public.auditoria_seguridad (
    usuario_id,
    accion,
    tabla_afectada,
    registro_id,
    datos_nuevos
  ) VALUES (
    auth.uid(),
    'APROBAR_SOLICITUD_ABOGADO_AUTOMATIZADO',
    'solicitudes_abogado',
    p_solicitud_id,
    jsonb_build_object(
      'solicitud_id', p_solicitud_id,
      'email', solicitud_data.email,
      -- 'profile_id' eliminado ya que el perfil no se crea aquí
      'activation_token', activation_token
    )
  );

  -- Retornar datos para el Edge Function (sin profile_id y con profile_created=false)
  result := json_build_object(
    'success', true,
    'solicitud_id', p_solicitud_id,
    'email', solicitud_data.email,
    'nombre', solicitud_data.nombre,
    'apellido', solicitud_data.apellido,
    'activation_token', activation_token,
    'profile_created', false
  );

  RETURN result;
END;
$function$;

-- Crear función para completar la activación del abogado
CREATE OR REPLACE FUNCTION public.activate_lawyer_account(
  p_token text,
  p_auth_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_data RECORD;
  result JSON;
BEGIN
  -- Verificar token válido
  SELECT * INTO token_data
  FROM public.lawyer_activation_tokens
  WHERE token = p_token
    AND expires_at > now()
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido o expirado';
  END IF;

  -- Actualizar el profile con el ID real del usuario auth
  UPDATE public.profiles
  SET id = p_auth_user_id
  WHERE email = token_data.email
    AND role = 'abogado'::profile_role_enum;

  -- Marcar token como usado
  UPDATE public.lawyer_activation_tokens
  SET used_at = now()
  WHERE token = p_token;

  -- Agregar auditoría
  INSERT INTO public.auditoria_seguridad (
    usuario_id,
    accion,
    tabla_afectada,
    registro_id,
    datos_nuevos
  ) VALUES (
    p_auth_user_id,
    'ACTIVAR_CUENTA_ABOGADO',
    'profiles',
    p_auth_user_id,
    jsonb_build_object(
      'email', token_data.email,
      'token_used', p_token,
      'activation_completed', true
    )
  );

  result := json_build_object(
    'success', true,
    'email', token_data.email,
    'profile_updated', true
  );

  RETURN result;
END;
$$;
