-- Arreglar el índice único de comunicaciones
-- El índice actual solo permite UNA comunicación por caso, pero necesitamos permitir
-- múltiples estados (pendiente -> enviado -> fallo)

-- 1. Eliminar el índice problemático
DROP INDEX IF EXISTS comunicaciones_unique_idx;

-- 2. Crear un nuevo índice que permita múltiples estados pero evite duplicados reales
-- Solo evitamos que haya múltiples comunicaciones PENDIENTES para el mismo caso
CREATE UNIQUE INDEX comunicaciones_unique_pendiente_idx
ON public.comunicaciones (caso_id, tipo)
WHERE canal = 'whatsapp' AND estado = 'pendiente';

-- 3. Crear índices adicionales para optimizar consultas
CREATE INDEX IF NOT EXISTS comunicaciones_caso_tipo_idx
ON public.comunicaciones (caso_id, tipo, canal, estado);

CREATE INDEX IF NOT EXISTS comunicaciones_pendientes_idx
ON public.comunicaciones (estado, enviado_at)
WHERE estado = 'pendiente';

-- 4. Comentarios explicativos
COMMENT ON INDEX comunicaciones_unique_pendiente_idx IS 
'Índice único que solo evita múltiples comunicaciones PENDIENTES para el mismo caso.
Permite que un caso tenga: pendiente -> enviado -> fallo (si es necesario).';

COMMENT ON INDEX comunicaciones_caso_tipo_idx IS 
'Índice compuesto para optimizar consultas por caso, tipo, canal y estado.';

COMMENT ON INDEX comunicaciones_pendientes_idx IS 
'Índice para optimizar consultas de comunicaciones pendientes por tiempo.';
