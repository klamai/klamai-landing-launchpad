-- Añadir índice para acelerar búsquedas por stripe_session_id usado en el webhook
CREATE INDEX IF NOT EXISTS idx_casos_stripe_session_id
ON public.casos(stripe_session_id);

