-- Actualizar la política de SELECT para incluir el estado 'asignado' para super admins
-- Esto permite a los super admins ver casos en estado 'asignado' además de los otros estados
DROP POLICY IF EXISTS "Acceso a casos por rol y tipo" ON casos;

CREATE POLICY "Acceso a casos por rol y tipo" ON casos
FOR SELECT TO authenticated
USING (
  CASE
    WHEN (get_current_user_role() = 'cliente') THEN (auth.uid() = cliente_id)
    WHEN ((get_current_user_role() = 'abogado') AND (get_current_user_lawyer_type() = 'super_admin')) THEN (
      estado = ANY (ARRAY['disponible'::caso_estado_enum, 'asignado'::caso_estado_enum, 'agotado'::caso_estado_enum, 'cerrado'::caso_estado_enum, 'esperando_pago'::caso_estado_enum, 'listo_para_propuesta'::caso_estado_enum])
    )
    WHEN ((get_current_user_role() = 'abogado') AND (get_current_user_lawyer_type() = 'regular')) THEN (
      EXISTS (
        SELECT 1
        FROM asignaciones_casos ac
        WHERE ac.caso_id = casos.id 
        AND ac.abogado_id = auth.uid() 
        AND ac.estado_asignacion = ANY (ARRAY['activa', 'completada'])
      )
    )
    WHEN (cliente_id IS NULL) THEN true
    ELSE false
  END
); 