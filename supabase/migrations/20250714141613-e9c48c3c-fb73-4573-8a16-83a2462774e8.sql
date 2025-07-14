-- ========================================
-- FASE 1: Sistema de Roles para Abogados
-- ========================================

-- 1. Crear enum para tipos de abogado
CREATE TYPE public.abogado_tipo_enum AS ENUM ('super_admin', 'regular');

-- 2. Agregar campo tipo_abogado a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN tipo_abogado public.abogado_tipo_enum DEFAULT 'regular';

-- 3. Crear tabla para asignaciones de casos
CREATE TABLE public.asignaciones_casos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  abogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asignado_por UUID REFERENCES public.profiles(id),
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado_asignacion TEXT DEFAULT 'activa' CHECK (estado_asignacion IN ('activa', 'completada', 'cancelada')),
  notas_asignacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar asignaciones duplicadas
  UNIQUE(caso_id, abogado_id)
);

-- Comentario para la tabla
COMMENT ON TABLE public.asignaciones_casos IS 'Gestiona qué abogado está asignado a cada caso';

-- 4. Crear tabla para documentos de resolución
CREATE TABLE public.documentos_resolucion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  abogado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  tamaño_archivo INTEGER,
  descripcion TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER DEFAULT 1,
  es_version_final BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentario para la tabla
COMMENT ON TABLE public.documentos_resolucion IS 'Documentos de resolución subidos por abogados para cada caso';

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.asignaciones_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_resolucion ENABLE ROW LEVEL SECURITY;

-- 6. Crear función para obtener tipo de abogado actual
CREATE OR REPLACE FUNCTION public.get_current_user_lawyer_type()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT tipo_abogado::text FROM public.profiles 
  WHERE id = auth.uid() AND role = 'abogado';
$$;

-- 7. Crear función para verificar si un usuario puede acceder a un caso
CREATE OR REPLACE FUNCTION public.can_access_case(p_caso_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  lawyer_type TEXT;
  is_assigned BOOLEAN := false;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Si es cliente, solo puede ver sus propios casos
  IF user_role = 'cliente' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id = p_caso_id AND cliente_id = auth.uid()
    );
  END IF;
  
  -- Si es abogado, verificar tipo
  IF user_role = 'abogado' THEN
    SELECT tipo_abogado::text INTO lawyer_type 
    FROM public.profiles WHERE id = auth.uid();
    
    -- Super admin ve todos los casos disponibles
    IF lawyer_type = 'super_admin' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.casos 
        WHERE id = p_caso_id AND estado IN ('disponible', 'agotado', 'cerrado')
      );
    END IF;
    
    -- Abogado regular solo ve casos asignados
    IF lawyer_type = 'regular' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.asignaciones_casos 
        WHERE caso_id = p_caso_id AND abogado_id = auth.uid() 
        AND estado_asignacion = 'activa'
      );
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 8. Crear función para asignar casos de forma segura
CREATE OR REPLACE FUNCTION public.assign_case_to_lawyer(
  p_caso_id UUID,
  p_abogado_id UUID,
  p_notas TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_type TEXT;
BEGIN
  -- Verificar que el usuario actual es super admin
  SELECT tipo_abogado::text INTO current_user_type
  FROM public.profiles 
  WHERE id = auth.uid() AND role = 'abogado';
  
  IF current_user_type != 'super_admin' THEN
    RAISE EXCEPTION 'Solo los super administradores pueden asignar casos';
  END IF;
  
  -- Verificar que el abogado destinatario existe
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_abogado_id AND role = 'abogado'
  ) THEN
    RAISE EXCEPTION 'El abogado especificado no existe';
  END IF;
  
  -- Verificar que el caso existe y está disponible
  IF NOT EXISTS (
    SELECT 1 FROM public.casos 
    WHERE id = p_caso_id AND estado IN ('disponible', 'agotado')
  ) THEN
    RAISE EXCEPTION 'El caso no existe o no está disponible para asignación';
  END IF;
  
  -- Crear la asignación
  INSERT INTO public.asignaciones_casos (
    caso_id, abogado_id, asignado_por, notas_asignacion
  ) VALUES (
    p_caso_id, p_abogado_id, auth.uid(), p_notas
  )
  ON CONFLICT (caso_id, abogado_id) 
  DO UPDATE SET
    estado_asignacion = 'activa',
    fecha_asignacion = now(),
    asignado_por = auth.uid(),
    notas_asignacion = p_notas;
  
  RETURN true;
END;
$$;

-- 9. Políticas RLS para asignaciones_casos
CREATE POLICY "Super admin ve todas las asignaciones"
ON public.asignaciones_casos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
);

CREATE POLICY "Abogados ven sus asignaciones"
ON public.asignaciones_casos
FOR SELECT
TO authenticated
USING (auth.uid() = abogado_id);

CREATE POLICY "Solo super admin puede crear asignaciones"
ON public.asignaciones_casos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
);

CREATE POLICY "Solo super admin puede actualizar asignaciones"
ON public.asignaciones_casos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
);

-- 10. Políticas RLS para documentos_resolucion
CREATE POLICY "Abogados ven documentos de sus casos"
ON public.documentos_resolucion
FOR SELECT
TO authenticated
USING (
  -- Super admin ve todos los documentos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
  OR
  -- Abogado que subió el documento
  auth.uid() = abogado_id
  OR
  -- Cliente del caso (solo si ha pagado)
  EXISTS (
    SELECT 1 FROM public.casos c
    JOIN public.pagos p ON p.usuario_id = c.cliente_id
    WHERE c.id = caso_id 
    AND c.cliente_id = auth.uid()
    AND p.estado = 'succeeded'
  )
);

CREATE POLICY "Solo abogados asignados pueden subir documentos"
ON public.documentos_resolucion
FOR INSERT
TO authenticated
WITH CHECK (
  -- Super admin puede subir a cualquier caso
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  )
  OR
  -- Abogado asignado al caso
  EXISTS (
    SELECT 1 FROM public.asignaciones_casos 
    WHERE caso_id = documentos_resolucion.caso_id 
    AND abogado_id = auth.uid()
    AND estado_asignacion = 'activa'
  )
);

-- 11. Actualizar políticas RLS de casos para incluir abogados
DROP POLICY IF EXISTS "Clientes ven solo sus casos, abogados ven disponibles" ON public.casos;

CREATE POLICY "Acceso a casos por rol y tipo"
ON public.casos
FOR SELECT
TO authenticated
USING (
  CASE
    -- Clientes ven solo sus casos
    WHEN (get_current_user_role() = 'cliente') THEN 
      (auth.uid() = cliente_id)
    -- Super admin ve todos los casos disponibles
    WHEN (get_current_user_role() = 'abogado' AND get_current_user_lawyer_type() = 'super_admin') THEN 
      (estado IN ('disponible', 'agotado', 'cerrado'))
    -- Abogado regular ve solo casos asignados
    WHEN (get_current_user_role() = 'abogado' AND get_current_user_lawyer_type() = 'regular') THEN 
      (id IN (
        SELECT caso_id FROM public.asignaciones_casos 
        WHERE abogado_id = auth.uid() AND estado_asignacion = 'activa'
      ))
    -- Casos borrador (sin dueño) son visibles para todos
    WHEN (cliente_id IS NULL) THEN true
    ELSE false
  END
);

-- 12. Trigger para notificar asignaciones de casos
CREATE OR REPLACE FUNCTION public.notify_case_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear notificación para el abogado asignado
  INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino)
  VALUES (
    NEW.abogado_id,
    'Se te ha asignado un nuevo caso #' || SUBSTRING(NEW.caso_id::text FROM 1 FOR 8),
    '/abogados/dashboard/casos/' || NEW.caso_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_case_assignment
  AFTER INSERT ON public.asignaciones_casos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_case_assignment();

-- 13. Índices para mejor rendimiento
CREATE INDEX idx_asignaciones_casos_abogado_id ON public.asignaciones_casos(abogado_id);
CREATE INDEX idx_asignaciones_casos_caso_id ON public.asignaciones_casos(caso_id);
CREATE INDEX idx_asignaciones_casos_estado ON public.asignaciones_casos(estado_asignacion);
CREATE INDEX idx_documentos_resolucion_caso_id ON public.documentos_resolucion(caso_id);
CREATE INDEX idx_documentos_resolucion_abogado_id ON public.documentos_resolucion(abogado_id);
CREATE INDEX idx_profiles_tipo_abogado ON public.profiles(tipo_abogado) WHERE role = 'abogado';