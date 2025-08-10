-- Ad-hoc payments columns, IVA breakdown and commission support
-- Safe to run multiple times using IF NOT EXISTS guards

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS concepto text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS tipo_cobro text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Allow null for backward compatibility; when set, must be 'ad_hoc' or 'plan'
DO $$ BEGIN
  ALTER TABLE public.pagos ADD CONSTRAINT chk_pagos_tipo_cobro
    CHECK (tipo_cobro IS NULL OR tipo_cobro IN ('ad_hoc','plan'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS monto_base numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS iva_tipo numeric(4,2);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS iva_monto numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS monto_total numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS exento boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS exencion_motivo text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS solicitado_por uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Foreign key to auth.users (cannot enforce in Postgres without extension); optional
-- Will be validated by application/service role

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS solicitante_rol text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD CONSTRAINT chk_pagos_solicitante_rol
    CHECK (solicitante_rol IS NULL OR solicitante_rol IN ('superadmin','abogado_regular'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS stripe_session_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS comision numeric(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Computed net amount = total - commission. Use generated column when available.
DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS monto_neto numeric(10,2);
  -- If generated columns supported and empty, try to set via trigger or keep as regular field
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pagos_caso_id ON public.pagos(caso_id);
CREATE INDEX IF NOT EXISTS idx_pagos_solicitado_por ON public.pagos(solicitado_por);
CREATE INDEX IF NOT EXISTS idx_pagos_stripe_session_id ON public.pagos(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_tipo_cobro ON public.pagos(tipo_cobro);

-- Backfill monto_total for existing rows if NULL (fallback to monto)
UPDATE public.pagos SET monto_total = COALESCE(monto_total, monto) WHERE monto_total IS NULL;

