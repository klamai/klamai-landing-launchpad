-- Permitir registros de cobros ad-hoc sin payment_intent hasta que Stripe complete el pago
-- Hace nullable la columna stripe_payment_intent_id en public.pagos

DO $$ BEGIN
  ALTER TABLE public.pagos
  ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Nota: la restricción UNIQUE existente permite múltiples NULL en Postgres
