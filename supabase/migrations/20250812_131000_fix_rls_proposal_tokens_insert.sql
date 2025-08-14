DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='proposal_tokens' AND policyname='proposal_tokens_insert_admin_abogado'
  ) THEN
    DROP POLICY "proposal_tokens_insert_admin_abogado" ON public.proposal_tokens;
  END IF;
END $$;

CREATE POLICY "proposal_tokens_insert_admin_abogado" ON public.proposal_tokens
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'abogado' AND p.tipo_abogado = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = proposal_tokens.caso_id
      AND ac.abogado_id = auth.uid()
      AND ac.estado_asignacion IN ('activa','completada')
  )
);

