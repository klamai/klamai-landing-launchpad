
-- Habilitar realtime para la tabla casos
ALTER TABLE public.casos REPLICA IDENTITY FULL;

-- Agregar la tabla casos a la publicación realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.casos;
