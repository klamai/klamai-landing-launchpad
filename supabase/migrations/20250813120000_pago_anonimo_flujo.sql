-- Añade el nuevo estado para gestionar los casos pagados por usuarios anónimos
ALTER TYPE public.caso_estado_enum ADD VALUE 'pago_realizado_pendiente_registro';

-- Añade una columna para un token de seguridad que permita vincular el pago a la cuenta posteriormente
-- Es nullable porque solo se usará en este flujo específico.
ALTER TABLE public.casos
ADD COLUMN token_reclamacion_pago text NULL;


