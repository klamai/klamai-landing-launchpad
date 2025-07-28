-- ========================================
-- PERMITIR QUE ABOGADOS REGULARES SUBAN DOCUMENTOS DEL CLIENTE
-- ========================================

-- Actualizar política INSERT para documentos_cliente
DROP POLICY IF EXISTS "Clientes pueden subir documentos a sus casos" ON public.documentos_cliente;

CREATE POLICY "Clientes y abogados asignados pueden subir documentos del cliente"
ON public.documentos_cliente FOR INSERT
WITH CHECK (
  -- Clientes pueden subir documentos a sus propios casos
  (auth.uid() = cliente_id
  AND EXISTS (
    SELECT 1 FROM public.casos 
    WHERE id = documentos_cliente.caso_id 
    AND cliente_id = auth.uid()
  ))
  OR
  -- Super admin puede subir documentos del cliente a cualquier caso
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- Abogados regulares pueden subir documentos del cliente solo a casos asignados
  (EXISTS (
    SELECT 1 FROM public.asignaciones_casos ac
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ac.caso_id = documentos_cliente.caso_id
    AND ac.abogado_id = auth.uid()
    AND ac.estado_asignacion = 'activa'
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'regular'
  ))
);

-- Actualizar política UPDATE para documentos_cliente
DROP POLICY IF EXISTS "Clientes pueden actualizar sus documentos" ON public.documentos_cliente;

CREATE POLICY "Clientes y abogados asignados pueden actualizar documentos del cliente"
ON public.documentos_cliente FOR UPDATE
USING (
  -- Clientes pueden actualizar sus propios documentos
  (auth.uid() = cliente_id)
  OR
  -- Super admin puede actualizar cualquier documento del cliente
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- Abogados regulares pueden actualizar documentos del cliente de casos asignados
  (EXISTS (
    SELECT 1 FROM public.asignaciones_casos ac
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ac.caso_id = documentos_cliente.caso_id
    AND ac.abogado_id = auth.uid()
    AND ac.estado_asignacion = 'activa'
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'regular'
  ))
);

-- Actualizar política DELETE para documentos_cliente
DROP POLICY IF EXISTS "Clientes pueden eliminar sus documentos" ON public.documentos_cliente;

CREATE POLICY "Clientes y abogados asignados pueden eliminar documentos del cliente"
ON public.documentos_cliente FOR DELETE
USING (
  -- Clientes pueden eliminar sus propios documentos
  (auth.uid() = cliente_id)
  OR
  -- Super admin puede eliminar cualquier documento del cliente
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'abogado' 
    AND tipo_abogado = 'super_admin'
  ))
  OR
  -- Abogados regulares pueden eliminar documentos del cliente de casos asignados
  (EXISTS (
    SELECT 1 FROM public.asignaciones_casos ac
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ac.caso_id = documentos_cliente.caso_id
    AND ac.abogado_id = auth.uid()
    AND ac.estado_asignacion = 'activa'
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'regular'
  ))
);

-- Actualizar política de storage para INSERT
DROP POLICY IF EXISTS "Subir documentos según rol actualizada" ON storage.objects;

CREATE POLICY "Subir documentos según rol actualizada"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND (
    -- Service role puede subir todo
    (auth.role() = 'service_role')
    OR
    -- Clientes pueden subir documentos a sus propios casos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    -- Super admin puede subir documentos a cualquier caso
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'abogado' 
      AND tipo_abogado = 'super_admin'
    ))
    OR
    -- Abogados regulares pueden subir documentos a casos asignados
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.asignaciones_casos ac
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ac.caso_id::text = (string_to_array(name, '/'))[2]
      AND ac.abogado_id = auth.uid()
      AND ac.estado_asignacion = 'activa'
      AND p.role = 'abogado'
      AND p.tipo_abogado = 'regular'
    ))
  )
);

-- Log de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Abogados regulares ahora pueden subir documentos del cliente a casos asignados';
  RAISE NOTICE 'Políticas RLS actualizadas para documentos_cliente y storage.objects';
END $$; 