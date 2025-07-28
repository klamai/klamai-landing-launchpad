-- ========================================
-- PERMITIR QUE ABOGADOS REGULARES CIERREN CASOS ASIGNADOS
-- ========================================

-- 1. Verificar que los campos fecha_cierre y cerrado_por existen
-- (Estos campos ya fueron agregados en migraciones anteriores)

-- 2. Crear índices para mejorar el rendimiento de consultas de casos cerrados
-- (Solo si no existen ya)
CREATE INDEX IF NOT EXISTS idx_casos_fecha_cierre ON public.casos(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_casos_cerrado_por ON public.casos(cerrado_por);
CREATE INDEX IF NOT EXISTS idx_casos_estado_fecha_cierre ON public.casos(estado, fecha_cierre);

-- 3. Eliminar política anterior si existe
DROP POLICY IF EXISTS "Super admin puede actualizar casos" ON public.casos;

-- 4. Crear nueva política RLS para permitir que abogados regulares actualicen casos asignados
CREATE POLICY "Abogados pueden actualizar casos asignados"
ON public.casos
FOR UPDATE
TO authenticated
USING (
  -- Super admin puede actualizar cualquier caso
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'abogado'
    AND tipo_abogado = 'super_admin'
  )
  OR
  -- Abogado regular puede actualizar casos asignados
  EXISTS (
    SELECT 1 FROM public.asignaciones_casos ac
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE ac.caso_id = casos.id
    AND ac.abogado_id = auth.uid()
    AND ac.estado_asignacion = 'activa'
    AND p.role = 'abogado'
    AND p.tipo_abogado = 'regular'
  )
  OR
  -- Cliente puede actualizar sus propios casos (mantener funcionalidad existente)
  (auth.uid() = cliente_id)
);

-- 5. Agregar comentarios para documentar la funcionalidad
COMMENT ON COLUMN public.casos.fecha_cierre IS 'Fecha y hora cuando el caso fue cerrado';
COMMENT ON COLUMN public.casos.cerrado_por IS 'ID del usuario (abogado) que cerró el caso';
COMMENT ON POLICY "Abogados pueden actualizar casos asignados" ON public.casos IS 'Permite que super admins, abogados regulares asignados y clientes puedan actualizar casos';

-- 6. Verificar que la tabla auditoria_seguridad existe y tiene la estructura correcta
-- (Esta tabla ya debería existir de migraciones anteriores)

-- 7. Log de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Abogados regulares ahora pueden cerrar casos asignados';
  RAISE NOTICE 'Índices creados para optimizar consultas de casos cerrados';
  RAISE NOTICE 'Política RLS actualizada para permitir actualizaciones de abogados asignados';
END $$; 