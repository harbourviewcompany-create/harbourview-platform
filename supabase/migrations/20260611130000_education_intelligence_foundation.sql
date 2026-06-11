-- Harbourview Global Education Intelligence Foundation
-- Additive-only first PR: schema, review gates, RLS-deny public raw table access.

create extension if not exists pgcrypto;

do $$ begin create type education_role as enum ('doctor','pharmacist','clinic','patient_general','licensed_producer','supplier','buyer_importer','distributor','lab','packaging_vendor','equipment_vendor','investor','regulator_policy','admin_operator'); exception when duplicate_object then null; end $$;
do $$ begin create type education_claim_type as enum ('medical_scientific','clinical_workflow','dosage_reference','pharmacist_workflow','legal_regulatory','import_export','licensing','quality_manufacturing','commercial_marketplace','glossary_definition','safety','jurisdiction_summary','professional_obligation'); exception when duplicate_object then null; end $$;
do $$ begin create type education_review_status as enum ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source','conflicting_sources','stale_source','jurisdiction_unclear','clinical_review_required','legal_review_required','review_pending','do_not_publish'); exception when duplicate_object then null; end $$;
do $$ begin create type education_evidence_grade as enum ('A_primary_binding','B_primary_guidance','C_professional_guideline','D_peer_reviewed','E_quality_standard','F_secondary_context','G_discovery_only','X_conflict_or_unverified'); exception when duplicate_object then null; end $$;
do $$ begin create type education_visibility as enum ('public','professional','commercial_user','admin_only','hidden'); exception when duplicate_object then null; end $$;

create or replace function public.education_has_review_role(allowed_roles text[] default array['admin','operator','analyst'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$$;

create or replace function public.education_can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.education_has_review_role(array['admin','operator']);
$$;

create table if not exists education_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  parent_id uuid references education_topics(id),
  title text not null,
  domain text not null,
  description text,
  default_visibility education_visibility not null default 'public',
  risk_level text not null default 'low',
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  module_type text not null,
  audience_roles education_role[] not null,
  topic_id uuid references education_topics(id),
  jurisdiction_scope text[] default array['GLOBAL'],
  required_review_status education_review_status[] not null default array['verified_primary_source']::education_review_status[],
  public_summary text,
  route_path text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_title text not null,
  source_owner text not null,
  source_owner_type text not null,
  source_url text not null,
  source_country text,
  source_jurisdiction text,
  source_language text,
  source_type text not null,
  evidence_grade education_evidence_grade not null,
  authority_tier integer not null,
  last_accessed_at timestamptz,
  published_at date,
  updated_at_source date,
  freshness_window_days integer not null default 90,
  archive_uri text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_claims (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  topic_id uuid references education_topics(id),
  claim_type education_claim_type not null,
  claim_text text not null,
  public_safe_summary text,
  jurisdiction_scope text[] not null default array['GLOBAL'],
  subjurisdiction_scope text[],
  audience_roles education_role[] not null,
  visibility education_visibility not null default 'admin_only',
  evidence_grade education_evidence_grade not null default 'X_conflict_or_unverified',
  review_status education_review_status not null default 'review_pending',
  medical_risk_level text not null default 'none',
  legal_risk_level text not null default 'none',
  commercial_risk_level text not null default 'none',
  freshness_window_days integer not null default 90,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  reviewer text,
  admin_notes text,
  conflict_notes text,
  do_not_publish_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_claim_sources (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references education_claims(id) on delete cascade,
  source_id uuid not null references education_source_registry(id) on delete restrict,
  support_type text not null,
  source_excerpt text,
  source_location text,
  confidence numeric(4,3) not null default 0.500,
  is_primary_support boolean not null default false,
  created_at timestamptz not null default now(),
  unique (claim_id, source_id, support_type)
);

create table if not exists jurisdiction_overlays (
  id uuid primary key default gen_random_uuid(),
  overlay_key text not null unique,
  jurisdiction_code text not null,
  jurisdiction_name text not null,
  parent_jurisdiction_code text,
  jurisdiction_type text not null,
  topic_id uuid references education_topics(id),
  module_id uuid references education_modules(id),
  overlay_summary text,
  applies_to_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  source_status text not null default 'missing',
  is_public_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role_overlays (
  id uuid primary key default gen_random_uuid(),
  role education_role not null,
  topic_id uuid references education_topics(id),
  module_id uuid references education_modules(id),
  display_priority integer not null default 100,
  required_claim_types education_claim_type[],
  hidden_claim_types education_claim_type[],
  intro_copy text,
  checklist_enabled boolean not null default false,
  professional_warning_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (role, topic_id, module_id)
);

create table if not exists glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  slug text not null unique,
  short_definition text not null,
  expanded_definition text,
  topic_id uuid references education_topics(id),
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dosage_reference_tables (
  id uuid primary key default gen_random_uuid(),
  dosage_key text not null unique,
  substance text not null,
  product_form text,
  route text,
  population_scope text,
  condition_scope text,
  reference_text text not null,
  unit text,
  jurisdiction_scope text[] not null default array['GLOBAL'],
  audience_roles education_role[] not null default array['doctor','pharmacist']::education_role[],
  evidence_grade education_evidence_grade not null default 'X_conflict_or_unverified',
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  public_rendering_mode text not null default 'show_professional_only',
  warning_text text,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_form_tables (
  id uuid primary key default gen_random_uuid(),
  form_key text not null unique,
  product_form text not null,
  route text,
  onset_range_text text,
  duration_range_text text,
  bioavailability_text text,
  counseling_points text,
  risk_notes text,
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists condition_evidence_map (
  id uuid primary key default gen_random_uuid(),
  condition_key text not null unique,
  condition_name text not null,
  evidence_summary text,
  approved_product_notes text,
  evidence_strength text not null default 'review_pending',
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null default array['doctor','pharmacist','patient_general']::education_role[],
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interaction_references (
  id uuid primary key default gen_random_uuid(),
  interaction_key text not null unique,
  substance_or_class text not null,
  cannabinoid_or_product text,
  mechanism_text text,
  severity text,
  counseling_text text,
  escalation_text text,
  audience_roles education_role[] not null default array['doctor','pharmacist']::education_role[],
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists professional_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null unique,
  role education_role not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  workflow_title text not null,
  workflow_steps jsonb not null default '[]'::jsonb,
  checklist_items jsonb not null default '[]'::jsonb,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commercial_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null unique,
  workflow_type text not null,
  audience_roles education_role[] not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  workflow_title text not null,
  workflow_steps jsonb not null default '[]'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'commercial_user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quality_standards (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null unique,
  standard_name text not null,
  standard_family text not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  summary text,
  applies_to text[],
  evidence_grade education_evidence_grade not null default 'E_quality_standard',
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists import_export_guides (
  id uuid primary key default gen_random_uuid(),
  guide_key text not null unique,
  origin_jurisdiction text,
  destination_jurisdiction text not null,
  product_category text,
  guide_summary text,
  required_documents jsonb not null default '[]'::jsonb,
  regulator_links jsonb not null default '[]'::jsonb,
  customs_notes text,
  review_status education_review_status not null default 'legal_review_required',
  visibility education_visibility not null default 'commercial_user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public_content_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  module_id uuid references education_modules(id),
  topic_id uuid references education_topics(id),
  title text not null,
  body text not null,
  claim_keys text[] not null default '{}',
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  visibility education_visibility not null default 'public',
  publish_status text not null default 'draft',
  generated_from_claims boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  queue_key text not null unique,
  entity_type text not null,
  entity_key text not null,
  review_reason text not null,
  assigned_role text,
  priority integer not null default 100,
  status text not null default 'open',
  due_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists source_conflicts (
  id uuid primary key default gen_random_uuid(),
  conflict_key text not null unique,
  claim_id uuid references education_claims(id),
  conflict_summary text not null,
  source_ids uuid[] not null,
  severity text not null default 'medium',
  resolution_status text not null default 'unresolved',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists freshness_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null unique,
  entity_type text not null,
  entity_key text not null,
  source_key text,
  last_checked_at timestamptz,
  next_check_due_at timestamptz,
  freshness_status text not null default 'unknown',
  http_status integer,
  source_changed boolean,
  change_summary text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_key text not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_education_claims_review on education_claims(review_status, visibility);
create index if not exists idx_education_claims_roles on education_claims using gin(audience_roles);
create index if not exists idx_education_claims_jurisdiction on education_claims using gin(jurisdiction_scope);
create index if not exists idx_public_content_blocks_publish on public_content_blocks(publish_status, visibility);

alter table education_topics enable row level security;
alter table education_modules enable row level security;
alter table education_source_registry enable row level security;
alter table education_claims enable row level security;
alter table education_claim_sources enable row level security;
alter table jurisdiction_overlays enable row level security;
alter table role_overlays enable row level security;
alter table glossary_terms enable row level security;
alter table dosage_reference_tables enable row level security;
alter table product_form_tables enable row level security;
alter table condition_evidence_map enable row level security;
alter table interaction_references enable row level security;
alter table professional_workflows enable row level security;
alter table commercial_workflows enable row level security;
alter table quality_standards enable row level security;
alter table import_export_guides enable row level security;
alter table public_content_blocks enable row level security;
alter table review_queue enable row level security;
alter table source_conflicts enable row level security;
alter table freshness_checks enable row level security;
alter table audit_log enable row level security;

revoke all on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log from anon;
revoke all on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log from authenticated;

grant select, insert, update, delete on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log to authenticated;

do $$
declare t text;
begin
  foreach t in array array['education_topics','education_modules','education_source_registry','education_claims','education_claim_sources','jurisdiction_overlays','role_overlays','glossary_terms','dosage_reference_tables','product_form_tables','condition_evidence_map','interaction_references','professional_workflows','commercial_workflows','quality_standards','import_export_guides','public_content_blocks','review_queue','source_conflicts','freshness_checks','audit_log'] loop
    execute format('drop policy if exists %I on %I', t || '_review_select', t);
    execute format('drop policy if exists %I on %I', t || '_manager_write', t);
    execute format('create policy %I on %I for select to authenticated using (public.education_has_review_role())', t || '_review_select', t);
    execute format('create policy %I on %I for all to authenticated using (public.education_can_manage()) with check (public.education_can_manage())', t || '_manager_write', t);
  end loop;
end $$;

comment on table education_claims is 'Harbourview education claim-control table. Public output must use server-side DTO allowlisting or public-safe content surfaces only.';
comment on table education_claim_sources is 'Admin evidence mapping. No anonymous/public raw access.';
comment on table review_queue is 'Admin-only education review queue.';
