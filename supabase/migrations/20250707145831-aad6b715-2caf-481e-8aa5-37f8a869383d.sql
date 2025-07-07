
-- Actualizar política SELECT para permitir que usuarios autenticados accedan a casos anónimos
DROP POLICY IF EXISTS "Usuarios pueden ver casos que crearon" ON casos;
CREATE POLICY "Usuarios pueden ver casos que crearon" ON casos
FOR SELECT
USING ((auth.uid() = cliente_id) OR (cliente_id IS NULL));

-- Actualizar política UPDATE para permitir que usuarios autenticados vinculen casos anónimos
DROP POLICY IF EXISTS "Usuarios pueden actualizar casos que crearon" ON casos;
CREATE POLICY "Usuarios pueden actualizar casos que crearon" ON casos
FOR UPDATE
USING ((auth.uid() = cliente_id) OR (cliente_id IS NULL));
