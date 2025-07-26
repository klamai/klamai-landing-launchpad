-- Elimina la política anterior si existe
DROP POLICY IF EXISTS "Subir documentos según rol actualizada" ON storage.objects;

-- Crea la política actualizada
CREATE POLICY "Subir documentos según rol actualizada"
ON storage.objects
FOR INSERT
TO public
USING (
  (bucket_id = 'documentos_legales'::text)
  AND (
    (auth.role() = 'service_role'::text)
    OR (
      (auth.uid() IS NOT NULL)
      AND ((string_to_array(name, '/'::text))[3] = 'documentos_cliente'::text)
      AND (
        (
          EXISTS (
            SELECT 1 FROM casos
            WHERE ((casos.id)::text = (string_to_array(objects.name, '/'::text))[2])
              AND (casos.cliente_id = auth.uid())
          )
        )
        OR (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE (profiles.id = auth.uid())
              AND (profiles.role = 'abogado'::profile_role_enum)
              AND (profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum)
          )
        )
      )
    )
    OR (
      (auth.uid() IS NOT NULL)
      AND ((string_to_array(name, '/'::text))[3] = 'documentos_resolucion'::text)
      AND (
        (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE (profiles.id = auth.uid())
              AND (profiles.role = 'abogado'::profile_role_enum)
              AND (profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum)
          )
        )
        OR (
          EXISTS (
            SELECT 1 FROM asignaciones_casos ac
            WHERE ((ac.caso_id)::text = (string_to_array(objects.name, '/'::text))[2])
              AND (ac.abogado_id = auth.uid())
              AND (ac.estado_asignacion = 'activa'::text)
          )
        )
      )
    )
  )
); 