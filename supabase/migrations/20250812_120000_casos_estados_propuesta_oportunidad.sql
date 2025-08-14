DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'caso_estado_enum' AND e.enumlabel = 'propuesta_enviada'
  ) THEN
    ALTER TYPE caso_estado_enum ADD VALUE 'propuesta_enviada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'caso_estado_enum' AND e.enumlabel = 'oportunidad'
  ) THEN
    ALTER TYPE caso_estado_enum ADD VALUE 'oportunidad';
  END IF;
END $$;

ALTER TABLE public.casos
  ADD COLUMN IF NOT EXISTS propuesta_enviada_at timestamptz,
  ADD COLUMN IF NOT EXISTS chat_finalizado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_casos_estado ON public.casos(estado);
CREATE INDEX IF NOT EXISTS idx_casos_propuesta_enviada_at ON public.casos(propuesta_enviada_at);
CREATE INDEX IF NOT EXISTS idx_casos_chat_finalizado_at ON public.casos(chat_finalizado_at);

-- Re-crear política usando comparación por texto para incluir nuevos estados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='casos' AND policyname='Acceso a casos por rol y tipo'
  ) THEN
    DROP POLICY "Acceso a casos por rol y tipo" ON public.casos;
  END IF;
END $$;

CREATE POLICY "Acceso a casos por rol y tipo" ON public.casos
FOR SELECT TO authenticated
USING (
  CASE
    WHEN (get_current_user_role() = 'cliente') THEN (auth.uid() = cliente_id)
    WHEN ((get_current_user_role() = 'abogado') AND (get_current_user_lawyer_type() = 'super_admin')) THEN (
      (estado)::text = ANY (ARRAY[
        'disponible',
        'asignado',
        'agotado',
        'cerrado',
        'esperando_pago',
        'listo_para_propuesta',
        'propuesta_enviada',
        'oportunidad'
      ])
    )
    WHEN ((get_current_user_role() = 'abogado') AND (get_current_user_lawyer_type() = 'regular')) THEN (
      EXISTS (
        SELECT 1
        FROM asignaciones_casos ac
        WHERE ac.caso_id = casos.id
          AND ac.abogado_id = auth.uid()
          AND ac.estado_asignacion = ANY (ARRAY['activa','completada'])
      )
    )
    WHEN (cliente_id IS NULL) THEN true
    ELSE false
  END
);

