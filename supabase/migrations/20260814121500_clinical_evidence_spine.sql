-- Clinical evidence spine P0.
-- Public, non-patient, provenance-bearing evidence records only.
-- This schema is deliberately separate from marketplace products, cultivar/genetics
-- records, patient data, recommendations and prescriptions.

create table if not exists public.clinical_condition_terms (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  aliases text[] not null default '{}',
  vocabulary_source text,
  source_url text,
  verified_at timestamptz,
  review_status text not null default 'under_review'
    check (review_status in ('published', 'under_review', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_records (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  condition_term_id uuid references public.clinical_condition_terms(id) on delete set null,
  condition_label text,
  condition_aliases text[] not null default '{}',
  population text,
  intervention text,
  formulation text,
  cannabinoids text[] not null default '{}',
  intervention_class text not null
    check (intervention_class in (
      'regulated-cannabinoid-drug', 'general-cannabis', 'cannabinoid-isolate',
      'cannabis-derived-formulation', 'non-cannabis', 'not-applicable'
    )),
  comparator text,
  outcome text,
  evidence_type text not null
    check (evidence_type in (
      'regulation', 'regulatory-guidance', 'clinical-guideline', 'systematic-review',
      'meta-analysis', 'randomized-trial', 'observational-study',
      'pharmacovigilance-signal', 'product-monograph', 'other'
    )),
  evidence_strength text not null
    check (evidence_strength in ('high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted')),
  evidence_strength_method text,
  uncertainty text,
  conflict_status text not null default 'none'
    check (conflict_status in ('none', 'mixed', 'material-conflict')),
  jurisdictions text[] not null default '{}',
  profession_relevance text[] not null default '{}',
  primary_source_title text not null,
  primary_source_publisher text not null,
  primary_source_url text not null,
  primary_source_id text,
  publication_date date,
  effective_date date,
  verified_at timestamptz not null,
  supersession_state text not null default 'current'
    check (supersession_state in ('current', 'superseded', 'partially-superseded')),
  superseded_by_id uuid references public.clinical_evidence_records(id) on delete set null,
  review_status text not null default 'under_review'
    check (review_status in ('published', 'under-review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_source_https check (primary_source_url ~ '^https://'),
  constraint clinical_evidence_no_product_identity check (
    intervention_class <> 'general-cannabis' or formulation is null or length(formulation) <= 240
  )
);

create table if not exists public.clinical_evidence_change_events (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete set null,
  event_type text not null
    check (event_type in ('published', 'updated', 'superseded', 'conflict-detected', 'conflict-resolved')),
  title text not null,
  summary text not null,
  materiality text not null default 'medium'
    check (materiality in ('low', 'medium', 'high')),
  jurisdictions text[] not null default '{}',
  profession_relevance text[] not null default '{}',
  occurred_at timestamptz not null,
  verified_at timestamptz not null,
  primary_source_title text not null,
  primary_source_publisher text not null,
  primary_source_url text not null,
  primary_source_id text,
  created_at timestamptz not null default now(),
  constraint clinical_evidence_change_source_https check (primary_source_url ~ '^https://')
);

create index if not exists idx_clinical_evidence_condition
  on public.clinical_evidence_records (condition_label);
create index if not exists idx_clinical_evidence_verified
  on public.clinical_evidence_records (verified_at desc);
create index if not exists idx_clinical_evidence_changes_occurred
  on public.clinical_evidence_change_events (occurred_at desc);
create index if not exists idx_clinical_condition_terms_name
  on public.clinical_condition_terms (lower(canonical_name));

alter table public.clinical_condition_terms enable row level security;
alter table public.clinical_evidence_records enable row level security;
alter table public.clinical_evidence_change_events enable row level security;

-- Only reviewed/public records are readable from browser-facing roles.
drop policy if exists clinical_condition_terms_public_read on public.clinical_condition_terms;
create policy clinical_condition_terms_public_read
  on public.clinical_condition_terms for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_records_public_read on public.clinical_evidence_records;
create policy clinical_evidence_records_public_read
  on public.clinical_evidence_records for select to anon, authenticated
  using (review_status = 'published');

drop policy if exists clinical_evidence_change_events_public_read on public.clinical_evidence_change_events;
create policy clinical_evidence_change_events_public_read
  on public.clinical_evidence_change_events for select to anon, authenticated
  using (
    evidence_record_id is null
    or exists (
      select 1 from public.clinical_evidence_records r
      where r.id = clinical_evidence_change_events.evidence_record_id
        and r.review_status = 'published'
    )
  );

grant select on public.clinical_condition_terms to anon, authenticated;
grant select on public.clinical_evidence_records to anon, authenticated;
grant select on public.clinical_evidence_change_events to anon, authenticated;
grant all on public.clinical_condition_terms to service_role;
grant all on public.clinical_evidence_records to service_role;
grant all on public.clinical_evidence_change_events to service_role;

-- P0 seed is intentionally limited to current Canadian primary authority and
-- regulatory/pharmacovigilance guidance. No condition efficacy, drug interaction,
-- profession-specific authorization, product or cultivar claim is inferred here.
insert into public.clinical_evidence_records (
  slug, title, summary, intervention_class, evidence_type, evidence_strength,
  evidence_strength_method, uncertainty, jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  effective_date, verified_at, supersession_state, review_status
) values
(
  'ca-cannabis-regulations-medical-document-273',
  'Medical document requirements under Cannabis Regulations §273',
  'Primary federal legal requirements for the contents and validity of a medical document used for access to cannabis for medical purposes.',
  'general-cannabis', 'regulation', 'ungraded',
  'Legal authority; clinical evidence certainty is not applicable.',
  'This record describes federal legal requirements and does not establish efficacy, safety or appropriateness for an individual patient.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  'Cannabis Regulations §273', 'Justice Laws Website',
  'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
  'SOR-2018-144-s273', null, '2026-08-14T12:00:00Z', 'current', 'published'
),
(
  'ca-health-canada-medical-practitioners',
  'Health Canada information for health care practitioners',
  'Federal professional orientation for health care practitioners, including the direction to consult applicable provincial or territorial licensing-authority guidance before authorizing cannabis for medical purposes.',
  'general-cannabis', 'regulatory-guidance', 'ungraded',
  'Primary government guidance; no formal evidence-certainty grading is supplied by the source.',
  'This guidance does not replace profession-specific provincial or territorial requirements and is not encoded as a profession-specific authorization rule.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis', 'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'health-canada-medical-practitioners', null, '2026-08-14T12:00:00Z', 'current', 'published'
),
(
  'ca-health-canada-cannabis-adverse-reaction-reporting-hcp',
  'Cannabis adverse-reaction reporting for health care professionals',
  'Current Health Canada guidance encourages health care professionals to report suspected adverse reactions to cannabis, including when causality is uncertain.',
  'general-cannabis', 'regulatory-guidance', 'ungraded',
  'Primary government pharmacovigilance guidance; clinical evidence certainty is not graded by the source.',
  'A suspected adverse reaction report does not establish that cannabis caused the event.',
  array['Canada'], array['doctor','nurse_practitioner','pharmacist','nurse','other'],
  'Report a side effect to cannabis: Health care professionals', 'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/recalls-adverse-reactions-reporting/report-side-effects-cannabis-products/health-care-professionals.html',
  'health-canada-cannabis-adverse-reaction-hcp', null, '2026-08-14T12:00:00Z', 'current', 'published'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  evidence_strength_method = excluded.evidence_strength_method,
  uncertainty = excluded.uncertainty,
  primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher,
  primary_source_url = excluded.primary_source_url,
  primary_source_id = excluded.primary_source_id,
  verified_at = excluded.verified_at,
  supersession_state = excluded.supersession_state,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions,
  profession_relevance, occurred_at, verified_at, primary_source_title,
  primary_source_publisher, primary_source_url, primary_source_id
)
select
  r.id,
  'updated',
  'Current Cannabis Regulations medical-document authority verified',
  'Harbourview verified the current federal §273 medical-document authority and suppresses legacy ACMPR-era framing rather than treating it as current.',
  'high', array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  '2026-08-14T12:00:00Z', '2026-08-14T12:00:00Z',
  'Cannabis Regulations §273', 'Justice Laws Website',
  'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-144/section-273.html',
  'SOR-2018-144-s273'
from public.clinical_evidence_records r
where r.slug = 'ca-cannabis-regulations-medical-document-273'
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.primary_source_id = 'SOR-2018-144-s273'
      and e.event_type = 'updated'
      and e.occurred_at = '2026-08-14T12:00:00Z'
  );

comment on table public.clinical_evidence_records is
  'Public reviewed clinical/regulatory evidence metadata only. Never store patient data, marketplace listing data, cultivar genetics, seller claims or private provenance here.';
comment on table public.clinical_evidence_change_events is
  'Public reviewed change events for clinical evidence/regulatory records; not a patient event log.';
