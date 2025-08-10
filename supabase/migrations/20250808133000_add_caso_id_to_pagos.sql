-- Añadir relación directa de pagos al caso y su índice
ALTER TABLE public.pagos
ADD COLUMN IF NOT EXISTS caso_id uuid REFERENCES public.casos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_caso_id ON public.pagos(caso_id);

