-- Añadir campo caso_id a la tabla notificaciones para filtrar por caso específico
ALTER TABLE public.notificaciones 
ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES public.casos(id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento de consultas por caso
CREATE INDEX IF NOT EXISTS idx_notificaciones_caso_id ON public.notificaciones(caso_id);

-- Actualizar la política de notificaciones para incluir el filtro por caso
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notificaciones;

-- Nueva política que permite ver notificaciones propias y del caso específico
CREATE POLICY "Users can view their own notifications" 
  ON public.notificaciones 
  FOR SELECT 
  USING (
    auth.uid() = usuario_id AND 
    (caso_id IS NULL OR EXISTS (
      SELECT 1 FROM public.casos 
      WHERE id = caso_id 
      AND cliente_id = auth.uid()
    ))
  );

-- Actualizar la función de notificación para incluir caso_id
CREATE OR REPLACE FUNCTION public.notify_case_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear notificación si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino, caso_id)
    VALUES (
      NEW.cliente_id,
      'El estado de tu caso #' || SUBSTRING(NEW.id::text FROM 1 FOR 8) || ' ha cambiado a: ' || NEW.estado,
      '/dashboard/casos/' || NEW.id,
      NEW.id
    );
    
    -- Marcar que tiene notificaciones nuevas
    NEW.tiene_notificaciones_nuevas = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario explicativo
COMMENT ON COLUMN public.notificaciones.caso_id IS 'ID del caso al que se refiere la notificación. NULL para notificaciones generales del sistema.'; 