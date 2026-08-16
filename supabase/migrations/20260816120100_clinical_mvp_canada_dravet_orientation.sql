-- Canada-scoped Dravet orientation so jurisdiction=Canada search returns a hit
-- when users query Dravet/Dravel (condition term + CA record).

insert into public.clinical_evidence_records (
  slug, title, summary,
  condition_term_id, condition_label, condition_aliases,
  population, intervention, formulation, cannabinoids, intervention_class,
  comparator, outcome,
  evidence_type, evidence_strength, evidence_strength_method, uncertainty, conflict_status,
  jurisdictions, profession_relevance,
  primary_source_title, primary_source_publisher, primary_source_url, primary_source_id,
  publication_date, effective_date, verified_at, supersession_state, review_status
) values
(
  'ca-dravet-cannabinoid-orientation',
  'Canada — Dravet syndrome and cannabinoid medicines: professional orientation',
  'Dravet syndrome is a recognized severe epilepsy syndrome. In Canada, access to cannabis for medical purposes follows the Cannabis Act / Cannabis Regulations and applicable professional guidance. Specific prescription cannabinoid products and their authorized uses must be confirmed against current Canadian product information and Health Canada materials — this record does not assert that any particular CBD product is authorized for Dravet syndrome in Canada.',
  (select id from public.clinical_condition_terms where canonical_name = 'Dravet syndrome' limit 1),
  'Dravet syndrome',
  array['Dravet', 'Dravel', 'SMEI'],
  'People with Dravet syndrome (clinical context only)',
  'Cannabinoid / cannabis-based medicines (product-specific)',
  null,
  array['CBD'],
  'regulated-cannabinoid-drug',
  null,
  null,
  'regulatory-guidance', 'ungraded',
  'Orientation to Canadian federal professional materials; not a systematic review or product authorization table.',
  'Does not encode dosing, does not claim comparative efficacy, and does not replace product monographs or specialist epilepsy guidance.',
  'none',
  array['Canada'],
  array['doctor','nurse_practitioner','pharmacist','other'],
  'Information for Health Care Practitioners - Medical Use of Cannabis',
  'Health Canada',
  'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners.html',
  'ca-dravet-orientation',
  null, null, '2026-08-16T12:00:00Z', 'current', 'published'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  condition_term_id = excluded.condition_term_id,
  condition_label = excluded.condition_label,
  condition_aliases = excluded.condition_aliases,
  cannabinoids = excluded.cannabinoids,
  uncertainty = excluded.uncertainty,
  jurisdictions = excluded.jurisdictions,
  primary_source_url = excluded.primary_source_url,
  verified_at = excluded.verified_at,
  review_status = excluded.review_status,
  updated_at = now();
