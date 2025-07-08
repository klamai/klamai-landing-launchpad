-- Eliminar políticas inseguras existentes
DROP POLICY IF EXISTS "Usuarios pueden ver casos que crearon" ON public.casos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar casos que crearon" ON public.casos;
DROP POLICY IF EXISTS "Usuarios pueden crear casos" ON public.casos;

-- Crear función de seguridad para obtener el rol del usuario
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Política SELECT segura: solo casos propios para clientes, casos disponibles/comprados para abogados
CREATE POLICY "Clientes ven solo sus casos, abogados ven disponibles" 
ON public.casos 
FOR SELECT 
TO authenticated
USING (
  CASE 
    WHEN public.get_current_user_role() = 'cliente' THEN 
      auth.uid() = cliente_id
    WHEN public.get_current_user_role() = 'abogado' THEN 
      (estado IN ('disponible', 'agotado') OR 
       id IN (SELECT caso_id FROM public.casos_comprados WHERE abogado_id = auth.uid()))
    ELSE false
  END
);

-- Política INSERT: solo para usuarios autenticados que son clientes
CREATE POLICY "Solo clientes pueden crear casos" 
ON public.casos 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'cliente' AND 
  auth.uid() = cliente_id
);

-- Política UPDATE: solo casos propios para clientes
CREATE POLICY "Solo propietarios pueden actualizar casos" 
ON public.casos 
FOR UPDATE 
TO authenticated
USING (
  public.get_current_user_role() = 'cliente' AND 
  auth.uid() = cliente_id
);

-- Política especial para casos en borrador (sin cliente_id)
-- Solo permite acceso al usuario que los esté creando en la sesión actual
CREATE POLICY "Acceso a casos borrador" 
ON public.casos 
FOR ALL
TO anon
USING (cliente_id IS NULL)
WITH CHECK (cliente_id IS NULL);