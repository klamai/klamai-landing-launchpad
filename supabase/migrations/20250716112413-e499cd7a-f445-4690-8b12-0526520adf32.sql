
-- ================================================================
-- CREAR TABLA PARA DOCUMENTOS DEL CLIENTE
-- ================================================================

-- Crear tabla documentos_cliente para documentos que suben los clientes
CREATE TABLE public.documentos_cliente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'documento_cliente',
  tamaño_archivo INTEGER,
  descripcion TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documentos_cliente ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLÍTICAS RLS PARA documentos_cliente
-- ================================================================

-- Los clientes pueden ver documentos de sus propios casos
CREATE POLICY "Clientes ven documentos de sus casos"
ON public.documentos_cliente FOR SELECT
USING (
  auth.uid() = cliente_id
  OR
  -- Super admin puede ver todos
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- Abogados asignados pueden ver documentos del caso
  (EXISTS (
    SELECT 1 FROM public.asignaciones_casos 
    WHERE caso_id = documentos_cliente.caso_id 
    AND abogado_id = auth.uid() 
    AND estado_asignacion = 'activa'
  ))
);

-- Los clientes pueden subir documentos a sus propios casos
CREATE POLICY "Clientes pueden subir documentos a sus casos"
ON public.documentos_cliente FOR INSERT
WITH CHECK (
  auth.uid() = cliente_id
  AND EXISTS (
    SELECT 1 FROM public.casos 
    WHERE id = documentos_cliente.caso_id 
    AND cliente_id = auth.uid()
  )
);

-- Los clientes pueden actualizar sus propios documentos
CREATE POLICY "Clientes pueden actualizar sus documentos"
ON public.documentos_cliente FOR UPDATE
USING (
  auth.uid() = cliente_id
  OR
  -- Super admin puede actualizar
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
);

-- Los clientes pueden eliminar sus propios documentos
CREATE POLICY "Clientes pueden eliminar sus documentos"
ON public.documentos_cliente FOR DELETE
USING (
  auth.uid() = cliente_id
  OR
  -- Super admin puede eliminar
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
);

-- ================================================================
-- ACTUALIZAR POLÍTICAS DE STORAGE PARA SOPORTAR AMBOS TIPOS
-- ================================================================

-- Eliminar políticas conflictivas existentes
DROP POLICY IF EXISTS "Ver documentos según rol y caso" ON storage.objects;
DROP POLICY IF EXISTS "Subir documentos según rol" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar documentos según rol" ON storage.objects;
DROP POLICY IF EXISTS "Eliminar documentos según rol" ON storage.objects;

-- 1. POLÍTICA PARA VER DOCUMENTOS (SELECT) - ACTUALIZADA
CREATE POLICY "Ver documentos según rol y caso actualizada"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role tiene acceso completo
    (auth.role() = 'service_role')
    OR
    -- Clientes pueden ver documentos de sus propios casos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    -- Super admin puede ver todos los documentos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    ))
    OR
    -- Abogados regulares pueden ver documentos de casos asignados
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.asignaciones_casos ac
      JOIN public.casos c ON c.id = ac.caso_id
      WHERE c.id::text = (string_to_array(name, '/'))[2]
      AND ac.abogado_id = auth.uid()
      AND ac.estado_asignacion = 'activa'
    ))
  )
);

-- 2. POLÍTICA PARA SUBIR DOCUMENTOS (INSERT) - ACTUALIZADA
CREATE POLICY "Subir documentos según rol actualizada"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role puede subir todo
    (auth.role() = 'service_role')
    OR
    -- Clientes pueden subir a documentos_cliente de sus casos
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_cliente'
     AND EXISTS (
       SELECT 1 FROM public.casos 
       WHERE id::text = (string_to_array(name, '/'))[2]
       AND cliente_id = auth.uid()
     ))
    OR
    -- Super admin puede subir documentos_resolucion a cualquier caso
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_resolucion'
     AND EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = auth.uid() 
       AND role = 'abogado' 
       AND tipo_abogado = 'super_admin'
     ))
    OR
    -- Abogados regulares pueden subir documentos_resolucion a casos asignados
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_resolucion'
     AND EXISTS (
       SELECT 1 FROM public.asignaciones_casos ac
       WHERE ac.caso_id::text = (string_to_array(name, '/'))[2]
       AND ac.abogado_id = auth.uid()
       AND ac.estado_asignacion = 'activa'
     ))
  )
);

-- 3. POLÍTICA PARA ACTUALIZAR DOCUMENTOS (UPDATE) - ACTUALIZADA
CREATE POLICY "Actualizar documentos según rol actualizada"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role puede actualizar todo
    (auth.role() = 'service_role')
    OR
    -- Clientes pueden actualizar documentos_cliente de sus casos
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_cliente'
     AND EXISTS (
       SELECT 1 FROM public.casos 
       WHERE id::text = (string_to_array(name, '/'))[2]
       AND cliente_id = auth.uid()
     ))
    OR
    -- Super admin puede actualizar documentos_resolucion
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_resolucion'
     AND EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = auth.uid() 
       AND role = 'abogado' 
       AND tipo_abogado = 'super_admin'
     ))
    OR
    -- Abogados regulares pueden actualizar documentos_resolucion de casos asignados
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_resolucion'
     AND EXISTS (
       SELECT 1 FROM public.asignaciones_casos ac
       WHERE ac.caso_id::text = (string_to_array(name, '/'))[2]
       AND ac.abogado_id = auth.uid()
       AND ac.estado_asignacion = 'activa'
     ))
  )
);

-- 4. POLÍTICA PARA ELIMINAR DOCUMENTOS (DELETE) - ACTUALIZADA
CREATE POLICY "Eliminar documentos según rol actualizada"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role puede eliminar todo
    (auth.role() = 'service_role')
    OR
    -- Clientes pueden eliminar documentos_cliente de sus casos
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_cliente'
     AND EXISTS (
       SELECT 1 FROM public.casos 
       WHERE id::text = (string_to_array(name, '/'))[2]
       AND cliente_id = auth.uid()
     ))
    OR
    -- Super admin puede eliminar cualquier documento
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    ))
    OR
    -- Abogados regulares pueden eliminar documentos_resolucion de casos asignados
    (auth.uid() IS NOT NULL 
     AND (string_to_array(name, '/'))[3] = 'documentos_resolucion'
     AND EXISTS (
       SELECT 1 FROM public.asignaciones_casos ac
       WHERE ac.caso_id::text = (string_to_array(name, '/'))[2]
       AND ac.abogado_id = auth.uid()
       AND ac.estado_asignacion = 'activa'
     ))
  )
);
