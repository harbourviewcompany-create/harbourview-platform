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
