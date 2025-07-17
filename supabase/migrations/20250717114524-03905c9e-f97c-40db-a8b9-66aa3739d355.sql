
-- Crear política que permite a super admin ver perfiles de todos los abogados
CREATE POLICY "Super admin can view all lawyer profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Si el usuario actual es super admin, puede ver perfiles de abogados
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'abogado' 
    AND p.tipo_abogado = 'super_admin'
  ) 
  AND role = 'abogado'
);
