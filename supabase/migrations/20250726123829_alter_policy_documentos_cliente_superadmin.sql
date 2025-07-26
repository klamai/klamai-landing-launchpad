-- Actualiza la política de insert para documentos_cliente para permitir también al super admin
ALTER POLICY "Clientes pueden subir documentos a sus casos"
ON public.documentos_cliente
TO public
WITH CHECK (
  (
    (auth.uid() = cliente_id
      AND EXISTS (
        SELECT 1 FROM casos
        WHERE casos.id = documentos_cliente.caso_id
          AND casos.cliente_id = auth.uid()
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'abogado'::profile_role_enum
          AND profiles.tipo_abogado = 'super_admin'::abogado_tipo_enum
      )
    )
  )
); 