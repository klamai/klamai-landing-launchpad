CREATE TABLE IF NOT EXISTS public.propuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  content jsonb,
  rendered_html text,
  sent_at timestamptz,
  sent_via text,
  sent_to_email text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propuestas_caso ON public.propuestas(caso_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_sent_at ON public.propuestas(sent_at);

ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='propuestas' AND policyname='propuestas_select_admin_abogado'
  ) THEN
    DROP POLICY "propuestas_select_admin_abogado" ON public.propuestas;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='propuestas' AND policyname='propuestas_insert_admin_abogado'
  ) THEN
    DROP POLICY "propuestas_insert_admin_abogado" ON public.propuestas;
  END IF;
END $$;

CREATE POLICY "propuestas_select_admin_abogado" ON public.propuestas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'abogado' AND p.tipo_abogado = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = propuestas.caso_id
      AND ac.abogado_id = auth.uid()
      AND ac.estado_asignacion IN ('activa','completada')
  )
);

CREATE POLICY "propuestas_insert_admin_abogado" ON public.propuestas
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'abogado' AND p.tipo_abogado = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM asignaciones_casos ac
    WHERE ac.caso_id = propuestas.caso_id
      AND ac.abogado_id = auth.uid()
      AND ac.estado_asignacion IN ('activa','completada')
  )
);

