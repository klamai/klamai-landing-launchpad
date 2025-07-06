
-- Enable realtime for casos table
ALTER TABLE public.casos REPLICA IDENTITY FULL;

-- Add casos table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.casos;
