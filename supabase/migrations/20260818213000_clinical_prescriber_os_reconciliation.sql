-- Clinical Prescriber OS reconciliation against current main after 20260818200000.
--
-- Purpose:
--   * preserve the existing patient / consent / authority / RLS contracts;
--   * add the missing Prescriber OS domain objects without replacing current tables;
--   * reconcile the pre-existing clinical_monitoring_protocols table rather than
--     creating PR #1514's stale alternate shape;
--   * fail closed on generic homepages/search portals as prescriber provenance;
--   * stage unsafe published evidence/interactions for review without deleting them.
--
-- This migration is additive/reconciling and is NOT self-applying.

-- ---------------------------------------------------------------------------
-- 1. Shared prescriber-inspectable provenance predicate
-- ---------------------------------------------------------------------------
create or replace function public.clinical_source_is_prescriber_inspectable(p_url text)
returns boolean
language sql
immutable
set search_path = public
as $function$
  select
    p_url is not null
    and btrim(p_url) ~ '^https://'
    and btrim(p_url) !~* '^https://[^/]+/?$'
    and btrim(p_url) !~* '^https://pubmed\.ncbi\.nlm\.nih\.gov/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.gov\.br/anvisa/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.accessdata\.fda\.gov/scripts/cder/daf/?(\?.*)?$'
    and btrim(p_url) !~* '^https://www\.tga\.gov\.au/?(\?.*)?$'
    and btrim(p_url) !~* '/search/?(\?.*)?$'
    and btrim(p_url) !~* '/search-results/?(\?.*)?$';
$function$;

revoke all on function public.clinical_source_is_prescriber_inspectable(text) from public;
grant execute on function public.clinical_source_is_prescriber_inspectable(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Canonical concepts and claim-level evidence provenance
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_concepts (
  id uuid primary key default gen_random_uuid(),
  canonical_label text not null,
  concept_kind text not null check (concept_kind in (
    'condition','symptom','population','intervention','product','medicine','outcome'
  )),
  coding_system text,
  code text,
  status text not null default 'active' check (status in ('active','superseded','retired')),
  superseded_by_id uuid references public.clinical_concepts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_kind, canonical_label)
);

create table if not exists public.clinical_concept_aliases (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.clinical_concepts(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_url text,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  unique (concept_id, normalized_alias),
  constraint clinical_concept_alias_source_https check (source_url is null or source_url ~ '^https://')
);

create index if not exists clinical_concept_alias_lookup_idx
  on public.clinical_concept_aliases (normalized_alias);

create table if not exists public.clinical_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  claim_text text not null,
  population text,
  intervention text,
  comparator text,
  outcome text,
  timeframe text,
  direction text not null default 'uncertain' check (direction in ('benefit','harm','neutral','uncertain')),
  effect_measure text,
  effect_value numeric,
  effect_unit text,
  ci_lower numeric,
  ci_upper numeric,
  absolute_effect text,
  relative_effect text,
  clinically_important_difference text,
  certainty text not null default 'ungraded' check (certainty in (
    'high','moderate','low','very-low','ungraded','conflicted'
  )),
  applicability text,
  publication_family_id text,
  independence_group_id text,
  status text not null default 'review-required' check (status in (
    'current','superseded','retracted','review-required'
  )),
  superseded_by_id uuid references public.clinical_evidence_claims(id) on delete set null,
  primary_source_url text not null,
  source_locator text not null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_claim_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_evidence_claim_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_evidence_claim_record_idx
  on public.clinical_evidence_claims (evidence_record_id, status);
create index if not exists clinical_evidence_claim_concept_idx
  on public.clinical_evidence_claims (concept_id, status);
create index if not exists clinical_evidence_claim_family_idx
  on public.clinical_evidence_claims (publication_family_id, independence_group_id);

create or replace function public.clinical_require_inspectable_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'current' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'current Clinical claim requires a prescriber-inspectable source';
    end if;
    if btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'current Clinical claim requires an exact source locator';
    end if;
    if new.reviewed_at is null then
      raise exception 'current Clinical claim requires review metadata';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_inspectable_claim() from public;
drop trigger if exists trg_clinical_require_inspectable_claim on public.clinical_evidence_claims;
create trigger trg_clinical_require_inspectable_claim
before insert or update of status, primary_source_url, source_locator, reviewed_at
on public.clinical_evidence_claims
for each row execute function public.clinical_require_inspectable_claim();

-- ---------------------------------------------------------------------------
-- 3. Structured safety, regimen and guidelines
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_safety_rules (
  id uuid primary key default gen_random_uuid(),
  rule_kind text not null check (rule_kind in (
    'contraindication','precaution','special-population','interaction'
  )),
  subject text not null,
  applies_when jsonb not null default '{}'::jsonb,
  severity text not null check (severity in ('info','caution','major','contraindicated','unknown')),
  rationale text not null,
  action_text text,
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete set null,
  interaction_id uuid references public.clinical_medication_interactions(id) on delete set null,
  jurisdictions text[] not null default array['global']::text[],
  primary_source_url text not null,
  source_locator text not null,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_safety_rule_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_safety_rule_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_safety_rule_subject_idx
  on public.clinical_safety_rules (subject, review_status);
create index if not exists clinical_safety_rule_jurisdiction_idx
  on public.clinical_safety_rules using gin (jurisdictions);

create table if not exists public.clinical_regimen_protocols (
  id uuid primary key default gen_random_uuid(),
  formulary_product_id uuid not null references public.clinical_formulary_products(id) on delete cascade,
  formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  jurisdiction text not null,
  population text,
  indication text not null,
  regimen_structured jsonb not null default '{}'::jsonb,
  titration_structured jsonb not null default '{}'::jsonb,
  administration_instructions text[] not null default '{}'::text[],
  monitoring_requirements text[] not null default '{}'::text[],
  stopping_rules text[] not null default '{}'::text[],
  primary_source_url text not null,
  source_locator text not null,
  source_version text,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_regimen_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_regimen_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_regimen_product_idx
  on public.clinical_regimen_protocols (formulary_product_id, jurisdiction, review_status);
create index if not exists clinical_regimen_concept_idx
  on public.clinical_regimen_protocols (concept_id, review_status);

create table if not exists public.clinical_guideline_recommendations (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  jurisdiction text not null,
  authority text not null,
  title text not null,
  recommendation_text text not null,
  recommendation_strength text,
  population text,
  intervention text,
  outcome text,
  effective_date date,
  primary_source_url text not null,
  source_locator text not null,
  status text not null default 'review-required' check (status in (
    'current','superseded','review-required'
  )),
  superseded_by_id uuid references public.clinical_guideline_recommendations(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_guideline_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_guideline_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create index if not exists clinical_guideline_context_idx
  on public.clinical_guideline_recommendations (jurisdiction, concept_id, status);

-- Reconcile the governed monitoring table created on current main. Do not create
-- PR #1514's incompatible alternate table shape.
alter table public.clinical_monitoring_protocols
  add column if not exists concept_id uuid references public.clinical_concepts(id) on delete set null,
  add column if not exists formulary_product_id uuid references public.clinical_formulary_products(id) on delete set null,
  add column if not exists formulary_sku_id uuid references public.clinical_formulary_skus(id) on delete set null,
  add column if not exists jurisdiction text,
  add column if not exists baseline_requirements text[] not null default '{}'::text[],
  add column if not exists therapeutic_objectives text[] not null default '{}'::text[],
  add column if not exists efficacy_measures text[] not null default '{}'::text[],
  add column if not exists safety_measures text[] not null default '{}'::text[],
  add column if not exists laboratory_monitoring text[] not null default '{}'::text[],
  add column if not exists reassessment_schedule text[] not null default '{}'::text[],
  add column if not exists stopping_rules text[] not null default '{}'::text[],
  add column if not exists source_locator text,
  add column if not exists provenance_status text not null default 'review-required'
    check (provenance_status in ('inspectable','review-required'));

-- ---------------------------------------------------------------------------
-- 4. Patient context, objectives and longitudinal decision record
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_patient_contexts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  recorded_by uuid not null,
  jurisdiction text not null,
  condition_concept_ids uuid[] not null default '{}'::uuid[],
  current_medicines text[] not null default '{}'::text[],
  prior_therapies text[] not null default '{}'::text[],
  allergies text[] not null default '{}'::text[],
  pregnancy_status text not null default 'unknown' check (pregnancy_status in ('yes','no','unknown','not-applicable')),
  hepatic_status text not null default 'unknown' check (hepatic_status in ('none-known','present','unknown')),
  renal_status text not null default 'unknown' check (renal_status in ('none-known','present','unknown')),
  cardiovascular_status text not null default 'unknown' check (cardiovascular_status in ('none-known','present','unknown')),
  psychiatric_risk_status text not null default 'unknown' check (psychiatric_risk_status in ('none-known','present','unknown')),
  substance_use_risk_status text not null default 'unknown' check (substance_use_risk_status in ('none-known','present','unknown')),
  driving_or_safety_sensitive_activity text not null default 'unknown' check (driving_or_safety_sensitive_activity in ('yes','no','unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinical_patient_context_patient_idx
  on public.clinical_patient_contexts (patient_id, created_at desc);

create table if not exists public.clinical_therapeutic_objectives (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  recorded_by uuid not null,
  description text not null,
  outcome_measure text,
  baseline_value text,
  target_value text,
  target_date date,
  status text not null default 'active' check (status in ('active','met','not-met','stopped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_decision_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  clinician_user_id uuid not null,
  jurisdiction text not null,
  decision_type text not null check (decision_type in ('consider','initiate','continue','adjust','stop','defer')),
  rationale text not null,
  evidence_claim_ids uuid[] not null default '{}'::uuid[],
  formulary_product_ids uuid[] not null default '{}'::uuid[],
  guideline_recommendation_ids uuid[] not null default '{}'::uuid[],
  unresolved_safety_items text[] not null default '{}'::text[],
  shared_decision_summary text,
  created_at timestamptz not null default now()
);

create index if not exists clinical_decision_patient_idx
  on public.clinical_decision_records (patient_id, created_at desc);

create table if not exists public.clinical_change_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'evidence','guideline','safety','product','regulatory','professional-rule'
  )),
  title text not null,
  summary text not null,
  jurisdictions text[] not null default array['global']::text[],
  affected_concept_ids uuid[] not null default '{}'::uuid[],
  affected_formulary_product_ids uuid[] not null default '{}'::uuid[],
  materiality text not null default 'review' check (materiality in ('informational','review','urgent')),
  primary_source_url text not null,
  source_locator text not null,
  effective_at timestamptz,
  verified_at timestamptz not null,
  review_status text not null default 'review-required' check (review_status in ('published','review-required','retired')),
  created_at timestamptz not null default now(),
  constraint clinical_change_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_change_locator_nonempty check (length(btrim(source_locator)) > 0)
);

create table if not exists public.clinical_patient_impact_reviews (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  change_event_id uuid not null references public.clinical_change_events(id) on delete cascade,
  match_reasons text[] not null default '{}'::text[],
  status text not null default 'unreviewed' check (status in (
    'unreviewed','reviewed-no-action','reviewed-action-needed','dismissed'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  unique (patient_id, change_event_id)
);

-- ---------------------------------------------------------------------------
-- 5. Interaction provenance and normalized pair idempotency
-- ---------------------------------------------------------------------------
alter table public.clinical_medication_interactions
  add column if not exists source_locator text,
  add column if not exists provenance_status text not null default 'review-required'
    check (provenance_status in ('inspectable','review-required'));

update public.clinical_medication_interactions
set provenance_status = case
  when public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and btrim(coalesce(source_locator, '')) <> '' then 'inspectable'
  else 'review-required'
end;

update public.clinical_medication_interactions
set review_status = 'under-review',
    provenance_status = 'review-required',
    updated_at = now()
where review_status = 'published'
  and (
    not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    or btrim(coalesce(source_locator, '')) = ''
  );

create unique index if not exists uq_clinical_interaction_normalized_pair
  on public.clinical_medication_interactions (
    lower(btrim(medication_ingredient)),
    lower(btrim(cannabinoid))
  );

create or replace function public.clinical_require_interaction_provenance()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'published Clinical interaction requires a prescriber-inspectable source';
    end if;
    if btrim(coalesce(new.source_locator, '')) = '' then
      raise exception 'published Clinical interaction requires an exact source locator';
    end if;
    new.provenance_status := 'inspectable';
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_interaction_provenance() from public;
drop trigger if exists trg_clinical_require_interaction_provenance on public.clinical_medication_interactions;
create trigger trg_clinical_require_interaction_provenance
before insert or update of review_status, primary_source_url, source_locator
on public.clinical_medication_interactions
for each row execute function public.clinical_require_interaction_provenance();

-- Monitoring rows are also prescriber-facing. Existing generic-source seeds are
-- retained but removed from the published set until exact sources/locators exist.
update public.clinical_monitoring_protocols
set provenance_status = case
  when public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and btrim(coalesce(source_locator, '')) <> '' then 'inspectable'
  else 'review-required'
end;

update public.clinical_monitoring_protocols
set review_status = 'under-review',
    provenance_status = 'review-required',
    updated_at = now()
where review_status = 'published'
  and (
    not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    or btrim(coalesce(source_locator, '')) = ''
  );

-- ---------------------------------------------------------------------------
-- 6. Evidence publication fail-closed repair
-- ---------------------------------------------------------------------------
-- First preserve every record but remove generic/search-portal rows from the
-- published surface. No replacement URL or claim is invented here.
update public.clinical_evidence_records
set review_status = 'under-review',
    freshness_status = 'review-required',
    freshness_reason = case
      when coalesce(freshness_reason, '') = '' then
        'Prescriber provenance remediation: primary source is generic, a search portal, or otherwise not directly inspectable.'
      else freshness_reason || ' Prescriber provenance remediation: primary source is not directly inspectable.'
    end,
    updated_at = now()
where review_status = 'published'
  and not public.clinical_source_is_prescriber_inspectable(primary_source_url);

-- A clinical-synthesis row additionally requires at least one current,
-- source-located claim. Existing rows without that claim-level provenance are
-- retained privately and staged for review.
update public.clinical_evidence_records e
set review_status = 'under-review',
    freshness_status = 'review-required',
    freshness_reason = case
      when coalesce(e.freshness_reason, '') = '' then
        'Prescriber provenance remediation: clinical synthesis lacks a current claim-level source locator.'
      else e.freshness_reason || ' Prescriber provenance remediation: clinical synthesis lacks a current claim-level source locator.'
    end,
    updated_at = now()
where e.review_status = 'published'
  and e.publication_scope = 'clinical-synthesis'
  and not exists (
    select 1
    from public.clinical_evidence_claims c
    where c.evidence_record_id = e.id
      and c.status = 'current'
      and public.clinical_source_is_prescriber_inspectable(c.primary_source_url)
      and btrim(c.source_locator) <> ''
  );

-- Preserve the credential-bound publication gate from current main and add the
-- direct-source + claim-level constraints.
create or replace function public.clinical_require_publication_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.review_status = 'published' then
    if not public.clinical_source_is_prescriber_inspectable(new.primary_source_url) then
      raise exception 'published Clinical evidence requires a prescriber-inspectable primary source';
    end if;

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

      if not exists (
        select 1
        from public.clinical_evidence_claims c
        where c.evidence_record_id = new.id
          and c.status = 'current'
          and public.clinical_source_is_prescriber_inspectable(c.primary_source_url)
          and btrim(c.source_locator) <> ''
      ) then
        raise exception 'clinical synthesis or graded certainty requires current claim-level inspectable provenance';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. RLS: reference material requires verified clinician access; patient data
--    remains care-team scoped and consent-gated.
-- ---------------------------------------------------------------------------
alter table public.clinical_concepts enable row level security;
alter table public.clinical_concept_aliases enable row level security;
alter table public.clinical_evidence_claims enable row level security;
alter table public.clinical_safety_rules enable row level security;
alter table public.clinical_regimen_protocols enable row level security;
alter table public.clinical_guideline_recommendations enable row level security;
alter table public.clinical_patient_contexts enable row level security;
alter table public.clinical_therapeutic_objectives enable row level security;
alter table public.clinical_decision_records enable row level security;
alter table public.clinical_change_events enable row level security;
alter table public.clinical_patient_impact_reviews enable row level security;

-- Reference reads: verified clinicians see only reviewed/current material.
drop policy if exists clinical_concepts_verified_read on public.clinical_concepts;
create policy clinical_concepts_verified_read on public.clinical_concepts
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_concept_aliases_verified_read on public.clinical_concept_aliases;
create policy clinical_concept_aliases_verified_read on public.clinical_concept_aliases
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_evidence_claims_verified_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_verified_read on public.clinical_evidence_claims
  for select to authenticated using (
    public.is_verified_clinician()
    and status = 'current'
    and public.clinical_source_is_prescriber_inspectable(primary_source_url)
    and exists (
      select 1 from public.clinical_evidence_records e
      where e.id = clinical_evidence_claims.evidence_record_id
        and e.review_status = 'published'
    )
  );

drop policy if exists clinical_safety_rules_verified_read on public.clinical_safety_rules;
create policy clinical_safety_rules_verified_read on public.clinical_safety_rules
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations
  for select to authenticated using (public.is_verified_clinician() and status = 'current');

drop policy if exists clinical_change_events_verified_read on public.clinical_change_events;
create policy clinical_change_events_verified_read on public.clinical_change_events
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

-- Review staff can inspect non-public reference rows without weakening the
-- verified-clinician customer surface.
drop policy if exists clinical_evidence_claims_review_access on public.clinical_evidence_claims;
create policy clinical_evidence_claims_review_access on public.clinical_evidence_claims
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_safety_rules_review_access on public.clinical_safety_rules;
create policy clinical_safety_rules_review_access on public.clinical_safety_rules
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_regimen_protocols_review_access on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_review_access on public.clinical_regimen_protocols
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

drop policy if exists clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

-- Patient-scoped tables: verified clinician + active care team + core consent.
drop policy if exists clinical_patient_contexts_member_access on public.clinical_patient_contexts;
create policy clinical_patient_contexts_member_access on public.clinical_patient_contexts
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_contexts.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_contexts.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  );

drop policy if exists clinical_therapeutic_objectives_member_access on public.clinical_therapeutic_objectives;
create policy clinical_therapeutic_objectives_member_access on public.clinical_therapeutic_objectives
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_therapeutic_objectives.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_decision_records_member_access on public.clinical_decision_records;
create policy clinical_decision_records_member_access on public.clinical_decision_records
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_decision_records.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and clinician_user_id = auth.uid()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_patient_impact_reviews_member_access on public.clinical_patient_impact_reviews;
create policy clinical_patient_impact_reviews_member_access on public.clinical_patient_impact_reviews
  for all to authenticated
  using (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
    and exists (
      select 1 from public.clinical_care_team ct
      where ct.patient_id = clinical_patient_impact_reviews.patient_id
        and ct.user_id = auth.uid()
        and ct.membership_status = 'active'
    )
  )
  with check (
    public.is_verified_clinician()
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

revoke all on public.clinical_concepts from anon;
revoke all on public.clinical_concept_aliases from anon;
revoke all on public.clinical_evidence_claims from anon;
revoke all on public.clinical_safety_rules from anon;
revoke all on public.clinical_regimen_protocols from anon;
revoke all on public.clinical_guideline_recommendations from anon;
revoke all on public.clinical_patient_contexts from anon;
revoke all on public.clinical_therapeutic_objectives from anon;
revoke all on public.clinical_decision_records from anon;
revoke all on public.clinical_change_events from anon;
revoke all on public.clinical_patient_impact_reviews from anon;

grant select on public.clinical_concepts, public.clinical_concept_aliases,
  public.clinical_evidence_claims, public.clinical_safety_rules,
  public.clinical_regimen_protocols, public.clinical_guideline_recommendations,
  public.clinical_change_events to authenticated;
grant select, insert, update on public.clinical_patient_contexts,
  public.clinical_therapeutic_objectives, public.clinical_patient_impact_reviews to authenticated;
grant select, insert on public.clinical_decision_records to authenticated;

grant all on public.clinical_concepts, public.clinical_concept_aliases,
  public.clinical_evidence_claims, public.clinical_safety_rules,
  public.clinical_regimen_protocols, public.clinical_guideline_recommendations,
  public.clinical_patient_contexts, public.clinical_therapeutic_objectives,
  public.clinical_decision_records, public.clinical_change_events,
  public.clinical_patient_impact_reviews to service_role;

comment on function public.clinical_source_is_prescriber_inspectable(text) is
  'Fail-closed URL predicate for prescriber-facing Clinical provenance. Generic homepages and search portals do not qualify.';
comment on table public.clinical_evidence_claims is
  'Claim-level Prescriber OS evidence with exact inspectable source URL and source locator; no claim is inferred from record-level metadata.';
comment on table public.clinical_patient_contexts is
  'Consent- and care-team-scoped patient clinical context for Prescriber OS decision support.';
