-- Política para que super admin pueda actualizar casos (manteniendo la seguridad para clientes)
-- Primero eliminar la política si existe
DROP POLICY IF EXISTS "Super admin puede actualizar casos" ON public.casos;

-- Luego crear la nueva política
CREATE POLICY "Super admin puede actualizar casos"
ON public.casos 
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
