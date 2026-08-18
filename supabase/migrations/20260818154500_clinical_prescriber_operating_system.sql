-- Harbourview Clinical Prescriber Operating System
-- Additive only. Preserves clinical_patients, consent, care-team, encounters,
-- calculations, recommendations, prescriptions, governed evidence/formulary,
-- medication interactions and the existing clinical audit contract.
--
-- This migration is intentionally NOT self-applying. Production application
-- requires the existing migration/release process and clinical review gates.

-- ---------------------------------------------------------------------------
-- 1. Canonical concepts and aliases
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

-- ---------------------------------------------------------------------------
-- 2. Claim-level evidence: PICO, effects, lineage, applicability
-- ---------------------------------------------------------------------------
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
  source_locator text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_claim_source_https check (primary_source_url ~ '^https://')
);

create index if not exists clinical_evidence_claim_record_idx
  on public.clinical_evidence_claims (evidence_record_id, status);
create index if not exists clinical_evidence_claim_concept_idx
  on public.clinical_evidence_claims (concept_id, status);
create index if not exists clinical_evidence_claim_family_idx
  on public.clinical_evidence_claims (publication_family_id, independence_group_id);

-- ---------------------------------------------------------------------------
-- 3. Structured safety and special-population rules
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
  source_locator text,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_safety_rule_source_https check (primary_source_url ~ '^https://')
);

create index if not exists clinical_safety_rule_subject_idx
  on public.clinical_safety_rules (subject, review_status);
create index if not exists clinical_safety_rule_jurisdiction_idx
  on public.clinical_safety_rules using gin (jurisdictions);

-- ---------------------------------------------------------------------------
-- 4. Product/indication-specific regimen protocols
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_regimen_protocols (
  id uuid primary key default gen_random_uuid(),
  formulary_product_id uuid not null references public.clinical_formulary_products(id) on delete cascade,
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
  source_locator text,
  source_version text,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_regimen_source_https check (primary_source_url ~ '^https://')
);

create index if not exists clinical_regimen_product_idx
  on public.clinical_regimen_protocols (formulary_product_id, jurisdiction, review_status);
create index if not exists clinical_regimen_concept_idx
  on public.clinical_regimen_protocols (concept_id, review_status);

-- ---------------------------------------------------------------------------
-- 5. Monitoring and guideline recommendations
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_monitoring_protocols (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid references public.clinical_concepts(id) on delete set null,
  formulary_product_id uuid references public.clinical_formulary_products(id) on delete set null,
  jurisdiction text,
  baseline_requirements text[] not null default '{}'::text[],
  therapeutic_objectives text[] not null default '{}'::text[],
  efficacy_measures text[] not null default '{}'::text[],
  safety_measures text[] not null default '{}'::text[],
  laboratory_monitoring text[] not null default '{}'::text[],
  reassessment_schedule text[] not null default '{}'::text[],
  stopping_rules text[] not null default '{}'::text[],
  primary_source_url text not null,
  source_locator text,
  review_status text not null default 'review-required' check (review_status in (
    'published','review-required','retired'
  )),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_monitoring_source_https check (primary_source_url ~ '^https://')
);

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
  source_locator text,
  status text not null default 'review-required' check (status in (
    'current','superseded','review-required'
  )),
  superseded_by_id uuid references public.clinical_guideline_recommendations(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_guideline_source_https check (primary_source_url ~ '^https://')
);

create index if not exists clinical_guideline_context_idx
  on public.clinical_guideline_recommendations (jurisdiction, concept_id, status);

-- ---------------------------------------------------------------------------
-- 6. Patient context, objectives and longitudinal decision record
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
  metadata jsonb not null default '{}'::jsonb,
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
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists clinical_decision_patient_idx
  on public.clinical_decision_records (patient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7. Clinical change events and patient-impact review
-- ---------------------------------------------------------------------------
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
  effective_at timestamptz,
  verified_at timestamptz not null,
  review_status text not null default 'review-required' check (review_status in ('published','review-required','retired')),
  created_at timestamptz not null default now(),
  constraint clinical_change_source_https check (primary_source_url ~ '^https://')
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
-- 8. RLS: governed reference data requires verified clinician access; patient
--    data additionally requires existing care-team/creator scope + core consent.
-- ---------------------------------------------------------------------------

alter table public.clinical_concepts enable row level security;
alter table public.clinical_concept_aliases enable row level security;
alter table public.clinical_evidence_claims enable row level security;
alter table public.clinical_safety_rules enable row level security;
alter table public.clinical_regimen_protocols enable row level security;
alter table public.clinical_monitoring_protocols enable row level security;
alter table public.clinical_guideline_recommendations enable row level security;
alter table public.clinical_patient_contexts enable row level security;
alter table public.clinical_therapeutic_objectives enable row level security;
alter table public.clinical_decision_records enable row level security;
alter table public.clinical_change_events enable row level security;
alter table public.clinical_patient_impact_reviews enable row level security;

-- Reference read policies. Only reviewed/current material is available to
-- ordinary verified clinicians; service_role handles governed editorial writes.
do $$
declare
  t text;
begin
  foreach t in array array[
    'clinical_concepts','clinical_concept_aliases','clinical_evidence_claims',
    'clinical_safety_rules','clinical_regimen_protocols','clinical_monitoring_protocols',
    'clinical_guideline_recommendations','clinical_change_events'
  ] loop
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

drop policy if exists clinical_concepts_verified_read on public.clinical_concepts;
create policy clinical_concepts_verified_read on public.clinical_concepts
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_concept_aliases_verified_read on public.clinical_concept_aliases;
create policy clinical_concept_aliases_verified_read on public.clinical_concept_aliases
  for select to authenticated using (public.is_verified_clinician() and status = 'active');

drop policy if exists clinical_evidence_claims_verified_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_verified_read on public.clinical_evidence_claims
  for select to authenticated using (
    public.is_verified_clinician() and status = 'current' and reviewed_at is not null
  );

drop policy if exists clinical_safety_rules_verified_read on public.clinical_safety_rules;
create policy clinical_safety_rules_verified_read on public.clinical_safety_rules
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_regimen_verified_read on public.clinical_regimen_protocols;
create policy clinical_regimen_verified_read on public.clinical_regimen_protocols
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_monitoring_verified_read on public.clinical_monitoring_protocols;
create policy clinical_monitoring_verified_read on public.clinical_monitoring_protocols
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

drop policy if exists clinical_guideline_verified_read on public.clinical_guideline_recommendations;
create policy clinical_guideline_verified_read on public.clinical_guideline_recommendations
  for select to authenticated using (public.is_verified_clinician() and status = 'current');

drop policy if exists clinical_change_verified_read on public.clinical_change_events;
create policy clinical_change_verified_read on public.clinical_change_events
  for select to authenticated using (public.is_verified_clinician() and review_status = 'published');

-- Service-role policies for governed reference data.
do $$
declare
  t text;
  policy_name text;
begin
  foreach t in array array[
    'clinical_concepts','clinical_concept_aliases','clinical_evidence_claims',
    'clinical_safety_rules','clinical_regimen_protocols','clinical_monitoring_protocols',
    'clinical_guideline_recommendations','clinical_change_events'
  ] loop
    policy_name := t || '_service';
    execute format('drop policy if exists %I on public.%I', policy_name, t);
    execute format(
      'create policy %I on public.%I for all to public using ((select auth.role()) = ''service_role'') with check ((select auth.role()) = ''service_role'')',
      policy_name, t
    );
  end loop;
end $$;

-- Reusable patient-scope expression is repeated intentionally so RLS remains
-- explicit and auditable per table.
revoke all on public.clinical_patient_contexts from anon;
revoke all on public.clinical_therapeutic_objectives from anon;
revoke all on public.clinical_decision_records from anon;
revoke all on public.clinical_patient_impact_reviews from anon;
grant select, insert, update on public.clinical_patient_contexts to authenticated;
grant select, insert, update on public.clinical_therapeutic_objectives to authenticated;
grant select, insert on public.clinical_decision_records to authenticated;
grant select, update on public.clinical_patient_impact_reviews to authenticated;
grant all on public.clinical_patient_contexts to service_role;
grant all on public.clinical_therapeutic_objectives to service_role;
grant all on public.clinical_decision_records to service_role;
grant all on public.clinical_patient_impact_reviews to service_role;

drop policy if exists clinical_patient_context_scope on public.clinical_patient_contexts;
create policy clinical_patient_context_scope on public.clinical_patient_contexts
  for all to authenticated
  using (
    public.is_verified_clinician() and exists (
      select 1 from public.clinical_patients p
      where p.id = clinical_patient_contexts.patient_id
        and (p.created_by = (select auth.uid()) or exists (
          select 1 from public.clinical_care_team ct
          where ct.patient_id = p.id and ct.user_id = (select auth.uid()) and ct.membership_status = 'active'
        ))
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = (select auth.uid())
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_objective_scope on public.clinical_therapeutic_objectives;
create policy clinical_objective_scope on public.clinical_therapeutic_objectives
  for all to authenticated
  using (
    public.is_verified_clinician() and exists (
      select 1 from public.clinical_patients p
      where p.id = clinical_therapeutic_objectives.patient_id
        and (p.created_by = (select auth.uid()) or exists (
          select 1 from public.clinical_care_team ct
          where ct.patient_id = p.id and ct.user_id = (select auth.uid()) and ct.membership_status = 'active'
        ))
    )
  )
  with check (
    public.is_verified_clinician()
    and recorded_by = (select auth.uid())
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_decision_scope on public.clinical_decision_records;
create policy clinical_decision_scope on public.clinical_decision_records
  for select to authenticated
  using (
    public.is_verified_clinician() and exists (
      select 1 from public.clinical_patients p
      where p.id = clinical_decision_records.patient_id
        and (p.created_by = (select auth.uid()) or exists (
          select 1 from public.clinical_care_team ct
          where ct.patient_id = p.id and ct.user_id = (select auth.uid()) and ct.membership_status = 'active'
        ))
    )
  );

drop policy if exists clinical_decision_insert on public.clinical_decision_records;
create policy clinical_decision_insert on public.clinical_decision_records
  for insert to authenticated
  with check (
    public.is_verified_clinician()
    and clinician_user_id = (select auth.uid())
    and public.clinical_has_active_consent(patient_id, 'treatment')
    and public.clinical_has_active_consent(patient_id, 'data_processing')
  );

drop policy if exists clinical_impact_scope on public.clinical_patient_impact_reviews;
create policy clinical_impact_scope on public.clinical_patient_impact_reviews
  for select to authenticated
  using (
    public.is_verified_clinician() and exists (
      select 1 from public.clinical_patients p
      where p.id = clinical_patient_impact_reviews.patient_id
        and (p.created_by = (select auth.uid()) or exists (
          select 1 from public.clinical_care_team ct
          where ct.patient_id = p.id and ct.user_id = (select auth.uid()) and ct.membership_status = 'active'
        ))
    )
  );

drop policy if exists clinical_impact_update on public.clinical_patient_impact_reviews;
create policy clinical_impact_update on public.clinical_patient_impact_reviews
  for update to authenticated
  using (
    public.is_verified_clinician() and exists (
      select 1 from public.clinical_patients p
      where p.id = clinical_patient_impact_reviews.patient_id
        and (p.created_by = (select auth.uid()) or exists (
          select 1 from public.clinical_care_team ct
          where ct.patient_id = p.id and ct.user_id = (select auth.uid()) and ct.membership_status = 'active'
        ))
    )
  )
  with check (public.is_verified_clinician() and reviewed_by = (select auth.uid()));

-- Service role for patient-derived OS tables.
do $$
declare
  t text;
  policy_name text;
begin
  foreach t in array array[
    'clinical_patient_contexts','clinical_therapeutic_objectives',
    'clinical_decision_records','clinical_patient_impact_reviews'
  ] loop
    policy_name := t || '_service';
    execute format('drop policy if exists %I on public.%I', policy_name, t);
    execute format(
      'create policy %I on public.%I for all to public using ((select auth.role()) = ''service_role'') with check ((select auth.role()) = ''service_role'')',
      policy_name, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Audit triggers for patient-derived clinical decision data
-- ---------------------------------------------------------------------------
create or replace function public.clinical_prescriber_os_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.clinical_audit_write(
    TG_ARGV[0],
    TG_TABLE_NAME,
    new.id::text,
    coalesce(to_jsonb(new)->>'jurisdiction', null),
    jsonb_build_object('patient_id', to_jsonb(new)->>'patient_id'),
    coalesce((to_jsonb(new)->>'recorded_by')::uuid, (to_jsonb(new)->>'clinician_user_id')::uuid, auth.uid())
  );
  return new;
end;
$$;

revoke all on function public.clinical_prescriber_os_after_insert from public;

drop trigger if exists trg_clinical_patient_context_audit on public.clinical_patient_contexts;
create trigger trg_clinical_patient_context_audit after insert on public.clinical_patient_contexts
  for each row execute function public.clinical_prescriber_os_after_insert('patient-context.record');

drop trigger if exists trg_clinical_objective_audit on public.clinical_therapeutic_objectives;
create trigger trg_clinical_objective_audit after insert on public.clinical_therapeutic_objectives
  for each row execute function public.clinical_prescriber_os_after_insert('therapeutic-objective.record');

drop trigger if exists trg_clinical_decision_audit on public.clinical_decision_records;
create trigger trg_clinical_decision_audit after insert on public.clinical_decision_records
  for each row execute function public.clinical_prescriber_os_after_insert('clinical-decision.record');

-- ---------------------------------------------------------------------------
-- 10. Fail weak pre-existing clinical provenance closed.
-- Preserve the rows/evidence; remove them from published prescriber retrieval
-- until a record-level source is attached and re-reviewed.
-- ---------------------------------------------------------------------------
update public.clinical_evidence_records
set review_status = 'under-review',
    updated_at = now()
where review_status = 'published'
  and (
    primary_source_url is null
    or primary_source_url in ('https://pubmed.ncbi.nlm.nih.gov/', 'https://pubmed.ncbi.nlm.nih.gov')
  );

update public.clinical_medication_interactions
set review_status = 'under-review',
    updated_at = now()
where review_status = 'published'
  and (
    primary_source_url is null
    or primary_source_url in ('https://pubmed.ncbi.nlm.nih.gov/', 'https://pubmed.ncbi.nlm.nih.gov')
  );

comment on table public.clinical_evidence_claims is
  'Claim-level governed evidence linked to the existing clinical evidence spine. PICO/effect/lineage fields are review-gated.';
comment on table public.clinical_regimen_protocols is
  'Product/indication/jurisdiction-specific regimen protocols. Never populated from the legacy generic mg/kg helper.';
comment on table public.clinical_decision_records is
  'Immutable clinician-authored rationale and evidence/product/guideline references; not an autonomous recommendation log.';
comment on table public.clinical_patient_impact_reviews is
  'Clinician review queue linking governed material clinical changes to patients; matching does not itself constitute a treatment recommendation.';
