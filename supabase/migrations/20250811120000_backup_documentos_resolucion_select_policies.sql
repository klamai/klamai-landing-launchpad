-- Backup of RLS policies for 'documentos_resolucion' table before changes on 2024-08-11
-- This file can be used to restore the original SELECT policies if needed.

-- Policy 1: "Abogados ven documentos de sus casos"
CREATE POLICY "Abogados ven documentos de sus casos"
ON public.documentos_resolucion
AS PERMISSIVE
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'abogado'::profile_role_enum) AND (profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum))
  )) OR 
  (auth.uid() = abogado_id) OR 
  (EXISTS (
    SELECT 1
    FROM (casos c JOIN pagos p ON ((p.usuario_id = c.cliente_id)))
    WHERE ((c.id = documentos_resolucion.caso_id) AND (c.cliente_id = auth.uid()) AND (p.estado = 'succeeded'::pago_estado_enum) AND ((p.metadata_pago ->> 'caso_id'::text) = (documentos_resolucion.caso_id)::text))
  ))
);

-- Policy 2: "Acceso completo a documentos de resolución"
CREATE POLICY "Acceso completo a documentos de resolución"
ON public.documentos_resolucion
AS PERMISSIVE
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'abogado'::profile_role_enum) AND (profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum))
  )) OR 
  (auth.uid() = abogado_id) OR 
  (EXISTS (
    SELECT 1
    FROM (asignaciones_casos ac JOIN profiles p ON ((p.id = auth.uid())))
    WHERE ((ac.caso_id = documentos_resolucion.caso_id) AND (ac.abogado_id = auth.uid()) AND (ac.estado_asignacion = ANY (ARRAY['activa'::text, 'completada'::text])) AND (p.role = 'abogado'::profile_role_enum) AND (p.tipo_abogado = 'regular'::abogado_tipo_enum))
  )) OR 
  (EXISTS (
    SELECT 1
    FROM (casos c JOIN pagos p ON ((p.usuario_id = c.cliente_id)))
    WHERE ((c.id = documentos_resolucion.caso_id) AND (c.cliente_id = auth.uid()) AND (p.estado = 'succeeded'::pago_estado_enum) AND ((p.metadata_pago ->> 'caso_id'::text) = (documentos_resolucion.caso_id)::text))
  ))
);
