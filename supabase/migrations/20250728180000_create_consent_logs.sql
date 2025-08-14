-- Crear tabla de auditoría de consentimientos
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  caso_id uuid references public.casos(id),
  proposal_token text,
  consent_type text not null,
  accepted_terms boolean default false,
  accepted_privacy boolean default false,
  accepted_marketing boolean default false,
  policy_terms_version int,
  policy_privacy_version int,
  cookies_policy_version int,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.consent_logs is 'Registro de consentimientos (RGPD) con prueba legal y versionado de políticas';

-- Índices útiles
create index if not exists consent_logs_user_idx on public.consent_logs(user_id);
create index if not exists consent_logs_caso_idx on public.consent_logs(caso_id);
create index if not exists consent_logs_token_idx on public.consent_logs(proposal_token);

-- Columnas opcionales en profiles para control de versión de políticas
alter table public.profiles
  add column if not exists politicas_aceptadas_at timestamptz,
  add column if not exists politicas_version int;



