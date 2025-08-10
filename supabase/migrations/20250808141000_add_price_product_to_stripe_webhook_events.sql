-- Añadir columnas para trazabilidad del producto y precio en eventos de Stripe
ALTER TABLE public.stripe_webhook_events
ADD COLUMN IF NOT EXISTS price_id text,
ADD COLUMN IF NOT EXISTS product_id text;

CREATE INDEX IF NOT EXISTS idx_swe_price_id ON public.stripe_webhook_events(price_id);
CREATE INDEX IF NOT EXISTS idx_swe_product_id ON public.stripe_webhook_events(product_id);

