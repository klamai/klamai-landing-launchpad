-- Renombrar el campo documenso_token a hoja_encargo_token
ALTER TABLE casos 
RENAME COLUMN documenso_token TO hoja_encargo_token;

-- Actualizar el comentario del campo
COMMENT ON COLUMN casos.hoja_encargo_token IS 'Token para hoja de encargo digital';

-- Renombrar el índice
DROP INDEX IF EXISTS idx_casos_documenso_token;
CREATE INDEX IF NOT EXISTS idx_casos_hoja_encargo_token ON casos(hoja_encargo_token);

-- Eliminar las políticas RLS antiguas
DROP POLICY IF EXISTS "Clientes pueden ver documenso_token de su caso" ON casos;
DROP POLICY IF EXISTS "Abogados asignados pueden ver documenso_token" ON casos;
DROP POLICY IF EXISTS "Abogados asignados pueden actualizar documenso_token" ON casos;
DROP POLICY IF EXISTS "Super admins pueden ver documenso_token" ON casos;

-- Crear nuevas políticas RLS para hoja_encargo_token
-- Los clientes pueden ver la hoja de encargo de su propio caso
CREATE POLICY "Clientes pueden ver hoja_encargo_token de su caso" ON casos
FOR SELECT USING (
  auth.uid() = cliente_id
);

-- Los abogados asignados pueden ver la hoja de encargo
CREATE POLICY "Abogados asignados pueden ver hoja_encargo_token" ON casos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = casos.id 
    AND ac.abogado_id = auth.uid()
  )
);

-- Solo los super admins pueden crear y actualizar hojas de encargo
CREATE POLICY "Super admins pueden crear hoja_encargo_token" ON casos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'super_admin'
  )
);

CREATE POLICY "Super admins pueden actualizar hoja_encargo_token" ON casos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'super_admin'
  )
); 