-- Poblar notificaciones de prueba para casos existentes
-- Esto creará notificaciones específicas por caso para demostrar la funcionalidad

INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino, caso_id, leida)
SELECT 
  c.cliente_id,
  'Tu caso #' || SUBSTRING(c.id::text FROM 1 FOR 8) || ' ha sido creado y está en revisión.',
  '/dashboard/casos/' || c.id,
  c.id,
  false
FROM public.casos c
WHERE c.cliente_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.notificaciones n 
  WHERE n.caso_id = c.id 
  AND n.usuario_id = c.cliente_id
  AND n.mensaje LIKE '%ha sido creado%'
);

-- Crear notificaciones para casos asignados
INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino, caso_id, leida)
SELECT 
  c.cliente_id,
  'Tu caso #' || SUBSTRING(c.id::text FROM 1 FOR 8) || ' ha sido asignado a un abogado y está en proceso.',
  '/dashboard/casos/' || c.id,
  c.id,
  false
FROM public.casos c
INNER JOIN public.asignaciones_casos ac ON c.id = ac.caso_id
WHERE c.estado = 'asignado'
AND ac.estado_asignacion = 'activa'
AND NOT EXISTS (
  SELECT 1 FROM public.notificaciones n 
  WHERE n.caso_id = c.id 
  AND n.usuario_id = c.cliente_id
  AND n.mensaje LIKE '%ha sido asignado%'
);

-- Crear notificaciones para casos que requieren pago
INSERT INTO public.notificaciones (usuario_id, mensaje, url_destino, caso_id, leida)
SELECT 
  c.cliente_id,
  'Tu caso #' || SUBSTRING(c.id::text FROM 1 FOR 8) || ' requiere el pago para continuar con el proceso.',
  '/dashboard/casos/' || c.id,
  c.id,
  false
FROM public.casos c
WHERE c.estado = 'esperando_pago'
AND NOT EXISTS (
  SELECT 1 FROM public.notificaciones n 
  WHERE n.caso_id = c.id 
  AND n.usuario_id = c.cliente_id
  AND n.mensaje LIKE '%requiere el pago%'
);

-- Comentario explicativo
COMMENT ON TABLE public.notificaciones IS 'Tabla de notificaciones con soporte para filtrado por caso específico. Las notificaciones pueden ser generales (caso_id = NULL) o específicas de un caso.'; 