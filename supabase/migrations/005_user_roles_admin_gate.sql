create table if not exists public.user_roles (
  user_id uuid not null,
  role text not null check (role in ('admin', 'operator', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  created_by uuid,
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_user_roles_role on public.user_roles(role);

comment on table public.user_roles is 'Internal Harbourview role assignments for admin provenance access.';
comment on column public.user_roles.role is 'Allowed values: admin, operator, analyst, viewer.';
