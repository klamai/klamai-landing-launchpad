-- Make data column nullable to allow sanitized-only storage
ALTER TABLE public.stripe_webhook_events
  ALTER COLUMN data DROP NOT NULL;