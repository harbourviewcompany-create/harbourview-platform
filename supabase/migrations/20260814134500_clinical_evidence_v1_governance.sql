-- Clinical Evidence V1 governance and first condition-level corpus.
-- Builds on 20260814121500_clinical_evidence_spine.sql.
-- Public Clinical DTO rows remain reviewed projections only; extraction/review provenance stays private.

create table if not exists public.clinical_evidence_grading_methods (
  method_key text primary key,
  version text not null,
  title text not null,
  description text not null,
  clinical_grades text[] not null default array['high','moderate','low','very-low'],
  requires_clinical_review boolean not null default true,
  source_url text,
  effective_at timestamptz not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clinical_grading_method_source_https check (source_url is null or source_url ~ '^https://')
);

insert into public.clinical_evidence_grading_methods (
  method_key, version, title, description, requires_clinical_review, source_url, effective_at
) values (
  'harbourview-clinical-evidence-v1',
  '1.0.0',
  'Harbourview Clinical Evidence V1',
  'Source ingestion defaults to ungraded. High/moderate/low/very-low certainty may only be assigned after an explicit clinical review using a documented GRADE-compatible assessment of study limitations, consistency, directness, precision and publication bias. Regulatory authorization or a product monograph is not converted into an efficacy-certainty grade. Conflicting reviewed evidence is surfaced rather than averaged away.',
  true,
  'https://www.gradeworkinggroup.org/',
  '2026-08-14T13:45:00Z'
) on conflict (method_key) do update set
  version = excluded.version,
  title = excluded.title,
  description = excluded.description,
  requires_clinical_review = excluded.requires_clinical_review,
  source_url = excluded.source_url,
  effective_at = excluded.effective_at;

alter table public.clinical_condition_terms
  add column if not exists slug text,
  add column if not exists definition text,
  add column if not exists vocabulary_version text not null default '1.0.0',
  add column if not exists source_system text,
  add column if not exists source_identifier text,
  add column if not exists source_version text,
  add column if not exists deprecated_at timestamptz,
  add column if not exists superseded_by_condition_id uuid references public.clinical_condition_terms(id) on delete set null;

create unique index if not exists uq_clinical_condition_terms_slug
  on public.clinical_condition_terms(slug) where slug is not null;
create index if not exists idx_clinical_condition_terms_source_identifier
  on public.clinical_condition_terms(source_system, source_identifier);

create table if not exists public.clinical_evidence_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_type text not null check (source_type in ('regulation','regulatory-guidance','product-monograph','systematic-review','meta-analysis','randomized-trial','observational-study','clinical-guideline','pharmacovigilance','other')),
  title text not null,
  publisher text not null,
  source_url text not null,
  jurisdiction text[] not null default '{}',
  doi text,
  pmid text,
  din text,
  notice_of_compliance_id text,
  source_version text,
  published_on date,
  effective_on date,
  retrieved_at timestamptz not null,
  content_sha256 text,
  currentness text not null default 'current' check (currentness in ('current','superseded','withdrawn','unknown')),
  superseded_by_source_id uuid references public.clinical_evidence_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_evidence_sources_url_https check (source_url ~ '^https://'),
  constraint clinical_evidence_sources_sha256 check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.clinical_evidence_records
  add column if not exists primary_source_registry_id uuid references public.clinical_evidence_sources(id) on delete set null,
  add column if not exists grading_method_key text references public.clinical_evidence_grading_methods(method_key) on delete set null,
  add column if not exists publication_scope text not null default 'source-metadata'
    check (publication_scope in ('source-metadata','clinical-synthesis'));

create table if not exists public.clinical_condition_evidence_links (
  id uuid primary key default gen_random_uuid(),
  condition_term_id uuid not null references public.clinical_condition_terms(id) on delete cascade,
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  relationship text not null check (relationship in ('indication','efficacy','safety','supporting','contradicting','context')),
  applicability text,
  created_at timestamptz not null default now(),
  unique(condition_term_id, evidence_record_id, relationship)
);

create table if not exists public.clinical_evidence_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid references public.clinical_evidence_records(id) on delete cascade,
  source_id uuid not null references public.clinical_evidence_sources(id) on delete restrict,
  extraction_type text not null check (extraction_type in ('indication','population','intervention','comparator','outcome','safety','limitation','bibliographic','other')),
  extracted_summary text not null,
  source_locator text,
  extraction_method text not null default 'manual-structured',
  extractor_identity text not null,
  extracted_at timestamptz not null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  review_type text not null check (review_type in ('provenance','clinical','methodology')),
  reviewer_type text not null check (reviewer_type in ('system','analyst','clinician','pharmacist')),
  reviewer_user_id uuid,
  reviewer_identity text not null,
  decision text not null check (decision in ('approved','needs-changes','rejected')),
  grading_method_key text references public.clinical_evidence_grading_methods(method_key) on delete set null,
  assigned_evidence_strength text check (assigned_evidence_strength is null or assigned_evidence_strength in ('high','moderate','low','very-low','ungraded','conflicted')),
  rationale text not null,
  reviewed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_evidence_conflicts (
  id uuid primary key default gen_random_uuid(),
  condition_term_id uuid references public.clinical_condition_terms(id) on delete cascade,
  evidence_record_a_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  evidence_record_b_id uuid not null references public.clinical_evidence_records(id) on delete cascade,
  conflict_type text not null check (conflict_type in ('direction','magnitude','population','formulation','safety','guideline','regulatory','other')),
  summary text not null,
  materiality text not null default 'medium' check (materiality in ('low','medium','high')),
  resolution_status text not null default 'unresolved' check (resolution_status in ('unresolved','contextualized','resolved','superseded')),
  resolution_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clinical_evidence_conflict_distinct_records check (evidence_record_a_id <> evidence_record_b_id)
);

create or replace function public.clinical_evidence_has_review_role(allowed_roles text[] default array['admin','operator','analyst'])
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$function$;

revoke all on function public.clinical_evidence_has_review_role(text[]) from public;
grant execute on function public.clinical_evidence_has_review_role(text[]) to authenticated, service_role;

alter table public.clinical_evidence_sources enable row level security;
alter table public.clinical_condition_evidence_links enable row level security;
alter table public.clinical_evidence_extractions enable row level security;
alter table public.clinical_evidence_reviews enable row level security;
alter table public.clinical_evidence_conflicts enable row level security;
alter table public.clinical_evidence_grading_methods enable row level security;

-- Public-safe relationships/methodology are visible only where linked evidence and conditions are published.
create policy clinical_grading_methods_public_read on public.clinical_evidence_grading_methods
  for select to anon, authenticated using (retired_at is null);
create policy clinical_condition_evidence_links_public_read on public.clinical_condition_evidence_links
  for select to anon, authenticated using (
    exists (select 1 from public.clinical_condition_terms c where c.id = condition_term_id and c.review_status = 'published')
    and exists (select 1 from public.clinical_evidence_records e where e.id = evidence_record_id and e.review_status = 'published')
  );

-- Normalized source registry, extraction provenance, review decisions and conflict workbench remain private.
create policy clinical_sources_review_read on public.clinical_evidence_sources
  for select to authenticated using (public.clinical_evidence_has_review_role());
create policy clinical_sources_review_write on public.clinical_evidence_sources
  for all to authenticated using (public.clinical_evidence_has_review_role(array['admin','operator','analyst']))
  with check (public.clinical_evidence_has_review_role(array['admin','operator','analyst']));
create policy clinical_extractions_review_access on public.clinical_evidence_extractions
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_reviews_review_access on public.clinical_evidence_reviews
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());
create policy clinical_conflicts_review_access on public.clinical_evidence_conflicts
  for all to authenticated using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

grant select on public.clinical_evidence_grading_methods to anon, authenticated;
grant select on public.clinical_condition_evidence_links to anon, authenticated;
grant select, insert, update on public.clinical_evidence_sources to authenticated;
grant select, insert, update on public.clinical_evidence_extractions to authenticated;
grant select, insert, update on public.clinical_evidence_reviews to authenticated;
grant select, insert, update on public.clinical_evidence_conflicts to authenticated;
grant all on public.clinical_evidence_grading_methods to service_role;
grant all on public.clinical_evidence_sources to service_role;
grant all on public.clinical_condition_evidence_links to service_role;
grant all on public.clinical_evidence_extractions to service_role;
grant all on public.clinical_evidence_reviews to service_role;
grant all on public.clinical_evidence_conflicts to service_role;

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
        select 1 from public.clinical_evidence_reviews r
        where r.evidence_record_id = new.id
          and r.review_type = 'clinical'
          and r.reviewer_type in ('clinician','pharmacist')
          and r.decision = 'approved'
      ) then
        raise exception 'clinical synthesis or graded certainty requires an approved clinician/pharmacist review';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.clinical_require_publication_review() from public;

drop trigger if exists trg_clinical_require_publication_review on public.clinical_evidence_records;
create trigger trg_clinical_require_publication_review
before insert or update of review_status, publication_scope, evidence_strength
on public.clinical_evidence_records
for each row execute function public.clinical_require_publication_review();

-- Normalized sources. Product monographs are authoritative regulatory product documents;
-- systematic reviews are staged privately until a qualified clinical review approves synthesis publication.
insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, doi, pmid, din,
  notice_of_compliance_id, source_version, published_on, effective_on, retrieved_at, currentness
) values
(
  'ca-epidiolex-pm-2024-10-30', 'product-monograph', 'EPIDIOLEX Product Monograph',
  'Jazz Pharmaceuticals Research UK Limited', 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf',
  array['Canada'], null, null, '02543079', '32096', '2024-10-30', '2024-10-30', '2023-11-15', '2026-08-14T13:45:00Z', 'current'
),
(
  'ca-sativex-pm-2019-12-11', 'product-monograph', 'SATIVEX Product Monograph',
  'GW Pharma Ltd.', 'https://pdf.hres.ca/dpd_pm/00054388.PDF',
  array['Canada'], null, null, '02266121', null, '2019-12-11', '2019-12-11', null, '2026-08-14T13:45:00Z', 'current'
),
(
  'pubmed-36417631', 'meta-analysis', 'Use of cannabidiol in the treatment of epilepsy: Lennox-Gastaut syndrome, Dravet syndrome, and tuberous sclerosis complex',
  'PubMed / indexed journal article', 'https://pubmed.ncbi.nlm.nih.gov/36417631/',
  array['Global'], '10.1016/j.seizure.2022.10.010', '36417631', null, null, '2022', '2022-11-21', null, '2026-08-14T13:45:00Z', 'current'
),
(
  'pubmed-39502271', 'meta-analysis', 'Cannabinoids for spasticity in patients with multiple sclerosis: A systematic review and meta-analysis',
  'PubMed / indexed journal article', 'https://pubmed.ncbi.nlm.nih.gov/39502271/',
  array['Global'], '10.1177/20552173241282379', '39502271', null, null, '2024', '2024-11-05', null, '2026-08-14T13:45:00Z', 'current'
)
on conflict (source_key) do update set
  title = excluded.title, publisher = excluded.publisher, source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction, doi = excluded.doi, pmid = excluded.pmid, din = excluded.din,
  notice_of_compliance_id = excluded.notice_of_compliance_id, source_version = excluded.source_version,
  published_on = excluded.published_on, effective_on = excluded.effective_on,
  retrieved_at = excluded.retrieved_at, currentness = excluded.currentness, updated_at = now();

-- Controlled V1 condition vocabulary. Labels are scoped to the reviewed source indication, not inferred disease ontology claims.
insert into public.clinical_condition_terms (
  canonical_name, slug, aliases, definition, vocabulary_source, source_url, verified_at,
  review_status, vocabulary_version, source_system, source_identifier, source_version
) values
('Lennox-Gastaut syndrome', 'lennox-gastaut-syndrome', array['LGS','Lennox Gastaut syndrome'], 'Condition label used in the current Canadian EPIDIOLEX authorized indication.', 'Health Canada-reviewed EPIDIOLEX Product Monograph', 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf', '2026-08-14T13:45:00Z', 'published', '1.0.0', 'EPIDIOLEX Product Monograph', 'INDICATION:LGS', '2024-10-30'),
('Dravet syndrome', 'dravet-syndrome', array['DS'], 'Condition label used in the current Canadian EPIDIOLEX authorized indication.', 'Health Canada-reviewed EPIDIOLEX Product Monograph', 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf', '2026-08-14T13:45:00Z', 'published', '1.0.0', 'EPIDIOLEX Product Monograph', 'INDICATION:DS', '2024-10-30'),
('Tuberous sclerosis complex', 'tuberous-sclerosis-complex', array['TSC','tuberous sclerosis'], 'Condition label used in the current Canadian EPIDIOLEX authorized indication.', 'Health Canada-reviewed EPIDIOLEX Product Monograph', 'https://pp.jazzpharma.com/pi/epidiolex.ca.PM-en.pdf', '2026-08-14T13:45:00Z', 'published', '1.0.0', 'EPIDIOLEX Product Monograph', 'INDICATION:TSC', '2024-10-30'),
('Multiple sclerosis spasticity', 'multiple-sclerosis-spasticity', array['MS spasticity','spasticity in multiple sclerosis','multiple sclerosis'], 'Symptom/condition label corresponding to the current Canadian SATIVEX indication for symptomatic relief of spasticity in multiple sclerosis.', 'Health Canada Drug Product Database / SATIVEX Product Monograph', 'https://pdf.hres.ca/dpd_pm/00054388.PDF', '2026-08-14T13:45:00Z', 'published', '1.0.0', 'SATIVEX Product Monograph', 'INDICATION:MS-SPASTICITY', '2019-12-11')
on conflict (canonical_name) do update set
  slug = excluded.slug, aliases = excluded.aliases, definition = excluded.definition,
  vocabulary_source = excluded.vocabulary_source, source_url = excluded.source_url,
  verified_at = excluded.verified_at, review_status = excluded.review_status,
  vocabulary_version = excluded.vocabulary_version, source_system = excluded.source_system,
  source_identifier = excluded.source_identifier, source_version = excluded.source_version, updated_at = now();

-- Insert condition-level source summaries under review first. Publication occurs only after provenance review.
insert into public.clinical_evidence_records (
  slug, title, summary, condition_term_id, condition_label, condition_aliases, population,
  intervention, formulation, cannabinoids, intervention_class, comparator, outcome,
  evidence_type, evidence_strength, evidence_strength_method, uncertainty, conflict_status,
  jurisdictions, profession_relevance, primary_source_title, primary_source_publisher,
  primary_source_url, primary_source_id, publication_date, effective_date, verified_at,
  supersession_state, review_status, primary_source_registry_id, grading_method_key, publication_scope
)
select v.slug, v.title, v.summary, c.id, c.canonical_name, c.aliases, v.population,
  v.intervention, v.formulation, v.cannabinoids, 'regulated-cannabinoid-drug', null, v.outcome,
  'product-monograph', 'ungraded',
  'Regulatory indication record; Harbourview Clinical Evidence V1 does not convert authorization into a clinical certainty grade.',
  v.uncertainty, 'none', array['Canada'], array['doctor','nurse_practitioner','pharmacist','other'],
  s.title, s.publisher, s.source_url, s.source_key, s.published_on, s.effective_on,
  '2026-08-14T13:45:00Z', 'current', 'under-review', s.id,
  'harbourview-clinical-evidence-v1', 'source-metadata'
from (values
  ('ca-epidiolex-lgs-indication','EPIDIOLEX authorized indication — Lennox-Gastaut syndrome','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Lennox-Gastaut syndrome in patients 2 years of age and older. This record represents regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','lennox-gastaut-syndrome','Patients 2 years of age and older with seizures associated with Lennox-Gastaut syndrome','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no independent comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
  ('ca-epidiolex-dravet-indication','EPIDIOLEX authorized indication — Dravet syndrome','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with Dravet syndrome in patients 2 years of age and older. This record represents regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','dravet-syndrome','Patients 2 years of age and older with seizures associated with Dravet syndrome','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no independent comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
  ('ca-epidiolex-tsc-indication','EPIDIOLEX authorized indication — tuberous sclerosis complex','The Canadian product monograph identifies EPIDIOLEX as adjunctive therapy for seizures associated with tuberous sclerosis complex in patients 2 years of age and older. This record represents regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','tuberous-sclerosis-complex','Patients 2 years of age and older with seizures associated with tuberous sclerosis complex','Cannabidiol (EPIDIOLEX)','Oral solution 100 mg/mL',array['CBD']::text[],'Authorized indication metadata; no independent comparative conclusion is asserted.','Product-monograph authorization does not establish comparative superiority or substitute for patient-specific clinical judgment.','ca-epidiolex-pm-2024-10-30'),
  ('ca-sativex-ms-spasticity-indication','SATIVEX authorized indication — multiple sclerosis spasticity','The Canadian product monograph identifies SATIVEX as adjunctive treatment for symptomatic relief of spasticity in patients with multiple sclerosis who have not responded adequately to other therapy and who demonstrate meaningful improvement during an initial trial. This record represents regulatory product-indication metadata, not an independent Harbourview efficacy recommendation.','multiple-sclerosis-spasticity','Patients with multiple sclerosis spasticity inadequately responsive to other therapy who demonstrate meaningful improvement during an initial trial','Nabiximols (SATIVEX)','Buccal spray',array['THC','CBD']::text[],'Authorized indication metadata; no independent comparative conclusion is asserted.','The indication is response-enriched and should not be generalized to all multiple sclerosis patients or to unregulated cannabis products.','ca-sativex-pm-2019-12-11')
) as v(slug,title,summary,condition_slug,population,intervention,formulation,cannabinoids,outcome,uncertainty,source_key)
join public.clinical_condition_terms c on c.slug = v.condition_slug
join public.clinical_evidence_sources s on s.source_key = v.source_key
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, condition_term_id = excluded.condition_term_id,
  condition_label = excluded.condition_label, condition_aliases = excluded.condition_aliases,
  population = excluded.population, intervention = excluded.intervention, formulation = excluded.formulation,
  cannabinoids = excluded.cannabinoids, intervention_class = excluded.intervention_class,
  outcome = excluded.outcome, evidence_type = excluded.evidence_type,
  evidence_strength = excluded.evidence_strength, evidence_strength_method = excluded.evidence_strength_method,
  uncertainty = excluded.uncertainty, primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher, primary_source_url = excluded.primary_source_url,
  primary_source_id = excluded.primary_source_id, publication_date = excluded.publication_date,
  effective_date = excluded.effective_date, verified_at = excluded.verified_at,
  primary_source_registry_id = excluded.primary_source_registry_id,
  grading_method_key = excluded.grading_method_key, publication_scope = excluded.publication_scope,
  updated_at = now();

-- Provenance reviews are explicit system migration reviews; they approve only source fidelity/public metadata.
insert into public.clinical_evidence_reviews (
  evidence_record_id, review_type, reviewer_type, reviewer_identity, decision,
  grading_method_key, assigned_evidence_strength, rationale, reviewed_at
)
select r.id, 'provenance', 'system', 'migration:20260814134500', 'approved',
  'harbourview-clinical-evidence-v1', 'ungraded',
  'Verified that the public summary is limited to the cited Canadian product-monograph indication and does not assert an independent efficacy grade, dosing recommendation, interaction claim or profession rule.',
  '2026-08-14T13:45:00Z'
from public.clinical_evidence_records r
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and not exists (
    select 1 from public.clinical_evidence_reviews x
    where x.evidence_record_id = r.id and x.review_type = 'provenance' and x.reviewer_identity = 'migration:20260814134500'
  );

update public.clinical_evidence_records
set review_status = 'published', updated_at = now()
where slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and review_status <> 'published';

insert into public.clinical_condition_evidence_links (condition_term_id, evidence_record_id, relationship, applicability)
select c.id, r.id, 'indication', 'Canadian regulated-drug product indication only; not general cannabis or cultivar evidence.'
from public.clinical_evidence_records r
join public.clinical_condition_terms c on c.id = r.condition_term_id
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
on conflict do nothing;

-- Stage high-quality systematic-review metadata privately. No efficacy synthesis is published without qualified clinical review.
insert into public.clinical_evidence_records (
  slug, title, summary, condition_label, condition_aliases, population, intervention, formulation,
  cannabinoids, intervention_class, comparator, outcome, evidence_type, evidence_strength,
  evidence_strength_method, uncertainty, conflict_status, jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  publication_date, verified_at, supersession_state, review_status,
  primary_source_registry_id, grading_method_key, publication_scope
)
select v.slug, s.title, v.summary, v.condition_label, v.aliases, v.population, v.intervention, v.formulation,
  v.cannabinoids, 'regulated-cannabinoid-drug', 'Placebo / control groups as defined by included trials', v.outcome,
  'meta-analysis', 'ungraded',
  'Staged for qualified clinical GRADE-compatible review under Harbourview Clinical Evidence V1 before any synthesized certainty statement may be published.',
  v.uncertainty, 'none', array['Global'], array['doctor','nurse_practitioner','pharmacist','other'],
  s.title, s.publisher, s.source_url, s.source_key, s.published_on,
  '2026-08-14T13:45:00Z', 'current', 'under-review', s.id,
  'harbourview-clinical-evidence-v1', 'clinical-synthesis'
from (values
  ('review-cbd-lgs-ds-tsc-2022','Lennox-Gastaut syndrome / Dravet syndrome / tuberous sclerosis complex',array['LGS','DS','TSC']::text[],'Children and adults with inadequately controlled seizures in LGS, DS or TSC as included by the review','Adjunctive purified cannabidiol','Oral cannabidiol formulations',array['CBD']::text[],'Seizure-frequency, responder, adverse-event and tolerability outcomes reported by the systematic review','Review-level results require independent clinical appraisal for risk of bias, directness and applicability before Harbourview assigns certainty.','pubmed-36417631'),
  ('review-nabiximols-ms-spasticity-2024','Multiple sclerosis spasticity',array['MS spasticity','spasticity in multiple sclerosis']::text[],'People with multiple sclerosis and spasticity in studies included by the review','Cannabinoids, predominantly nabiximols','Multiple formulations represented in the review',array['THC','CBD']::text[],'Spasticity outcomes reported by the systematic review/meta-analysis','High heterogeneity and formulation/population differences require clinical appraisal before a Harbourview certainty grade or generalized conclusion.','pubmed-39502271')
) as v(slug,condition_label,aliases,population,intervention,formulation,cannabinoids,outcome,uncertainty,source_key)
join public.clinical_evidence_sources s on s.source_key = v.source_key
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, condition_label = excluded.condition_label,
  condition_aliases = excluded.condition_aliases, population = excluded.population,
  intervention = excluded.intervention, formulation = excluded.formulation, cannabinoids = excluded.cannabinoids,
  intervention_class = excluded.intervention_class, comparator = excluded.comparator,
  outcome = excluded.outcome, evidence_type = excluded.evidence_type,
  evidence_strength = excluded.evidence_strength, evidence_strength_method = excluded.evidence_strength_method,
  uncertainty = excluded.uncertainty, primary_source_title = excluded.primary_source_title,
  primary_source_publisher = excluded.primary_source_publisher, primary_source_url = excluded.primary_source_url,
  primary_source_id = excluded.primary_source_id, publication_date = excluded.publication_date,
  verified_at = excluded.verified_at, primary_source_registry_id = excluded.primary_source_registry_id,
  grading_method_key = excluded.grading_method_key, publication_scope = excluded.publication_scope,
  review_status = 'under-review', updated_at = now();

insert into public.clinical_evidence_extractions (
  evidence_record_id, source_id, extraction_type, extracted_summary, source_locator,
  extraction_method, extractor_identity, extracted_at, verification_status
)
select r.id, s.id, 'bibliographic',
  'Bibliographic and abstract-level source metadata captured for clinical review; no public efficacy synthesis approved.',
  case when s.pmid is not null then 'PubMed PMID ' || s.pmid else s.source_version end,
  'manual-structured', 'migration:20260814134500', '2026-08-14T13:45:00Z', 'verified'
from public.clinical_evidence_records r
join public.clinical_evidence_sources s on s.id = r.primary_source_registry_id
where r.slug in ('review-cbd-lgs-ds-tsc-2022','review-nabiximols-ms-spasticity-2024')
  and not exists (
    select 1 from public.clinical_evidence_extractions x
    where x.evidence_record_id = r.id and x.source_id = s.id and x.extraction_type = 'bibliographic'
  );

insert into public.clinical_evidence_change_events (
  evidence_record_id, event_type, title, summary, materiality, jurisdictions, profession_relevance,
  occurred_at, verified_at, primary_source_title, primary_source_publisher, primary_source_url,
  primary_source_id, review_status
)
select r.id, 'published', 'Regulated cannabinoid medicine indication added to Clinical Evidence V1',
  'A current Canadian regulated-drug indication record was added with explicit product-monograph provenance and ungraded certainty; this does not generalize to cannabis products or genetics.',
  'medium', array['Canada'], r.profession_relevance, '2026-08-14T13:45:00Z', '2026-08-14T13:45:00Z',
  r.primary_source_title, r.primary_source_publisher, r.primary_source_url, r.primary_source_id, 'published'
from public.clinical_evidence_records r
where r.slug in ('ca-epidiolex-lgs-indication','ca-epidiolex-dravet-indication','ca-epidiolex-tsc-indication','ca-sativex-ms-spasticity-indication')
  and not exists (
    select 1 from public.clinical_evidence_change_events e
    where e.evidence_record_id = r.id and e.event_type = 'published' and e.occurred_at = '2026-08-14T13:45:00Z'
  );

comment on table public.clinical_evidence_sources is
  'Private normalized source registry for Clinical evidence provenance. Public rendering uses reviewed denormalized projection fields on clinical_evidence_records.';
comment on table public.clinical_evidence_extractions is
  'Private extraction provenance. Never expose raw extraction/review work through public Clinical DTOs.';
comment on table public.clinical_evidence_reviews is
  'Private governed review decisions. Clinical synthesis or graded certainty requires approved clinician/pharmacist review.';
comment on table public.clinical_evidence_conflicts is
  'Private contradiction workbench. Conflicts are resolved/contextualized before publication; public records expose only safe conflict status.';
