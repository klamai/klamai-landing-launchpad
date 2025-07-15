-- ================================================================
-- LIMPIEZA DE POLÍTICAS CONFLICTIVAS DE STORAGE
-- ================================================================

-- Eliminar todas las políticas existentes de storage.objects
DROP POLICY IF EXISTS "Users can view their own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents to their own cases" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- ================================================================
-- NUEVAS POLÍTICAS ORGANIZADAS PARA STORAGE
-- ================================================================

-- 1. POLÍTICA PARA VER DOCUMENTOS (SELECT)
-- Clientes ven documentos de sus casos + Abogados ven según su rol
CREATE POLICY "Ver documentos según rol y caso"
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

-- 2. POLÍTICA PARA SUBIR DOCUMENTOS (INSERT)
-- Clientes suben a documentos_cliente + Abogados a documentos_resolucion
CREATE POLICY "Subir documentos según rol"
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

-- 3. POLÍTICA PARA ACTUALIZAR DOCUMENTOS (UPDATE)
CREATE POLICY "Actualizar documentos según rol"
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

-- 4. POLÍTICA PARA ELIMINAR DOCUMENTOS (DELETE)
CREATE POLICY "Eliminar documentos según rol"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role puede eliminar todo
    (auth.role() = 'service_role')
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

-- ================================================================
-- ACTUALIZAR POLÍTICAS DE LA TABLA documentos_resolucion
-- ================================================================

-- Eliminar política restrictiva existente
DROP POLICY IF EXISTS "Solo abogados asignados pueden subir documentos" ON public.documentos_resolucion;

-- Nueva política para INSERT más permisiva
CREATE POLICY "Abogados pueden subir documentos de resolución"
ON public.documentos_resolucion FOR INSERT
WITH CHECK (
  -- Super admin puede subir a cualquier caso
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- Abogados regulares solo a casos asignados
  (EXISTS (
    SELECT 1 FROM public.asignaciones_casos 
    WHERE caso_id = documentos_resolucion.caso_id 
    AND abogado_id = auth.uid() 
    AND estado_asignacion = 'activa'
  ))
);

-- Agregar política UPDATE para documentos_resolucion
CREATE POLICY "Abogados pueden actualizar documentos de resolución"
ON public.documentos_resolucion FOR UPDATE
USING (
  -- Super admin puede actualizar cualquier documento
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- El abogado que subió el documento puede actualizarlo
  (auth.uid() = abogado_id)
);

-- Agregar política DELETE para documentos_resolucion  
CREATE POLICY "Abogados pueden eliminar documentos de resolución"
ON public.documentos_resolucion FOR DELETE
USING (
  -- Super admin puede eliminar cualquier documento
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- El abogado que subió el documento puede eliminarlo
  (auth.uid() = abogado_id)
);