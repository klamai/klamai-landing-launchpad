-- Cambiar el tipo de la columna monto a numeric(10,2) para guardar 37.50 exacto
ALTER TABLE public.pagos
ALTER COLUMN monto TYPE numeric(10,2)
USING (monto::numeric);

