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
