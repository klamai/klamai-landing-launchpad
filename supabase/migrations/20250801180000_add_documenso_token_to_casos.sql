-- Agregar campo documenso_token a la tabla casos
ALTER TABLE casos 
ADD COLUMN documenso_token TEXT;

-- Agregar comentario al campo
COMMENT ON COLUMN casos.documenso_token IS 'Token de Documenso para documentos de firma digital';

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_casos_documenso_token ON casos(documenso_token);

-- Agregar política RLS para el campo documenso_token
-- Los clientes pueden ver el token de su propio caso
CREATE POLICY "Clientes pueden ver documenso_token de su caso" ON casos
FOR SELECT USING (
  auth.uid() = cliente_id
);

-- Los abogados asignados pueden ver y actualizar el token
CREATE POLICY "Abogados asignados pueden ver documenso_token" ON casos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = casos.id 
    AND ac.abogado_id = auth.uid()
  )
);

CREATE POLICY "Abogados asignados pueden actualizar documenso_token" ON casos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = casos.id 
    AND ac.abogado_id = auth.uid()
  )
);

-- Los super admins pueden ver y actualizar todos los tokens
CREATE POLICY "Super admins pueden ver documenso_token" ON casos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
); 