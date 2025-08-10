-- Columns to track manual/automatic payouts to lawyers
DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS payout_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS payout_reference text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Optional check constraint for allowed statuses
DO $$ BEGIN
  ALTER TABLE public.pagos ADD CONSTRAINT chk_pagos_payout_status
    CHECK (payout_status IN ('pending','in_progress','paid','on_hold'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
