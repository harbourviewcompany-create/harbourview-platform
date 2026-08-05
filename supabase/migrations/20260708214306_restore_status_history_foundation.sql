-- Production's public.status_history relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact audit table contract without replacing rows. The
-- following migration remains authoritative for its reviewed read policy.

create table if not exists public.status_history (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by text not null default 'system'::text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_history_created_at
  on public.status_history (created_at desc);
create index if not exists idx_status_history_entity
  on public.status_history (entity_type, entity_id);

alter table public.status_history enable row level security;

grant select, insert, update, delete on table public.status_history
  to anon, authenticated;
grant all privileges on table public.status_history to service_role;
