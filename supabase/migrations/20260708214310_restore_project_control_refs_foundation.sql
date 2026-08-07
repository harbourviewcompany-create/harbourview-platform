-- Production's project_control_refs ledger existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact table, constraints, indexes, ACL and RLS state;
-- the following migration installs the three reviewed production policies.

create table if not exists public.project_control_refs (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  external_type text not null,
  external_id text not null,
  external_url text,
  canonical_entity_type text not null,
  canonical_entity_id text,
  canonical_key text not null,
  authority text not null default 'reference'::text,
  write_mode text not null default 'read_only'::text,
  title text,
  status text,
  source_hash text,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_control_refs_system_check
    check (system = any (array[
      'notion'::text,
      'linear'::text,
      'airtable'::text,
      'github'::text,
      'n8n'::text,
      'vercel'::text,
      'supabase'::text,
      'google_drive'::text,
      'manual'::text,
      'other'::text
    ])),
  constraint project_control_refs_authority_check
    check (authority = any (array[
      'canonical'::text,
      'mirror'::text,
      'reference'::text,
      'proposal'::text,
      'blocked'::text
    ])),
  constraint project_control_refs_write_mode_check
    check (write_mode = any (array[
      'read_only'::text,
      'controlled_write'::text,
      'blocked'::text
    ])),
  constraint project_control_refs_system_external_unique
    unique (system, external_type, external_id),
  constraint project_control_refs_canonical_system_unique
    unique (system, canonical_entity_type, canonical_key)
);

create unique index if not exists project_control_refs_external_url_unique
  on public.project_control_refs (system, lower(external_url))
  where external_url is not null;
create index if not exists project_control_refs_system_idx
  on public.project_control_refs (system, external_type);
create index if not exists project_control_refs_canonical_idx
  on public.project_control_refs (canonical_entity_type, canonical_key);
create index if not exists project_control_refs_authority_idx
  on public.project_control_refs (authority, write_mode);

alter table public.project_control_refs enable row level security;

grant select, insert, update, delete on table public.project_control_refs
  to anon, authenticated;
grant all privileges on table public.project_control_refs to service_role;
