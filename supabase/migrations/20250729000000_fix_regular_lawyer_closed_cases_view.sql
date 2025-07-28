-- ========================================
-- CORREGIR POLÍTICA RLS PARA ABOGADOS REGULARES VEAN CASOS CERRADOS
-- ========================================

-- Actualizar política RLS para que abogados regulares puedan ver casos con asignaciones completadas
DROP POLICY IF EXISTS "Acceso a casos por rol y tipo" ON public.casos;

CREATE POLICY "Acceso a casos por rol y tipo"
ON public.casos
FOR SELECT
TO authenticated
USING (
  CASE
    -- Clientes ven solo sus casos
    WHEN (get_current_user_role() = 'cliente') THEN 
      (auth.uid() = cliente_id)
    -- Super admin ve todos los casos disponibles
    WHEN (get_current_user_role() = 'abogado' AND get_current_user_lawyer_type() = 'super_admin') THEN 
      (estado IN ('disponible', 'agotado', 'cerrado'))
    -- Abogados regulares ven casos asignados (activos y completados)
    WHEN (get_current_user_role() = 'abogado' AND get_current_user_lawyer_type() = 'regular') THEN 
      EXISTS (
        SELECT 1 FROM public.asignaciones_casos ac
        WHERE ac.caso_id = casos.id
        AND ac.abogado_id = auth.uid()
        AND ac.estado_asignacion IN ('activa', 'completada')
      )
    -- Casos borrador (sin dueño) son visibles para todos
    WHEN (cliente_id IS NULL) THEN true
    ELSE false
  END
);

-- Agregar comentario para documentar el cambio
COMMENT ON POLICY "Acceso a casos por rol y tipo" ON public.casos IS 'Permite que abogados regulares vean casos asignados tanto activos como completados (cerrados)';

-- Log de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Abogados regulares ahora pueden ver sus casos cerrados';
  RAISE NOTICE 'Política RLS actualizada para incluir asignaciones completadas';
END $$;