
-- Actualizar políticas RLS para permitir que el service role cree carpetas y archivos iniciales
DROP POLICY IF EXISTS "Users can upload documents to their own cases" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage case documents" ON storage.objects;

-- Política para que usuarios puedan subir a sus propios casos
CREATE POLICY "Users can upload documents to their own cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos_legales' 
  AND (
    -- Usuarios autenticados pueden subir a sus propios casos
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (storage.foldername(name))[1] 
      AND cliente_id = auth.uid()
    ))
    OR
    -- Service role puede crear archivos iniciales (para la función edge)
    (auth.role() = 'service_role')
  )
);

-- Política para que el service role pueda gestionar documentos de casos
CREATE POLICY "Service role can manage case documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documentos_legales' 
  AND auth.role() = 'service_role'
);

-- Política específica para actualizaciones (sobrescribir archivos existentes)
CREATE POLICY "Users and service role can update case documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documentos_legales' 
  AND (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id::text = (storage.foldername(name))[1] 
      AND cliente_id = auth.uid()
    ))
    OR
    (auth.role() = 'service_role')
  )
);
