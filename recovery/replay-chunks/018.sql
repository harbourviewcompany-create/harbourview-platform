
-- RECOVERY BEGIN 20260814143500_clinical_evidence_v1_production_foundation.sql
-- Clinical Evidence V1 production-foundation hardening.
-- Extends the verified P0/V1 evidence spine without activating unsourced clinical advice.
-- No production migration is applied by this change.

-- ---------------------------------------------------------------------------
-- Credential-bound qualified review authority
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_reviewer_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  profession text not null check (profession in ('clinician','pharmacist')),
  jurisdiction text not null,
  credential_reference text not null,
  verification_source_url text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','expired','revoked','rejected')),
  verified_by_user_id uuid,
  verified_at timestamptz,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profession, jurisdiction, credential_reference),
  constraint clinical_reviewer_credential_url_https check (verification_source_url ~ '^https://'),
  constraint clinical_reviewer_credential_verified_fields check (
    verification_status <> 'verified' or verified_at is not null
  )
);

alter table public.clinical_evidence_reviews
  add column if not exists reviewer_credential_id uuid
    references public.clinical_reviewer_credentials(id) on delete restrict;

create or replace function public.clinical_reviewer_credential_is_valid(
  p_credential_id uuid,
  p_user_id uuid,
  p_reviewer_type text,
  p_reviewed_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_reviewer_credentials c
    where c.id = p_credential_id
      and c.user_id = p_user_id
      and c.profession = p_reviewer_type
      and c.verification_status = 'verified'
      and (c.valid_from is null or c.valid_from <= p_reviewed_at::date)
      and (c.valid_until is null or c.valid_until >= p_reviewed_at::date)
  );
$function$;

revoke all on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz) from public;
grant execute on function public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz) to authenticated, service_role;

create or replace function public.clinical_require_credentialed_qualified_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.decision = 'approved' and new.review_type in ('clinical','methodology') then
    if new.reviewer_type not in ('clinician','pharmacist') then
      raise exception 'qualified Clinical review requires clinician or pharmacist reviewer type';
    end if;
    if new.reviewer_user_id is null or new.reviewer_credential_id is null then
      raise exception 'qualified Clinical review requires credential-bound reviewer identity';
    end if;
    if not public.clinical_reviewer_credential_is_valid(
      new.reviewer_credential_id,
      new.reviewer_user_id,
      new.reviewer_type,
      new.reviewed_at
    ) then
      raise exception 'qualified Clinical review credential is not verified/current for this reviewer';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_credentialed_qualified_review() from public;
drop trigger if exists trg_clinical_require_credentialed_qualified_review on public.clinical_evidence_reviews;
create trigger trg_clinical_require_credentialed_qualified_review
before insert or update of review_type, reviewer_type, reviewer_user_id, reviewer_credential_id, decision, reviewed_at
on public.clinical_evidence_reviews
for each row execute function public.clinical_require_credentialed_qualified_review();

-- Tighten publication: graded/synthesis publication must be backed by a currently
-- valid credential-bound approved clinical review, not a declared reviewer_type.
create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' and (tg_op = 'INSERT' or old.review_status is distinct from 'published') then
    if not exists (
      select 1 from public.clinical_evidence_reviews r
      where r.evidence_record_id = new.id
        and r.review_type = 'provenance'
        and r.decision = 'approved'
    ) then
      raise exception 'clinical evidence publication requires an approved provenance review';
    end if;

    if new.publication_scope = 'clinical-synthesis' or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
      if not exists (
        select 1
        from public.clinical_evidence_reviews r
        where r.evidence_record_id = new.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
          and r.reviewer_user_id is not null
          and r.reviewer_credential_id is not null
          and public.clinical_reviewer_credential_is_valid(
            r.reviewer_credential_id,
            r.reviewer_user_id,
            r.reviewer_type,
            r.reviewed_at
          )
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Immutable/versioned source snapshots and structured extraction provenance
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.clinical_evidence_sources(id) on delete restrict,
  snapshot_key text not null unique,
  source_url text not null,
  source_version text,
  retrieved_at timestamptz not null,
  media_type text not null,
  hash_scope text not null check (hash_scope in ('source-bytes','normalized-reviewed-extract')),
  content_sha256 text not null,
  byte_size bigint,
  storage_path text,
  locator_manifest jsonb not null default '{}'::jsonb,
  normalized_extract text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  constraint clinical_snapshot_url_https check (source_url ~ '^https://'),
  constraint clinical_snapshot_sha256 check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint clinical_snapshot_bytes_require_size check (hash_scope <> 'source-bytes' or byte_size is not null)
);

alter table public.clinical_evidence_sources
  add column if not exists latest_snapshot_id uuid
    references public.clinical_evidence_source_snapshots(id) on delete set null,
  add column if not exists currentness_checked_at timestamptz;

create or replace function public.clinical_snapshot_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical evidence snapshots are immutable; insert a new version instead';
end;
$function$;

revoke all on function public.clinical_snapshot_immutable() from public;
drop trigger if exists trg_clinical_snapshot_immutable on public.clinical_evidence_source_snapshots;
create trigger trg_clinical_snapshot_immutable
before update or delete on public.clinical_evidence_source_snapshots
for each row execute function public.clinical_snapshot_immutable();

alter table public.clinical_evidence_extractions
  add column if not exists source_snapshot_id uuid references public.clinical_evidence_source_snapshots(id) on delete restrict,
  add column if not exists population_json jsonb,
  add column if not exists intervention_json jsonb,
  add column if not exists comparator_json jsonb,
  add column if not exists outcomes_json jsonb,
  add column if not exists study_design text,
  add column if not exists sample_size integer,
  add column if not exists follow_up text,
  add column if not exists effect_estimates_json jsonb,
  add column if not exists uncertainty_json jsonb,
  add column if not exists limitations_json jsonb;

create or replace function public.clinical_verified_extraction_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.verification_status = 'verified' then
    raise exception 'verified Clinical extraction is immutable; create a superseding extraction';
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_verified_extraction_immutable() from public;
drop trigger if exists trg_clinical_verified_extraction_immutable on public.clinical_evidence_extractions;
create trigger trg_clinical_verified_extraction_immutable
before update or delete on public.clinical_evidence_extractions
for each row execute function public.clinical_verified_extraction_immutable();

-- ---------------------------------------------------------------------------
-- Outcome-level evidence graph
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_outcome_links (
  id uuid primary key default gen_random_uuid(),
  condition_term_id uuid not null references public.clinical_condition_terms(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  source_snapshot_id uuid references public.clinical_evidence_source_snapshots(id) on delete restrict,
  intervention_label text,
  intervention_class text not null check (intervention_class in (
    'regulated-cannabinoid-drug','general-cannabis','cannabinoid-isolate',
    'cannabis-derived-formulation','non-cannabis','not-applicable'
  )),
  formulation text,
  cannabinoids text[] not null default '{}',
  population_summary text,
  comparator_summary text,
  outcome_key text not null,
  outcome_label text not null,
  relationship_kind text not null check (relationship_kind in (
    'authorized-indication','efficacy','safety','tolerability','quality-of-life','other'
  )),
  direction text not null default 'not-assessed' check (direction in (
    'benefit','harm','no-clear-effect','mixed','not-assessed'
  )),
  effect_summary text,
  uncertainty_summary text,
  applicability text,
  publication_scope text not null default 'source-metadata'
    check (publication_scope in ('source-metadata','clinical-synthesis')),
  review_status text not null default 'under-review'
    check (review_status in ('under-review','published','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(condition_term_id, evidence_record_id, outcome_key, relationship_kind)
);

-- ---------------------------------------------------------------------------
-- Reproducible grading assessments
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_grade_assessments (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  review_id uuid not null references public.clinical_evidence_reviews(id) on delete restrict,
  grading_method_key text not null references public.clinical_evidence_grading_methods(method_key) on delete restrict,
  starting_certainty text not null check (starting_certainty in ('high','moderate','low','very-low','ungraded')),
  risk_of_bias text not null check (risk_of_bias in ('not-assessed','not-serious','serious','very-serious')),
  inconsistency text not null check (inconsistency in ('not-assessed','not-serious','serious','very-serious')),
  indirectness text not null check (indirectness in ('not-assessed','not-serious','serious','very-serious')),
  imprecision text not null check (imprecision in ('not-assessed','not-serious','serious','very-serious')),
  publication_bias text not null check (publication_bias in ('not-assessed','undetected','suspected','strongly-suspected')),
  upgrade_factors jsonb not null default '[]'::jsonb,
  downgrade_rationale text,
  final_certainty text not null check (final_certainty in ('high','moderate','low','very-low','ungraded','conflicted')),
  assessment_rationale text not null,
  assessed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(evidence_record_id, review_id)
);

create or replace function public.clinical_require_grade_review_binding()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.clinical_evidence_reviews r
    where r.id = new.review_id
      and r.evidence_record_id = new.evidence_record_id
      and r.review_type in ('clinical','methodology')
      and r.decision = 'approved'
      and r.reviewer_user_id is not null
      and r.reviewer_credential_id is not null
      and public.clinical_reviewer_credential_is_valid(
        r.reviewer_credential_id,
        r.reviewer_user_id,
        r.reviewer_type,
        r.reviewed_at
      )
  ) then
    raise exception 'Clinical grade assessment requires an approved credential-bound review for the same evidence record';
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_grade_review_binding() from public;
drop trigger if exists trg_clinical_require_grade_review_binding on public.clinical_evidence_grade_assessments;
create trigger trg_clinical_require_grade_review_binding
before insert or update on public.clinical_evidence_grade_assessments
for each row execute function public.clinical_require_grade_review_binding();

-- ---------------------------------------------------------------------------
-- Contradiction, partial supersession, freshness and review-required state
-- ---------------------------------------------------------------------------
alter table public.clinical_evidence_conflicts
  add column if not exists claim_scope text,
  add column if not exists outcome_key text,
  add column if not exists resolution_review_id uuid references public.clinical_evidence_reviews(id) on delete restrict,
  add column if not exists supersession_scope text,
  add column if not exists public_impact text not null default 'none'
    check (public_impact in ('none','stale','conflicted','withdraw'));

alter table public.clinical_evidence_records
  add column if not exists freshness_status text not null default 'current'
    check (freshness_status in ('current','stale','review-required','source-degraded')),
  add column if not exists review_due_at timestamptz,
  add column if not exists source_currentness_checked_at timestamptz,
  add column if not exists freshness_reason text;

create or replace function public.clinical_require_conflict_resolution_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.resolution_status in ('contextualized','resolved','superseded') then
    if new.resolution_review_id is null or not exists (
      select 1 from public.clinical_evidence_reviews r
      where r.id = new.resolution_review_id
        and r.decision = 'approved'
    ) then
      raise exception 'Clinical conflict resolution requires an approved review';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_conflict_resolution_review() from public;
drop trigger if exists trg_clinical_require_conflict_resolution_review on public.clinical_evidence_conflicts;
create trigger trg_clinical_require_conflict_resolution_review
before insert or update of resolution_status, resolution_review_id
on public.clinical_evidence_conflicts
for each row execute function public.clinical_require_conflict_resolution_review();

create or replace function public.clinical_propagate_source_currentness()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.currentness is distinct from new.currentness and new.currentness in ('superseded','withdrawn','unknown') then
    update public.clinical_evidence_records
    set freshness_status = case when new.currentness = 'unknown' then 'source-degraded' else 'review-required' end,
        freshness_reason = 'Primary source currentness changed to ' || new.currentness || '; evidence requires review before continued reliance.',
        source_currentness_checked_at = now(),
        review_status = case when review_status = 'published' then 'under-review' else review_status end,
        supersession_state = case when new.currentness = 'superseded' then 'partially-superseded' else supersession_state end,
        updated_at = now()
    where primary_source_registry_id = new.id;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_propagate_source_currentness() from public;
drop trigger if exists trg_clinical_propagate_source_currentness on public.clinical_evidence_sources;
create trigger trg_clinical_propagate_source_currentness
after update of currentness on public.clinical_evidence_sources
for each row execute function public.clinical_propagate_source_currentness();

-- ---------------------------------------------------------------------------
-- Immutable audit-grade publication history
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_publication_versions (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete restrict,
  version_no integer not null,
  trigger_event text not null check (trigger_event in ('initial-backfill','published','updated','unpublished','superseded','stale')),
  public_projection jsonb not null,
  actor_user_id uuid,
  recorded_at timestamptz not null default now(),
  unique(evidence_record_id, version_no)
);

create or replace function public.clinical_public_projection_json(p public.clinical_evidence_records)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $function$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'title', p.title,
    'summary', p.summary,
    'condition_label', p.condition_label,
    'population', p.population,
    'intervention', p.intervention,
    'formulation', p.formulation,
    'cannabinoids', p.cannabinoids,
    'intervention_class', p.intervention_class,
    'comparator', p.comparator,
    'outcome', p.outcome,
    'evidence_type', p.evidence_type,
    'evidence_strength', p.evidence_strength,
    'evidence_strength_method', p.evidence_strength_method,
    'uncertainty', p.uncertainty,
    'conflict_status', p.conflict_status,
    'jurisdictions', p.jurisdictions,
    'profession_relevance', p.profession_relevance,
    'primary_source_title', p.primary_source_title,
    'primary_source_publisher', p.primary_source_publisher,
    'primary_source_url', p.primary_source_url,
    'publication_date', p.publication_date,
    'effective_date', p.effective_date,
    'verified_at', p.verified_at,
    'supersession_state', p.supersession_state,
    'review_status', p.review_status,
    'publication_scope', p.publication_scope,
    'freshness_status', p.freshness_status,
    'review_due_at', p.review_due_at,
    'source_currentness_checked_at', p.source_currentness_checked_at,
    'freshness_reason', p.freshness_reason
  );
$function$;

revoke all on function public.clinical_public_projection_json(public.clinical_evidence_records) from public;
grant execute on function public.clinical_public_projection_json(public.clinical_evidence_records) to service_role;

create or replace function public.clinical_capture_publication_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  next_version integer;
  event_name text;
  projection jsonb;
begin
  if tg_op = 'INSERT' then
    if new.review_status <> 'published' then return new; end if;
    event_name := 'published';
    projection := public.clinical_public_projection_json(new);
  else
    if old.review_status = new.review_status
      and old.supersession_state = new.supersession_state
      and old.freshness_status = new.freshness_status
      and old.summary is not distinct from new.summary
      and old.uncertainty is not distinct from new.uncertainty
      and old.evidence_strength is not distinct from new.evidence_strength
      and old.primary_source_url is not distinct from new.primary_source_url then
      return new;
    end if;
    event_name := case
      when old.review_status <> 'published' and new.review_status = 'published' then 'published'
      when old.review_status = 'published' and new.review_status <> 'published' then 'unpublished'
      when new.supersession_state <> 'current' then 'superseded'
      when new.freshness_status <> 'current' then 'stale'
      else 'updated'
    end;
    projection := public.clinical_public_projection_json(new);
  end if;

  select coalesce(max(version_no), 0) + 1
    into next_version
  from public.clinical_evidence_publication_versions
  where evidence_record_id = new.id;

  insert into public.clinical_evidence_publication_versions (
    evidence_record_id, version_no, trigger_event, public_projection, actor_user_id
  ) values (
    new.id, next_version, event_name, projection, auth.uid()
  );
  return new;
end;
$function$;

revoke all on function public.clinical_capture_publication_version() from public;
drop trigger if exists trg_clinical_capture_publication_version on public.clinical_evidence_records;
create trigger trg_clinical_capture_publication_version
after insert or update on public.clinical_evidence_records
for each row execute function public.clinical_capture_publication_version();

insert into public.clinical_evidence_publication_versions (
  evidence_record_id, version_no, trigger_event, public_projection, actor_user_id
)
select e.id, 1, 'initial-backfill', public.clinical_public_projection_json(e), null
from public.clinical_evidence_records e
where e.review_status = 'published'
  and not exists (
    select 1 from public.clinical_evidence_publication_versions v where v.evidence_record_id = e.id
  );

-- ---------------------------------------------------------------------------
-- Corpus coverage/freshness metrics (private operational RPC)
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_corpus_metrics()
returns table (
  published_conditions bigint,
  published_records bigint,
  under_review_records bigint,
  stale_or_review_required bigint,
  unresolved_material_conflicts bigint,
  ungraded_published_records bigint,
  sources_without_snapshot bigint,
  oldest_verified_at timestamptz,
  newest_verified_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if auth.role() <> 'service_role' and not public.clinical_evidence_has_review_role() then
    raise exception 'Clinical corpus metrics require review-role authorization';
  end if;

  return query
  select
    (select count(*) from public.clinical_condition_terms c where c.review_status = 'published'),
    (select count(*) from public.clinical_evidence_records e where e.review_status = 'published'),
    (select count(*) from public.clinical_evidence_records e where e.review_status = 'under-review'),
    (select count(*) from public.clinical_evidence_records e where e.freshness_status in ('stale','review-required','source-degraded')),
    (select count(*) from public.clinical_evidence_conflicts c where c.materiality = 'high' and c.resolution_status = 'unresolved'),
    (select count(*) from public.clinical_evidence_records e where e.review_status = 'published' and e.evidence_strength = 'ungraded'),
    (select count(*) from public.clinical_evidence_sources s where s.currentness = 'current' and s.latest_snapshot_id is null),
    (select min(e.verified_at) from public.clinical_evidence_records e where e.review_status = 'published'),
    (select max(e.verified_at) from public.clinical_evidence_records e where e.review_status = 'published');
end;
$function$;

revoke all on function public.clinical_evidence_corpus_metrics() from public;
grant execute on function public.clinical_evidence_corpus_metrics() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Current SATIVEX monograph capture and narrow source-metadata republication
-- ---------------------------------------------------------------------------
insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, din,
  notice_of_compliance_id, source_version, published_on, retrieved_at, currentness,
  currentness_checked_at
) values (
  'ca-sativex-pm-2024-12-17',
  'product-monograph',
  'SATIVEX Product Monograph',
  'Jazz Pharmaceuticals Operations UK Limited',
  'https://pdf.hres.ca/dpd_pm/00078089.PDF',
  array['Canada'],
  '02266121',
  '291740',
  '2024-12-17',
  '2024-12-17',
  '2026-08-14T13:54:00Z',
  'current',
  '2026-08-14T13:54:00Z'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  din = excluded.din,
  notice_of_compliance_id = excluded.notice_of_compliance_id,
  source_version = excluded.source_version,
  published_on = excluded.published_on,
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  currentness_checked_at = excluded.currentness_checked_at,
  updated_at = now();

insert into public.clinical_evidence_source_snapshots (
  source_id, snapshot_key, source_url, source_version, retrieved_at, media_type,
  hash_scope, content_sha256, locator_manifest, normalized_extract
)
select
  s.id,
  'ca-sativex-pm-2024-12-17-indications-extract-v1',
  s.source_url,
  '2024-12-17',
  '2026-08-14T13:54:00Z',
  'application/pdf',
  'normalized-reviewed-extract',
  'fe36495ec4adf482f95e0a72fa22a651e19599bc8414d34b22cc848248e731ae',
  jsonb_build_object(
    'document_pages', 38,
    'document_page', 3,
    'section', '1 INDICATIONS',
    'source_lines', '42-46',
    'submission_control_no', '291740',
    'hash_scope_note', 'SHA-256 covers the canonical normalized extract payload, not source PDF bytes.'
  ),
  'SATIVEX (delta-9-tetrahydrocannabinol (THC) and cannabidiol (CBD)) is indicated as an adjunctive treatment for symptomatic relief of spasticity in patients with multiple sclerosis (MS) who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial of therapy.'
from public.clinical_evidence_sources s
where s.source_key = 'ca-sativex-pm-2024-12-17'
on conflict (snapshot_key) do nothing;

update public.clinical_evidence_sources s
set latest_snapshot_id = snap.id,
    updated_at = now()
from public.clinical_evidence_source_snapshots snap
where s.source_key = 'ca-sativex-pm-2024-12-17'
  and snap.snapshot_key = 'ca-sativex-pm-2024-12-17-indications-extract-v1';

update public.clinical_evidence_sources old_source
set superseded_by_source_id = current_source.id,
    updated_at = now()
from public.clinical_evidence_sources current_source
where old_source.source_key = 'ca-sativex-pm-2019-12-11'
  and current_source.source_key = 'ca-sativex-pm-2024-12-17';

-- Preserve the DPD record as a current regulatory-status source but make the actual
-- current product monograph the replacement for historical indication provenance.
update public.clinical_evidence_records e
set primary_source_registry_id = s.id,
    primary_source_title = s.title,
    primary_source_publisher = s.publisher,
    primary_source_url = s.source_url,
    primary_source_id = 'DIN 02266121; Submission Control 291740',
    publication_date = '2024-12-17',
    verified_at = '2026-08-14T13:54:00Z',
    supersession_state = 'current',
    freshness_status = 'current',
    freshness_reason = null,
    source_currentness_checked_at = '2026-08-14T13:54:00Z',
    uncertainty = 'This public record reproduces current Canadian authorized-indication metadata only. It is not an independent efficacy conclusion, comparative recommendation, dosing instruction, or evidence grade.',
    updated_at = now()
from public.clinical_evidence_sources s
where e.slug = 'ca-sativex-ms-spasticity-indication'
  and s.source_key = 'ca-sativex-pm-2024-12-17';

insert into public.clinical_evidence_extractions (
  evidence_record_id, source_id, source_snapshot_id, extraction_type, extracted_summary,
  source_locator, extraction_method, extractor_identity, extracted_at, verification_status,
  population_json, intervention_json, outcomes_json, study_design, uncertainty_json, limitations_json
)
select
  e.id,
  s.id,
  snap.id,
  'indication',
  'Current Canadian SATIVEX authorized indication: adjunctive treatment for symptomatic relief of spasticity in patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial of therapy.',
  'PDF page 3; section 1 INDICATIONS; source lines 42-46 in reviewed extraction',
  'manual-structured',
  'Harbourview controlled source review',
  '2026-08-14T13:54:00Z',
  'verified',
  jsonb_build_object('population','patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial of therapy'),
  jsonb_build_object('product','SATIVEX','active_components',jsonb_build_array('delta-9-tetrahydrocannabinol','cannabidiol'),'route','buccal'),
  jsonb_build_array(jsonb_build_object('outcome_key','symptomatic-relief-spasticity','label','symptomatic relief of spasticity','relationship','authorized-indication','direction','not-assessed')),
  'regulatory product-monograph indication metadata',
  jsonb_build_object('clinical_certainty','not graded'),
  jsonb_build_array('Authorized indication metadata does not establish comparative efficacy or appropriateness for an individual patient.')
from public.clinical_evidence_records e
join public.clinical_evidence_sources s on s.source_key = 'ca-sativex-pm-2024-12-17'
join public.clinical_evidence_source_snapshots snap on snap.snapshot_key = 'ca-sativex-pm-2024-12-17-indications-extract-v1'
where e.slug = 'ca-sativex-ms-spasticity-indication'
  and not exists (
    select 1 from public.clinical_evidence_extractions x
    where x.evidence_record_id = e.id and x.source_snapshot_id = snap.id and x.extraction_type = 'indication'
  );

-- Provenance approval is source-fidelity only. It is explicitly not a clinical or
-- methodology review and therefore does not require/pretend a professional credential.
insert into public.clinical_evidence_reviews (
  evidence_record_id, review_type, reviewer_type, reviewer_identity, decision,
  grading_method_key, assigned_evidence_strength, rationale, reviewed_at
)
select
  e.id,
  'provenance',
  'system',
  'Harbourview controlled source review',
  'approved',
  'harbourview-clinical-evidence-v1',
  'ungraded',
  'Verified current SATIVEX monograph revision 2024-12-17, Submission Control 291740, and indication text at page 3 section 1. Approval is limited to source fidelity and does not grade efficacy.',
  '2026-08-14T13:54:00Z'
from public.clinical_evidence_records e
where e.slug = 'ca-sativex-ms-spasticity-indication'
  and not exists (
    select 1 from public.clinical_evidence_reviews r
    where r.evidence_record_id = e.id
      and r.review_type = 'provenance'
      and r.reviewer_identity = 'Harbourview controlled source review'
      and r.reviewed_at = '2026-08-14T13:54:00Z'
  );

update public.clinical_evidence_records
set review_status = 'published',
    updated_at = now()
where slug = 'ca-sativex-ms-spasticity-indication';

update public.clinical_condition_terms
set review_status = 'published',
    deprecated_at = null,
    verified_at = '2026-08-14T13:54:00Z',
    definition = 'Condition label used in the current Canadian SATIVEX authorized indication for adjunctive symptomatic relief of spasticity in multiple sclerosis.',
    source_url = 'https://pdf.hres.ca/dpd_pm/00078089.PDF',
    source_system = 'SATIVEX Product Monograph',
    source_identifier = 'INDICATION:MS-SPASTICITY',
    source_version = '2024-12-17',
    updated_at = now()
where slug = 'multiple-sclerosis-spasticity';

insert into public.clinical_evidence_outcome_links (
  condition_term_id, evidence_record_id, source_snapshot_id,
  intervention_label, intervention_class, formulation, cannabinoids,
  population_summary, outcome_key, outcome_label, relationship_kind, direction,
  effect_summary, uncertainty_summary, publication_scope, review_status
)
select
  c.id,
  e.id,
  snap.id,
  'SATIVEX',
  'regulated-cannabinoid-drug',
  'buccal spray',
  array['THC','CBD'],
  'Patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial of therapy.',
  'symptomatic-relief-spasticity',
  'Symptomatic relief of spasticity',
  'authorized-indication',
  'not-assessed',
  null,
  'Source-metadata relationship only; no independent efficacy direction or magnitude is inferred.',
  'source-metadata',
  'published'
from public.clinical_condition_terms c
join public.clinical_evidence_records e on e.slug = 'ca-sativex-ms-spasticity-indication'
join public.clinical_evidence_source_snapshots snap on snap.snapshot_key = 'ca-sativex-pm-2024-12-17-indications-extract-v1'
where c.slug = 'multiple-sclerosis-spasticity'
on conflict (condition_term_id, evidence_record_id, outcome_key, relationship_kind) do update set
  source_snapshot_id = excluded.source_snapshot_id,
  intervention_label = excluded.intervention_label,
  formulation = excluded.formulation,
  cannabinoids = excluded.cannabinoids,
  population_summary = excluded.population_summary,
  uncertainty_summary = excluded.uncertainty_summary,
  publication_scope = excluded.publication_scope,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions,
  profession_relevance, occurred_at, verified_at,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  review_status
)
select
  e.id,
  'updated',
  'Current SATIVEX Canadian product monograph reviewed',
  'The SATIVEX source projection has been reconciled to the current 2024-12-17 Canadian product monograph. The public record remains ungraded authorized-indication metadata only.',
  'medium',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  '2026-08-14T13:54:00Z',
  '2026-08-14T13:54:00Z',
  'SATIVEX Product Monograph',
  'Jazz Pharmaceuticals Operations UK Limited',
  'https://pdf.hres.ca/dpd_pm/00078089.PDF',
  'DIN 02266121; Submission Control 291740',
  'published'
from public.clinical_evidence_records e
where e.slug = 'ca-sativex-ms-spasticity-indication'
  and not exists (
    select 1 from public.clinical_evidence_change_events ce
    where ce.evidence_record_id = e.id
      and ce.title = 'Current SATIVEX Canadian product monograph reviewed'
  );

-- ---------------------------------------------------------------------------
-- RLS / grants: new provenance/governance tables stay private; outcome links are
-- safe public projections only when their parent evidence and condition are public.
-- ---------------------------------------------------------------------------
alter table public.clinical_reviewer_credentials enable row level security;
alter table public.clinical_evidence_source_snapshots enable row level security;
alter table public.clinical_evidence_outcome_links enable row level security;
alter table public.clinical_evidence_grade_assessments enable row level security;
alter table public.clinical_evidence_publication_versions enable row level security;

create policy clinical_reviewer_credentials_review_access on public.clinical_reviewer_credentials
  for all to authenticated using (public.clinical_evidence_has_review_role(array['admin','operator']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator']));
create policy clinical_snapshots_review_access on public.clinical_evidence_source_snapshots
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_snapshots_review_insert on public.clinical_evidence_source_snapshots
  for insert to authenticated with check (public.clinical_evidence_has_review_role());
create policy clinical_outcome_links_public_read on public.clinical_evidence_outcome_links
  for select to anon, authenticated using (
    review_status = 'published'
    and exists (select 1 from public.clinical_condition_terms c where c.id = condition_term_id and c.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records e where e.id = evidence_record_id and e.review_status = 'published')
  );
create policy clinical_grade_assessments_review_access on public.clinical_evidence_grade_assessments
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_publication_versions_review_access on public.clinical_evidence_publication_versions
  for select to authenticated using (public.clinical_evidence_has_review_role());

grant select, insert, update on public.clinical_reviewer_credentials to authenticated;
grant select, insert on public.clinical_evidence_source_snapshots to authenticated;
grant select on public.clinical_evidence_outcome_links to anon, authenticated;
grant select, insert, update on public.clinical_evidence_grade_assessments to authenticated;
grant select on public.clinical_evidence_publication_versions to authenticated;
grant all on public.clinical_reviewer_credentials to service_role;
grant all on public.clinical_evidence_source_snapshots to service_role;
grant all on public.clinical_evidence_outcome_links to service_role;
grant all on public.clinical_evidence_grade_assessments to service_role;
grant all on public.clinical_evidence_publication_versions to service_role;

comment on table public.clinical_reviewer_credentials is
  'Private verified reviewer authority. Clinical/methodology approval requires a current credential bound to the authenticated reviewer identity.';
comment on table public.clinical_evidence_source_snapshots is
  'Private immutable evidence snapshots. hash_scope declares whether SHA-256 covers source bytes or a canonical reviewed extraction payload.';
comment on table public.clinical_evidence_outcome_links is
  'Outcome-level reviewed evidence graph. Source-metadata relationships may use direction=not-assessed and must not be interpreted as efficacy conclusions.';
comment on table public.clinical_evidence_grade_assessments is
  'Private reproducible evidence-grade domain assessments bound to credentialed approved reviews.';
comment on table public.clinical_evidence_publication_versions is
  'Private immutable history of public Clinical evidence projections.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814143500','clinical_evidence_v1_production_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814143500_clinical_evidence_v1_production_foundation.sql

-- RECOVERY BEGIN 20260814144000_clinical_evidence_v1_audit_immutability.sql
-- Clinical Evidence V1 audit-history immutability hardening.
-- Publication versions are append-only evidence of what the public projection showed.

create or replace function public.clinical_publication_version_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical publication versions are immutable; append a new version instead';
end;
$function$;

revoke all on function public.clinical_publication_version_immutable() from public;

drop trigger if exists trg_clinical_publication_version_immutable
  on public.clinical_evidence_publication_versions;
create trigger trg_clinical_publication_version_immutable
before update or delete on public.clinical_evidence_publication_versions
for each row execute function public.clinical_publication_version_immutable();

comment on table public.clinical_evidence_publication_versions is
  'Private append-only immutable history of public Clinical evidence projections.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814144000','clinical_evidence_v1_audit_immutability','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814144000_clinical_evidence_v1_audit_immutability.sql

-- RECOVERY BEGIN 20260814150000_clinical_evidence_v1_1_operations.sql
-- Clinical Evidence V1.1 governed evidence-operations layer.
-- Private operational queues only; no production migration is applied by this change.

create table if not exists public.clinical_evidence_intake_queue (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.clinical_evidence_sources(id) on delete restrict,
  intake_status text not null default 'queued' check (intake_status in (
    'queued','snapshot-required','extraction-required','provenance-review','qualified-review','grading-review','conflict-review','publication-ready','published','superseded','deferred','rejected'
  )),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  intended_conditions text[] not null default '{}',
  intended_jurisdictions text[] not null default '{}',
  intended_publication_scope text not null default 'clinical-synthesis' check (intended_publication_scope in ('source-metadata','clinical-synthesis')),
  coverage_status text not null default 'source-identified' check (coverage_status in (
    'source-identified','snapshot-captured','extracted','reviewed','published','deferred','rejected'
  )),
  assigned_user_id uuid,
  review_due_at timestamptz,
  notes text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id)
);

create table if not exists public.clinical_evidence_operation_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'source','intake','snapshot','extraction','credential','review','grade','conflict','evidence-record','publication','corpus'
  )),
  entity_id uuid,
  event_type text not null,
  actor_user_id uuid,
  event_payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create or replace function public.clinical_operation_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  raise exception 'Clinical operation events are append-only';
end;
$function$;
revoke all on function public.clinical_operation_event_immutable() from public;
drop trigger if exists trg_clinical_operation_event_immutable on public.clinical_evidence_operation_events;
create trigger trg_clinical_operation_event_immutable
before update or delete on public.clinical_evidence_operation_events
for each row execute function public.clinical_operation_event_immutable();

create or replace function public.clinical_intake_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
drop trigger if exists trg_clinical_intake_touch_updated_at on public.clinical_evidence_intake_queue;
create trigger trg_clinical_intake_touch_updated_at
before update on public.clinical_evidence_intake_queue
for each row execute function public.clinical_intake_touch_updated_at();

-- Credential verification state is private and only admin/operator may mutate it
-- through authenticated RLS. Service-role remains available to server-only admin actions.
alter table public.clinical_reviewer_credentials enable row level security;
alter table public.clinical_evidence_source_snapshots enable row level security;
alter table public.clinical_evidence_outcome_links enable row level security;
alter table public.clinical_evidence_grade_assessments enable row level security;
alter table public.clinical_evidence_publication_versions enable row level security;
alter table public.clinical_evidence_intake_queue enable row level security;
alter table public.clinical_evidence_operation_events enable row level security;

-- V1.0 may already have created some review-access policies on these tables.
-- Reconcile by name so the V1.1 migration is replay-safe across both isolated and
-- production-history application paths without weakening the intended predicates.
drop policy if exists clinical_reviewer_credentials_review_read on public.clinical_reviewer_credentials;
drop policy if exists clinical_reviewer_credentials_admin_write on public.clinical_reviewer_credentials;
drop policy if exists clinical_source_snapshots_review_read on public.clinical_evidence_source_snapshots;
drop policy if exists clinical_outcome_links_review_access on public.clinical_evidence_outcome_links;
drop policy if exists clinical_grade_assessments_review_access on public.clinical_evidence_grade_assessments;
drop policy if exists clinical_publication_versions_review_read on public.clinical_evidence_publication_versions;
drop policy if exists clinical_intake_queue_review_access on public.clinical_evidence_intake_queue;
drop policy if exists clinical_operation_events_review_access on public.clinical_evidence_operation_events;
drop policy if exists clinical_operation_events_review_insert on public.clinical_evidence_operation_events;

create policy clinical_reviewer_credentials_review_read on public.clinical_reviewer_credentials
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_reviewer_credentials_admin_write on public.clinical_reviewer_credentials
  for all to authenticated
  using (public.clinical_evidence_has_review_role(array['admin','operator']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator']));

create policy clinical_source_snapshots_review_read on public.clinical_evidence_source_snapshots
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_outcome_links_review_access on public.clinical_evidence_outcome_links
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_grade_assessments_review_access on public.clinical_evidence_grade_assessments
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_publication_versions_review_read on public.clinical_evidence_publication_versions
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_intake_queue_review_access on public.clinical_evidence_intake_queue
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_access on public.clinical_evidence_operation_events
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_operation_events_review_insert on public.clinical_evidence_operation_events
  for insert to authenticated with check (public.clinical_evidence_has_review_role());

grant select on public.clinical_reviewer_credentials to authenticated;
grant select on public.clinical_evidence_source_snapshots to authenticated;
grant select, insert, update on public.clinical_evidence_outcome_links to authenticated;
grant select, insert, update on public.clinical_evidence_grade_assessments to authenticated;
grant select on public.clinical_evidence_publication_versions to authenticated;
grant select, insert, update on public.clinical_evidence_intake_queue to authenticated;
grant select, insert on public.clinical_evidence_operation_events to authenticated;
grant all on public.clinical_reviewer_credentials to service_role;
grant all on public.clinical_evidence_source_snapshots to service_role;
grant all on public.clinical_evidence_outcome_links to service_role;
grant all on public.clinical_evidence_grade_assessments to service_role;
grant all on public.clinical_evidence_publication_versions to service_role;
grant all on public.clinical_evidence_intake_queue to service_role;
grant all on public.clinical_evidence_operation_events to service_role;

-- Private queue projections for the analyst/reviewer workbench.
create or replace view api.clinical_evidence_freshness_queue
with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.title,
  e.review_status,
  e.freshness_status,
  e.review_due_at,
  e.source_currentness_checked_at,
  e.freshness_reason,
  s.source_key,
  s.currentness as source_currentness,
  s.source_url
from public.clinical_evidence_records e
left join public.clinical_evidence_sources s on s.id = e.primary_source_registry_id
where e.freshness_status <> 'current'
   or (e.review_due_at is not null and e.review_due_at <= now() + interval '30 days');

revoke all on api.clinical_evidence_freshness_queue from public, anon;
grant select on api.clinical_evidence_freshness_queue to authenticated, service_role;

create or replace view api.clinical_evidence_review_queue
with (security_invoker = true) as
select
  q.id as intake_id,
  q.intake_status,
  q.priority,
  q.coverage_status,
  q.intended_conditions,
  q.intended_jurisdictions,
  q.intended_publication_scope,
  q.assigned_user_id,
  q.review_due_at,
  q.notes,
  s.id as source_id,
  s.source_key,
  s.source_type,
  s.title as source_title,
  s.publisher,
  s.source_url,
  s.doi,
  s.pmid,
  s.din,
  s.source_version,
  s.currentness,
  s.latest_snapshot_id,
  s.retrieved_at
from public.clinical_evidence_intake_queue q
join public.clinical_evidence_sources s on s.id = q.source_id;

revoke all on api.clinical_evidence_review_queue from public, anon;
grant select on api.clinical_evidence_review_queue to authenticated, service_role;

create index if not exists idx_clinical_intake_status_priority
  on public.clinical_evidence_intake_queue(intake_status, priority, updated_at);
create index if not exists idx_clinical_operation_events_entity
  on public.clinical_evidence_operation_events(entity_type, entity_id, recorded_at desc);
create index if not exists idx_clinical_records_freshness_due
  on public.clinical_evidence_records(freshness_status, review_due_at);

-- ---------------------------------------------------------------------------
-- V1.1 systematic Canadian coverage expansion.
-- These sources are source-registry + private intake records only. Nothing below
-- publishes a clinical conclusion, assigns a grade, or creates an efficacy record.
-- ---------------------------------------------------------------------------
insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, doi, pmid,
  source_version, published_on, retrieved_at, currentness, currentness_checked_at
) values
(
  'pubmed-40238954', 'systematic-review',
  'Living Systematic Review on Cannabis and Other Plant-Based Treatments for Chronic Pain: 2024 Update',
  'AHRQ / NCBI Bookshelf indexed in PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/40238954/', array['Global'], null, '40238954',
  '2024 update', null, '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-39953210', 'systematic-review',
  'Efficacy of cannabinoids for the prophylaxis of chemotherapy-induced nausea and vomiting-a systematic review and meta-analysis',
  'PubMed / indexed journal article',
  'https://pubmed.ncbi.nlm.nih.gov/39953210/', array['Global'], null, '39953210',
  '2025', null, '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-38478773', 'clinical-guideline',
  'Cannabis and Cannabinoids in Adults With Cancer: ASCO Guideline',
  'American Society of Clinical Oncology / PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/38478773/', array['Global'], null, '38478773',
  '2024', '2024-03-13', '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
),
(
  'pubmed-38171632', 'meta-analysis',
  'Cannabis for medical use versus opioids for chronic non-cancer pain: a systematic review and network meta-analysis of randomised clinical trials',
  'BMJ Open / PubMed',
  'https://pubmed.ncbi.nlm.nih.gov/38171632/', array['Global'], '10.1136/bmjopen-2022-068182', '38171632',
  '2024', '2024-01-03', '2026-08-14T15:00:00Z', 'current', '2026-08-14T15:00:00Z'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  doi = coalesce(excluded.doi, public.clinical_evidence_sources.doi),
  pmid = excluded.pmid,
  source_version = excluded.source_version,
  published_on = coalesce(excluded.published_on, public.clinical_evidence_sources.published_on),
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  currentness_checked_at = excluded.currentness_checked_at,
  updated_at = now();

insert into public.clinical_evidence_intake_queue (
  source_id, intake_status, priority, intended_conditions, intended_jurisdictions,
  intended_publication_scope, coverage_status, notes
)
select s.id, x.intake_status, x.priority, x.conditions, array['Canada'], 'clinical-synthesis', 'source-identified', x.notes
from public.clinical_evidence_sources s
join (values
  ('pubmed-40238954','snapshot-required','high',array['chronic pain'], 'Living systematic-review candidate. Private/ungraded until snapshot, structured extraction, provenance review and qualified clinical review are complete.'),
  ('pubmed-38171632','snapshot-required','normal',array['chronic non-cancer pain'], 'Network meta-analysis candidate. Private/ungraded; do not infer comparative recommendation from source identification alone.'),
  ('pubmed-39953210','snapshot-required','normal',array['chemotherapy-induced nausea and vomiting'], 'Systematic review/meta-analysis candidate. Private/ungraded pending review against current oncology context.'),
  ('pubmed-38478773','snapshot-required','high',array['cancer symptom management','chemotherapy-induced nausea and vomiting'], 'Professional guideline candidate. Private until provenance and qualified review determine exact claim-level applicability to Canada.')
) as x(source_key,intake_status,priority,conditions,notes)
  on x.source_key = s.source_key
on conflict (source_id) do update set
  priority = excluded.priority,
  intended_conditions = excluded.intended_conditions,
  intended_jurisdictions = excluded.intended_jurisdictions,
  notes = excluded.notes,
  updated_at = now();

comment on table public.clinical_evidence_intake_queue is
  'Private V1.1 evidence operations queue. Source identification never implies a clinical conclusion or grade.';
comment on table public.clinical_evidence_operation_events is
  'Private append-only operations audit trail for source, review, grading, conflict and publication workflow events.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814150000','clinical_evidence_v1_1_operations','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814150000_clinical_evidence_v1_1_operations.sql

-- RECOVERY BEGIN 20260814151000_clinical_evidence_v1_1_canadian_nabilone_source.sql
-- Clinical Evidence V1.1 Canadian regulated-drug source coverage.
-- Source-identification only: no clinical record, outcome direction or grade is published here.

insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, din,
  source_version, retrieved_at, currentness, currentness_checked_at
) values (
  'ca-cesamet-hpr-00548375-2026-08-14',
  'other',
  'CESAMET — Drug and Health Product Register',
  'Health Canada',
  'https://hpr-rps.hres.ca/details.php?drugproductid=385&query=',
  array['Canada'],
  '00548375',
  'Health Canada register snapshot checked 2026-08-14',
  '2026-08-14T15:15:00Z',
  'current',
  '2026-08-14T15:15:00Z'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  din = excluded.din,
  source_version = excluded.source_version,
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  currentness_checked_at = excluded.currentness_checked_at,
  updated_at = now();

insert into public.clinical_evidence_intake_queue (
  source_id, intake_status, priority, intended_conditions, intended_jurisdictions,
  intended_publication_scope, coverage_status, notes
)
select
  s.id,
  'snapshot-required',
  'high',
  array['severe nausea and vomiting associated with cancer therapy'],
  array['Canada'],
  'source-metadata',
  'source-identified',
  'Authoritative Health Canada register source confirms marketed CESAMET/nabilone product metadata and consumer-information indication context. Capture the current full product monograph before any source-metadata publication; keep ungraded and private until provenance review.'
from public.clinical_evidence_sources s
where s.source_key = 'ca-cesamet-hpr-00548375-2026-08-14'
on conflict (source_id) do update set
  priority = excluded.priority,
  intended_conditions = excluded.intended_conditions,
  intended_jurisdictions = excluded.intended_jurisdictions,
  intended_publication_scope = excluded.intended_publication_scope,
  notes = excluded.notes,
  updated_at = now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814151000','clinical_evidence_v1_1_canadian_nabilone_source','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814151000_clinical_evidence_v1_1_canadian_nabilone_source.sql

-- RECOVERY BEGIN 20260814180000_bound_classify_retries.sql
-- Bound the classifier retry loop: record per-attempt outcomes, retire signals
-- that keep failing into the manual-review queue, and stop re-dispatching them.
--
-- TWO DEFECTS, ONE OUTAGE
--
-- DEFECT 1 -- the dispatch budget is a reservation that is never released.
--
-- `hv_classify_corpus_dispatch()` calls
-- `hv_consume_dispatch_budget('classify', p_limit)` BEFORE it selects any rows,
-- charging the full p_limit whether or not there is anything to dispatch, and
-- nothing ever returns the unused remainder. `hv_pipeline_tick()` passes 120 and
-- runs every 30 minutes, so the ceiling is consumed at 120 x 48 = 5,760/day
-- against a 3,000/day limit -- exhausted after ~25 ticks, roughly 12.5 hours,
-- every single day, even with an empty pool and zero work performed.
--
-- Demonstrated locally on a PostgreSQL 16 harness: with every signal already
-- classified and the review queue empty, two consecutive ticks reported
-- `dispatched = 0` while `calls_used` advanced 0 -> 120.
--
-- This is why all three metered stages sit at exactly their ceilings on
-- 2026-08-14 (classify 3000/3000, translate 800/800, entities 600/600). Three
-- independent workloads landing precisely on three different ceilings is not a
-- coincidence about volume; it is unconditional reservation.
--
-- DEFECT 2 -- failed attempts are not recorded, so they repeat without limit.
--
-- `hv_classify_corpus_harvest()` only ever writes a signal when the edge
-- response is HTTP 200 *and* its body carries a `classification` object. Every
-- other case falls through the `if v_c is not null` guard, does nothing, and
-- still marks the job `harvested = true`.
--
-- Nothing records that the attempt failed. The signal keeps
-- `quality_label is null`, which is exactly the predicate
-- `hv_classify_corpus_dispatch()` selects on, so the same row is dispatched
-- again on the next tick, and the next, without limit.
--
-- That turns a transient upstream failure into a permanent outage, because the
-- retries are charged against the daily dispatch budget that
-- `hv_consume_dispatch_budget('classify', ...)` enforces. Once the failing
-- backlog is large enough to consume the ceiling, healthy new signals never get
-- dispatched at all -- the cost control works exactly as designed and is spent
-- entirely on rows that will fail again.
--
-- MEASURED AGAINST PRODUCTION 2026-08-14, not inferred:
--
--   classify budget (hv_dispatch_budget) ............ 3000 / 3000 used
--   eligible unclassified backlog ................... 123 signals
--   hv_classify_jobs rows for those 123 signals ..... 3,859
--   average dispatches per backlogged signal ........ 31.4
--   most-retried single signal ...................... 392 dispatches
--
--   signals ingested / left unclassified, by day:
--     2026-08-11 .... 133 ingested,   0 unclassified    (0.0%)
--     2026-08-12 ....  27 ingested,  21 unclassified   (77.8%)
--     2026-08-13 ....  44 ingested,  44 unclassified  (100.0%)
--     2026-08-14 ....  62 ingested,  57 unclassified   (91.9%)
--
-- 123 backlogged rows retried across 48 ticks/day at 120 per tick lands on
-- ~2,950 calls against a 3,000 ceiling. The arithmetic closes: the loop is
-- self-sustaining and will not clear on its own.
--
-- The surviving `net._http_response` rows show what the retries were buying:
--
--   200 with body {"ok":true,"routed":"manual_review","reason":"openai_429"} .. 169
--   503 SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED ............................... 71
--
-- Note the first shape carries HTTP 200 and no `classification` key. To the
-- harvester that is indistinguishable from success, which is why the failure
-- was invisible while every cron job reported green.
--
-- WHY THE EDGE FUNCTION CANNOT FIX THIS ALONE
--
-- `hv-classify`'s ad-hoc `{text}` path reports `routed: "manual_review"` but
-- performs no routing -- unlike its `pool` and `eval` modes, it never calls
-- `routeToManualReview`. It cannot: `hv_classify_corpus_dispatch` posts only
-- `{text: {headline, summary}}` and no `signalId`, so the function does not know
-- which row it is judging. Confirmed by the queue itself --
-- `public.intel_classify_review_queue` has taken no new row since 2026-07-21
-- despite 169 "routed to manual review" responses today alone.
--
-- So `INTELLIGENCE_ARCHITECTURE_SPEC.md` §6.1's stated safety property --
-- "nothing is silently dropped" -- does not hold for the path Pipeline B
-- actually uses. The harvester is the only participant that knows the
-- signal_id, so the routing belongs here.
--
-- WHAT THIS CHANGES
--
-- 1. `hv_classify_jobs` gains `outcome` and `attempted_at`, so a failed attempt
--    is distinguishable from a successful one after the fact.
-- 2. `hv_classify_corpus_harvest()` records that outcome instead of discarding
--    it. Its successful path is byte-for-byte unchanged.
-- 3. `hv_classify_corpus_dispatch()` retires a signal to
--    `intel_classify_review_queue` after c_max_attempts recorded failures and
--    excludes anything sitting unresolved in that queue from further dispatch.
-- 4. `hv_classify_corpus_dispatch()` selects its batch before charging the
--    budget, and charges for exactly the rows it will dispatch. The ceiling and
--    its fail-closed behaviour on an unknown stage name are unchanged;
--    `hv_consume_dispatch_budget` itself is not modified.
--
-- Only `classify` is changed here. `translate` and `entities` dispatch through
-- their own functions with the same reservation defect and are left alone: this
-- migration is scoped to the stage whose outage was actually measured, and
-- fixing all three at once would make it un-revertable in isolation. They are
-- called out in the PR so the remaining work is visible rather than implied.
--
-- Existing `hv_classify_jobs` rows keep `outcome = null` -- their outcomes were
-- never recorded and are not recoverable, so they are left honestly unknown
-- rather than backfilled with a guess. The 123 backlogged signals therefore get
-- a fresh budget of c_max_attempts each (~615 calls, one-off) and then retire
-- permanently.
--
-- Confirmed read-only against production before writing this: with `outcome`
-- absent, the retirement predicate matches 0 rows, so nothing is mass-retired on
-- first run. The dispatch pool goes 123 -> 122, the single row removed being one
-- already sitting unresolved in the review queue from July.
--
-- Note the two defects interact, so do not read the retry counts as the budget
-- driver: today the reservation (Defect 1) exhausts the ceiling first, which
-- caps how often the retries (Defect 2) can actually fire. Fixing only Defect 1
-- would have freed the budget for an unbounded retry loop to consume in earnest
-- -- roughly 123 x 48 ticks -- which is why both are fixed together.
--
-- Resolving a queue row makes its signal eligible again, which is the intended
-- manual-override path and the reason the exclusion tests `not q.resolved`
-- rather than mere presence.
--
-- SEARCH PATH
--
-- Both functions are recreated with their live `search_path` reproduced
-- verbatim, including its duplicated 'public' entry. That duplicate is not a
-- typo to tidy: narrowing a pinned search_path on a SECURITY DEFINER function
-- in this database is precisely what broke `hv_dedup_assign` on 2026-08-14
-- (see 20260814143000). Verbatim is the house standard here.

alter table public.hv_classify_jobs
  add column if not exists outcome text,
  add column if not exists attempted_at timestamptz;

-- Added without a default so the rewrite is skipped and pre-existing rows stay
-- NULL ("not recorded") rather than being stamped with the migration time.
alter table public.hv_classify_jobs
  alter column attempted_at set default now();

comment on column public.hv_classify_jobs.outcome is
  'Harvest result for this dispatch: ok | no_classification | http_<status>. NULL means the attempt predates 20260814180000 and its outcome was never recorded.';

create index if not exists hv_classify_jobs_signal_failed_idx
  on public.hv_classify_jobs (signal_id)
  where outcome is not null and outcome <> 'ok';

create index if not exists intel_classify_review_queue_unresolved_idx
  on public.intel_classify_review_queue (signal_id)
  where not resolved;

create or replace function public.hv_classify_corpus_harvest()
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_c jsonb; v_outcome text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    v_outcome := 'http_' || coalesce(r.status_code::text, 'null');
    if r.status_code=200 then
      v_outcome := 'no_classification';
      begin
        v_c := (r.content::jsonb->'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v2-summary-fix'
          where s.id = r.signal_id;
          v_outcome := 'ok';
          n:=n+1;
        end if;
      exception when others then v_outcome := 'parse_error';
      end;
    end if;
    update public.hv_classify_jobs
       set harvested=true, outcome=v_outcome, attempted_at=coalesce(attempted_at, now())
     where request_id=r.request_id;
  end loop;
  return n;
end$function$;

create or replace function public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; n int:=0; v_ids text[]; c_max_attempts constant int := 5;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  -- Retire anything that has failed c_max_attempts times into manual review, so
  -- the exclusion below can take it out of the dispatch pool permanently. This
  -- runs before the budget is consumed: retiring a dead row must not itself be
  -- rationed, or a saturated budget would keep the loop alive forever.
  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select s.id,
         coalesce(s.title_en, s.headline),
         coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline),
         'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days||' days')::interval
    and (
      select count(*) from public.hv_classify_jobs k
      where k.signal_id = s.id and k.outcome is not null and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched. The original charged p_limit up front and
  -- never returned the unused remainder, so a tick that dispatched nothing
  -- still spent its full reservation -- see the header for the measurements.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
      and not exists (select 1 from public.intel_classify_review_queue q where q.signal_id=s.id and not q.resolved)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('classify', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

-- Deliberately no GRANT block.
--
-- The sibling migration 20260814143000 ends with `grant execute ... to
-- service_role`, and copying that pattern here would have been wrong. Checked
-- rather than assumed -- live ACLs on 2026-08-14:
--
--   hv_classify_corpus_dispatch ..... {postgres=X/postgres}
--   hv_classify_corpus_harvest ...... {postgres=X/postgres}
--   hv_pipeline_tick ................ {postgres=X/postgres}
--   hv_dedup_assign ................. {postgres=X/postgres,service_role=X/postgres}
--
-- Only hv_dedup_assign carries service_role, and these two are reached solely
-- through hv_pipeline_tick under pg_cron, which runs as postgres. Adding
-- service_role would widen privileges beyond what the caller needs, against
-- Guardrail 6. `create or replace function` preserves the existing ACL, so the
-- current least-privilege state carries forward untouched.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814180000','bound_classify_retries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814180000_bound_classify_retries.sql

-- RECOVERY BEGIN 20260814220000_assert_alert_delivery_configured.sql
-- Make an unconfigured alert channel a first-class alert instead of a silent skip.
--
-- THE DEFECT
--
-- `hv_alert_tick()` emails through Resend only when the vault holds BOTH
-- `resend_api_key` and `alert_email_to`. When either is missing it takes an
-- early return:
--
--   return jsonb_build_object(..., 'delivery',
--     'skipped: vault needs resend_api_key and alert_email_to
--      (detection and history are unaffected)');
--
-- That return value goes to pg_cron job 55, which discards it. So the alerting
-- system reports its own deafness into a void.
--
-- MEASURED AGAINST PRODUCTION 2026-08-14, not inferred:
--
--   vault.decrypted_secrets 'resend_api_key' ......... 0 rows
--   vault.decrypted_secrets 'alert_email_to' ......... 0 rows
--   hv_alert_log open (resolved_at is null) .......... 3
--   hv_alert_log ever notified (notified_at not null) . 0
--
-- Zero. Not one alert has been delivered in the entire history of the table,
-- and the three currently open ones are not minor:
--
--   classification_stalled  critical  first seen 2026-08-13 20:47  value 122
--   edge_http_errors        critical  first seen 2026-08-13 20:47  value 3
--   extraction_rescan       warning   first seen 2026-08-12 00:47  value 40
--
-- `classification_stalled` is the assertion that catches exactly the outage
-- diagnosed on 2026-08-14 -- "signals ingested >6h ago with no quality_label".
-- It fired correctly, a day early, and reached nobody.
--
-- INTELLIGENCE_ARCHITECTURE_SPEC.md §9 Guardrail 5 requires that "observable"
-- mean actively alerting, "not a dashboard someone has to remember to check".
-- The detection half satisfies that. The delivery half is unconfigured, and
-- nothing anywhere reports that fact.
--
-- WHY THIS EXTENDS hv_pipeline_alerts RATHER THAN FIXING hv_alert_tick
--
-- The obvious repair is to make `hv_alert_tick` raise or otherwise escalate on
-- the unconfigured path. That would be clobbered.
--
-- `20260802080000_harden_eval_labels_and_alert_delivery.sql` is committed,
-- merged, and NOT applied to production (verified: absent from
-- schema_migrations; `hv_alert_log` has no `delivery_status` column). It is
-- classified `separately_authorized` in the pending-decisions ledger, so it is
-- deliberately gated, not forgotten. It redefines `hv_alert_tick` -- and
-- carries the SAME silent-skip early return at its own line 180.
--
-- So any edit to `hv_alert_tick` here would be silently reverted the moment
-- that gated migration is applied, because it is an EARLIER version number that
-- will be applied LATER. `hv_pipeline_alerts()` is not redefined by it
-- (checked, not assumed: the only functions it replaces are
-- `api.admin_add_signal_to_eval_set` and `public.hv_alert_tick`), so extending
-- the board is durable across that release where patching the tick is not.
--
-- It is also the better fit: this is an assertion about pipeline health, and
-- asserting is what this function is for.
--
-- SELF-REFERENCE IS INTENTIONAL AND BOUNDED
--
-- `hv_alert_tick` calls `hv_pipeline_alerts()` and then upserts the non-ok rows
-- into `hv_alert_log`; this new assertion reads `hv_alert_log`. That is not a
-- loop. The read happens inside the `cur` CTE under the statement snapshot, so
-- it observes the table as of statement start and cannot see its own insert.
--
-- The assertion counts open alerts rather than un-notified ones on purpose.
-- `resolved_at` means the same thing before and after 20260802080000, whereas
-- that migration reworks delivery bookkeeping (`notified_at` gains company in
-- `delivery_status`, `delivery_attempts`, `last_delivery_error`). Keying on the
-- stable column keeps this assertion correct across that release.
--
-- Once both secrets exist the assertion returns 'ok' and `hv_alert_tick`
-- resolves the logged row on its next pass. It is self-clearing; no follow-up
-- migration is needed to retire it.
--
-- WHAT THIS DOES NOT DO
--
-- It does not deliver anything. An alert saying "alerts cannot be delivered"
-- still cannot be emailed. It makes the condition visible wherever the board is
-- read and gives it a dated row in `hv_alert_log`, which is strictly better than
-- a discarded string, but the actual repair is two vault secrets -- an owner
-- action under CLAUDE.md Rule 3b, deliberately not taken here.
--
-- A hard failure signal is available if wanted: schedule a job that raises when
-- this assertion is critical, so `cron.job_run_details.status` goes 'failed'.
-- That needs a pg_cron change, which is owner state with no version history
-- (AGENT_OPERATING_FACTS.md §10), so it is left as a decision rather than done.
--
-- The whole function is restated because `create or replace function` has no
-- partial form. Every pre-existing assertion below is reproduced verbatim from
-- the live definition read back on 2026-08-14; the only change is the final
-- `alert_delivery_unconfigured` block.

create or replace function public.hv_pipeline_alerts()
 returns table(alert_key text, severity text, value text, detail text)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
  select 'dispatch_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'unharvested dispatch jobs whose HTTP response was 4xx/5xx; any non-zero means a stage is failing every call'
  from (
    select count(*) n from (
      select j.request_id from public.hv_classify_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_entity_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_embed_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_translation_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
    ) e) d

  union all
  -- Structural rescan check: a signal already dispatched must not be eligible again.
  select 'extraction_rescan',
         case when n > 50 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'signals already entity-dispatched yet still eligible for dispatch; >0 means the once-only guard has regressed'
  from (
    select count(*) n
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)
  ) rs

  union all
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
  select 'budget_below_ingest',
         case when ceiling_per_day < ingest_per_day then 'critical'
              when ceiling_per_day < ingest_per_day * 1.5 then 'warning' else 'ok' end,
         ceiling_per_day::text || '/day vs ' || round(ingest_per_day)::text || ' ingested/day',
         'classify daily ceiling versus actual ingest rate; at or below parity the backlog can never clear'
  from (
    select (select daily_ceiling from public.hv_dispatch_budget where stage='classify') as ceiling_per_day,
           (select count(*)::numeric/7 from public.signals where created_at > now() - interval '7 days') as ingest_per_day
  ) b

  union all
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- Every classifier_version in use must have a gate_passed row, else promotion for
  -- those rows halts silently. Checks all versions present, not just one guessed row.
  select 'classifier_gate',
         case when n_ungated > 0 then 'critical' else 'ok' end,
         coalesce(versions, 'none'),
         'classifier versions on signals lacking a gate_passed=true validation row; any such version cannot promote'
  from (
    select count(*) filter (where not coalesce(cv.gate_passed,false)) as n_ungated,
           string_agg(v.classifier_version || '=' || coalesce(cv.gate_passed::text,'no_row'), ', ' order by v.classifier_version) as versions
    from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version
  ) g

  union all
  -- Asserts the outcome (a 2xx actually came back) rather than trusting the caller.
  select 'edge_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'non-2xx or timed-out edge-function responses in the last 2h; pg_cron reports these as succeeded'
  from (
    select count(*) as n
    from net._http_response
    where created > now() - interval '2 hours'
      and (status_code is null or status_code < 200 or status_code >= 300)
  ) eh

  union all
  -- Asserts that ingested signals are actually getting labelled.
  select 'classification_stalled',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'signals ingested >6h ago with no quality_label; unclassified rows can never promote'
  from (
    select count(*) as n
    from public.signals
    where quality_label is null
      and created_at < now() - interval '6 hours'
      and created_at > now() - interval '7 days'
  ) cs

  union all
  -- Asserts that the alerting channel can actually reach a human. Every other
  -- assertion above is worthless if this one is failing: hv_alert_tick records
  -- breaches either way, but sends nothing without both vault secrets, and it
  -- reports that only through a return value pg_cron discards.
  --
  -- Critical only when something is actually waiting to be sent. An unconfigured
  -- channel with a clean board is a warning, not an emergency -- keeping the
  -- board honest matters more here than shouting, because a permanently critical
  -- row is one people learn to scroll past.
  select 'alert_delivery_unconfigured',
         case when not configured and n_open > 0 then 'critical'
              when not configured then 'warning'
              else 'ok' end,
         case when configured then 'configured'
              else n_open::text || ' open alert(s) with no delivery channel' end,
         'hv_alert_tick emails via Resend only when vault holds resend_api_key and alert_email_to; without both it logs breaches and silently sends nothing'
  from (
    select (exists (select 1 from vault.decrypted_secrets where name = 'resend_api_key')
        and exists (select 1 from vault.decrypted_secrets where name = 'alert_email_to')) as configured,
           (select count(*) from public.hv_alert_log where resolved_at is null) as n_open
  ) ad;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260814220000','assert_alert_delivery_configured','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260814220000_assert_alert_delivery_configured.sql

-- RECOVERY BEGIN 20260815013000_lock_down_api_schema_drift_rpcs.sql
-- Revoke PUBLIC/anon/authenticated EXECUTE on the api-schema drift RPCs.
--
-- LIVE EXPOSURE, measured against production 2026-08-15
--
--   api.get_tables_missing_from_api_schema()
--   api.get_functions_missing_from_api_schema()
--     proacl = {=X/postgres, postgres=X/postgres, service_role=X/postgres,
--               anon=X/postgres, authenticated=X/postgres}
--
-- The leading `=X/postgres` grants EXECUTE to the PUBLIC pseudo-role, and anon
-- and authenticated additionally hold it explicitly. The `api` schema is the
-- PostgREST-exposed one, so both functions are callable by anyone holding the
-- publishable anon key.
--
-- What they return is a list of tables and functions that exist in the database
-- but are NOT exposed through `api` -- i.e. an enumeration of internal object
-- names. That is schema reconnaissance available without authentication. No row
-- data is exposed, so this is disclosure of structure rather than of records,
-- but it is precisely the surface an attacker maps first.
--
-- The corresponding `public.*` functions are already correct
-- ({postgres, service_role} only), which is what makes the `api` wrappers the
-- gap rather than a deliberate design.
--
-- WHY THIS IS A NEW MIGRATION RATHER THAN AN EDIT
--
-- These exact statements already exist in the tree -- appended to
-- `20260810222500_harden_edge_function_cron_auth.sql` by commit 1f9660df
-- ("Harden schema drift RPC ACLs on current main", 2026-08-11, pushed straight
-- to main with no PR).
--
-- That migration is **pending and gated**: classified `separately_authorized`
-- in `pending-production-migration-decisions.json`, never applied to
-- production. Its content is bound by git blob hash, and appending to it broke
-- the binding -- expected c7174bb1, got 78f02bd8. That mismatch has been
-- failing `check-pending-production-migration-decisions.mjs` on pristine `main`
-- ever since, and is what blocks PR #1423.
--
-- There were two ways to clear it. Re-recording the hash would bless content
-- that reached main without review -- defeating the exact control the binding
-- exists to enforce. So instead `20260810222500` is restored to its bound
-- content (verified: the restored file hashes to c7174bb1 again) and the ACL
-- work is carried here, where it gets its own version, its own review, and no
-- entanglement with a release someone deliberately gated.
--
-- The security fix is therefore preserved, not discarded -- it just stops
-- riding along inside a migration that is not cleared to ship.
--
-- SAFETY
--
-- This only revokes. The sole caller is the `schema-drift-monitor` edge
-- function, which builds its client from SERVICE_ROLE_KEY and calls both RPCs
-- through it (verified in `supabase/functions/schema-drift-monitor/index.ts`).
-- service_role keeps EXECUTE, so the monitor is unaffected.
--
-- The schema-usage grant to service_role is retained from the original
-- statements: it is required for that role to reach the wrappers at all, and
-- schema usage alone exposes no object.
--
-- The public.* revokes look redundant -- those ACLs are already correct in
-- production. They are kept deliberately: they cost nothing (REVOKE on an
-- already-revoked privilege is a no-op, as is GRANT on one already held), they
-- make a fresh replay reach the same state rather than depending on history,
-- and `tests/security/edge-function-auth-hardening.test.ts` asserts both
-- schemas explicitly.
--
-- NOTE FOR FUTURE EDITORS: that test parses this file with regexes over the
-- lowercased text and does not skip comments. Do not write a literal GRANT or
-- REVOKE statement in prose here -- an earlier draft did, and the parser
-- counted the comment as a real statement.

grant usage on schema api to service_role;

revoke execute on function api.get_tables_missing_from_api_schema() from public, anon, authenticated;
revoke execute on function api.get_functions_missing_from_api_schema() from public, anon, authenticated;
grant execute on function api.get_tables_missing_from_api_schema() to service_role;
grant execute on function api.get_functions_missing_from_api_schema() to service_role;

revoke execute on function public.get_tables_missing_from_api_schema() from public, anon, authenticated;
revoke execute on function public.get_functions_missing_from_api_schema() from public, anon, authenticated;
grant execute on function public.get_tables_missing_from_api_schema() to service_role;
grant execute on function public.get_functions_missing_from_api_schema() to service_role;

revoke all on api.schema_drift_alerts from public, anon, authenticated;
grant select, insert on api.schema_drift_alerts to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815013000','lock_down_api_schema_drift_rpcs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815013000_lock_down_api_schema_drift_rpcs.sql

-- RECOVERY BEGIN 20260815140000_bound_entities_translate_budget.sql
-- Charge the entities and translate dispatch budgets for work actually done.
--
-- THE DEFECT
--
-- This is the same defect as `classify` Defect 1, fixed in
-- `20260814180000_bound_classify_retries.sql` and since proven in production.
-- That migration's header recorded the other two stages as out of scope:
--
--   "translate and entities share defect 1 in their own dispatch functions"
--
-- This closes them. Both functions charge the full requested limit before they
-- know whether any row qualifies:
--
--   p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
--   p_limit := public.hv_consume_dispatch_budget('entities', p_limit);  -- charged
--   if p_limit <= 0 then return 0; end if;
--   for r in select ... limit p_limit loop                              -- may be empty
--
-- `hv_pipeline_tick` passes 40 to each, every 30 minutes. A tick that dispatches
-- nothing still spends 40. entities has a 600/day ceiling and translate 800, so
-- 15 and 20 empty ticks respectively exhaust a full day of budget having done no
-- work at all.
--
-- MEASURED AGAINST PRODUCTION 2026-08-15, not inferred:
--
--   stage      calls_used / daily_ceiling
--   entities         600 / 600     (pinned at ceiling)
--   translate        800 / 800     (pinned at ceiling)
--   classify        1005 / 3000    (fixed 2026-08-14; stopped climbing)
--
-- classify is the control. Before its fix it sat at 3000/3000 on the same
-- pattern; after it, it froze at 1005 once its pool drained, while entities and
-- translate continued to ceiling. The difference between them is exactly this
-- change.
--
-- WHAT IS NOT CHANGED
--
-- `hv_embed_dispatch` was checked and is NOT defective. It charges
-- `least(array_length(p_signal_ids,1), 100)` -- the real size of the array it
-- was handed -- and then slices `v_ids := p_signal_ids[1 : v_allowed]` so it
-- processes exactly what it paid for. It is deliberately left alone; "fix the
-- other dispatchers too" would have broken a correct function.
--
-- `hv_consume_dispatch_budget` itself is untouched, as are both ceilings, both
-- clamps, both candidate queries, both request bodies and both job-table
-- inserts. The reap step in the entities function keeps running before the
-- budget is consulted: releasing a job whose response never arrived must not be
-- rationed, or a saturated budget would keep its signal hostage forever.
--
-- Only the order of "select the batch" and "charge the budget" changes, plus
-- charging the measured batch size instead of the requested limit.

create or replace function public.hv_entities_dispatch(p_limit integer DEFAULT 60)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0; v_ids text[];
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);

  -- Reap jobs that never produced a response; without this they hold their signal
  -- hostage permanently via the unharvested-job guard below. Unrationed on
  -- purpose -- see the header.
  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('entities', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

create or replace function public.hv_translate_dispatch(p_limit integer DEFAULT 30, p_eval_only boolean DEFAULT false)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; v_key text; n int := 0; v_ids text[];
begin
  p_limit := least(greatest(coalesce(p_limit, 30), 1), 50);

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched. p_eval_only is part of the candidate
  -- predicate and so is applied here, before the charge, exactly as it was
  -- applied before inside the loop's query.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where coalesce(s.lang,'en') not in ('en','EN')
      and s.title_en is null
      and s.headline is not null
      and (not p_eval_only or s.id in (select signal_id from public.intel_eval_set))
      and not exists (select 1 from public.hv_translation_jobs j where j.signal_id = s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('translate', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id, s.headline, s.summary
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url := 'https://api.openai.com/v1/chat/completions',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body := jsonb_build_object(
        'model','gpt-4o-mini','temperature',0,
        'response_format', jsonb_build_object('type','json_object'),
        'messages', jsonb_build_array(
          jsonb_build_object('role','system','content','You translate cannabis-industry news to English for a B2B regulatory-intelligence pipeline. Detect the original language and translate the headline and summary into natural English. Return ONLY strict JSON: {"lang":"<ISO 639-1>","title_en":"...","summary_en":"..."}. If already English, echo it back with lang:"en".'),
          jsonb_build_object('role','user','content','HEADLINE: '||coalesce(r.headline,'')||E'\nSUMMARY: '||coalesce(left(r.summary,1000),''))
        )
      ),
      timeout_milliseconds := 30000
    ) into v_rid;
    insert into public.hv_translation_jobs(request_id, signal_id) values (v_rid, r.id)
      on conflict (request_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815140000','bound_entities_translate_budget','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815140000_bound_entities_translate_budget.sql

-- RECOVERY BEGIN 20260815190715_daily_brief_event_dedup_hardening.sql
create table if not exists public.signal_digest_canonical_links (
  duplicate_signal_id text primary key references public.signals(id) on delete cascade,
  canonical_signal_id text not null references public.signals(id) on delete cascade,
  reason text not null default 'same_event',
  created_at timestamptz not null default now(),
  constraint signal_digest_canonical_links_not_self check (duplicate_signal_id <> canonical_signal_id)
);

comment on table public.signal_digest_canonical_links is
  'Private presentation-layer canonical mapping. Preserves all source signals while suppressing same-event duplicates from digest presentation.';

alter table public.signal_digest_canonical_links enable row level security;
revoke all on table public.signal_digest_canonical_links from anon, authenticated;
grant all on table public.signal_digest_canonical_links to service_role;

create index if not exists idx_signal_digest_canonical_links_canonical
  on public.signal_digest_canonical_links(canonical_signal_id);

-- Cross-cluster same-event links for the five audited Daily Brief events.
-- These inserts do not modify public.signals; they preserve the source rows as corroboration.
insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-libby-phase2', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-libby-phase2'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-14 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-07-27 23:59:59+00'
  and (
    s.headline ilike '%LiBBY%'
    or s.headline ilike '%THC%CBD%agitation%late-stage dementia%'
    or s.headline ilike '%THC and CBD Reduce Agitation in Late-Stage Dementia%'
    or (s.source = 'Cannabis Health UK' and s.headline ilike '%agitation%dementia%')
  )
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-curaleaf-spain', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-curaleaf-spain'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-13 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-07-24 00:00:00+00'
  and s.headline ilike '%Curaleaf%Spain%'
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

insert into public.signal_digest_canonical_links (duplicate_signal_id, canonical_signal_id, reason)
select s.id, 'daily-2026-08-15-sndl-parallel', 'same_event_cross_cluster'
from public.signals s
where s.id <> 'daily-2026-08-15-sndl-parallel'
  and coalesce(s.date, s.created_at) >= timestamptz '2026-07-27 00:00:00+00'
  and coalesce(s.date, s.created_at) <  timestamptz '2026-08-04 00:00:00+00'
  and (s.headline ilike '%SNDL%Parallel%' or s.headline ilike '%Parallel takeover%')
on conflict (duplicate_signal_id) do update
set canonical_signal_id = excluded.canonical_signal_id,
    reason = excluded.reason;

create or replace view public.signals_for_digest
with (security_invoker = true)
as
select
  sq.id,
  sq.headline as title,
  sq.cat as type,
  sq.country as market,
  sq.cat as category,
  sq.score as confidence,
  coalesce(sq.commercial_impact, '') as commercial_impact,
  sq.summary,
  coalesce(sq.date, sq.created_at) as detected_at,
  'signals'::text as source_table
from public.signals_quality sq
join public.signals s on s.id = sq.id
where sq.headline is not null
  and sq.summary is not null
  and coalesce(s.is_representative, true) is true
  and not exists (
    select 1
    from public.signal_digest_canonical_links l
    where l.duplicate_signal_id = sq.id
  )
union all
select
  ia.id,
  ia.title,
  ia.type,
  ia.market,
  ia.category,
  ia.confidence,
  coalesce(ia.commercial_impact, '') as commercial_impact,
  ia.summary,
  ia.detected_at,
  'ia_signals'::text as source_table
from public.ia_signals ia
where ia.stage = 'qualified'
  and ia.title is not null
  and ia.summary is not null
  and ia.id not like 's-%';

comment on view public.signals_for_digest is
  'Digest presentation candidates: quality-gated representative signals only, explicit same-event canonical suppression, and no mirrored s-* ia_signals.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815190715','daily_brief_event_dedup_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815190715_daily_brief_event_dedup_hardening.sql

-- RECOVERY BEGIN 20260815204500_daily_brief_delta_intelligence.sql
-- ============================================================================
-- STATUS NOTE added 2026-09-20 (not part of the original migration):
-- The table/index/helper-function portions of this file were applied to
-- production on 2026-09-20 under version 20260920000001
-- (daily_brief_lineage_data_model_partial_apply.sql). The run_daily_digest()
-- rewrite/patch in this file was NOT applied: the live run_daily_digest()
-- has evolved past what this file expects (manual fallback, smart-truncate,
-- feedback-based ranking added Aug 30-Sep 1, after this file was written).
-- Lineage-aware GATING inside run_daily_digest() remains un-integrated and
-- needs a manual rebase against the current live function, not a raw apply
-- of this file. Do not apply this file directly.
-- ============================================================================

-- Daily Brief delta-intelligence foundation.
--
-- Preserves the existing signal_digest_canonical_links / signals_for_digest
-- presentation dedup layer and adds cross-edition event lineage, candidate
-- assessments and presentation history. The nightly writer now classifies
-- every candidate as new_event, material_advancement or unchanged_duplicate
-- before publication. Only the first two states may enter daily_digest.

create table if not exists public.digest_event_lineage (
  event_key text primary key,
  root_event_key text not null,
  latest_signal_id text references public.signals(id) on delete set null,
  prior_event_key text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  latest_advancement_reason text null,
  first_presented_on date not null default current_date,
  last_presented_on date not null default current_date,
  presentation_count integer not null default 1 check (presentation_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digest_event_lineage_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  )
);

create table if not exists public.digest_candidate_assessments (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete cascade,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  include_in_edition boolean not null default false,
  assessed_at timestamptz not null default now(),
  constraint digest_candidate_assessments_delta_status_check check (
    delta_status in ('new_event', 'material_advancement', 'unchanged_duplicate')
  ),
  constraint digest_candidate_assessments_priority_domain_check check (
    priority_domain in (
      'global_medical', 'import_export_eu_gmp', 'm_and_a', 'licensing_regulatory',
      'commercial_distribution', 'genetics', 'formulations',
      'pharmaceutical_cannabinoid_technology', 'other'
    )
  ),
  constraint digest_candidate_assessments_unique_signal_day unique (digest_date, signal_id)
);

create table if not exists public.digest_presentation_history (
  id bigint generated always as identity primary key,
  digest_date date not null,
  signal_id text not null references public.signals(id) on delete restrict,
  event_key text not null,
  prior_event_key text null,
  delta_status text not null,
  advancement_reason text null,
  headline text not null,
  why_it_matters text not null,
  jurisdiction text not null default 'Global',
  entities jsonb not null default '[]'::jsonb,
  priority_domain text not null default 'other',
  verified_facts jsonb not null default '[]'::jsonb,
  inferences jsonb not null default '[]'::jsonb,
  competitive_position_change boolean not null default false,
  competitive_position_detail text null,
  presented_at timestamptz not null default now(),
  constraint digest_presentation_history_delta_status_check check (
    delta_status in ('new_event', 'material_advancement')
  ),
  constraint digest_presentation_history_one_event_per_edition unique (digest_date, event_key)
);

create index if not exists idx_digest_candidate_assessments_signal
  on public.digest_candidate_assessments(signal_id, assessed_at desc);
create index if not exists idx_digest_candidate_assessments_event
  on public.digest_candidate_assessments(event_key, assessed_at desc);
create index if not exists idx_digest_presentation_history_event
  on public.digest_presentation_history(event_key, digest_date desc);
create index if not exists idx_digest_presentation_history_domain
  on public.digest_presentation_history(priority_domain, digest_date desc);

comment on table public.digest_event_lineage is
  'Private cross-edition event registry for Daily Brief novelty/material-advancement decisions.';
comment on table public.digest_candidate_assessments is
  'Private per-candidate Daily Brief delta classification. Underlying source signals remain unchanged.';
comment on table public.digest_presentation_history is
  'Private immutable-style record of events actually presented in each Daily Brief edition.';

alter table public.digest_event_lineage enable row level security;
alter table public.digest_candidate_assessments enable row level security;
alter table public.digest_presentation_history enable row level security;

revoke all on table public.digest_event_lineage from anon, authenticated;
revoke all on table public.digest_candidate_assessments from anon, authenticated;
revoke all on table public.digest_presentation_history from anon, authenticated;
grant all on table public.digest_event_lineage to service_role;
grant all on table public.digest_candidate_assessments to service_role;
grant all on table public.digest_presentation_history to service_role;

create or replace function public._digest_priority_domain(p_title text, p_summary text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(eu[- ]?gmp|good manufacturing practice|import permit|export permit|importer|exporter|cross-border|market access)'
      then 'import_export_eu_gmp'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(acquir|takeover|merger|m&a|strategic transaction|buyout|bid for)'
      then 'm_and_a'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(licen[cs]|regulat|gazette|rulemaking|reschedul|permit|authorization)'
      then 'licensing_regulatory'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(medical cannabis|medical marijuana|patient access|prescrib|pharmac|clinic)'
      then 'global_medical'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(distribution|wholesale|dispensar|retail channel|direct-to-consumer|showcase|marketplace)'
      then 'commercial_distribution'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(genetic|genomic|allele|cultivar|breeding|thcas|cbdas|germplasm)'
      then 'genetics'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(formulation|delivery system|rapid[- ]?onset|soft chew|capsule|pharmacokinetic)'
      then 'formulations'
    when lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) ~
      '(pharmaceutical cannabinoid|drug delivery|clinical-stage cannabinoid|cannabinoid medicine|nabiximols|cannabidiol drug)'
      then 'pharmaceutical_cannabinoid_technology'
    else 'other'
  end;
$$;

create or replace function public._digest_priority_weight(p_domain text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_domain
    when 'import_export_eu_gmp' then 24
    when 'm_and_a' then 22
    when 'global_medical' then 20
    when 'licensing_regulatory' then 18
    when 'pharmaceutical_cannabinoid_technology' then 18
    when 'commercial_distribution' then 15
    when 'formulations' then 15
    when 'genetics' then 14
    else 0
  end;
$$;

revoke all on function public._digest_priority_domain(text,text) from public, anon, authenticated;
revoke all on function public._digest_priority_weight(text) from public, anon, authenticated;
grant execute on function public._digest_priority_domain(text,text) to service_role;
grant execute on function public._digest_priority_weight(text) to service_role;

create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_payload jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B regulated-cannabis market-intelligence briefing.

You receive a JSON object with:
- candidates: quality-gated, representative, canonically deduplicated signals not previously assessed for Daily Brief presentation;
- prior_presentations: previously presented real-world events and their latest material state.

You MUST classify EVERY candidate against prior_presentations as exactly one of:
- new_event: a genuinely new real-world event not already presented;
- material_advancement: the same event/event-lineage was presented before, but a new verified development materially changes commercial, regulatory, technical or competitive consequences;
- unchanged_duplicate: the candidate only repeats, paraphrases, corroborates or comments on what Harbourview already presented without a material change.

Only new_event and material_advancement may be included in the edition. For a material_advancement, set prior_event_key to the prior event it advances and explain exactly what changed. Multiple source articles about the same event or same advancement must share one event_key; set include=false for all but the strongest representative candidate. Corroborating sources remain evidence, not separate presentation records.

Priority domains are:
global_medical, import_export_eu_gmp, m_and_a, licensing_regulatory, commercial_distribution, genetics, formulations, pharmaceutical_cannabinoid_technology, other.
Use the candidate priority_domain_hint unless the evidence clearly supports a better domain. Prioritize the named domains without excluding a genuinely higher-impact development classified as other.

For every candidate return one JSON object with ALL fields below:
{
  "signal_id": string,
  "event_key": string,
  "prior_event_key": string|null,
  "delta_status": "new_event"|"material_advancement"|"unchanged_duplicate",
  "include": boolean,
  "headline": string,
  "why_it_matters": string,
  "market": string,
  "jurisdiction": string,
  "entities": string[],
  "priority_domain": string,
  "verified_facts": string[],
  "inferences": string[],
  "advancement_reason": string|null,
  "competitive_position_change": boolean,
  "competitive_position_detail": string|null,
  "priority_score": number
}

Rules:
- Ground verified_facts only in supplied candidate evidence.
- Put analytical deductions only in inferences; never present an inference as verified fact.
- competitive_position_change is true only when the new development changes the strategic/commercial position of a major operator; name the operator and change in competitive_position_detail.
- For unchanged_duplicate, include=false.
- Select at most 10 include=true candidates, ordered internally by commercial importance; still return classifications for every candidate.
- Do not invent entities, licences, GMP status, transaction status, approvals, dates or financial figures.
- Headline max 110 characters. why_it_matters should be one concise commercial sentence.
Return ONLY the JSON array.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    valid as (
      select * from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    classified as (
      select
        v.request_id,
        v.signal_ids,
        v.provider,
        e as item,
        e->>'signal_id' as signal_id,
        coalesce(nullif(e->>'event_key',''), e->>'signal_id') as event_key,
        nullif(e->>'prior_event_key','') as prior_event_key,
        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,
        coalesce(nullif(e->>'priority_domain',''), 'other') as priority_domain,
        case
          when coalesce(e->>'priority_score','') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (e->>'priority_score')::numeric
          else 0
        end as priority_score
      from valid v
      cross join lateral jsonb_array_elements(v.p) e
      where e->>'signal_id' = any(v.signal_ids)
        and e->>'delta_status' in ('new_event','material_advancement','unchanged_duplicate')
    ),
    assessment_write as (
      insert into public.digest_candidate_assessments (
        digest_date, signal_id, event_key, prior_event_key, delta_status,
        advancement_reason, jurisdiction, entities, priority_domain,
        verified_facts, inferences, competitive_position_change,
        competitive_position_detail, include_in_edition
      )
      select
        current_date,
        c.signal_id,
        c.event_key,
        c.prior_event_key,
        c.delta_status,
        nullif(c.item->>'advancement_reason',''),
        c.jurisdiction,
        case when jsonb_typeof(c.item->'entities')='array' then c.item->'entities' else '[]'::jsonb end,
        case when c.priority_domain in (
          'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
          'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
        ) then c.priority_domain else 'other' end,
        case when jsonb_typeof(c.item->'verified_facts')='array' then c.item->'verified_facts' else '[]'::jsonb end,
        case when jsonb_typeof(c.item->'inferences')='array' then c.item->'inferences' else '[]'::jsonb end,
        lower(coalesce(c.item->>'competitive_position_change','false')) = 'true',
        nullif(c.item->>'competitive_position_detail',''),
        c.include_in_edition and c.delta_status in ('new_event','material_advancement')
      from classified c
      on conflict (digest_date, signal_id) do update set
        event_key = excluded.event_key,
        prior_event_key = excluded.prior_event_key,
        delta_status = excluded.delta_status,
        advancement_reason = excluded.advancement_reason,
        jurisdiction = excluded.jurisdiction,
        entities = excluded.entities,
        priority_domain = excluded.priority_domain,
        verified_facts = excluded.verified_facts,
        inferences = excluded.inferences,
        competitive_position_change = excluded.competitive_position_change,
        competitive_position_detail = excluded.competitive_position_detail,
        include_in_edition = excluded.include_in_edition,
        assessed_at = now()
      returning signal_id
    ),
    ranked as (
      select c.*,
             row_number() over (partition by c.event_key order by c.priority_score desc, c.signal_id) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')
    ),
    selected as (
      select * from ranked where event_rn = 1
      order by priority_score desc, signal_id
      limit 10
    ),
    public_payload as (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'headline', left(coalesce(nullif(s.item->>'headline',''), 'Untitled'), 110),
          'why_it_matters', coalesce(s.item->>'why_it_matters',''),
          'market', s.jurisdiction,
          'jurisdiction', s.jurisdiction,
          'signal_id', s.signal_id,
          'event_key', s.event_key,
          'prior_event_key', s.prior_event_key,
          'delta_status', s.delta_status,
          'advancement_reason', nullif(s.item->>'advancement_reason',''),
          'entities', case when jsonb_typeof(s.item->'entities')='array' then s.item->'entities' else '[]'::jsonb end,
          'priority_domain', case when s.priority_domain in (
            'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
            'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
          ) then s.priority_domain else 'other' end,
          'verified_facts', case when jsonb_typeof(s.item->'verified_facts')='array' then s.item->'verified_facts' else '[]'::jsonb end,
          'inferences', case when jsonb_typeof(s.item->'inferences')='array' then s.item->'inferences' else '[]'::jsonb end,
          'competitive_position_change', lower(coalesce(s.item->>'competitive_position_change','false')) = 'true',
          'competitive_position_detail', nullif(s.item->>'competitive_position_detail','')
        ) order by s.priority_score desc, s.signal_id
      ), '[]'::jsonb) as payload
      from selected s
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, p.payload,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(p.payload) h),
        'published', now()
      from public_payload p
      where jsonb_array_length(p.payload) > 0
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    presentation_write as (
      insert into public.digest_presentation_history (
        digest_date, signal_id, event_key, prior_event_key, delta_status,
        advancement_reason, headline, why_it_matters, jurisdiction, entities,
        priority_domain, verified_facts, inferences, competitive_position_change,
        competitive_position_detail
      )
      select
        current_date,
        s.signal_id,
        s.event_key,
        s.prior_event_key,
        s.delta_status,
        nullif(s.item->>'advancement_reason',''),
        left(coalesce(nullif(s.item->>'headline',''), 'Untitled'),110),
        coalesce(s.item->>'why_it_matters',''),
        s.jurisdiction,
        case when jsonb_typeof(s.item->'entities')='array' then s.item->'entities' else '[]'::jsonb end,
        case when s.priority_domain in (
          'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
          'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
        ) then s.priority_domain else 'other' end,
        case when jsonb_typeof(s.item->'verified_facts')='array' then s.item->'verified_facts' else '[]'::jsonb end,
        case when jsonb_typeof(s.item->'inferences')='array' then s.item->'inferences' else '[]'::jsonb end,
        lower(coalesce(s.item->>'competitive_position_change','false')) = 'true',
        nullif(s.item->>'competitive_position_detail','')
      from selected s
      where exists (select 1 from ins)
      on conflict (digest_date, event_key) do nothing
      returning *
    ),
    lineage_write as (
      insert into public.digest_event_lineage (
        event_key, root_event_key, latest_signal_id, prior_event_key, jurisdiction,
        entities, priority_domain, verified_facts, inferences,
        competitive_position_change, competitive_position_detail,
        latest_advancement_reason, first_presented_on, last_presented_on,
        presentation_count
      )
      select
        p.event_key,
        coalesce((select root_event_key from public.digest_event_lineage where event_key = p.prior_event_key), p.prior_event_key, p.event_key),
        p.signal_id,
        p.prior_event_key,
        p.jurisdiction,
        p.entities,
        p.priority_domain,
        p.verified_facts,
        p.inferences,
        p.competitive_position_change,
        p.competitive_position_detail,
        p.advancement_reason,
        current_date,
        current_date,
        1
      from presentation_write p
      on conflict (event_key) do update set
        latest_signal_id = excluded.latest_signal_id,
        prior_event_key = coalesce(excluded.prior_event_key, digest_event_lineage.prior_event_key),
        jurisdiction = excluded.jurisdiction,
        entities = excluded.entities,
        priority_domain = excluded.priority_domain,
        verified_facts = excluded.verified_facts,
        inferences = excluded.inferences,
        competitive_position_change = excluded.competitive_position_change,
        competitive_position_detail = excluded.competitive_position_detail,
        latest_advancement_reason = excluded.latest_advancement_reason,
        last_presented_on = excluded.last_presented_on,
        presentation_count = digest_event_lineage.presentation_count + 1,
        updated_at = now()
      returning event_key
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      where s.id in (select signal_id from presentation_write)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'classified', (select count(*) from assessment_write),
      'presented', (select count(*) from presentation_write),
      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'source', 'pipeline_b_delta'
    )
    into v_payload;

    return coalesce(v_payload, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), d.title, 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), d.summary, '') as summary,
      coalesce(nullif(trim(s.country), ''), nullif(trim(d.market), ''), 'Global') as market,
      coalesce(s.content_type, d.type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at,
      coalesce(l.canonical_signal_id, s.cluster_rep_id, s.id) as event_key_hint,
      public._digest_priority_domain(
        coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), d.title),
        coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), d.summary)
      ) as priority_domain_hint
    from public.signals_for_digest d
    join public.signals s on s.id = d.id
    left join public.signal_digest_canonical_links l on l.duplicate_signal_id = s.id
    where d.source_table = 'signals'
      and s.reviewed is true
      and s.used_in_digest_at is null
      and not exists (
        select 1 from public.digest_candidate_assessments a where a.signal_id = s.id
      )
      and coalesce(s.date, s.created_at::date) > current_date - 14
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) + public._digest_priority_weight(b.priority_domain_hint) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select * from diversified
    order by rank_score desc, signal_date desc
    limit 24
  ),
  candidate_payload as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'event_key_hint', t.event_key_hint,
        'title', left(t.title,200),
        'summary', left(t.summary,900),
        'market', t.market,
        'jurisdiction', t.market,
        'type', t.content_type,
        'impact', t.impact,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'corroboration_count', t.corroboration_count,
        'priority_domain_hint', t.priority_domain_hint,
        'detected_at', t.signal_date
      ) order by t.rank_score desc
    ), '[]'::jsonb) as candidates,
    array_agg(t.id order by t.rank_score desc) as ids
    from top_n t
  ),
  prior_payload as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'event_key', p.event_key,
      'prior_event_key', p.prior_event_key,
      'delta_status', p.delta_status,
      'headline', p.headline,
      'why_it_matters', p.why_it_matters,
      'jurisdiction', p.jurisdiction,
      'entities', p.entities,
      'priority_domain', p.priority_domain,
      'verified_facts', p.verified_facts,
      'inferences', p.inferences,
      'competitive_position_change', p.competitive_position_change,
      'competitive_position_detail', p.competitive_position_detail,
      'digest_date', p.digest_date
    ) order by p.digest_date desc, p.id desc), '[]'::jsonb) as history
    from (
      select * from public.digest_presentation_history
      order by digest_date desc, id desc
      limit 250
    ) p
  )
  select jsonb_build_object(
      'candidates', c.candidates,
      'prior_presentations', h.history
    ), c.ids
  into v_payload, v_signal_ids
  from candidate_payload c cross join prior_payload h;

  if v_payload is null
     or jsonb_array_length(coalesce(v_payload->'candidates','[]'::jsonb)) = 0 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'no unassessed representative digest candidates in last 14 days',
      'available', 0,
      'source', 'pipeline_b_delta'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'openai'; end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'anthropic'; end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0)=0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest', current_date, 'all_configured_llm_providers_degraded',
      jsonb_build_object(
        'available_signals', jsonb_array_length(v_payload->'candidates'),
        'source', 'pipeline_b_delta'
      )
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok',true,'degraded',true,'reason','all_configured_llm_providers_degraded',
      'available',jsonb_array_length(v_payload->'candidates'),'source','pipeline_b_delta'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
        body := jsonb_build_object(
          'model','gpt-4o-mini','max_tokens',7000,'temperature',0,
          'messages',jsonb_build_array(
            jsonb_build_object('role','system','content',v_pre),
            jsonb_build_object('role','user','content',v_payload::text)
          )
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
        body := jsonb_build_object(
          'model','claude-haiku-4-5-20251001','max_tokens',7000,
          'messages',jsonb_build_array(jsonb_build_object('role','user','content',v_pre||E'\n\nINPUT:\n'||v_payload::text))
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
        body := jsonb_build_object(
          'systemInstruction',jsonb_build_object('parts',jsonb_build_array(jsonb_build_object('text',v_pre))),
          'contents',jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',v_payload::text)))),
          'generationConfig',jsonb_build_object('temperature',0,'maxOutputTokens',7000)
        ), timeout_milliseconds := 90000
      ), current_date, v_signal_ids, 'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok',true,'phase','fire','provider',v_provider,
    'signals_sent',jsonb_array_length(v_payload->'candidates'),
    'prior_events_compared',jsonb_array_length(v_payload->'prior_presentations'),
    'source','pipeline_b_delta','ranking','feedback_priority_delta_aware'
  );
end;
$function$;

revoke all on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

comment on function public.run_daily_digest() is
  'Daily Brief writer with representative/canonical dedup, cross-edition delta classification, priority-domain weighting and durable presentation history.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815204500','daily_brief_delta_intelligence','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815204500_daily_brief_delta_intelligence.sql

-- RECOVERY BEGIN 20260815213000_daily_brief_delta_history_backfill.sql
-- ============================================================================
-- STATUS NOTE added 2026-09-20 (not part of the original migration):
-- The table/index/helper-function portions of this file were applied to
-- production on 2026-09-20 under version 20260920000001
-- (daily_brief_lineage_data_model_partial_apply.sql). The run_daily_digest()
-- rewrite/patch in this file was NOT applied: the live run_daily_digest()
-- has evolved past what this file expects (manual fallback, smart-truncate,
-- feedback-based ranking added Aug 30-Sep 1, after this file was written).
-- Lineage-aware GATING inside run_daily_digest() remains un-integrated and
-- needs a manual rebase against the current live function, not a raw apply
-- of this file. Do not apply this file directly.
-- ============================================================================

-- Seed the delta-intelligence event memory from previously published, source-backed
-- Daily Brief headlines so the first post-deploy edition compares against prior
-- presentations instead of starting from an empty history.
--
-- Only historical cards with a valid signal_id are seeded. Legacy cards without
-- a source-backed signal cannot be assigned a trustworthy canonical event key and
-- are intentionally left unseeded rather than inventing lineage.

with legacy_cards as (
  select
    d.digest_date,
    h.item
  from public.daily_digest d
  cross join lateral jsonb_array_elements(coalesce(d.headlines, '[]'::jsonb)) h(item)
  where d.status = 'published'
    and jsonb_typeof(h.item) = 'object'
    and nullif(h.item->>'signal_id', '') is not null
),
resolved as (
  select
    l.digest_date,
    s.id as signal_id,
    coalesce(link.canonical_signal_id, s.cluster_rep_id, s.id) as event_key,
    left(coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline, 'Untitled'), 110) as headline,
    coalesce(l.item->>'why_it_matters', '') as why_it_matters,
    coalesce(nullif(l.item->>'jurisdiction', ''), nullif(l.item->>'market', ''), nullif(s.country, ''), 'Global') as jurisdiction,
    case when jsonb_typeof(l.item->'entities') = 'array' then l.item->'entities' else '[]'::jsonb end as entities,
    case
      when l.item->>'priority_domain' in (
        'global_medical','import_export_eu_gmp','m_and_a','licensing_regulatory',
        'commercial_distribution','genetics','formulations','pharmaceutical_cannabinoid_technology','other'
      ) then l.item->>'priority_domain'
      else public._digest_priority_domain(
        coalesce(nullif(l.item->>'headline', ''), nullif(s.title_en, ''), s.headline),
        coalesce(nullif(s.summary_en, ''), nullif(s.summary, ''), l.item->>'why_it_matters')
      )
    end as priority_domain,
    case when jsonb_typeof(l.item->'verified_facts') = 'array' then l.item->'verified_facts' else '[]'::jsonb end as verified_facts,
    case when jsonb_typeof(l.item->'inferences') = 'array' then l.item->'inferences' else '[]'::jsonb end as inferences,
    lower(coalesce(l.item->>'competitive_position_change', 'false')) = 'true' as competitive_position_change,
    nullif(l.item->>'competitive_position_detail', '') as competitive_position_detail
  from legacy_cards l
  join public.signals s on s.id = l.item->>'signal_id'
  left join public.signal_digest_canonical_links link on link.duplicate_signal_id = s.id
),
ranked as (
  select
    r.*,
    row_number() over (
      partition by r.digest_date, r.event_key
      order by r.signal_id
    ) as event_rn
  from resolved r
)
insert into public.digest_presentation_history (
  digest_date,
  signal_id,
  event_key,
  prior_event_key,
  delta_status,
  advancement_reason,
  headline,
  why_it_matters,
  jurisdiction,
  entities,
  priority_domain,
  verified_facts,
  inferences,
  competitive_position_change,
  competitive_position_detail
)
select
  r.digest_date,
  r.signal_id,
  r.event_key,
  null,
  'new_event',
  'Historical presentation seeded from a previously published source-backed Daily Brief card.',
  r.headline,
  r.why_it_matters,
  r.jurisdiction,
  r.entities,
  r.priority_domain,
  r.verified_facts,
  r.inferences,
  r.competitive_position_change,
  r.competitive_position_detail
from ranked r
where r.event_rn = 1
on conflict (digest_date, event_key) do nothing;

with history_ranked as (
  select
    p.*,
    min(p.digest_date) over (partition by p.event_key) as first_date,
    max(p.digest_date) over (partition by p.event_key) as last_date,
    count(*) over (partition by p.event_key)::integer as presentation_total,
    row_number() over (
      partition by p.event_key
      order by p.digest_date desc, p.id desc
    ) as latest_rn
  from public.digest_presentation_history p
)
insert into public.digest_event_lineage (
  event_key,
  root_event_key,
  latest_signal_id,
  prior_event_key,
  jurisdiction,
  entities,
  priority_domain,
  verified_facts,
  inferences,
  competitive_position_change,
  competitive_position_detail,
  latest_advancement_reason,
  first_presented_on,
  last_presented_on,
  presentation_count
)
select
  h.event_key,
  h.event_key,
  h.signal_id,
  null,
  h.jurisdiction,
  h.entities,
  h.priority_domain,
  h.verified_facts,
  h.inferences,
  h.competitive_position_change,
  h.competitive_position_detail,
  h.advancement_reason,
  h.first_date,
  h.last_date,
  h.presentation_total
from history_ranked h
where h.latest_rn = 1
on conflict (event_key) do update set
  latest_signal_id = excluded.latest_signal_id,
  jurisdiction = excluded.jurisdiction,
  entities = excluded.entities,
  priority_domain = excluded.priority_domain,
  verified_facts = excluded.verified_facts,
  inferences = excluded.inferences,
  competitive_position_change = excluded.competitive_position_change,
  competitive_position_detail = excluded.competitive_position_detail,
  first_presented_on = least(public.digest_event_lineage.first_presented_on, excluded.first_presented_on),
  last_presented_on = greatest(public.digest_event_lineage.last_presented_on, excluded.last_presented_on),
  presentation_count = greatest(public.digest_event_lineage.presentation_count, excluded.presentation_count),
  updated_at = now();

comment on table public.digest_presentation_history is
  'Private Daily Brief presentation history, including source-backed historical editions seeded during delta-intelligence rollout.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815213000','daily_brief_delta_history_backfill','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815213000_daily_brief_delta_history_backfill.sql

-- RECOVERY BEGIN 20260815222000_jurisdiction_command_canada_refresh.sql
-- Jurisdiction Command Canada source correction.
-- Forward-only content repair: do not rewrite historical seed migration 20260623100137.
-- Primary-source basis verified 2026-08-15 against Health Canada:
--   Cannabis Act legislative review final report (tabled 2024-03-22)
--   Cannabis Regulations streamlining amendments (in force 2025-03-12)
--   current Cannabis Regulations medical-access guidance
--   current cannabis import/export guidance
--   2026 Industrial Hemp Regulations consultation status

UPDATE public.cc_jurisdiction_briefings
SET
  public_summary = 'Canada regulates cannabis federally under the Cannabis Act and Cannabis Regulations, with provinces and territories responsible for important distribution, retail and local implementation rules. A separate federal medical-access system remains available under the Cannabis Regulations alongside legal non-medical access. Commercial activity is licence- and activity-specific; a country-level legal status should not be treated as transaction authorization.',
  patient_access = 'Under the Cannabis Regulations, an individual may obtain a medical document from a health care practitioner and register as a client of a holder of a licence for sale for medical purposes. The federal framework also permits eligible individuals to register with Health Canada for personal production or designated production. These medical-access routes operate under the Cannabis Act and Cannabis Regulations, not the former ACMPR framework.',
  physician_access = 'Health Canada''s current medical-access guidance provides that a health care practitioner may issue a medical document when they determine that a limited amount of cannabis is required for the person''s condition. The medical document must contain the information required by the Cannabis Regulations. Professional authorization and standards of practice remain subject to the applicable provincial or territorial regulatory framework.',
  market_dynamics = 'Canada has national legal non-medical and medical cannabis frameworks, but commercial execution varies materially by province or territory, licence class, product and activity. International cannabis import and export permits are issued only for medical or scientific purposes and are assessed shipment by shipment under the federal framework. Operators therefore need transaction-specific licence, permit, destination and product evidence rather than a single national market-status label.',
  regulatory_outlook = 'The independent Expert Panel''s final Legislative Review of the Cannabis Act report was tabled in both Houses of Parliament on March 22, 2024. On March 12, 2025, amendments streamlining requirements under the Cannabis Regulations and related instruments came into force. Health Canada also ran a consultation from May 16 to June 30, 2026 on potential amendments to the Industrial Hemp Regulations; that consultation is closed, and any future regulatory proposals based on it are expected to be pre-published in the Canada Gazette, Part I before final amendments.',
  data_source_summary = 'Health Canada: Cannabis Act legislative review; Legislative Review of the Cannabis Act final report; Summary of changes following the streamlining of regulations; Accessing cannabis for medical purposes; Importing and exporting cannabis; Closed consultation on potential amendments to the Industrial Hemp Regulations.',
  verification_summary = 'Primary-source refresh completed 2026-08-15. Prior ACMPR references and the incorrect prior legislative-review timing statement were removed. Transaction-specific conclusions still require current licence, product, purpose, origin/destination and permit evidence.',
  update_cadence = 'Event-driven with quarterly review',
  last_reviewed_date = DATE '2026-08-15'
WHERE country_iso2 = 'CA'
  AND jurisdiction_type = 'country';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815222000','jurisdiction_command_canada_refresh','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815222000_jurisdiction_command_canada_refresh.sql

-- RECOVERY BEGIN 20260815234000_daily_brief_lineage_hardening.sql
-- ============================================================================
-- STATUS NOTE added 2026-09-20 (not part of the original migration):
-- The table/index/helper-function portions of this file were applied to
-- production on 2026-09-20 under version 20260920000001
-- (daily_brief_lineage_data_model_partial_apply.sql). The run_daily_digest()
-- rewrite/patch in this file was NOT applied: the live run_daily_digest()
-- has evolved past what this file expects (manual fallback, smart-truncate,
-- feedback-based ranking added Aug 30-Sep 1, after this file was written).
-- Lineage-aware GATING inside run_daily_digest() remains un-integrated and
-- needs a manual rebase against the current live function, not a raw apply
-- of this file. Do not apply this file directly.
-- ============================================================================

-- Harden Daily Brief cross-edition lineage consultation and publication gating.
--
-- This forward companion migration preserves the verified delta-intelligence
-- foundation and patches only run_daily_digest(). Every candidate gets a
-- deterministic lookup against persistent digest_event_lineage, including
-- events older than the bounded recent-presentation context. Model-labelled
-- material advancements are publication-eligible only when prior_event_key
-- resolves to an actually persisted canonical event.

create or replace function public._digest_candidate_lineage_context(p_event_key_hint text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'event_key', l.event_key,
        'root_event_key', l.root_event_key,
        'prior_event_key', l.prior_event_key,
        'jurisdiction', l.jurisdiction,
        'entities', l.entities,
        'priority_domain', l.priority_domain,
        'verified_facts', l.verified_facts,
        'inferences', l.inferences,
        'competitive_position_change', l.competitive_position_change,
        'competitive_position_detail', l.competitive_position_detail,
        'latest_advancement_reason', l.latest_advancement_reason,
        'first_presented_on', l.first_presented_on,
        'last_presented_on', l.last_presented_on,
        'presentation_count', l.presentation_count
      )
      from public.digest_event_lineage l
      where l.event_key = p_event_key_hint
         or l.root_event_key = p_event_key_hint
      order by
        (l.event_key = p_event_key_hint) desc,
        l.last_presented_on desc,
        l.event_key
      limit 1
    ),
    'null'::jsonb
  );
$$;

revoke all on function public._digest_candidate_lineage_context(text) from public, anon, authenticated;
grant execute on function public._digest_candidate_lineage_context(text) to service_role;

comment on function public._digest_candidate_lineage_context(text) is
  'Bounded candidate-specific lookup into persistent Daily Brief event lineage; returns JSON null when no canonical lineage exists.';

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_daily_digest()'::regprocedure) into v_def;

  v_old := $old$- prior_presentations: previously presented real-world events and their latest material state.$old$;
  v_new := $new$- prior_presentations: a bounded recent comparison set of previously presented real-world events;
- candidate.prior_lineage: a deterministic persistent canonical-lineage lookup for that candidate, which may reference an event older than prior_presentations.$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: prompt contract anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        'priority_domain_hint', t.priority_domain_hint,
        'detected_at', t.signal_date$old$;
  v_new := $new$        'priority_domain_hint', t.priority_domain_hint,
        'prior_lineage', public._digest_candidate_lineage_context(t.event_key_hint),
        'detected_at', t.signal_date$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: candidate payload anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,$old$;
  v_new := $new$        e->>'delta_status' as delta_status,
        lower(coalesce(e->>'include','false')) = 'true' as include_in_edition,
        case
          when e->>'delta_status' <> 'material_advancement' then true
          when nullif(e->>'prior_event_key','') is null then false
          else exists (
            select 1
            from public.digest_event_lineage prior_lineage
            where prior_lineage.event_key = nullif(e->>'prior_event_key','')
          )
        end as lineage_valid,
        coalesce(nullif(e->>'market',''), nullif(e->>'jurisdiction',''), 'Global') as jurisdiction,$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: classified lineage anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$        c.include_in_edition and c.delta_status in ('new_event','material_advancement')
      from classified c$old$;
  v_new := $new$        c.include_in_edition
          and c.delta_status in ('new_event','material_advancement')
          and c.lineage_valid
      from classified c$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: assessment gate anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$             row_number() over (partition by c.event_key order by c.priority_score desc, c.signal_id) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')$old$;
  v_new := $new$             row_number() over (
               partition by case
                 when c.delta_status = 'material_advancement' then c.prior_event_key
                 else c.event_key
               end
               order by c.priority_score desc, c.signal_id
             ) as event_rn
      from classified c
      where c.include_in_edition is true
        and c.delta_status in ('new_event','material_advancement')
        and c.lineage_valid$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: edition dedup gate anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'source', 'pipeline_b_delta'$old$;
  v_new := $new$      'unchanged_suppressed', (
        select count(*) from classified where delta_status='unchanged_duplicate'
      ),
      'invalid_advancement_lineage_suppressed', (
        select count(*)
        from classified
        where delta_status='material_advancement' and not lineage_valid
      ),
      'source', 'pipeline_b_delta'$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'Daily Brief lineage hardening: suppression telemetry anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;

revoke all on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

comment on function public.run_daily_digest() is
  'Daily Brief writer with canonical dedup, bounded recent comparison context, candidate-specific persistent lineage lookup, fail-closed material-advancement validation and durable presentation history.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260815234000','daily_brief_lineage_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260815234000_daily_brief_lineage_hardening.sql

-- RECOVERY BEGIN 20260816120000_auto_heatmap_from_signals.sql
-- ============================================================
-- Automatic heat-map repaint from regulatory signals
-- ============================================================
-- Builds on existing countries.regulatory_tier + regulatory_tier_audit
-- + api.derive_regulatory_tier(). Closes the loop so promoted signals
-- with high confidence can update the globe colour automatically.
--
-- Safety:
--   * Global kill switch (market_access_auto_apply_enabled)
--   * Per-country freeze (regulatory_tier_auto_frozen)
--   * Primary-source preference + corroboration thresholds
--   * Full audit trail in regulatory_tier_audit + market_access_events
--   * Idempotent; concurrent-safe via advisory lock
-- ============================================================

-- 1. Kill switch + per-country freeze
create table if not exists public.platform_feature_flags (
  key         text primary key,
  enabled     boolean not null default false,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

insert into public.platform_feature_flags (key, enabled, description, updated_by)
values (
  'market_access_auto_apply_enabled',
  true,
  'When true, high-confidence market-access events may auto-update countries.regulatory_tier. Disable instantly to freeze the heat map.',
  'migration:20260816120000'
)
on conflict (key) do nothing;

alter table public.countries
  add column if not exists regulatory_tier_auto_frozen boolean not null default false;

comment on column public.countries.regulatory_tier_auto_frozen is
  'When true, automatic signal-driven tier updates are blocked for this country. Manual set_regulatory_tier still works.';

-- Ensure cbd_hemp_only is allowed on the check constraint (may already exist)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'countries_regulatory_tier_check'
  ) then
    alter table public.countries drop constraint countries_regulatory_tier_check;
  end if;
  alter table public.countries
    add constraint countries_regulatory_tier_check
    check (
      regulatory_tier is null or regulatory_tier in (
        'legal_commercial_access',
        'medical_limited_trade',
        'domestic_only',
        'cbd_hemp_only',
        'prohibited'
      )
    );
exception when others then
  null; -- already correct or concurrent
end $$;

-- 2. Structured impact events extracted from signals
create table if not exists public.market_access_events (
  id                  uuid primary key default gen_random_uuid(),
  signal_id           uuid not null,
  country_iso2        text not null,
  pathway             text not null check (pathway in (
                        'medical', 'adult_use', 'import', 'export',
                        'commercial_retail', 'hemp_cbd', 'prohibition'
                      )),
  direction           text not null check (direction in (
                        'expanded', 'restricted', 'opened', 'closed', 'clarified'
                      )),
  proposed_status     text not null check (proposed_status in (
                        'legal_commercial_access',
                        'medical_limited_trade',
                        'domestic_only',
                        'cbd_hemp_only',
                        'prohibited'
                      )),
  confidence          numeric(5,4) not null check (confidence between 0 and 1),
  is_primary_source   boolean not null default false,
  source_id           uuid,
  evidence_snippet    text,
  evidence_url        text,
  as_of_date          date,
  extracted_at        timestamptz not null default now(),
  extractor_version   text not null default 'v1',
  processed_at        timestamptz,
  unique (signal_id, pathway)
);

create index if not exists idx_mae_country_pending
  on public.market_access_events (country_iso2, extracted_at desc)
  where processed_at is null;

create index if not exists idx_mae_confidence
  on public.market_access_events (confidence desc)
  where confidence >= 0.85 and processed_at is null;

-- 3. Proposal ledger (even auto decisions are logged)
create table if not exists public.market_access_proposals (
  id                      uuid primary key default gen_random_uuid(),
  country_iso2            text not null,
  proposed_status         text not null,
  previous_status         text,
  aggregate_confidence    numeric(5,4) not null,
  corroboration_count     integer not null,
  primary_source_count    integer not null,
  event_ids               uuid[] not null default '{}',
  signal_ids              uuid[] not null default '{}',
  decision                text not null check (decision in (
                            'auto_applied',
                            'rejected_low_confidence',
                            'rejected_conflict',
                            'rejected_stale',
                            'rejected_frozen',
                            'rejected_disabled'
                          )),
  decision_reason         text,
  decided_at              timestamptz not null default now()
);

create index if not exists idx_map_country_decided
  on public.market_access_proposals (country_iso2, decided_at desc);

-- 4. Helper: is this source a primary regulator / gazette?
create or replace function public.is_primary_market_access_source(p_source_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select
        coalesce(s.tier, 99) <= 1
        or coalesce(s.source_type, '') in ('regulator', 'government_official', 'gazette', 'official_gazette')
        or coalesce(s.content_type, '{}'::text[]) && array['regulatory','legislation','official_notice']::text[]
      from public.source_registry s
      where s.id = p_source_id
    ),
    false
  );
$$;

-- 5. Pathway roll-up: many pathway events -> one overall status
-- Priority (most open wins when evidence is expansion-oriented;
-- restriction uses the most restrictive consistent signal).
create or replace function public.roll_up_market_access_status(p_statuses text[])
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text;
begin
  if p_statuses is null or array_length(p_statuses, 1) is null then
    return null;
  end if;
  -- Prefer most open status present
  foreach s in array array[
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only',
    'prohibited'
  ] loop
    if s = any (p_statuses) then
      return s;
    end if;
  end loop;
  return null;
end;
$$;

-- 6. Core promote tick (fully automatic)
create or replace function api.promote_market_access_from_signals(
  p_lookback_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_country text;
  v_current text;
  v_frozen boolean;
  v_proposed text;
  v_conf numeric;
  v_primary_count int;
  v_corroboration int;
  v_event_ids uuid[];
  v_signal_ids uuid[];
  v_decision text;
  v_reason text;
  v_applied int := 0;
  v_rejected int := 0;
  v_countries int := 0;
  r record;
begin
  -- Global kill switch
  select enabled into v_enabled
  from public.platform_feature_flags
  where key = 'market_access_auto_apply_enabled';

  if not coalesce(v_enabled, false) then
    return jsonb_build_object(
      'ok', true,
      'applied', 0,
      'rejected', 0,
      'reason', 'auto-apply disabled'
    );
  end if;

  -- Advisory lock so concurrent ticks do not double-apply
  if not pg_try_advisory_xact_lock(hashtext('promote_market_access_from_signals')) then
    return jsonb_build_object('ok', true, 'applied', 0, 'rejected', 0, 'reason', 'lock held');
  end if;

  for r in
    with fresh as (
      select
        e.*,
        row_number() over (
          partition by e.country_iso2, e.proposed_status
          order by e.is_primary_source desc, e.confidence desc, e.extracted_at desc
        ) as rn
      from public.market_access_events e
      where e.processed_at is null
        and e.extracted_at > now() - make_interval(hours => p_lookback_hours)
        and e.confidence >= 0.80
    ),
    by_country as (
      select
        country_iso2,
        array_agg(distinct proposed_status) as statuses,
        max(confidence) filter (where is_primary_source) as max_primary_conf,
        max(confidence) as max_conf,
        count(*) filter (where is_primary_source) as primary_count,
        count(distinct source_id) as independent_sources,
        array_agg(id) as event_ids,
        array_agg(distinct signal_id) as signal_ids
      from fresh
      group by country_iso2
    )
    select * from by_country
  loop
    v_countries := v_countries + 1;
    v_country := r.country_iso2;

    select c.regulatory_tier, c.regulatory_tier_auto_frozen
      into v_current, v_frozen
    from public.countries c
    where c.iso_alpha2 = v_country;

    if not found then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), null,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_stale', 'unknown country'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    if v_frozen then
      v_rejected := v_rejected + 1;
      insert into public.market_access_proposals (
        country_iso2, proposed_status, previous_status,
        aggregate_confidence, corroboration_count, primary_source_count,
        event_ids, signal_ids, decision, decision_reason
      ) values (
        v_country, public.roll_up_market_access_status(r.statuses), v_current,
        coalesce(r.max_conf, 0), r.independent_sources, r.primary_count,
        r.event_ids, r.signal_ids, 'rejected_frozen', 'country auto-frozen'
      );
      update public.market_access_events
         set processed_at = now()
       where id = any (r.event_ids);
      continue;
    end if;

    v_proposed := public.roll_up_market_access_status(r.statuses);
    v_conf := coalesce(r.max_primary_conf, r.max_conf, 0);
    v_primary_count := r.primary_count;
    v_corroboration := r.independent_sources;
    v_event_ids := r.event_ids;
    v_signal_ids := r.signal_ids;

    -- Same status -> no-op
    if v_proposed is not null and v_proposed is not distinct from v_current then
      v_decision := 'rejected_stale';
      v_reason := 'status already current';
      v_rejected := v_rejected + 1;
    -- Single strong primary
    elsif v_primary_count >= 1 and v_conf >= 0.92 then
      v_decision := 'auto_applied';
      v_reason := format('primary source @ %.2f', v_conf);
    -- Multi-source corroboration
    elsif v_corroboration >= 2 and v_conf >= 0.85 then
      v_decision := 'auto_applied';
      v_reason := format('%s sources @ %.2f', v_corroboration, v_conf);
    else
      v_decision := 'rejected_low_confidence';
      v_reason := format(
        'conf=%.2f corroboration=%s primary=%s',
        v_conf, v_corroboration, v_primary_count
      );
      v_rejected := v_rejected + 1;
    end if;

    insert into public.market_access_proposals (
      country_iso2, proposed_status, previous_status,
      aggregate_confidence, corroboration_count, primary_source_count,
      event_ids, signal_ids, decision, decision_reason
    ) values (
      v_country, v_proposed, v_current,
      v_conf, v_corroboration, v_primary_count,
      v_event_ids, v_signal_ids, v_decision, v_reason
    );

    if v_decision = 'auto_applied' and v_proposed is not null then
      update public.countries set
        regulatory_tier = v_proposed,
        regulatory_tier_origin = 'auto',
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_source = 'signal-auto v1 ' || to_char(now(), 'YYYY-MM-DD'),
        regulatory_tier_rationale = v_reason,
        regulatory_tier_needs_review = false
      where iso_alpha2 = v_country;

      insert into public.regulatory_tier_audit (
        country_iso2, old_tier, new_tier, origin, trigger_source,
        program_status, actor, note
      ) values (
        v_country, v_current, v_proposed, 'auto', 'signal_pipeline',
        null, 'auto:v1', v_reason
      );

      v_applied := v_applied + 1;
    end if;

    update public.market_access_events
       set processed_at = now()
     where id = any (v_event_ids);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'countries_seen', v_countries,
    'applied', v_applied,
    'rejected', v_rejected
  );
end;
$$;

revoke all on function api.promote_market_access_from_signals(integer) from public, anon, authenticated;
grant execute on function api.promote_market_access_from_signals(integer) to service_role;

comment on function api.promote_market_access_from_signals(integer) is
  'Fully automatic: promotes high-confidence market_access_events into countries.regulatory_tier. Respects kill switch and per-country freeze. Idempotent under advisory lock.';

-- 7. Insert helper used by the extractor edge function / cron
create or replace function api.record_market_access_event(
  p_signal_id uuid,
  p_country_iso2 text,
  p_pathway text,
  p_direction text,
  p_proposed_status text,
  p_confidence numeric,
  p_source_id uuid default null,
  p_evidence_snippet text default null,
  p_evidence_url text default null,
  p_as_of_date date default null,
  p_extractor_version text default 'v1'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_primary boolean;
begin
  v_primary := public.is_primary_market_access_source(p_source_id);

  insert into public.market_access_events (
    signal_id, country_iso2, pathway, direction, proposed_status,
    confidence, is_primary_source, source_id,
    evidence_snippet, evidence_url, as_of_date, extractor_version
  ) values (
    p_signal_id, upper(p_country_iso2), p_pathway, p_direction, p_proposed_status,
    p_confidence, v_primary, p_source_id,
    p_evidence_snippet, p_evidence_url, p_as_of_date, p_extractor_version
  )
  on conflict (signal_id, pathway) do update set
    confidence = greatest(market_access_events.confidence, excluded.confidence),
    is_primary_source = market_access_events.is_primary_source or excluded.is_primary_source,
    evidence_snippet = coalesce(excluded.evidence_snippet, market_access_events.evidence_snippet),
    evidence_url = coalesce(excluded.evidence_url, market_access_events.evidence_url),
    as_of_date = coalesce(excluded.as_of_date, market_access_events.as_of_date),
    processed_at = null  -- re-open for promote if evidence improved
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function api.record_market_access_event(uuid,text,text,text,text,numeric,uuid,text,text,date,text)
  from public, anon, authenticated;
grant execute on function api.record_market_access_event(uuid,text,text,text,text,numeric,uuid,text,text,date,text)
  to service_role;

-- 8. Instant kill / unfreeze helpers
create or replace function api.set_market_access_auto_apply(p_enabled boolean, p_actor text default 'ops')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.platform_feature_flags (key, enabled, description, updated_at, updated_by)
  values (
    'market_access_auto_apply_enabled',
    p_enabled,
    'When true, high-confidence market-access events may auto-update countries.regulatory_tier.',
    now(),
    p_actor
  )
  on conflict (key) do update set
    enabled = excluded.enabled,
    updated_at = now(),
    updated_by = excluded.updated_by;
  return p_enabled;
end;
$$;

create or replace function api.set_country_auto_freeze(p_iso text, p_frozen boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.countries
     set regulatory_tier_auto_frozen = p_frozen
   where iso_alpha2 = upper(p_iso);
  if not found then
    raise exception 'unknown country %', p_iso;
  end if;
end;
$$;

revoke all on function api.set_market_access_auto_apply(boolean, text) from public, anon;
revoke all on function api.set_country_auto_freeze(text, boolean) from public, anon;
grant execute on function api.set_market_access_auto_apply(boolean, text) to service_role, authenticated;
grant execute on function api.set_country_auto_freeze(text, boolean) to service_role, authenticated;

-- 9. Public-safe read of current heat-map status (single source of truth)
create or replace view api.country_market_access_public as
select
  c.iso_alpha2 as country_iso2,
  c.country_name,
  c.region,
  c.regulatory_tier as status,
  c.regulatory_tier_last_derived_at as last_changed_at,
  c.regulatory_tier_origin as origin
from public.countries c
where c.regulatory_tier is not null;

grant select on api.country_market_access_public to anon, authenticated, service_role;

comment on view api.country_market_access_public is
  'Public-safe heat-map status. Globe and country briefs should read regulatory_tier via this view (or countries) — not fixtures.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260816120000','auto_heatmap_from_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260816120000_auto_heatmap_from_signals.sql

-- RECOVERY BEGIN 20260816150000_clinical_evidence_operating_system.sql
-- Clinical Evidence Operating System V1.
-- Extends the governed Clinical evidence spine with deterministic concept resolution,
-- evidence eligibility, publication/study-family normalization, claim-level provenance,
-- and corpus-coverage introspection. This migration adds no efficacy, dosing, safety,
-- interaction, or patient-specific claim.

-- ---------------------------------------------------------------------------
-- Deterministic normalization shared by concept resolution and search.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_clinical_query(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $function$
  select btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(p_value, '')), '[^[:alnum:]]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$function$;

revoke all on function public.normalize_clinical_query(text) from public;
grant execute on function public.normalize_clinical_query(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Canonical concepts + individually sourced aliases.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_type text not null check (concept_type in (
    'condition','intervention','cannabinoid','formulation','outcome','safety','guideline','other'
  )),
  canonical_label text not null,
  normalized_label text not null,
  definition text,
  vocabulary_source text,
  source_system text,
  source_identifier text,
  source_version text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  superseded_by_concept_id uuid references public.clinical_concepts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_type, normalized_label),
  constraint clinical_concept_source_https check (source_url is null or source_url ~ '^https://'),
  constraint clinical_concept_normalized_label_nonempty check (btrim(normalized_label) <> '')
);

create table if not exists public.clinical_concept_aliases (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  alias_label text not null,
  normalized_alias text not null,
  alias_kind text not null default 'synonym'
    check (alias_kind in ('synonym','abbreviation','historical-term','spelling-variant','source-term','other')),
  source_system text,
  source_identifier text,
  source_version text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, normalized_alias),
  constraint clinical_concept_alias_source_https check (source_url is null or source_url ~ '^https://'),
  constraint clinical_concept_alias_normalized_nonempty check (btrim(normalized_alias) <> '')
);

create index if not exists idx_clinical_concepts_normalized
  on public.clinical_concepts (normalized_label) where review_status = 'published';
create index if not exists idx_clinical_concept_aliases_normalized
  on public.clinical_concept_aliases (normalized_alias) where review_status = 'published';

alter table public.clinical_concepts enable row level security;
alter table public.clinical_concept_aliases enable row level security;

drop policy if exists clinical_concepts_public_read on public.clinical_concepts;
create policy clinical_concepts_public_read
  on public.clinical_concepts for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_concept_aliases_public_read on public.clinical_concept_aliases;
create policy clinical_concept_aliases_public_read
  on public.clinical_concept_aliases for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (
      select 1 from public.clinical_concepts c
      where c.id = clinical_concept_aliases.concept_id
        and c.review_status = 'published'
    )
  );

grant select on public.clinical_concepts to anon, authenticated;
grant select on public.clinical_concept_aliases to anon, authenticated;
grant all on public.clinical_concepts to service_role;
grant all on public.clinical_concept_aliases to service_role;

-- Backfill the already-governed condition vocabulary without changing its source truth.
insert into public.clinical_concepts (
  concept_type, canonical_label, normalized_label, definition, vocabulary_source,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  'condition', t.canonical_name, public.normalize_clinical_query(t.canonical_name), t.definition,
  t.vocabulary_source, t.source_system, t.source_identifier, t.source_version, t.source_url,
  t.verified_at,
  case when t.review_status = 'published' then 'published'
       when t.review_status = 'retired' then 'retired'
       else 'under-review' end
from public.clinical_condition_terms t
where public.normalize_clinical_query(t.canonical_name) <> ''
on conflict (concept_type, normalized_label) do update set
  canonical_label = excluded.canonical_label,
  definition = excluded.definition,
  vocabulary_source = excluded.vocabulary_source,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_concept_aliases (
  concept_id, alias_label, normalized_alias, alias_kind,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  c.id,
  a.alias_label,
  public.normalize_clinical_query(a.alias_label),
  case when a.alias_label = upper(a.alias_label) and length(a.alias_label) <= 12 then 'abbreviation' else 'synonym' end,
  t.source_system,
  t.source_identifier,
  t.source_version,
  t.source_url,
  t.verified_at,
  case when t.review_status = 'published' then 'published'
       when t.review_status = 'retired' then 'retired'
       else 'under-review' end
from public.clinical_condition_terms t
join public.clinical_concepts c
  on c.concept_type = 'condition'
 and c.normalized_label = public.normalize_clinical_query(t.canonical_name)
cross join lateral unnest(t.aliases) as a(alias_label)
where public.normalize_clinical_query(a.alias_label) <> ''
on conflict (concept_id, normalized_alias) do update set
  alias_label = excluded.alias_label,
  alias_kind = excluded.alias_kind,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- Add only sourced terminology, not a clinical conclusion. Orphanet ORPHA:33069
-- records SMEI / severe myoclonic epilepsy of infancy as Dravet syndrome terminology.
insert into public.clinical_concept_aliases (
  concept_id, alias_label, normalized_alias, alias_kind,
  source_system, source_identifier, source_version, source_url, verified_at, review_status
)
select
  c.id, v.alias_label, public.normalize_clinical_query(v.alias_label), v.alias_kind,
  'Orphanet', 'ORPHA:33069', '2026-08-16',
  'https://www.orpha.net/en/disease/detail/33069', '2026-08-16T14:00:00Z', 'published'
from public.clinical_concepts c
cross join (values
  ('SMEI'::text, 'abbreviation'::text),
  ('Severe myoclonic epilepsy of infancy'::text, 'historical-term'::text)
) as v(alias_label, alias_kind)
where c.concept_type = 'condition'
  and c.normalized_label = public.normalize_clinical_query('Dravet syndrome')
on conflict (concept_id, normalized_alias) do update set
  alias_label = excluded.alias_label,
  alias_kind = excluded.alias_kind,
  source_system = excluded.source_system,
  source_identifier = excluded.source_identifier,
  source_version = excluded.source_version,
  source_url = excluded.source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();

-- Keep condition concepts synchronized with future governed condition-term updates.
create or replace function public.clinical_sync_condition_concept()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_concept_id uuid;
  v_status text;
  v_alias text;
begin
  v_status := case when new.review_status = 'published' then 'published'
                   when new.review_status = 'retired' then 'retired'
                   else 'under-review' end;

  insert into public.clinical_concepts (
    concept_type, canonical_label, normalized_label, definition, vocabulary_source,
    source_system, source_identifier, source_version, source_url, verified_at, review_status
  ) values (
    'condition', new.canonical_name, public.normalize_clinical_query(new.canonical_name),
    new.definition, new.vocabulary_source, new.source_system, new.source_identifier,
    new.source_version, new.source_url, new.verified_at, v_status
  )
  on conflict (concept_type, normalized_label) do update set
    canonical_label = excluded.canonical_label,
    definition = excluded.definition,
    vocabulary_source = excluded.vocabulary_source,
    source_system = excluded.source_system,
    source_identifier = excluded.source_identifier,
    source_version = excluded.source_version,
    source_url = excluded.source_url,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now()
  returning id into v_concept_id;

  foreach v_alias in array coalesce(new.aliases, '{}'::text[]) loop
    if public.normalize_clinical_query(v_alias) <> '' then
      insert into public.clinical_concept_aliases (
        concept_id, alias_label, normalized_alias, alias_kind,
        source_system, source_identifier, source_version, source_url, verified_at, review_status
      ) values (
        v_concept_id, v_alias, public.normalize_clinical_query(v_alias),
        case when v_alias = upper(v_alias) and length(v_alias) <= 12 then 'abbreviation' else 'synonym' end,
        new.source_system, new.source_identifier, new.source_version, new.source_url,
        new.verified_at, v_status
      )
      on conflict (concept_id, normalized_alias) do update set
        alias_label = excluded.alias_label,
        alias_kind = excluded.alias_kind,
        source_system = excluded.source_system,
        source_identifier = excluded.source_identifier,
        source_version = excluded.source_version,
        source_url = excluded.source_url,
        verified_at = excluded.verified_at,
        review_status = excluded.review_status,
        updated_at = now();
    end if;
  end loop;

  return new;
end;
$function$;

revoke all on function public.clinical_sync_condition_concept() from public;
drop trigger if exists trg_clinical_sync_condition_concept on public.clinical_condition_terms;
create trigger trg_clinical_sync_condition_concept
after insert or update of canonical_name, aliases, definition, vocabulary_source, source_system,
  source_identifier, source_version, source_url, verified_at, review_status
on public.clinical_condition_terms
for each row execute function public.clinical_sync_condition_concept();

-- ---------------------------------------------------------------------------
-- Evidence-to-concept graph.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_concept_links (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  relationship text not null check (relationship in (
    'condition','indication','intervention','formulation','outcome','safety','guideline','context','other'
  )),
  applicability text,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, evidence_record_id, relationship)
);

alter table public.clinical_evidence_concept_links enable row level security;
drop policy if exists clinical_evidence_concept_links_public_read on public.clinical_evidence_concept_links;
create policy clinical_evidence_concept_links_public_read
  on public.clinical_evidence_concept_links for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_concepts c where c.id = concept_id and c.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );
grant select on public.clinical_evidence_concept_links to anon, authenticated;
grant all on public.clinical_evidence_concept_links to service_role;

insert into public.clinical_evidence_concept_links (
  concept_id, evidence_record_id, relationship, applicability, review_status
)
select
  c.id,
  r.id,
  'condition',
  l.applicability,
  case when r.review_status = 'published' and t.review_status = 'published' then 'published' else 'under-review' end
from public.clinical_evidence_records r
join public.clinical_condition_terms t on t.id = r.condition_term_id
join public.clinical_concepts c
  on c.concept_type = 'condition'
 and c.normalized_label = public.normalize_clinical_query(t.canonical_name)
left join public.clinical_condition_evidence_links l
  on l.condition_term_id = t.id and l.evidence_record_id = r.id
on conflict (concept_id, evidence_record_id, relationship) do update set
  applicability = coalesce(excluded.applicability, clinical_evidence_concept_links.applicability),
  review_status = excluded.review_status,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Publication-family / independent-study normalization.
-- No family rows are inferred or seeded by this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_study_families (
  id uuid primary key default gen_random_uuid(),
  family_key text not null unique,
  family_kind text not null check (family_kind in (
    'randomized-trial','controlled-study','observational-cohort','case-series','systematic-review',
    'meta-analysis','guideline','regulatory-dossier','other'
  )),
  title text not null,
  trial_registry_id text,
  protocol_id text,
  cohort_fingerprint text,
  counts_as_independent_study boolean not null default false,
  normalization_rationale text not null,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_study_family_links (
  id uuid primary key default gen_random_uuid(),
  study_family_id uuid not null references public.clinical_study_families(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  publication_role text not null check (publication_role in (
    'primary-report','secondary-analysis','follow-up','extension','abstract','registry','regulatory-summary','other'
  )),
  is_primary_report boolean not null default false,
  overlap_note text,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_family_id, evidence_record_id)
);

alter table public.clinical_study_families enable row level security;
alter table public.clinical_evidence_study_family_links enable row level security;

drop policy if exists clinical_study_families_public_read on public.clinical_study_families;
create policy clinical_study_families_public_read
  on public.clinical_study_families for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_study_family_links_public_read on public.clinical_evidence_study_family_links;
create policy clinical_evidence_study_family_links_public_read
  on public.clinical_evidence_study_family_links for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_study_families f where f.id = study_family_id and f.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );

grant select on public.clinical_study_families to anon, authenticated;
grant select on public.clinical_evidence_study_family_links to anon, authenticated;
grant all on public.clinical_study_families to service_role;
grant all on public.clinical_evidence_study_family_links to service_role;

-- ---------------------------------------------------------------------------
-- Claim-level provenance anchored to immutable source snapshots and locators.
-- No claim rows are inferred or seeded by this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  claim_key text not null,
  claim_kind text not null check (claim_kind in (
    'indication','efficacy','safety','tolerability','interaction','monitoring','regulatory','limitation','other'
  )),
  claim_origin text not null default 'source-extraction'
    check (claim_origin in ('source-extraction','clinical-synthesis')),
  statement text not null,
  outcome_link_id uuid references public.clinical_evidence_outcome_links(id) on delete set null,
  extraction_id uuid references public.clinical_evidence_extractions(id) on delete set null,
  source_snapshot_id uuid references public.clinical_evidence_source_snapshots(id) on delete restrict,
  source_locator text,
  review_id uuid references public.clinical_evidence_reviews(id) on delete restrict,
  review_status text not null default 'under-review'
    check (review_status in ('published','under-review','retired')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evidence_record_id, claim_key),
  constraint clinical_evidence_claim_statement_nonempty check (btrim(statement) <> '')
);

create or replace function public.clinical_require_claim_provenance()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if new.source_snapshot_id is null or btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'published Clinical claim requires immutable source snapshot and source locator';
    end if;
    if not exists (
      select 1 from public.clinical_evidence_records r
      where r.id = new.evidence_record_id and r.review_status = 'published'
    ) then
      raise exception 'published Clinical claim requires a published evidence record';
    end if;
    if new.claim_origin = 'clinical-synthesis' then
      if new.review_id is null or not exists (
        select 1 from public.clinical_evidence_reviews r
        where r.id = new.review_id
          and r.evidence_record_id = new.evidence_record_id
          and r.decision = 'approved'
          and r.review_type in ('clinical','methodology')
      ) then
        raise exception 'published Clinical synthesis claim requires an approved clinical or methodology review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_claim_provenance() from public;
drop trigger if exists trg_clinical_require_claim_provenance on public.clinical_evidence_claims;
create trigger trg_clinical_require_claim_provenance
before insert or update of review_status, source_snapshot_id, source_locator, claim_origin, review_id
on public.clinical_evidence_claims
for each row execute function public.clinical_require_claim_provenance();

alter table public.clinical_evidence_claims enable row level security;
drop policy if exists clinical_evidence_claims_public_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_public_read
  on public.clinical_evidence_claims for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (select 1 from public.clinical_evidence_records r where r.id = evidence_record_id and r.review_status = 'published')
  );
grant select on public.clinical_evidence_claims to anon, authenticated;
grant all on public.clinical_evidence_claims to service_role;

-- ---------------------------------------------------------------------------
-- Defense-in-depth evidence eligibility.
-- Published stale/superseded records remain inspectable; withdrawn primary sources do not.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_record_is_eligible(p_record_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_evidence_records r
    left join public.clinical_evidence_sources s on s.id = r.primary_source_registry_id
    where r.id = p_record_id
      and r.review_status = 'published'
      and (s.id is null or s.currentness <> 'withdrawn')
  );
$function$;

revoke all on function public.clinical_evidence_record_is_eligible(uuid) from public;
grant execute on function public.clinical_evidence_record_is_eligible(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Deterministic concept resolver. No model/vector inference participates in ranking.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_clinical_query(
  p_query text,
  p_limit integer default 12
)
returns table (
  concept_id uuid,
  concept_type text,
  canonical_label text,
  matched_label text,
  match_kind text,
  match_rank integer,
  aliases text[]
)
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), candidates as (
    select
      c.id as concept_id,
      c.concept_type,
      c.canonical_label,
      c.canonical_label as matched_label,
      case
        when c.normalized_label = q.normalized then 'exact-canonical'
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 'prefix-canonical'
        else 'contains-canonical'
      end as match_kind,
      case
        when c.normalized_label = q.normalized then 0
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 2
        else 4
      end as match_rank
    from public.clinical_concepts c cross join q
    where c.review_status = 'published'
      and q.normalized <> ''
      and (
        c.normalized_label = q.normalized
        or (length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%')
        or (length(q.normalized) >= 4 and c.normalized_label like '%' || q.normalized || '%')
      )
    union all
    select
      c.id,
      c.concept_type,
      c.canonical_label,
      a.alias_label,
      case
        when a.normalized_alias = q.normalized then 'exact-alias'
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 'prefix-alias'
        else 'contains-alias'
      end,
      case
        when a.normalized_alias = q.normalized then 1
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 3
        else 5
      end
    from public.clinical_concept_aliases a
    join public.clinical_concepts c on c.id = a.concept_id
    cross join q
    where c.review_status = 'published'
      and a.review_status = 'published'
      and q.normalized <> ''
      and (
        a.normalized_alias = q.normalized
        or (length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%')
        or (length(q.normalized) >= 4 and a.normalized_alias like '%' || q.normalized || '%')
      )
  ), best as (
    select distinct on (x.concept_id)
      x.concept_id, x.concept_type, x.canonical_label, x.matched_label, x.match_kind, x.match_rank
    from candidates x
    order by x.concept_id, x.match_rank, length(x.matched_label), x.matched_label
  )
  select
    b.concept_id,
    b.concept_type,
    b.canonical_label,
    b.matched_label,
    b.match_kind,
    b.match_rank,
    coalesce((
      select array_agg(a.alias_label order by a.alias_label)
      from public.clinical_concept_aliases a
      where a.concept_id = b.concept_id and a.review_status = 'published'
    ), '{}'::text[]) as aliases
  from best b
  order by b.match_rank, b.canonical_label, b.concept_id
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$function$;

revoke all on function public.resolve_clinical_query(text,integer) from public;
grant execute on function public.resolve_clinical_query(text,integer) to anon, authenticated, service_role;

-- Replace the P0 text-only search with deterministic concept expansion while retaining
-- direct field matching and the existing RPC signature used by the application.
create or replace function public.search_clinical_evidence_records(
  p_query text default '',
  p_jurisdiction text default null,
  p_limit integer default 20
)
returns setof public.clinical_evidence_records
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), resolved as (
    select * from public.resolve_clinical_query(p_query, 50)
  )
  select r.*
  from public.clinical_evidence_records r cross join q
  where public.clinical_evidence_record_is_eligible(r.id)
    and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
    and (
      q.normalized = ''
      or exists (
        select 1
        from public.clinical_evidence_concept_links l
        join resolved rc on rc.concept_id = l.concept_id
        where l.evidence_record_id = r.id and l.review_status = 'published'
      )
      or exists (
        select 1
        from public.clinical_condition_terms t
        join resolved rc
          on rc.concept_type = 'condition'
         and rc.canonical_label = t.canonical_name
        where t.id = r.condition_term_id and t.review_status = 'published'
      )
      or public.normalize_clinical_query(coalesce(r.condition_label, '')) like '%' || q.normalized || '%'
      or exists (select 1 from unnest(r.condition_aliases) a where public.normalize_clinical_query(a) like '%' || q.normalized || '%')
      or public.normalize_clinical_query(r.title) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(r.summary) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.population, '')) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.intervention, '')) like '%' || q.normalized || '%'
      or public.normalize_clinical_query(coalesce(r.formulation, '')) like '%' || q.normalized || '%'
      or exists (select 1 from unnest(r.cannabinoids) c where public.normalize_clinical_query(c) like '%' || q.normalized || '%')
      or public.normalize_clinical_query(coalesce(r.outcome, '')) like '%' || q.normalized || '%'
    )
  order by
    case
      when q.normalized = '' then 0
      else coalesce((
        select min(rc.match_rank)
        from resolved rc
        where exists (
          select 1 from public.clinical_evidence_concept_links l
          where l.evidence_record_id = r.id
            and l.concept_id = rc.concept_id
            and l.review_status = 'published'
        )
        or exists (
          select 1 from public.clinical_condition_terms t
          where t.id = r.condition_term_id
            and t.review_status = 'published'
            and rc.concept_type = 'condition'
            and rc.canonical_label = t.canonical_name
        )
      ), 20)
    end,
    case when r.supersession_state = 'current' then 0 else 1 end,
    case when coalesce(r.freshness_status, 'current') = 'current' then 0 else 1 end,
    r.verified_at desc,
    r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

create or replace function public.clinical_condition_term_known(p_query text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $function$
  select exists (
    select 1 from public.resolve_clinical_query(p_query, 12) r
    where r.concept_type = 'condition'
  );
$function$;

revoke all on function public.search_clinical_evidence_records(text,text,integer) from public;
revoke all on function public.clinical_condition_term_known(text) from public;
grant execute on function public.search_clinical_evidence_records(text,text,integer) to anon, authenticated, service_role;
grant execute on function public.clinical_condition_term_known(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Safe public projections for claims, publication families and corpus coverage.
-- ---------------------------------------------------------------------------
create or replace function public.clinical_evidence_claims_for_records(p_record_ids uuid[])
returns table (
  id uuid,
  evidence_record_id uuid,
  claim_key text,
  claim_kind text,
  claim_origin text,
  statement text,
  source_snapshot_id uuid,
  source_locator text,
  verified_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $function$
  select c.id, c.evidence_record_id, c.claim_key, c.claim_kind, c.claim_origin,
         c.statement, c.source_snapshot_id, c.source_locator, c.verified_at
  from public.clinical_evidence_claims c
  where c.review_status = 'published'
    and c.evidence_record_id = any(coalesce(p_record_ids, '{}'::uuid[]))
    and public.clinical_evidence_record_is_eligible(c.evidence_record_id)
  order by c.evidence_record_id, c.claim_key, c.id;
$function$;

create or replace function public.clinical_evidence_study_families_for_records(p_record_ids uuid[])
returns table (
  evidence_record_id uuid,
  family_key text,
  family_kind text,
  title text,
  trial_registry_id text,
  protocol_id text,
  counts_as_independent_study boolean,
  publication_role text,
  is_primary_report boolean,
  overlap_note text,
  verified_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $function$
  select l.evidence_record_id, f.family_key, f.family_kind, f.title,
         f.trial_registry_id, f.protocol_id, f.counts_as_independent_study,
         l.publication_role, l.is_primary_report, l.overlap_note, f.verified_at
  from public.clinical_evidence_study_family_links l
  join public.clinical_study_families f on f.id = l.study_family_id
  where l.review_status = 'published'
    and f.review_status = 'published'
    and l.evidence_record_id = any(coalesce(p_record_ids, '{}'::uuid[]))
    and public.clinical_evidence_record_is_eligible(l.evidence_record_id)
  order by l.evidence_record_id, f.family_key, l.publication_role;
$function$;

create or replace function public.clinical_evidence_corpus_profile(p_jurisdiction text default null)
returns table (
  record_count bigint,
  current_record_count bigint,
  graded_record_count bigint,
  condition_count bigint,
  concept_count bigint,
  source_count bigint,
  independent_study_count bigint,
  study_family_count bigint,
  claim_count bigint,
  claim_anchored_record_count bigint,
  last_verified_at timestamptz,
  grading_method_key text,
  grading_method_version text,
  grading_method_title text
)
language sql
stable
security invoker
set search_path = public
as $function$
  with eligible as (
    select r.*
    from public.clinical_evidence_records r
    where public.clinical_evidence_record_is_eligible(r.id)
      and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
  ), family_scope as (
    select distinct f.id, f.counts_as_independent_study
    from eligible e
    join public.clinical_evidence_study_family_links l
      on l.evidence_record_id = e.id and l.review_status = 'published'
    join public.clinical_study_families f
      on f.id = l.study_family_id and f.review_status = 'published'
  ), claim_scope as (
    select c.*
    from public.clinical_evidence_claims c
    join eligible e on e.id = c.evidence_record_id
    where c.review_status = 'published'
  ), method as (
    select m.method_key, m.version, m.title
    from public.clinical_evidence_grading_methods m
    where m.retired_at is null
    order by m.effective_at desc, m.method_key
    limit 1
  )
  select
    (select count(*) from eligible),
    (select count(*) from eligible where supersession_state = 'current' and coalesce(freshness_status, 'current') = 'current'),
    (select count(*) from eligible where evidence_strength in ('high','moderate','low','very-low')),
    (select count(distinct condition_term_id) from eligible where condition_term_id is not null),
    (select count(*) from public.clinical_concepts where review_status = 'published'),
    (select count(distinct primary_source_registry_id) from eligible where primary_source_registry_id is not null),
    (select count(*) from family_scope where counts_as_independent_study),
    (select count(*) from family_scope),
    (select count(*) from claim_scope),
    (select count(distinct evidence_record_id) from claim_scope),
    (select max(verified_at) from eligible),
    (select method_key from method),
    (select version from method),
    (select title from method);
$function$;

revoke all on function public.clinical_evidence_claims_for_records(uuid[]) from public;
revoke all on function public.clinical_evidence_study_families_for_records(uuid[]) from public;
revoke all on function public.clinical_evidence_corpus_profile(text) from public;
grant execute on function public.clinical_evidence_claims_for_records(uuid[]) to anon, authenticated, service_role;
grant execute on function public.clinical_evidence_study_families_for_records(uuid[]) to anon, authenticated, service_role;
grant execute on function public.clinical_evidence_corpus_profile(text) to anon, authenticated, service_role;

comment on table public.clinical_concepts is
  'Governed canonical Clinical concepts. Matching expands deterministic reviewed terminology only; it does not infer a clinical conclusion.';
comment on table public.clinical_study_families is
  'Reviewed normalization of multiple publications to an underlying study/cohort/review family. Empty until independently verified; no publication is assumed independent by default.';
comment on table public.clinical_evidence_claims is
  'Published claim-level Clinical projections. Every published claim must remain anchored to an immutable source snapshot and exact source locator.';
comment on function public.resolve_clinical_query(text,integer) is
  'Deterministic governed concept resolver ranked exact canonical, exact alias, prefix canonical, prefix alias, then longer contains matches.';
comment on function public.search_clinical_evidence_records(text,text,integer) is
  'RLS-preserving governed evidence search with deterministic concept expansion, publication eligibility, jurisdiction/global matching, and no model-generated clinical inference.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260816150000','clinical_evidence_operating_system','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260816150000_clinical_evidence_operating_system.sql

-- RECOVERY BEGIN 20260816150100_clinical_evidence_operating_system_retrieval_hardening.sql
-- Clinical Evidence Operating System V1 retrieval hardening.
-- Keeps private source-registry state behind a narrow eligibility predicate and
-- makes deterministic concept/text retrieval useful for natural clinical questions.

-- The source registry is reviewer-private. Expose only the boolean eligibility
-- decision so anon/authenticated evidence search never requires direct source-table access.
create or replace function public.clinical_evidence_record_is_eligible(p_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.clinical_evidence_records r
    left join public.clinical_evidence_sources s on s.id = r.primary_source_registry_id
    where r.id = p_record_id
      and r.review_status = 'published'
      and (s.id is null or s.currentness <> 'withdrawn')
  );
$function$;

revoke all on function public.clinical_evidence_record_is_eligible(uuid) from public;
grant execute on function public.clinical_evidence_record_is_eligible(uuid) to anon, authenticated, service_role;

-- Resolve both direct terms and substantive terms embedded in a natural-language
-- question. Ranking remains explicit and deterministic; no vector/model similarity.
create or replace function public.resolve_clinical_query(
  p_query text,
  p_limit integer default 12
)
returns table (
  concept_id uuid,
  concept_type text,
  canonical_label text,
  matched_label text,
  match_kind text,
  match_rank integer,
  aliases text[]
)
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), terms as (
    select q.normalized as term, 0 as term_rank from q where q.normalized <> ''
    union
    select token, 1
    from q
    cross join lateral regexp_split_to_table(q.normalized, '\s+') token
    where length(token) >= 3
      and token not in (
        'the','and','for','with','from','into','about','what','which','where','when','does','show','find',
        'evidence','clinical','reviewed','record','records','current','use','using','are','this','that'
      )
  ), candidates as (
    select
      c.id as concept_id,
      c.concept_type,
      c.canonical_label,
      c.canonical_label as matched_label,
      case
        when c.normalized_label = q.normalized then 'exact-canonical'
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 'prefix-canonical'
        else 'contains-canonical'
      end as match_kind,
      case
        when c.normalized_label = q.normalized then 0
        when length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%' then 2
        when length(c.normalized_label) >= 4 and q.normalized like '%' || c.normalized_label || '%' then 4
        else 6 + t.term_rank
      end as match_rank
    from public.clinical_concepts c
    cross join q
    join terms t on true
    where c.review_status = 'published'
      and q.normalized <> ''
      and (
        c.normalized_label = q.normalized
        or (length(q.normalized) >= 2 and c.normalized_label like q.normalized || '%')
        or (length(c.normalized_label) >= 4 and q.normalized like '%' || c.normalized_label || '%')
        or (length(t.term) >= 3 and c.normalized_label like t.term || '%')
      )
    union all
    select
      c.id,
      c.concept_type,
      c.canonical_label,
      a.alias_label,
      case
        when a.normalized_alias = q.normalized then 'exact-alias'
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 'prefix-alias'
        else 'contains-alias'
      end,
      case
        when a.normalized_alias = q.normalized then 1
        when length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%' then 3
        when length(a.normalized_alias) >= 3 and q.normalized like '%' || a.normalized_alias || '%' then 5
        else 8 + t.term_rank
      end
    from public.clinical_concept_aliases a
    join public.clinical_concepts c on c.id = a.concept_id
    cross join q
    join terms t on true
    where c.review_status = 'published'
      and a.review_status = 'published'
      and q.normalized <> ''
      and (
        a.normalized_alias = q.normalized
        or (length(q.normalized) >= 2 and a.normalized_alias like q.normalized || '%')
        or (length(a.normalized_alias) >= 3 and q.normalized like '%' || a.normalized_alias || '%')
        or (length(t.term) >= 3 and a.normalized_alias like t.term || '%')
      )
  ), best as (
    select distinct on (x.concept_id)
      x.concept_id, x.concept_type, x.canonical_label, x.matched_label, x.match_kind, x.match_rank
    from candidates x
    order by x.concept_id, x.match_rank, length(x.matched_label), x.matched_label
  )
  select
    b.concept_id,
    b.concept_type,
    b.canonical_label,
    b.matched_label,
    b.match_kind,
    b.match_rank,
    coalesce((
      select array_agg(a.alias_label order by a.alias_label)
      from public.clinical_concept_aliases a
      where a.concept_id = b.concept_id and a.review_status = 'published'
    ), '{}'::text[]) as aliases
  from best b
  order by b.match_rank, b.canonical_label, b.concept_id
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$function$;

revoke all on function public.resolve_clinical_query(text,integer) from public;
grant execute on function public.resolve_clinical_query(text,integer) to anon, authenticated, service_role;

-- Search resolved concepts first, then deterministic substantive terms across
-- governed record fields. Natural-language wrapper words do not become evidence filters.
create or replace function public.search_clinical_evidence_records(
  p_query text default '',
  p_jurisdiction text default null,
  p_limit integer default 20
)
returns setof public.clinical_evidence_records
language sql
stable
security invoker
set search_path = public
as $function$
  with q as (
    select public.normalize_clinical_query(p_query) as normalized
  ), terms as (
    select q.normalized as term, 0 as term_rank from q where q.normalized <> ''
    union
    select token, 1
    from q
    cross join lateral regexp_split_to_table(q.normalized, '\s+') token
    where length(token) >= 3
      and token not in (
        'the','and','for','with','from','into','about','what','which','where','when','does','show','find',
        'evidence','clinical','reviewed','record','records','current','use','using','are','this','that'
      )
  ), resolved as (
    select * from public.resolve_clinical_query(p_query, 50)
  )
  select r.*
  from public.clinical_evidence_records r cross join q
  where public.clinical_evidence_record_is_eligible(r.id)
    and (p_jurisdiction is null or p_jurisdiction = any(r.jurisdictions) or 'Global' = any(r.jurisdictions))
    and (
      q.normalized = ''
      or exists (
        select 1
        from public.clinical_evidence_concept_links l
        join resolved rc on rc.concept_id = l.concept_id
        where l.evidence_record_id = r.id and l.review_status = 'published'
      )
      or exists (
        select 1
        from public.clinical_condition_terms t
        join resolved rc
          on rc.concept_type = 'condition'
         and rc.canonical_label = t.canonical_name
        where t.id = r.condition_term_id and t.review_status = 'published'
      )
      or exists (
        select 1 from terms t
        where
          public.normalize_clinical_query(coalesce(r.condition_label, '')) like '%' || t.term || '%'
          or exists (select 1 from unnest(r.condition_aliases) a where public.normalize_clinical_query(a) like '%' || t.term || '%')
          or public.normalize_clinical_query(r.title) like '%' || t.term || '%'
          or public.normalize_clinical_query(r.summary) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.population, '')) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.intervention, '')) like '%' || t.term || '%'
          or public.normalize_clinical_query(coalesce(r.formulation, '')) like '%' || t.term || '%'
          or exists (select 1 from unnest(r.cannabinoids) c where public.normalize_clinical_query(c) like '%' || t.term || '%')
          or public.normalize_clinical_query(coalesce(r.outcome, '')) like '%' || t.term || '%'
      )
    )
  order by
    case
      when q.normalized = '' then 0
      else coalesce((
        select min(rc.match_rank)
        from resolved rc
        where exists (
          select 1 from public.clinical_evidence_concept_links l
          where l.evidence_record_id = r.id
            and l.concept_id = rc.concept_id
            and l.review_status = 'published'
        )
        or exists (
          select 1 from public.clinical_condition_terms t
          where t.id = r.condition_term_id
            and t.review_status = 'published'
            and rc.concept_type = 'condition'
            and rc.canonical_label = t.canonical_name
        )
      ), 20)
    end,
    case when r.supersession_state = 'current' then 0 else 1 end,
    case when coalesce(r.freshness_status, 'current') = 'current' then 0 else 1 end,
    r.verified_at desc,
    r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

revoke all on function public.search_clinical_evidence_records(text,text,integer) from public;
grant execute on function public.search_clinical_evidence_records(text,text,integer) to anon, authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260816150100','clinical_evidence_operating_system_retrieval_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260816150100_clinical_evidence_operating_system_retrieval_hardening.sql

-- RECOVERY BEGIN 20260816150200_clinical_evidence_domain_separation.sql
-- Explicit evidence-domain separation.
-- This prevents regulatory authority, clinical evidence and preclinical evidence from
-- becoming visually equivalent. Existing records are classified only where their
-- governed evidence_type is itself unambiguous; all other records remain not-assessed.

alter table public.clinical_evidence_records
  add column if not exists evidence_domain text not null default 'not-assessed'
    check (evidence_domain in ('clinical','preclinical','regulatory','mixed','other','not-assessed'));

update public.clinical_evidence_records
set evidence_domain = case
  when evidence_type in ('regulation','regulatory-guidance','product-monograph') then 'regulatory'
  when evidence_type in ('randomized-trial','observational-study','clinical-guideline') then 'clinical'
  else evidence_domain
end
where evidence_domain = 'not-assessed';

comment on column public.clinical_evidence_records.evidence_domain is
  'Reviewed evidence domain. Systematic reviews/meta-analyses remain not-assessed until their included evidence scope is explicitly reviewed; no clinical applicability is inferred from source type alone.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260816150200','clinical_evidence_domain_separation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260816150200_clinical_evidence_domain_separation.sql

-- RECOVERY BEGIN 20260818110000_clinical_evidence_release_publication_guard.sql
-- Clinical corpus release guard.
--
-- Production currently has the August 18 seed migrations applied without the
-- Clinical Evidence V1/V1.1 governance chain. This migration is intentionally
-- ordered after V1/V1.1 and before those August 18 seeds for a zero-state replay.
-- It changes no evidence rows. Its only legacy accommodation is fail-closed:
-- known historical graded INSERT seeds are staged under review when replayed
-- from zero instead of bypassing credential-bound publication governance.

do $$
begin
  if to_regclass('public.clinical_evidence_reviews') is null
     or to_regclass('public.clinical_reviewer_credentials') is null
     or to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') is null then
    raise exception 'Clinical Evidence V1/V1.1 governance must be applied before the Clinical corpus release guard';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clinical_evidence_records'
      and column_name = 'publication_scope'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clinical_evidence_records'
      and column_name = 'freshness_status'
  ) then
    raise exception 'Clinical Evidence publication_scope/freshness controls are required before the Clinical corpus release guard';
  end if;
end $$;

create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  publication_transition boolean := false;
  provenance_approved boolean := false;
  qualified_review_approved boolean := false;
  legacy_zero_state_seed boolean := false;
begin
  if new.review_status <> 'published' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    publication_transition := true;
  elsif tg_op = 'UPDATE' then
    publication_transition :=
      old.review_status is distinct from 'published'
      or old.publication_scope is distinct from new.publication_scope
      or old.evidence_strength is distinct from new.evidence_strength;
  end if;

  if not publication_transition then
    return new;
  end if;

  select exists (
    select 1
    from public.clinical_evidence_reviews r
    where r.evidence_record_id = new.id
      and r.review_type = 'provenance'
      and r.decision = 'approved'
  ) into provenance_approved;

  if new.publication_scope = 'clinical-synthesis'
     or new.evidence_strength in ('high','moderate','low','very-low','conflicted') then
    select exists (
      select 1
      from public.clinical_evidence_reviews r
      where r.evidence_record_id = new.id
        and r.review_type = 'clinical'
        and r.reviewer_type in ('clinician','pharmacist')
        and r.decision = 'approved'
        and r.reviewer_user_id is not null
        and r.reviewer_credential_id is not null
        and public.clinical_reviewer_credential_is_valid(
          r.reviewer_credential_id,
          r.reviewer_user_id,
          r.reviewer_type,
          r.reviewed_at
        )
    ) into qualified_review_approved;
  else
    qualified_review_approved := true;
  end if;

  legacy_zero_state_seed := tg_op = 'INSERT' and new.slug = any (array[
    'ev-neuropathic-pain-overview',
    'ev-cbd-epilepsy-dravet-lgs',
    'ev-safety-monitoring-overview',
    'ev-cannabinoid-drug-interactions',
    'ev-spasticity-ms-overview',
    'ev-chemo-nausea-overview',
    'ev-anxiety-cbd-overview',
    'ev-sleep-cannabinoids-overview',
    'ev-chronic-pain-non-cancer-overview',
    'ev-parkinson-symptoms-overview',
    'ev-ptsd-symptoms-overview'
  ]::text[]);

  if legacy_zero_state_seed and (not provenance_approved or not qualified_review_approved) then
    new.review_status := 'under-review';
    new.publication_scope := 'clinical-synthesis';
    new.freshness_status := 'review-required';
    new.freshness_reason := 'Legacy graded seed replayed under Clinical Evidence V1/V1.1 governance; publication requires approved provenance and a valid credential-bound clinician/pharmacist review.';
    return new;
  end if;

  if not provenance_approved then
    raise exception 'clinical evidence publication requires an approved provenance review';
  end if;

  if not qualified_review_approved then
    raise exception 'clinical synthesis or graded certainty requires an approved credential-bound clinician/pharmacist review';
  end if;

  return new;
end;
$function$;

revoke all on function public.clinical_require_publication_review() from public;

drop trigger if exists trg_clinical_require_publication_review
  on public.clinical_evidence_records;
create trigger trg_clinical_require_publication_review
before insert or update of review_status, publication_scope, evidence_strength
on public.clinical_evidence_records
for each row execute function public.clinical_require_publication_review();

comment on function public.clinical_require_publication_review() is
  'Fail-closed Clinical publication gate. Known historical graded seed INSERTs are staged under review on zero-state replay; every other graded/synthesis publication requires approved provenance plus a valid credential-bound clinician/pharmacist review.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818110000','clinical_evidence_release_publication_guard','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818110000_clinical_evidence_release_publication_guard.sql

-- RECOVERY BEGIN 20260818120000_clinical_formulary_and_evidence_seed.sql
-- Clinical formulary layer + seed published evidence from Harbourview clinical fixtures.
-- Extends the existing clinical_evidence_records spine; does not create a parallel evidence system.
-- Boundaries: public, non-patient, provenance-bearing only. Not marketplace product marketing.

-- ── Formulary products (jurisdiction-authorised reference) ─────────────────
create table if not exists public.clinical_formulary_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_iso2 text not null,
  product_class text not null
    check (product_class in (
      'cbd-dominant', 'thc-dominant', 'balanced', 'isolate',
      'full-spectrum', 'pharmaceutical', 'other'
    )),
  authorization_status text not null
    check (authorization_status in (
      'authorised', 'import-authorised', 'compounding-permitted',
      'restricted', 'not-authorised', 'unknown'
    )),
  cannabinoid_profile text not null,
  routes text[] not null default '{}',
  authority text not null,
  notes text not null default '',
  primary_source_url text,
  last_reviewed date not null,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_formulary_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_formulary_country_idx
  on public.clinical_formulary_products (country_iso2);
create index if not exists clinical_formulary_review_idx
  on public.clinical_formulary_products (review_status);

alter table public.clinical_formulary_products enable row level security;

-- Public read of published formulary only (anon + authenticated)
drop policy if exists clinical_formulary_public_read on public.clinical_formulary_products;
create policy clinical_formulary_public_read
  on public.clinical_formulary_products
  for select
  to anon, authenticated
  using (review_status = 'published');

-- Service role / authenticated staff write left to existing admin patterns
grant select on public.clinical_formulary_products to anon, authenticated;

-- ── Seed formulary (idempotent by slug) ────────────────────────────────────
insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status
) values
(
  'br-anvisa-cbd-oral-class',
  'ANVISA-authorised CBD oral products (class)',
  'BR', 'cbd-dominant', 'authorised',
  'CBD-dominant; THC limits per product registration',
  array['oral','oromucosal'],
  'ANVISA',
  'Only products with current ANVISA authorisation may be prescribed and dispensed. Verify the live register before relying on any specific SKU.',
  'https://www.gov.br/anvisa',
  '2026-07-20', 'published'
),
(
  'br-import-authorisation-pathway',
  'Individual import authorisation pathway',
  'BR', 'other', 'import-authorised',
  'Varies by authorised product',
  array['oral','oromucosal','other'],
  'ANVISA',
  'Import authorisation remains an important access route for some patients when domestic authorised products are insufficient.',
  'https://www.gov.br/anvisa',
  '2026-07-20', 'published'
),
(
  'gb-cbpm-unlicensed-class',
  'UK CBPMs (unlicensed specialist pathway)',
  'GB', 'full-spectrum', 'authorised',
  'Flower, oils, capsules — ratios vary by product',
  array['inhaled','oral','oromucosal'],
  'MHRA / specialist prescribing framework',
  'Unlicensed CBPMs dominate UK medical use. Specialist initiation is the default.',
  null,
  '2026-06-30', 'published'
),
(
  'au-sas-b-medicinal-cannabis',
  'TGA SAS-B / Authorised Prescriber medicinal cannabis products',
  'AU', 'other', 'authorised',
  'Wide range of CBD/THC ratios and forms',
  array['oral','inhaled','oromucosal','topical'],
  'Therapeutic Goods Administration (TGA)',
  'Product choice is broad under SAS-B and Authorised Prescriber schemes. State controlled-drug rules still apply.',
  null,
  '2026-07-05', 'published'
),
(
  'de-medical-cannabis-pharmacy',
  'German medical cannabis (pharmacy-dispensed)',
  'DE', 'full-spectrum', 'authorised',
  'Flowers and extracts under medical framework',
  array['inhaled','oral'],
  'BfArM / narcotics-medicines framework',
  'Medical pathway is distinct from adult-use rules.',
  null,
  '2026-07-10', 'published'
)
on conflict (slug) do update set
  name = excluded.name,
  authorization_status = excluded.authorization_status,
  notes = excluded.notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

-- ── Seed evidence records into existing spine (published, idempotent by slug)
-- Only insert if table exists (spine migration already applied in production).
do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then
    raise notice 'clinical_evidence_records missing — skip evidence seed';
    return;
  end if;

  insert into public.clinical_evidence_records (
    slug, title, summary, condition_label, population, intervention, formulation,
    cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
    uncertainty, jurisdictions, profession_relevance,
    primary_source_title, primary_source_publisher, primary_source_url,
    publication_date, verified_at, review_status
  ) values
  (
    'ev-neuropathic-pain-overview',
    'Cannabinoids for chronic neuropathic pain — overview of controlled evidence',
    'Multiple RCTs and systematic reviews support a modest analgesic effect of THC-containing products in neuropathic pain, with higher rates of adverse events than placebo. CBD-dominant products have weaker and more heterogeneous evidence.',
    'chronic neuropathic pain',
    'adult',
    'THC / CBD / balanced cannabinoid products',
    'oral / oromucosal',
    array['THC','CBD'],
    'cannabis-derived-formulation',
    'pain intensity reduction',
    'systematic-review',
    'moderate',
    'Heterogeneous formulations and limited long-term comparative data',
    array['BR','global'],
    array['physician','specialist'],
    'Systematic reviews of RCTs (various, 2018–2025)',
    'Peer-reviewed literature synthesis',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-11-01',
    '2026-07-15T00:00:00Z',
    'published'
  ),
  (
    'ev-cbd-epilepsy-dravet-lgs',
    'CBD in treatment-resistant epilepsy (Dravet / Lennox-Gastaut context)',
    'High-quality evidence supports purified CBD as adjunctive therapy for seizures in Dravet syndrome and Lennox-Gastaut syndrome. Evidence for other epilepsy syndromes and non-purified extracts is weaker.',
    'treatment-resistant epilepsy',
    'paediatric / adult',
    'purified CBD',
    'oral',
    array['CBD'],
    'regulated-cannabinoid-drug',
    'seizure frequency reduction',
    'randomized-trial',
    'high',
    'Most robust data are for purified pharmaceutical CBD, not broad-spectrum extracts',
    array['BR','global'],
    array['physician','specialist','paediatrician'],
    'Pivotal RCTs and regulatory assessments',
    'FDA/EMA/ANVISA-related assessments',
    'https://www.gov.br/anvisa',
    '2024-06-01',
    '2026-06-20T00:00:00Z',
    'published'
  ),
  (
    'ev-safety-monitoring-overview',
    'Common adverse effects and monitoring considerations',
    'THC-related effects (psychoactivity, sedation, tachycardia) and CBD-related effects (somnolence, GI disturbance, potential hepatic enzyme elevation) are the dominant safety themes. Elderly and polypharmacy patients require particular caution.',
    'general medical cannabis use',
    'adult / elderly',
    'THC and CBD products',
    null,
    array['THC','CBD'],
    'general-cannabis',
    'adverse event profile',
    'clinical-guideline',
    'moderate',
    'Real-world adverse event reporting remains incomplete in many jurisdictions',
    array['global'],
    array['physician','pharmacist'],
    'Guideline consensus and pharmacovigilance summaries',
    'Professional society / regulator summaries',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-09-01',
    '2026-07-01T00:00:00Z',
    'published'
  ),
  (
    'ev-cannabinoid-drug-interactions',
    'Cannabinoid–drug interaction overview (CYP focus)',
    'CBD is a more significant CYP inhibitor (notably CYP3A4, CYP2C19, CYP2C9) than THC in most clinical contexts. Clinically relevant interactions have been documented with clobazam and certain narrow-therapeutic-index drugs.',
    'polypharmacy / concomitant medication',
    'adult / elderly',
    'CBD / THC',
    null,
    array['CBD','THC'],
    'cannabinoid-isolate',
    'drug–drug interaction risk',
    'pharmacovigilance-signal',
    'moderate',
    'Most data are from PK studies or case series rather than large RCTs',
    array['global'],
    array['physician','pharmacist'],
    'Pharmacokinetic studies and interaction resources',
    'Clinical pharmacology literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-08-01',
    '2026-06-15T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;

comment on table public.clinical_formulary_products is
  'Jurisdiction-authorised cannabis product reference for clinical command. Not marketplace listings. Published rows only are public.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818120000','clinical_formulary_and_evidence_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818120000_clinical_formulary_and_evidence_seed.sql

-- RECOVERY BEGIN 20260818130000_clinical_evidence_formulary_expand.sql
-- Expand clinical evidence + formulary seeds for higher-demand prescriber conditions/countries.

insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status
) values
(
  'ca-medical-authorisation-class',
  'Canada medical authorisation product class',
  'CA', 'full-spectrum', 'authorised',
  'Medical licence holders — CBD/THC ratios vary',
  array['oral','inhaled','oromucosal'],
  'Health Canada',
  'Medical authorisation remains available alongside adult-use retail. Keep medical documentation distinct.',
  null,
  '2026-06-25', 'published'
),
(
  'co-medical-cannabis-class',
  'Colombia medical cannabis authorised products',
  'CO', 'other', 'authorised',
  'Varies by licensed manufacturer',
  array['oral','other'],
  'INVIMA / Ministry of Health',
  'Prescribing must stay within authorised product and distribution channels.',
  null,
  '2026-07-01', 'published'
),
(
  'il-imc-medical-cannabis',
  'Israel IMC medical cannabis',
  'IL', 'full-spectrum', 'authorised',
  'IMC-licensed products — multiple ratios',
  array['oral','inhaled'],
  'Ministry of Health / IMC',
  'Medical pathway under IMC framework. Confirm current product catalogue with primary authority.',
  null,
  '2026-07-01', 'published'
)
on conflict (slug) do update set
  notes = excluded.notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then
    return;
  end if;

  insert into public.clinical_evidence_records (
    slug, title, summary, condition_label, population, intervention, formulation,
    cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
    uncertainty, jurisdictions, profession_relevance,
    primary_source_title, primary_source_publisher, primary_source_url,
    publication_date, verified_at, review_status
  ) values
  (
    'ev-spasticity-ms-overview',
    'Cannabinoids for spasticity in multiple sclerosis — evidence overview',
    'Controlled trials and reviews support modest benefit of certain THC:CBD combinations for MS-related spasticity in selected patients, with trade-offs in adverse effects.',
    'multiple sclerosis spasticity',
    'adult',
    'THC:CBD oromucosal / oral',
    'oromucosal',
    array['THC','CBD'],
    'regulated-cannabinoid-drug',
    'spasticity severity reduction',
    'systematic-review',
    'moderate',
    'Effect sizes modest; patient selection and titration critical',
    array['global','GB','DE','CA'],
    array['physician','specialist','neurologist'],
    'Systematic reviews of MS spasticity trials',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-01-01',
    '2026-07-01T00:00:00Z',
    'published'
  ),
  (
    'ev-chemo-nausea-overview',
    'Cannabinoids for chemotherapy-induced nausea and vomiting',
    'Evidence supports cannabinoids as adjunctive options in refractory CINV in some settings; first-line antiemetic standards of care still apply.',
    'chemotherapy-induced nausea and vomiting',
    'adult',
    'THC-containing products / regulated cannabinoid drugs',
    'oral',
    array['THC'],
    'regulated-cannabinoid-drug',
    'nausea/vomiting control',
    'systematic-review',
    'moderate',
    'Modern multi-agent antiemetic regimens limit incremental benefit in many patients',
    array['global','US','CA','GB'],
    array['physician','oncologist'],
    'CINV cannabinoid systematic reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2024-11-01',
    '2026-06-15T00:00:00Z',
    'published'
  ),
  (
    'ev-anxiety-cbd-overview',
    'CBD for anxiety symptoms — evidence snapshot',
    'Evidence for CBD in anxiety is mixed and formulation-dependent; high-quality trials remain limited relative to demand. Not a substitute for standard mental-health care.',
    'anxiety symptoms',
    'adult',
    'CBD',
    'oral',
    array['CBD'],
    'cannabinoid-isolate',
    'anxiety symptom reduction',
    'observational-study',
    'low',
    'Heterogeneous products and endpoints; risk of overstating benefit',
    array['global','BR','AU','CA'],
    array['physician','psychiatrist'],
    'Anxiety and CBD evidence reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-03-01',
    '2026-07-10T00:00:00Z',
    'published'
  ),
  (
    'ev-sleep-cannabinoids-overview',
    'Cannabinoids and sleep disturbance — evidence snapshot',
    'Signals for sleep improvement exist in some populations but certainty is low; daytime sedation and tolerance are relevant safety considerations.',
    'sleep disturbance',
    'adult',
    'THC / CBD products',
    'oral / inhaled',
    array['THC','CBD'],
    'general-cannabis',
    'sleep quality / latency',
    'observational-study',
    'low',
    'Few long-term RCTs; confounding by concurrent symptoms common',
    array['global'],
    array['physician'],
    'Sleep and cannabinoid reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-05-01',
    '2026-07-05T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818130000','clinical_evidence_formulary_expand','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818130000_clinical_evidence_formulary_expand.sql

-- RECOVERY BEGIN 20260818133500_network_command_p0_core.sql
begin;

-- Network Command P0.
-- Canonical real-world identity remains public.entities.
-- Workspace membership remains the tenancy/security boundary.
-- Existing domain systems (operators/licences, genetics, marketplace, transactions,
-- intelligence and watchlists) remain canonical and are linked rather than copied.

create table public.network_missions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  objective text not null,
  status text not null default 'active'
    check (status in ('active','paused','completed','archived')),
  country_iso2 text,
  target_country_iso2s text[] not null default '{}',
  target_date date,
  confidentiality text not null default 'workspace'
    check (confidentiality in ('workspace','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_missions_name_chk check (length(btrim(name)) between 1 and 160),
  constraint network_missions_objective_chk check (length(btrim(objective)) between 1 and 2000),
  constraint network_missions_country_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$')
);

create index network_missions_workspace_status_idx
  on public.network_missions(workspace_id, status, updated_at desc);

create table public.network_mission_requirements (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.network_missions(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  requirement_type text not null,
  label text not null,
  description text,
  hard_requirement boolean not null default true,
  capability_code text,
  licence_activity text,
  country_iso2 text,
  expected_value jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','satisfied','waived','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_mission_requirements_type_chk check (length(btrim(requirement_type)) between 1 and 80),
  constraint network_mission_requirements_label_chk check (length(btrim(label)) between 1 and 240),
  constraint network_mission_requirements_country_chk check (country_iso2 is null or country_iso2 ~ '^[A-Z]{2}$')
);

create index network_mission_requirements_mission_idx
  on public.network_mission_requirements(mission_id, status, sort_order, created_at);

-- Resolution bridge only. This never becomes a second entity master.
create table public.network_source_entity_links (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  source_id text not null,
  entity_id uuid references public.entities(id) on delete set null,
  resolution_status text not null default 'unresolved'
    check (resolution_status in ('unresolved','candidate','resolved','rejected')),
  resolution_method text,
  confidence numeric(5,4),
  evidence_id uuid references public.hv_evidence(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_source_entity_links_kind_chk check (length(btrim(source_kind)) between 1 and 80),
  constraint network_source_entity_links_source_id_chk check (length(btrim(source_id)) between 1 and 240),
  constraint network_source_entity_links_confidence_chk check (confidence is null or confidence between 0 and 1),
  unique(source_kind, source_id)
);

create index network_source_entity_links_entity_idx
  on public.network_source_entity_links(entity_id)
  where entity_id is not null;
create index network_source_entity_links_queue_idx
  on public.network_source_entity_links(resolution_status, updated_at desc);

create table public.network_introductions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid references public.network_missions(id) on delete set null,
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  target_entity_id uuid references public.entities(id) on delete set null,
  target_source_kind text,
  target_source_id text,
  reason text not null,
  requested_disclosure_scope text not null default 'identity_and_business_context',
  status text not null default 'draft'
    check (status in (
      'draft','review','disclosure_pending','consent_pending','approved','introduced',
      'converted','declined','expired','closed'
    )),
  consent_required boolean not null default true,
  introduced_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_introductions_target_chk check (
    target_entity_id is not null
    or (target_source_kind is not null and length(btrim(target_source_kind)) > 0
        and target_source_id is not null and length(btrim(target_source_id)) > 0)
  ),
  constraint network_introductions_reason_chk check (length(btrim(reason)) between 1 and 2000)
);

create index network_introductions_workspace_status_idx
  on public.network_introductions(workspace_id, status, updated_at desc);
create index network_introductions_mission_idx
  on public.network_introductions(mission_id)
  where mission_id is not null;
create index network_introductions_target_entity_idx
  on public.network_introductions(target_entity_id)
  where target_entity_id is not null;

create table public.network_introduction_events (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references public.network_introductions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint network_introduction_events_type_chk check (length(btrim(event_type)) between 1 and 100)
);

create index network_introduction_events_intro_idx
  on public.network_introduction_events(introduction_id, created_at desc);
create index network_introduction_events_workspace_idx
  on public.network_introduction_events(workspace_id, created_at desc);

create table public.network_interactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid references public.network_missions(id) on delete set null,
  introduction_id uuid references public.network_introductions(id) on delete set null,
  entity_id uuid references public.entities(id) on delete set null,
  source_kind text,
  source_id text,
  interaction_type text not null,
  channel text,
  direction text not null default 'outbound'
    check (direction in ('outbound','inbound','mutual','internal')),
  occurred_at timestamptz not null default now(),
  summary text not null,
  outcome text,
  classification text not null default 'workspace'
    check (classification in ('workspace','restricted')),
  created_by uuid not null references auth.users(id) on delete restrict,
  supersedes_interaction_id uuid references public.network_interactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint network_interactions_subject_chk check (
    entity_id is not null
    or (source_kind is not null and length(btrim(source_kind)) > 0
        and source_id is not null and length(btrim(source_id)) > 0)
  ),
  constraint network_interactions_type_chk check (length(btrim(interaction_type)) between 1 and 100),
  constraint network_interactions_summary_chk check (length(btrim(summary)) between 1 and 4000),
  constraint network_interactions_supersedes_chk check (supersedes_interaction_id is null or supersedes_interaction_id <> id)
);

create index network_interactions_workspace_time_idx
  on public.network_interactions(workspace_id, occurred_at desc);
create index network_interactions_mission_idx
  on public.network_interactions(mission_id, occurred_at desc)
  where mission_id is not null;
create index network_interactions_entity_idx
  on public.network_interactions(entity_id, occurred_at desc)
  where entity_id is not null;
create index network_interactions_source_idx
  on public.network_interactions(source_kind, source_id, occurred_at desc)
  where source_kind is not null and source_id is not null;

create trigger network_missions_set_updated_at
before update on public.network_missions
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_mission_requirements_set_updated_at
before update on public.network_mission_requirements
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_source_entity_links_set_updated_at
before update on public.network_source_entity_links
for each row execute function public.hv_transaction_set_updated_at();

create trigger network_introductions_set_updated_at
before update on public.network_introductions
for each row execute function public.hv_transaction_set_updated_at();

-- PostgREST exposes only `api` in this project. Keep browser access on simple,
-- security-invoker views so base-table RLS remains authoritative.
create or replace view api.network_missions
with (security_invoker = true) as
select id, workspace_id, created_by, name, objective, status, country_iso2,
       target_country_iso2s, target_date, confidentiality, created_at, updated_at
from public.network_missions;

create or replace view api.network_mission_requirements
with (security_invoker = true) as
select id, mission_id, created_by, requirement_type, label, description,
       hard_requirement, capability_code, licence_activity, country_iso2,
       expected_value, status, sort_order, created_at, updated_at
from public.network_mission_requirements;

create or replace view api.network_introductions
with (security_invoker = true) as
select id, workspace_id, mission_id, requester_user_id, target_entity_id,
       target_source_kind, target_source_id, reason, requested_disclosure_scope,
       status, consent_required, introduced_at, outcome, created_at, updated_at
from public.network_introductions;

create or replace view api.network_introduction_events
with (security_invoker = true) as
select id, introduction_id, workspace_id, actor_user_id, event_type,
       from_status, to_status, detail, created_at
from public.network_introduction_events;

create or replace view api.network_interactions
with (security_invoker = true) as
select id, workspace_id, mission_id, introduction_id, entity_id, source_kind,
       source_id, interaction_type, channel, direction, occurred_at, summary,
       outcome, classification, created_by, supersedes_interaction_id, created_at
from public.network_interactions;

comment on table public.network_missions is 'Workspace-private commercial objectives used by Network Command. Workspaces remain the tenancy boundary.';
comment on table public.network_source_entity_links is 'Resolution bridge from domain records to public.entities; never a parallel entity registry.';
comment on table public.network_interactions is 'Workspace-private append-oriented relationship interaction memory.';
comment on table public.network_introductions is 'Controlled Network introduction lifecycle with disclosure and consent gates.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818133500','network_command_p0_core','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818133500_network_command_p0_core.sql

-- RECOVERY BEGIN 20260818133600_network_command_p0_security.sql
begin;

create or replace function public.hv_network_active_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and w.status = 'active'
  );
$$;

revoke all on function public.hv_network_active_workspace_member(uuid) from public, anon;
grant execute on function public.hv_network_active_workspace_member(uuid) to authenticated, service_role;

-- Foreign references between private Network objects must never cross workspace
-- boundaries, even if a caller guesses another object's UUID.
create or replace function public.hv_network_validate_introduction_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mission_id is not null and not exists (
    select 1 from public.network_missions m
    where m.id = new.mission_id and m.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_introductions_validate_links
before insert or update on public.network_introductions
for each row execute function public.hv_network_validate_introduction_links();

create or replace function public.hv_network_validate_introduction_event_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.network_introductions i
    where i.id = new.introduction_id and i.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_introduction_events_validate_links
before insert or update on public.network_introduction_events
for each row execute function public.hv_network_validate_introduction_event_links();

create or replace function public.hv_network_validate_interaction_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mission_id is not null and not exists (
    select 1 from public.network_missions m
    where m.id = new.mission_id and m.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;
  if new.introduction_id is not null and not exists (
    select 1 from public.network_introductions i
    where i.id = new.introduction_id and i.workspace_id = new.workspace_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_WORKSPACE_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger network_interactions_validate_links
before insert or update on public.network_interactions
for each row execute function public.hv_network_validate_interaction_links();

alter table public.network_missions enable row level security;
alter table public.network_mission_requirements enable row level security;
alter table public.network_source_entity_links enable row level security;
alter table public.network_introductions enable row level security;
alter table public.network_introduction_events enable row level security;
alter table public.network_interactions enable row level security;

revoke all on table
  public.network_missions,
  public.network_mission_requirements,
  public.network_source_entity_links,
  public.network_introductions,
  public.network_introduction_events,
  public.network_interactions
from public, anon, authenticated;

-- Missions are workspace-private and editable by any active workspace member in P0.
-- This is the explicit P0 write policy; role-specific authoring can be layered later.
grant select, insert, update on table public.network_missions to authenticated;
grant select, insert, update on table public.network_mission_requirements to authenticated;

create policy network_missions_member_read
  on public.network_missions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_missions_member_insert
  on public.network_missions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(workspace_id))
  );
create policy network_missions_member_update
  on public.network_missions for update to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)))
  with check ((select public.hv_network_active_workspace_member(workspace_id)));

create policy network_mission_requirements_member_read
  on public.network_mission_requirements for select to authenticated
  using (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ));
create policy network_mission_requirements_member_insert
  on public.network_mission_requirements for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.network_missions m
      where m.id = mission_id
        and public.hv_network_active_workspace_member(m.workspace_id)
    )
  );
create policy network_mission_requirements_member_update
  on public.network_mission_requirements for update to authenticated
  using (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ))
  with check (exists (
    select 1 from public.network_missions m
    where m.id = mission_id
      and public.hv_network_active_workspace_member(m.workspace_id)
  ));

-- The source/entity resolution queue is staff-only. Customer Network DTOs receive
-- only an allowlisted resolved entity id when the server can safely expose one.
grant select, insert, update on table public.network_source_entity_links to authenticated;
create policy network_source_entity_links_staff_read
  on public.network_source_entity_links for select to authenticated
  using ((select public.hv_has_transaction_role(array['admin','operator','analyst','super_admin','compliance_reviewer'])));
create policy network_source_entity_links_staff_write
  on public.network_source_entity_links for all to authenticated
  using ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])))
  with check ((select public.hv_has_transaction_role(array['admin','operator','super_admin'])));

-- Introduction requests are append/control-plane objects in P0. Workspace users can
-- create/read requests; status advancement is deliberately not directly updateable
-- by the authenticated role and remains a controlled staff/system follow-up.
grant select, insert on table public.network_introductions to authenticated;
grant select, insert on table public.network_introduction_events to authenticated;

create policy network_introductions_member_read
  on public.network_introductions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_introductions_member_insert
  on public.network_introductions for insert to authenticated
  with check (
    requester_user_id = (select auth.uid())
    and status in ('draft','review')
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

create policy network_introduction_events_member_read
  on public.network_introduction_events for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_introduction_events_member_insert
  on public.network_introduction_events for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and event_type = 'requested'
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

-- Interaction memory is append-oriented. Corrections are separate rows through
-- supersedes_interaction_id rather than mutable/deletable history.
grant select, insert on table public.network_interactions to authenticated;
create policy network_interactions_member_read
  on public.network_interactions for select to authenticated
  using ((select public.hv_network_active_workspace_member(workspace_id)));
create policy network_interactions_member_insert
  on public.network_interactions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(workspace_id))
  );

-- Service-role remains available to controlled server/admin jobs only.
grant all on table
  public.network_missions,
  public.network_mission_requirements,
  public.network_source_entity_links,
  public.network_introductions,
  public.network_introduction_events,
  public.network_interactions
to service_role;

-- api schema is the only PostgREST-exposed schema in production.
revoke all on
  api.network_missions,
  api.network_mission_requirements,
  api.network_introductions,
  api.network_introduction_events,
  api.network_interactions
from public, anon;

grant select, insert, update on api.network_missions to authenticated;
grant select, insert, update on api.network_mission_requirements to authenticated;
grant select, insert on api.network_introductions to authenticated;
grant select, insert on api.network_introduction_events to authenticated;
grant select, insert on api.network_interactions to authenticated;

grant select, insert, update, delete on
  api.network_missions,
  api.network_mission_requirements,
  api.network_introductions,
  api.network_introduction_events,
  api.network_interactions
to service_role;

-- Harden the existing watchlist contract: inactive memberships must no longer
-- retain read/write/delete access to workspace watches or rules.
drop policy if exists cc_watchlist_items_member_read on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_insert on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_update on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_delete on public.cc_watchlist_items;

drop policy if exists cc_watch_rules_member_read on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_insert on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_update on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_delete on public.cc_watch_rules;

create policy cc_watchlist_items_member_read
  on public.cc_watchlist_items for select to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watchlist_items_member_insert
  on public.cc_watchlist_items for insert to authenticated
  with check (
    added_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(org_id))
  );
create policy cc_watchlist_items_member_update
  on public.cc_watchlist_items for update to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)))
  with check ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watchlist_items_member_delete
  on public.cc_watchlist_items for delete to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));

create policy cc_watch_rules_member_read
  on public.cc_watch_rules for select to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watch_rules_member_insert
  on public.cc_watch_rules for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.hv_network_active_workspace_member(org_id))
  );
create policy cc_watch_rules_member_update
  on public.cc_watch_rules for update to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)))
  with check ((select public.hv_network_active_workspace_member(org_id)));
create policy cc_watch_rules_member_delete
  on public.cc_watch_rules for delete to authenticated
  using ((select public.hv_network_active_workspace_member(org_id)));

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818133600','network_command_p0_security','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818133600_network_command_p0_security.sql

-- RECOVERY BEGIN 20260818133700_network_command_p0_identity_backfill.sql
begin;

-- Reuse reviewed/canonical links that already exist. No name-based or inferred
-- merges are performed here; unresolved source records remain unresolved.
insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'cannabis_operator', co.id::text, co.entity_id, 'resolved', 'existing_bridge', 1.0
from public.cannabis_operators co
where co.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'ia_counterparty', c.id::text, c.entity_id, 'resolved', 'existing_bridge', 1.0
from public.ia_counterparties c
where c.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

insert into public.network_source_entity_links (
  source_kind, source_id, entity_id, resolution_status, resolution_method, confidence
)
select
  'operator_licence', ol.id::text, ol.entity_id, 'resolved', 'existing_bridge', 1.0
from public.operator_licences ol
where ol.entity_id is not null
on conflict (source_kind, source_id) do update
set entity_id = excluded.entity_id,
    resolution_status = 'resolved',
    resolution_method = 'existing_bridge',
    confidence = 1.0,
    updated_at = now();

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818133700','network_command_p0_identity_backfill','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818133700_network_command_p0_identity_backfill.sql

-- RECOVERY BEGIN 20260818140000_clinical_interactions_sku_depth.sql
-- SKU-level formulary fields + medication interaction reference + deeper content seeds.

alter table public.clinical_formulary_products
  add column if not exists brand_name text,
  add column if not exists registration_code text,
  add column if not exists strength_label text;

create table if not exists public.clinical_medication_interactions (
  id uuid primary key default gen_random_uuid(),
  medication_ingredient text not null,
  cannabinoid text not null,
  mechanism text,
  clinical_significance text not null
    check (clinical_significance in ('minor', 'moderate', 'major', 'unknown')),
  evidence_certainty text not null
    check (evidence_certainty in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  uncertainty text,
  monitoring_consideration text,
  primary_source_title text not null,
  primary_source_url text,
  verified_at timestamptz not null default now(),
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_interaction_source_https
    check (primary_source_url is null or primary_source_url ~ '^https://')
);

create index if not exists clinical_interactions_med_idx
  on public.clinical_medication_interactions (medication_ingredient);
create index if not exists clinical_interactions_review_idx
  on public.clinical_medication_interactions (review_status);

alter table public.clinical_medication_interactions enable row level security;

drop policy if exists clinical_interactions_public_read on public.clinical_medication_interactions;
create policy clinical_interactions_public_read
  on public.clinical_medication_interactions
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_medication_interactions to anon, authenticated;

-- SKU-level examples (illustrative class+label where public SKU lists change frequently)
insert into public.clinical_formulary_products (
  slug, name, country_iso2, product_class, authorization_status,
  cannabinoid_profile, routes, authority, notes, primary_source_url,
  last_reviewed, review_status, brand_name, registration_code, strength_label
) values
(
  'br-sku-cbd-oil-example-class',
  'Authorised CBD oral oil products (ANVISA class reference)',
  'BR', 'cbd-dominant', 'authorised',
  'CBD-dominant oils; THC within product registration',
  array['oral','oromucosal'],
  'ANVISA',
  'SKU lists change; treat as class reference. Confirm exact brand, registration and strength on the live ANVISA register before prescribing.',
  'https://www.gov.br/anvisa',
  '2026-08-01', 'published',
  null, null, 'Various registered strengths'
),
(
  'gb-sku-cbpm-oil-class',
  'UK CBPM oils (unlicensed specialist formulary class)',
  'GB', 'balanced', 'authorised',
  'Multiple CBD:THC ratios in oil format',
  array['oral','oromucosal'],
  'MHRA / specialist CBPM pathway',
  'Product availability is formulary- and clinic-specific. Confirm current product, batch quality and specialist pathway rules.',
  null,
  '2026-08-01', 'published',
  null, null, 'Clinic formulary dependent'
)
on conflict (slug) do update set
  notes = excluded.notes,
  brand_name = excluded.brand_name,
  registration_code = excluded.registration_code,
  strength_label = excluded.strength_label,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_medication_interactions (
  medication_ingredient, cannabinoid, mechanism, clinical_significance,
  evidence_certainty, uncertainty, monitoring_consideration,
  primary_source_title, primary_source_url, verified_at, review_status
) values
(
  'clobazam', 'CBD',
  'CBD inhibits CYP2C19; may increase N-desmethylclobazam exposure',
  'major', 'moderate',
  'Magnitude varies with CBD dose and product composition',
  'Monitor sedation and consider clobazam dose adjustment with specialist input',
  'Pharmacokinetic studies / product labels (class)',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'warfarin', 'CBD',
  'Possible CYP-mediated interaction affecting INR',
  'major', 'low',
  'Limited clinical series; product variability high',
  'Increase INR monitoring when starting, stopping or changing CBD dose',
  'Case series and interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'cns-depressants', 'THC',
  'Additive CNS depression (sedation, psychomotor impairment)',
  'moderate', 'moderate',
  'Depends on dose, route and patient tolerance',
  'Counsel on driving, falls risk and staggered titration',
  'Clinical pharmacology consensus',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-07-01T00:00:00Z', 'published'
),
(
  'tacrolimus', 'CBD',
  'Potential CYP3A4 interaction increasing tacrolimus levels',
  'major', 'low',
  'Evidence largely case-based',
  'Therapeutic drug monitoring if CBD is introduced or dose-changed',
  'Case reports / interaction references',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-06-15T00:00:00Z', 'published'
),
(
  'ssri', 'CBD',
  'Theoretical CYP2C19 interaction; clinical significance often uncertain',
  'minor', 'very-low',
  'Few controlled data',
  'Monitor for serotonergic adverse effects; do not assume safety from absence of data',
  'Interaction class summaries',
  'https://pubmed.ncbi.nlm.nih.gov/',
  '2026-06-15T00:00:00Z', 'published'
)
on conflict do nothing;

-- Additional evidence depth
do $$
begin
  if to_regclass('public.clinical_evidence_records') is null then return; end if;
  insert into public.clinical_evidence_records (
    slug, title, summary, condition_label, population, intervention, formulation,
    cannabinoids, intervention_class, outcome, evidence_type, evidence_strength,
    uncertainty, jurisdictions, profession_relevance,
    primary_source_title, primary_source_publisher, primary_source_url,
    publication_date, verified_at, review_status
  ) values
  (
    'ev-chronic-pain-non-cancer-overview',
    'Cannabinoids for non-cancer chronic pain — evidence snapshot',
    'Evidence supports small average pain reductions for some cannabinoid products in selected chronic pain populations, with frequent adverse events and uncertain long-term comparative effectiveness versus standard care.',
    'chronic non-cancer pain',
    'adult',
    'THC / CBD / balanced products',
    'oral / oromucosal / inhaled',
    array['THC','CBD'],
    'cannabis-derived-formulation',
    'pain intensity',
    'systematic-review',
    'low',
    'Heterogeneous trials; high placebo response; limited functional outcome data',
    array['global','CA','AU','GB','DE'],
    array['physician','pain-specialist'],
    'Chronic pain cannabinoid systematic reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-06-01',
    '2026-08-01T00:00:00Z',
    'published'
  ),
  (
    'ev-parkinson-symptoms-overview',
    'Cannabinoids in Parkinson disease symptoms — evidence snapshot',
    'Evidence for motor and non-motor symptom benefit is limited and mixed; safety (sedation, falls, psychiatric effects) requires careful individualisation.',
    'Parkinson disease symptoms',
    'adult / elderly',
    'THC / CBD products',
    'oral',
    array['THC','CBD'],
    'general-cannabis',
    'motor/non-motor symptoms',
    'observational-study',
    'very-low',
    'Small studies; high confounding',
    array['global','BR','DE'],
    array['physician','neurologist'],
    'Parkinson and cannabinoid reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-04-01',
    '2026-08-01T00:00:00Z',
    'published'
  ),
  (
    'ev-ptsd-symptoms-overview',
    'Cannabinoids for PTSD-related symptoms — evidence snapshot',
    'Evidence remains limited; potential benefits on sleep or hyperarousal are uncertain and must be weighed against psychiatric adverse-effect risk.',
    'PTSD-related symptoms',
    'adult',
    'THC / CBD products',
    'oral / inhaled',
    array['THC','CBD'],
    'general-cannabis',
    'PTSD symptom scores',
    'observational-study',
    'very-low',
    'Few rigorous RCTs; high risk of bias',
    array['global','US','CA','IL'],
    array['physician','psychiatrist'],
    'PTSD cannabinoid evidence reviews',
    'Peer-reviewed literature',
    'https://pubmed.ncbi.nlm.nih.gov/',
    '2025-02-01',
    '2026-08-01T00:00:00Z',
    'published'
  )
  on conflict (slug) do update set
    summary = excluded.summary,
    evidence_strength = excluded.evidence_strength,
    verified_at = excluded.verified_at,
    review_status = excluded.review_status,
    updated_at = now();
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818140000','clinical_interactions_sku_depth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818140000_clinical_interactions_sku_depth.sql

-- RECOVERY BEGIN 20260818150000_clinical_sku_feeds_jurisdiction_audit.sql
-- National formulary SKU feeds (ANVISA / TGA), clinical jurisdiction profiles, stricter audit.

-- ── Feed run ledger ─────────────────────────────────────────────────────────
create table if not exists public.clinical_sku_feed_runs (
  id uuid primary key default gen_random_uuid(),
  authority text not null check (authority in ('ANVISA', 'TGA', 'OTHER')),
  country_iso2 text not null,
  status text not null check (status in ('success', 'partial', 'degraded', 'failed')),
  source_url text,
  http_status integer,
  rows_upserted integer not null default 0,
  rows_retired integer not null default 0,
  error_message text,
  raw_fingerprint text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists clinical_sku_feed_runs_authority_idx
  on public.clinical_sku_feed_runs (authority, started_at desc);

alter table public.clinical_sku_feed_runs enable row level security;
-- service role only for writes; admins can read via service client

-- ── National SKU rows (product-level where available) ───────────────────────
create table if not exists public.clinical_formulary_skus (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  authority text not null,
  registration_code text,
  brand_name text,
  product_name text not null,
  strength_label text,
  dosage_form text,
  route text,
  cannabinoid_profile text,
  thc_limit text,
  cbd_content text,
  authorization_status text not null default 'authorised'
    check (authorization_status in (
      'authorised', 'import-authorised', 'compounding-permitted',
      'restricted', 'not-authorised', 'unknown', 'listed', 'suspended'
    )),
  source_url text,
  source_type text not null default 'authority_register_snapshot'
    check (source_type in (
      'authority_register_live',
      'authority_register_snapshot',
      'class_reference',
      'manual_curated'
    )),
  feed_run_id uuid references public.clinical_sku_feed_runs(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  review_status text not null default 'published'
    check (review_status in ('published', 'under-review', 'retired')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_iso2, authority, registration_code, product_name)
);

create index if not exists clinical_formulary_skus_country_idx
  on public.clinical_formulary_skus (country_iso2, review_status);
create index if not exists clinical_formulary_skus_reg_idx
  on public.clinical_formulary_skus (registration_code);

alter table public.clinical_formulary_skus enable row level security;

drop policy if exists clinical_skus_public_read on public.clinical_formulary_skus;
create policy clinical_skus_public_read
  on public.clinical_formulary_skus
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_formulary_skus to anon, authenticated;

-- ── Clinical jurisdiction profiles (Command Clinical, not weekly market briefings)
create table if not exists public.clinical_jurisdiction_profiles (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null unique,
  country_name text not null,
  flag text,
  status text not null default 'loaded'
    check (status in ('loaded', 'partial', 'unavailable')),
  legal_pathway text not null,
  adult_use boolean not null default false,
  summary text not null,
  primary_authority_name text not null,
  primary_authority_role text not null,
  primary_authority_url text,
  professional_regulator_name text,
  professional_regulator_role text,
  professional_regulator_url text,
  key_rules text[] not null default '{}',
  access_notes text not null default '',
  who_may_prescribe text,
  pathway_roles text,
  pathway_restrictions text[] not null default '{}',
  pathway_notes text,
  last_reviewed date not null,
  review_status text not null default 'under-review'
    check (review_status in ('published', 'under-review', 'retired')),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_jurisdiction_authority_https
    check (primary_authority_url is null or primary_authority_url ~ '^https://')
);

alter table public.clinical_jurisdiction_profiles enable row level security;

drop policy if exists clinical_jurisdiction_public_read on public.clinical_jurisdiction_profiles;
create policy clinical_jurisdiction_public_read
  on public.clinical_jurisdiction_profiles
  for select
  to anon, authenticated
  using (review_status = 'published');

grant select on public.clinical_jurisdiction_profiles to anon, authenticated;

-- Seed clinical jurisdiction profiles from curated Command briefings
insert into public.clinical_jurisdiction_profiles (
  country_iso2, country_name, flag, status, legal_pathway, adult_use, summary,
  primary_authority_name, primary_authority_role, primary_authority_url,
  professional_regulator_name, professional_regulator_role,
  key_rules, access_notes, who_may_prescribe, pathway_roles, pathway_restrictions, pathway_notes,
  last_reviewed, review_status
) values
(
  'BR', 'Brazil', '🇧🇷', 'loaded',
  'Medical Legal (CBD and THC Products); No Adult-Use', false,
  'Medical cannabis is regulated by ANVISA. Patients access authorised cannabis-derived products via physician prescription. Adult-use remains prohibited. Domestic cultivation frameworks have expanded under recent ANVISA resolutions; import authorisation pathways also exist.',
  'ANVISA (Agência Nacional de Vigilância Sanitária)', 'Product authorisation, quality, import rules',
  'https://www.gov.br/anvisa',
  'Conselho Federal de Medicina (CFM)', 'Professional standards for physicians',
  array['Only authorised cannabis products may be prescribed and dispensed','Prescriptions must specify approved products','Import authorisation remains an important access route for some patients'],
  'Confirm product registration and import rules on the live ANVISA register before relying on any SKU.',
  'Licensed physicians under CFM standards may prescribe authorised products.',
  'Physicians',
  array['Must use authorised products','Patient documentation required'],
  'Verify current CFM guidance and ANVISA product status.',
  '2026-07-20', 'published'
),
(
  'AU', 'Australia', '🇦🇺', 'loaded',
  'Medical cannabis via SAS-B / Authorised Prescriber; Adult-use limited by state', false,
  'Medicinal cannabis is accessed primarily through TGA Special Access Scheme Category B and Authorised Prescriber pathways. Many products are unregistered; ARTG-listed products are a minority. State controlled-drug rules still apply.',
  'Therapeutic Goods Administration (TGA)', 'Access schemes, product quality, advertising controls',
  'https://www.tga.gov.au',
  'AHPRA / state medical boards', 'Professional registration and prescribing standards',
  array['SAS-B and AP are the dominant pathways','Scheduling and state rules still apply','Product availability changes frequently'],
  'Confirm current TGA pathway requirements and state controlled-substance rules.',
  'Appropriately registered medical practitioners under SAS-B or Authorised Prescriber arrangements.',
  'Medical practitioners',
  array['Pathway-specific documentation','State controlled-drug compliance'],
  'Always verify the live TGA medicinal cannabis hub and state rules.',
  '2026-07-05', 'published'
),
(
  'GB', 'United Kingdom', '🇬🇧', 'loaded',
  'Medical cannabis (unlicensed CBPMs) via specialist pathway', false,
  'Since 2018 specialists may prescribe unlicensed cannabis-based products for medicinal use (CBPMs). Unlicensed products dominate. Adult-use remains prohibited.',
  'MHRA / Home Office controlled drugs framework', 'Product and controlled-drug regulation',
  'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
  'GMC', 'Professional standards',
  array['Specialist initiation is the default','Unlicensed CBPMs dominate medical use','Shared care arrangements vary'],
  'Confirm specialist pathway and product quality documentation.',
  'Specialist physicians; follow current GMC and controlled-drug guidance.',
  'Specialists',
  array['Unlicensed product responsibilities','Controlled drug record-keeping'],
  'Verify current NHS/specialist formulary practice locally.',
  '2026-06-30', 'published'
),
(
  'DE', 'Germany', '🇩🇪', 'loaded',
  'Medical cannabis under narcotics-medicines framework; adult-use regulated separately', true,
  'Medical cannabis is established under the medical framework with pharmacy dispensing. Adult-use rules are separate and must not be conflated with clinical practice.',
  'BfArM / narcotics-medicines framework', 'Medical cannabis oversight',
  'https://www.bfarm.de',
  'State medical chambers', 'Professional standards',
  array['Medical pathway distinct from adult-use','Reimbursement often requires documentation','Pharmacy dispensing'],
  'Confirm current BfArM guidance and insurer documentation expectations.',
  'Physicians under applicable professional and narcotics rules.',
  'Physicians',
  array['Documentation for reimbursement','Narcotics handling rules'],
  'Keep medical and adult-use channels distinct in clinical documentation.',
  '2026-07-10', 'published'
),
(
  'CA', 'Canada', '🇨🇦', 'loaded',
  'Medical authorisation under Cannabis Act; adult-use parallel', true,
  'Medical cannabis operates under the federal Cannabis Act with provincial/territorial overlays. Patients may obtain medical authorisations from healthcare practitioners. Adult-use is legal and regulated separately.',
  'Health Canada', 'Federal cannabis framework',
  'https://www.canada.ca/en/health-canada.html',
  'Provincial/territorial professional colleges', 'Professional standards',
  array['Medical authorisation documentation distinct from adult-use','Provincial rules vary','Licensed producers supply medical channel'],
  'Confirm provincial college guidance and Health Canada medical access rules.',
  'Healthcare practitioners authorised under applicable provincial rules.',
  'Healthcare practitioners',
  array['Provincial variation','Documentation requirements'],
  'Do not treat adult-use retail products as automatic medical equivalents.',
  '2026-06-25', 'published'
),
(
  'CO', 'Colombia', '🇨🇴', 'loaded',
  'Medical cannabis under national health regulation', false,
  'Medical cannabis operates under national regulatory frameworks with licensed manufacturing and distribution channels. Clinical use must remain within authorised product pathways.',
  'INVIMA / Ministry of Health', 'Product and health regulation',
  null,
  'Professional medical authorities', 'Professional standards',
  array['Authorised product channels only','Prescribing within licensed frameworks'],
  'Confirm current INVIMA and Ministry guidance before relying on product availability.',
  'Licensed physicians under applicable national rules.',
  'Physicians',
  array['Licensed channel requirements'],
  'Verify primary authority before material clinical decisions.',
  '2026-07-01', 'published'
)
on conflict (country_iso2) do update set
  summary = excluded.summary,
  legal_pathway = excluded.legal_pathway,
  primary_authority_url = excluded.primary_authority_url,
  key_rules = excluded.key_rules,
  access_notes = excluded.access_notes,
  last_reviewed = excluded.last_reviewed,
  review_status = excluded.review_status,
  updated_at = now();

-- ── Clinical admin audit (stricter, append-only) ────────────────────────────
create table if not exists public.clinical_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  actor_roles text[] not null default '{}',
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  notes text,
  ip_address text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists clinical_admin_audit_actor_idx
  on public.clinical_admin_audit_log (actor_user_id, created_at desc);
create index if not exists clinical_admin_audit_entity_idx
  on public.clinical_admin_audit_log (entity_type, entity_id, created_at desc);

alter table public.clinical_admin_audit_log enable row level security;

-- No update/delete policies — append-only via service role
revoke update, delete on public.clinical_admin_audit_log from public, anon, authenticated;
grant select on public.clinical_admin_audit_log to authenticated;

drop policy if exists clinical_admin_audit_admin_read on public.clinical_admin_audit_log;
create policy clinical_admin_audit_admin_read
  on public.clinical_admin_audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = any (array['admin'::text, 'operator'::text])
    )
  );

comment on table public.clinical_admin_audit_log is
  'Append-only clinical admin actions (publish/retire/feed). Service role INSERT only.';

comment on table public.clinical_formulary_skus is
  'National product-level formulary SKUs from authority feeds or curated snapshots. Published rows only are public.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818150000','clinical_sku_feeds_jurisdiction_audit','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818150000_clinical_sku_feeds_jurisdiction_audit.sql

-- RECOVERY BEGIN 20260818160000_clinical_sku_product_level_bootstrap.sql
-- Product-level ANVISA catalogue bootstrap (verify live on consultas.anvisa.gov.br)
insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('BR','ANVISA','159910001','Canabidiol Nunature','Canabidiol Nunature 17,18 mg/mL','17,18 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Nunature', now()),
  ('BR','ANVISA','159910002','Canabidiol Nunature','Canabidiol Nunature 34,36 mg/mL','34,36 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Nunature', now()),
  ('BR','ANVISA','110630158','Canabidiol Farmanguinhos','Canabidiol Farmanguinhos',null,'solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Fiocruz', now()),
  ('BR','ANVISA','143130001','Promediol','Extrato de Cannabis Sativa Promediol',null,'solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Promediol', now()),
  ('BR','ANVISA','142730001','Zion Medpharma','Extrato de Cannabis Sativa Zion Medpharma 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Endogen', now()),
  ('BR','ANVISA','145000001','Greencare','Extrato de Cannabis Sativa Greencare 79,14 mg/mL','79,14 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','AS pública. Verificar em consultas.anvisa.gov.br. Detentor: Greencare', now()),
  ('BR','ANVISA',null,'Active Pharmaceutica','Canabidiol Active Pharmaceutica 20 mg/mL','20 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Aura Pharma','Canabidiol Aura Pharma 50 mg/mL','50 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Belcher','Canabidiol Belcher 150 mg/mL','150 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Ease Labs','Canabidiol Ease Labs 100 mg/mL','100 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Herbarium','Canabidiol Herbarium 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Mantecorp Farmasa','Canabidiol Mantecorp Farmasa 23,75 mg/mL','23,75 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Greencare','Canabidiol Greencare 23,75 mg/mL','23,75 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Aura Pharma','Extrato de Cannabis Sativa Aura Pharma 200 mg/mL','200 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now()),
  ('BR','ANVISA',null,'Mantecorp Farmasa','Extrato de Cannabis Sativa Mantecorp Farmasa 79,14 mg/mL','79,14 mg/mL','solução oral','oral','CBD/extrato','authorised','https://consultas.anvisa.gov.br/#/cannabis/','manual_curated','published','Listado em levantamentos públicos de AS. Confirmar código e situação em consultas.anvisa.gov.br.', now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2
    and s.authority = v.authority
    and s.product_name = v.product_name
);

-- Sample TGA sponsor products (Category 1 subset) until live cron populates full list
insert into public.clinical_formulary_skus (
  country_iso2, authority, registration_code, brand_name, product_name,
  strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
  source_url, source_type, review_status, notes, last_seen_at
)
select * from (values
  ('AU','TGA',null,null,'Oral Liquid · CBD 100mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 100mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Little Green Pharma Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Oral Liquid · CBD 200mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 200mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Cannatrek Medical Pty Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Herb, Dried · CBD 120mg/g · 10g','10g','Herb, Dried','inhaled','CBD 120mg/g','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 1. Sponsor: Little Green Pharma Ltd. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Capsule · CBD 20mg, THC 1mg · 30','30','Capsule','oral','CBD 20mg, THC 1mg','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 2. Sponsor: Canopy Growth Australia. Verify live TGA list.', now()),
  ('AU','TGA',null,null,'Oral Liquid · CBD 100mg/mL, THC 10mg/mL · 30mL','30mL','Oral Liquid','oral','CBD 100mg/mL, THC 10mg/mL','authorised','https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list','authority_register_snapshot','published','SAS/AP Category 2. Sponsor: Indica Industries Pty Ltd. Verify live TGA list.', now())
) as v(country_iso2, authority, registration_code, brand_name, product_name,
       strength_label, dosage_form, route, cannabinoid_profile, authorization_status,
       source_url, source_type, review_status, notes, last_seen_at)
where not exists (
  select 1 from public.clinical_formulary_skus s
  where s.country_iso2 = v.country_iso2 and s.authority = v.authority and s.product_name = v.product_name
);

SELECT count(*) FILTER (WHERE authority='ANVISA') AS anvisa_skus,
       count(*) FILTER (WHERE authority='TGA') AS tga_skus
FROM public.clinical_formulary_skus WHERE review_status='published';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260818160000','clinical_sku_product_level_bootstrap','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260818160000_clinical_sku_product_level_bootstrap.sql
