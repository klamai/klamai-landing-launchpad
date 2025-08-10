-- Añadir columnas e índices en stripe_webhook_events para trazabilidad sin PII
ALTER TABLE public.stripe_webhook_events
ADD COLUMN IF NOT EXISTS caso_id uuid REFERENCES public.casos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS amount_total_cents integer,
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_sanitizada jsonb;

CREATE INDEX IF NOT EXISTS idx_swe_caso_id ON public.stripe_webhook_events(caso_id);
CREATE INDEX IF NOT EXISTS idx_swe_session_id ON public.stripe_webhook_events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_swe_payment_intent_id ON public.stripe_webhook_events(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_swe_user_id ON public.stripe_webhook_events(user_id);

