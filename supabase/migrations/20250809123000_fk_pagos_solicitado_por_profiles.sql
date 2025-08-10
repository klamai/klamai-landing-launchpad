-- FK desde pagos.solicitado_por a public.profiles(id) e índice auxiliar

DO $$ BEGIN
  ALTER TABLE public.pagos
    ADD CONSTRAINT fk_pagos_solicitado_por_profiles
    FOREIGN KEY (solicitado_por)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_pagos_solicitado_por_fk ON public.pagos(solicitado_por);

COMMENT ON CONSTRAINT fk_pagos_solicitado_por_profiles ON public.pagos IS 'Referencia opcional al usuario que solicitó el cobro (profiles.id)';

