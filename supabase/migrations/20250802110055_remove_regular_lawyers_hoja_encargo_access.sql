-- Eliminar política que permite a abogados regulares ver hojas de encargo
DROP POLICY IF EXISTS "Abogados asignados pueden ver hoja_encargo_token" ON casos;

-- Crear política más restrictiva: solo super admins pueden ver hojas de encargo
CREATE POLICY "Solo super admins pueden ver hoja_encargo_token" ON casos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'super_admin'
  )
  OR auth.uid() = cliente_id  -- Los clientes también pueden ver su propia hoja de encargo
); 