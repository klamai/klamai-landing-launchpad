
-- Eliminar todas las políticas existentes para storage.objects
DROP POLICY IF EXISTS "Users can upload documents to their own cases" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users and service role can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own case documents" ON storage.objects;

-- Política para que usuarios puedan VER documentos de sus propios casos
CREATE POLICY "Users can view their own case documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos_legales' 
  AND (
    -- Usuarios autenticados pueden ver documentos de sus propios casos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    -- Service role puede ver todo
    (auth.role() = 'service_role')
  )
);

-- Política para que usuarios puedan SUBIR documentos a sus propios casos
CREATE POLICY "Users can upload documents to their own cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND (
    -- Usuarios autenticados pueden subir a sus propios casos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    -- Service role puede crear archivos iniciales
    (auth.role() = 'service_role')
  )
);

-- Política para ACTUALIZAR/SOBRESCRIBIR archivos
CREATE POLICY "Users can update their own case documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    (auth.role() = 'service_role')
  )
);

-- Política para ELIMINAR documentos
CREATE POLICY "Users can delete their own case documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (string_to_array(name, '/'))[2]
      AND cliente_id = auth.uid()
    ))
    OR
    (auth.role() = 'service_role')
  )
);

-- Política para service role (acceso completo para funciones edge)
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documentos_legales' 
  AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND auth.role() = 'service_role'
);
