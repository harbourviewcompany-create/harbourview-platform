-- Production's private internal-admin notes relation existed out of band before
-- the July 8 RLS initplan snapshot. Restore the exact server-control contract
-- during zero-state replay without replacing or updating existing notes.

create table if not exists public.internal_admin_notes (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  note text not null,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notes_entity
  on public.internal_admin_notes(entity_type, entity_id);

alter table public.internal_admin_notes enable row level security;

comment on table public.internal_admin_notes is
  'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server/service-role paths.';

-- Match the production ACL. The immediately following July 8 snapshot installs
-- the reviewed admin/operator SELECT policy; all client writes remain denied by RLS.
grant select, insert, update, delete on table public.internal_admin_notes
  to anon, authenticated;
grant all privileges on table public.internal_admin_notes to service_role;
