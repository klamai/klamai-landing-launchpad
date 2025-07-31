-- Eliminar la política conflictiva que solo permite a clientes actualizar casos
-- Esta política estaba interfiriendo con la política de abogados
DROP POLICY IF EXISTS "Solo propietarios pueden actualizar casos" ON casos; 