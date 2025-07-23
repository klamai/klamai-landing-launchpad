
-- Actualizar la función aprobar_solicitud_abogado_automatizado para usar alternativas a gen_random_bytes
CREATE OR REPLACE FUNCTION public.aprobar_solicitud_abogado_automatizado(p_solicitud_id uuid, p_notas_admin text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Generar token de activación usando gen_random_uuid (reemplaza gen_random_bytes)
  activation_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
  -- Generar contraseña temporal usando gen_random_uuid
  temp_password := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12));

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
$function$;
