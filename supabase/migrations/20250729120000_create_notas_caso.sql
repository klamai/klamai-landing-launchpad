create table notas_caso (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id) on delete cascade,
  autor_id uuid references profiles(id) on delete set null,
  autor_rol text not null,
  destinatario text not null check (destinatario in ('cliente', 'abogado', 'ambos')),
  contenido text not null,
  created_at timestamptz not null default now()
);

create index idx_notas_caso_caso_id on notas_caso(caso_id); 