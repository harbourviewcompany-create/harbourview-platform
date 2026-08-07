-- Replay-safe foundation recovered from the production import-staging schema.
-- It also adds the source geography columns required by the immediately
-- following normalization trigger.

alter table public.source_registry
  add column if not exists country text,
  add column if not exists iso text,
  add column if not exists jurisdiction text,
  add column if not exists jurisdiction_code text;

create table if not exists public.hv_import_staging (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  source_system text not null,
  source_record_id text,
  source_url text,
  import_batch_id uuid not null,
  importer_version text,
  transform_version text,
  raw_payload jsonb not null default '{}'::jsonb,
  raw_payload_hash text not null,
  normalized_payload jsonb not null default '{}'::jsonb,
  normalized_hash text,
  proposed_object_class public.hv_object_class,
  proposed_classification public.hv_classification default 'internal',
  proposed_title text,
  proposed_jurisdiction text,
  proposed_country_iso text,
  content_hash text,
  duplicate_of uuid references public.hv_import_staging(id),
  is_duplicate_candidate boolean not null default false,
  duplicate_confidence numeric(4,3),
  status text not null default 'pending',
  promoted_artifact_id uuid references public.hv_artifacts(id),
  promoted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  error_message text,
  retry_count integer not null default 0,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_import_staging_duplicate_confidence_check
    check (duplicate_confidence is null or duplicate_confidence between 0 and 1)
);

create index if not exists idx_hv_import_staging_workspace on public.hv_import_staging(workspace_id);
create index if not exists idx_hv_import_staging_source_record on public.hv_import_staging(source_system, source_record_id);
create index if not exists idx_hv_import_staging_content_hash on public.hv_import_staging(content_hash);
create index if not exists idx_hv_import_staging_status on public.hv_import_staging(status, created_at);

alter table public.hv_import_staging enable row level security;
revoke all on table public.hv_import_staging from public, anon, authenticated;
grant all on table public.hv_import_staging to service_role;
