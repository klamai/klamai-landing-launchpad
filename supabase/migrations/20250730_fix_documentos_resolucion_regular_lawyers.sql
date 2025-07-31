-- ========================================
-- CORREGIR ACCESO A DOCUMENTOS DE RESOLUCIÓN PARA ABOGADOS REGULARES
-- ========================================

-- Actualizar política SELECT para documentos_resolucion
DROP POLICY IF EXISTS "Clientes pueden ver documentos de resolución si han pagado" ON public.documentos_resolucion;

CREATE POLICY "Acceso completo a documentos de resolución"
ON public.documentos_resolucion
FOR SELECT
USING (
  (
    -- Super admin puede ver todo
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'abogado'::profile_role_enum
        AND profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum
    )
    OR
    -- El abogado que subió el documento
    (auth.uid() = abogado_id)
    OR
    -- Abogados regulares asignados al caso pueden ver documentos
    EXISTS (
      SELECT 1 FROM asignaciones_casos ac
      JOIN profiles p ON p.id = auth.uid()
      WHERE ac.caso_id = documentos_resolucion.caso_id
        AND ac.abogado_id = auth.uid()
        AND ac.estado_asignacion IN ('activa', 'completada')
        AND p.role = 'abogado'::profile_role_enum
        AND p.tipo_abogado = 'regular'::abogado_tipo_enum
    )
    OR
    -- El cliente puede ver documentos SOLO si ha pagado ese caso
    EXISTS (
      SELECT 1 FROM casos c
      JOIN pagos p ON p.usuario_id = c.cliente_id
      WHERE c.id = documentos_resolucion.caso_id
        AND c.cliente_id = auth.uid()
        AND p.estado = 'succeeded'::pago_estado_enum
        AND p.metadata_pago->>'caso_id' = documentos_resolucion.caso_id::text
    )
  )
);

-- Log de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración completada: Abogados regulares asignados ahora pueden ver documentos de resolución';
  RAISE NOTICE 'Política SELECT actualizada para documentos_resolucion';
END $$; 