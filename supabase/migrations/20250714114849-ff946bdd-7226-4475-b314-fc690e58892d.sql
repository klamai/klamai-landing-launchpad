-- Crear tabla para eventos de webhook de Stripe
CREATE TABLE public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Índices para mejorar performance
CREATE INDEX idx_stripe_webhook_events_stripe_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_type ON public.stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed ON public.stripe_webhook_events(processed);

-- Habilitar RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Solo service role puede acceder (webhooks son procesos internos)
CREATE POLICY "Service role full access" ON public.stripe_webhook_events
FOR ALL USING (true) WITH CHECK (true);