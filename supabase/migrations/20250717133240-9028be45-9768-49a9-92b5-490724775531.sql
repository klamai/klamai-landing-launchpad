
-- Eliminar la política problemática que causa recursión infinita
DROP POLICY IF EXISTS "Super admin can view all lawyer profiles" ON public.profiles;

-- Crear nueva política segura usando las funciones SECURITY DEFINER existentes
CREATE POLICY "Super admin can view other lawyer profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Super admin puede ver perfiles de otros abogados
  (get_current_user_role() = 'abogado' 
   AND get_current_user_lawyer_type() = 'super_admin' 
   AND role = 'abogado')
  OR
  -- Todos pueden ver su propio perfil (mantener funcionalidad existente)
  (auth.uid() = id)
);
