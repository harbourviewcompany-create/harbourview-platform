-- Production's controlled connector-staging inbox existed out of band before the
-- 20260708214318 RLS initplan snapshot. Restore the exact durable relation during
-- zero-state replay without replacing or updating existing observations.

create table if not exists public.external_sync_inbox (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'READ_ONLY_AUDIT'
    check (mode = any (array['READ_ONLY_AUDIT','CONTROLLED_WRITE','SCHEMA_CHANGE','PRODUCTION_SMOKE']::text[])),
  system text not null
    check (system = any (array['notion','linear','airtable','github','n8n','vercel','supabase','google_drive','manual','other']::text[])),
  external_type text not null,
  external_id text not null,
  external_url text,
  operation text not null
    check (operation = any (array['observe','propose_insert','propose_update','propose_archive','propose_link','reject','apply']::text[])),
  target_table text,
  target_record_id text,
  idempotency_key text not null,
  source_hash text,
  payload jsonb not null default '{}'::jsonb,
  proposed_changes jsonb not null default '{}'::jsonb,
  duplicate_check jsonb not null default '{}'::jsonb,
  safety_check jsonb not null default '{}'::jsonb,
  status text not null default 'pending_review'
    check (status = any (array['pending_review','approved','applied','rejected','superseded','failed']::text[])),
  approval_required boolean not null default true,
  approved_by uuid,
  approved_at timestamptz,
  applied_by uuid,
  applied_at timestamptz,
  error_message text,
  created_by uuid,
  created_by_system text not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_sync_inbox_idempotency_unique unique (idempotency_key)
);

create index if not exists external_sync_inbox_status_idx
  on public.external_sync_inbox(status, created_at desc);
create index if not exists external_sync_inbox_system_idx
  on public.external_sync_inbox(system, external_type, external_id);
create index if not exists external_sync_inbox_target_idx
  on public.external_sync_inbox(target_table, target_record_id);

alter table public.external_sync_inbox enable row level security;

comment on table public.external_sync_inbox is
  'Controlled staging inbox for connector observations and proposed writes. External systems land here before touching canonical Harbourview records.';

-- Match production ACLs. The immediately following RLS snapshot installs the
-- admin/operator insert, select, and update policies; service_role retains full
-- trusted queue access.
grant select, insert, update, delete on table public.external_sync_inbox
  to anon, authenticated;
grant all privileges on table public.external_sync_inbox to service_role;
