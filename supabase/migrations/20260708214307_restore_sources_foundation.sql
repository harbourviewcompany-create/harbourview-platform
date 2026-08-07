-- Production's public.sources relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact minimal production contract without replacing
-- rows. The following migration remains authoritative for its reviewed policy.

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

alter table public.sources enable row level security;

grant select, insert, update, delete on table public.sources
  to anon, authenticated;
grant all privileges on table public.sources to service_role;
