-- Fix RLS policies for anonymous users to access cases they created
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios casos" ON public.casos;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios casos" ON public.casos;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios casos" ON public.casos;

-- Create new policies that allow anonymous users to access cases they created
CREATE POLICY "Usuarios pueden ver casos que crearon" ON public.casos
FOR SELECT USING (
  (auth.uid() = cliente_id) OR 
  (cliente_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Usuarios pueden actualizar casos que crearon" ON public.casos  
FOR UPDATE USING (
  (auth.uid() = cliente_id) OR 
  (cliente_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Usuarios pueden crear casos" ON public.casos
FOR INSERT WITH CHECK (
  (auth.uid() = cliente_id) OR 
  (cliente_id IS NULL AND auth.uid() IS NULL)
);

-- Add casos table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.casos;