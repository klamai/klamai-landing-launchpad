
-- Enable REPLICA IDENTITY FULL on casos table to allow Realtime to access all fields during UPDATE operations
ALTER TABLE public.casos REPLICA IDENTITY FULL;
