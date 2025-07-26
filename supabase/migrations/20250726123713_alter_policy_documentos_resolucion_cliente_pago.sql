-- Actualiza la política de SELECT para documentos_resolucion
ALTER POLICY "Clientes pueden ver documentos de resolución si han pagado"
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