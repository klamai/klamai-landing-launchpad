-- Habilitar RLS
alter table notas_caso enable row level security;

-- Permitir lectura a:
-- - El cliente del caso
-- - El abogado asignado
-- - El superadmin
create policy "Permitir leer notas del caso según rol" on notas_caso
for select using (
  (
    -- Cliente: puede ver notas de su caso
    exists (
      select 1 from casos
      where casos.id = notas_caso.caso_id
      and casos.cliente_id = auth.uid()
    )
  )
  or
  (
    -- Abogado asignado: puede ver notas de sus casos asignados
    exists (
      select 1 from asignaciones_casos
      where asignaciones_casos.caso_id = notas_caso.caso_id
      and asignaciones_casos.abogado_id = auth.uid()
      and asignaciones_casos.estado_asignacion = 'activa'
    )
  )
  or
  (
    -- Superadmin: puede ver todas las notas
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'abogado'
      and profiles.tipo_abogado = 'super_admin'
    )
  )
);

-- Permitir insertar a:
-- - El cliente del caso
-- - El abogado asignado
-- - El superadmin
create policy "Permitir insertar notas del caso según rol" on notas_caso
for insert with check (
  (
    -- Cliente: puede escribir notas de su caso
    exists (
      select 1 from casos
      where casos.id = notas_caso.caso_id
      and casos.cliente_id = auth.uid()
    )
  )
  or
  (
    -- Abogado asignado: puede escribir notas de sus casos asignados
    exists (
      select 1 from asignaciones_casos
      where asignaciones_casos.caso_id = notas_caso.caso_id
      and asignaciones_casos.abogado_id = auth.uid()
      and asignaciones_casos.estado_asignacion = 'activa'
    )
  )
  or
  (
    -- Superadmin: puede escribir todas las notas
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'abogado'
      and profiles.tipo_abogado = 'super_admin'
    )
  )
);

-- Permitir actualización solo al autor de la nota
create policy "Permitir actualizar solo al autor" on notas_caso
for update using (
  autor_id = auth.uid()
);

-- Permitir borrado solo al superadmin
create policy "Permitir borrar solo superadmin" on notas_caso
for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'abogado'
    and profiles.tipo_abogado = 'super_admin'
  )
); 