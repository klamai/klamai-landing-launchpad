
-- Crear tabla de notificaciones para el sistema
CREATE TABLE public.notificaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  url_destino TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para notificaciones
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean solo sus notificaciones
CREATE POLICY "Users can view their own notifications" 
  ON public.notificaciones 
  FOR SELECT 
  USING (auth.uid() = usuario_id);

-- Política para insertar notificaciones (para triggers futuros)
CREATE POLICY "Service role can insert notifications" 
  ON public.notificaciones 
  FOR INSERT 
  WITH CHECK (true);

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;

-- Agregar campos necesarios a la tabla casos para mejor gestión
ALTER TABLE public.casos 
ADD COLUMN IF NOT EXISTS fecha_ultimo_contacto TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tiene_notificaciones_nuevas BOOLEAN DEFAULT false;

-- Función para crear notificación cuando se actualiza un caso
CREATE OR REPLACE FUNCTION public.notify_case_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear notificación si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino)
    VALUES (
      NEW.cliente_id,
      'El estado de tu caso #' || SUBSTRING(NEW.id::text FROM 1 FOR 8) || ' ha cambiado a: ' || NEW.estado,
      '/dashboard/casos/' || NEW.id
    );
    
    -- Marcar que tiene notificaciones nuevas
    NEW.tiene_notificaciones_nuevas = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificaciones automáticas
DROP TRIGGER IF EXISTS trigger_notify_case_update ON public.casos;
CREATE TRIGGER trigger_notify_case_update
  BEFORE UPDATE ON public.casos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_case_update();
