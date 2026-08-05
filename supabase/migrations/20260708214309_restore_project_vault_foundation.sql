-- Production's public.project_vault relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- enum, trigger-function, or table creators. Restore the exact production
-- foundation without replacing existing rows. The following migration remains
-- authoritative for the four reviewed admin-only policy definitions.

do $restore_project_status$
begin
  create type public.project_status as enum (
    'complete',
    'needs_work',
    'can_be_built',
    'raw',
    'archived'
  );
exception
  when duplicate_object then null;
end
$restore_project_status$;

do $restore_project_category$
begin
  create type public.project_category as enum (
    'website',
    'app',
    'program',
    'html',
    'tool',
    'game',
    'other'
  );
exception
  when duplicate_object then null;
end
$restore_project_category$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists public.project_vault (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  original_filename text not null,
  file_path text,
  bucket text default 'project-vault'::text,
  file_type text,
  file_size_bytes bigint,
  status public.project_status default 'raw'::public.project_status,
  category public.project_category default 'other'::public.project_category,
  notes text,
  tags text[] default '{}'::text[],
  entry_point text,
  preview_url text,
  contents jsonb,
  uploaded_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_vault_category
  on public.project_vault (category);
create index if not exists idx_project_vault_status
  on public.project_vault (status);
create index if not exists idx_project_vault_uploaded_at
  on public.project_vault (uploaded_at desc);

alter table public.project_vault enable row level security;

grant select, insert, update, delete on table public.project_vault
  to anon, authenticated;
grant all privileges on table public.project_vault to service_role;

drop trigger if exists project_vault_updated_at on public.project_vault;
create trigger project_vault_updated_at
  before update on public.project_vault
  for each row execute function public.update_updated_at();
