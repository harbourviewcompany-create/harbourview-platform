-- Production's public.hv_evidence relation existed before the July 8 RLS
-- initplan advisory snapshot, but its creating DDL was absent from repository
-- zero-state history. Restore the production table contract without replacing
-- rows or changing an existing relation.

create table if not exists public.hv_evidence (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  source_system text not null,
  source_id text,
  source_url text,
  captured_at timestamptz not null default now(),
  captured_by uuid references auth.users(id),
  import_batch_id uuid,
  content_hash text not null,
  mime_type text,
  file_size_bytes bigint,
  storage_path text,
  extracted_text text,
  word_count integer,
  classification public.hv_classification not null default 'internal'::public.hv_classification,
  access_classification public.hv_classification not null default 'restricted'::public.hv_classification,
  ocr_status text default 'not_required'::text,
  extraction_status text default 'pending'::text,
  requires_translation boolean default false,
  language_detected text,
  review_status public.hv_review_status not null default 'pending'::public.hv_review_status,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  redaction_status text default 'not_required'::text,
  retention_status text not null default 'active'::text,
  legal_hold boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hv_evidence_artifact
  on public.hv_evidence (artifact_id);
create index if not exists idx_hv_evidence_captured_by
  on public.hv_evidence (captured_by);
create index if not exists idx_hv_evidence_content_hash
  on public.hv_evidence (content_hash);
create index if not exists idx_hv_evidence_reviewed_by
  on public.hv_evidence (reviewed_by);
create index if not exists idx_hv_evidence_source
  on public.hv_evidence (source_system, source_id);
create index if not exists idx_hv_evidence_workspace
  on public.hv_evidence (workspace_id);

alter table public.hv_evidence enable row level security;

-- Preserve the live ACL boundary. The following migration installs the exact
-- reviewed workspace-isolation policy captured from production.
grant select, insert, update, delete on table public.hv_evidence
  to anon, authenticated;
grant all privileges on table public.hv_evidence to service_role;
