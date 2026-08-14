-- Reconcile Clinical Evidence V1 source metadata against current authoritative records.
-- No production migration has been applied; this remains part of the PR migration set.

-- PMID 36417631 resolves to DOI 10.1590/1806-9282.2022D689.
update public.clinical_evidence_sources
set doi = '10.1590/1806-9282.2022D689',
    updated_at = now()
where source_key = 'pubmed-36417631';

-- Health Canada's current DPD shows SATIVEX marketed with a newer product monograph
-- dated 2024-12-17. The normalized 2019 PDF remains useful historical provenance but
-- must not be represented as the current source for a public indication record.
update public.clinical_evidence_sources
set currentness = 'superseded',
    updated_at = now()
where source_key = 'ca-sativex-pm-2019-12-11';

insert into public.clinical_evidence_sources (
  source_key, source_type, title, publisher, source_url, jurisdiction, din,
  source_version, published_on, retrieved_at, currentness
) values (
  'ca-sativex-dpd-2024-12-17',
  'regulatory-guidance',
  'SATIVEX — current Drug Product Database record',
  'Health Canada',
  'https://health-products.canada.ca/dpd-bdpp/info.do?code=75157&lang=en',
  array['Canada'],
  '02266121',
  'DPD status / product-monograph date 2024-12-17',
  '2024-12-17',
  '2026-08-14T13:55:00Z',
  'current'
)
on conflict (source_key) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  din = excluded.din,
  source_version = excluded.source_version,
  published_on = excluded.published_on,
  retrieved_at = excluded.retrieved_at,
  currentness = excluded.currentness,
  updated_at = now();

update public.clinical_evidence_sources old_source
set superseded_by_source_id = current_source.id,
    updated_at = now()
from public.clinical_evidence_sources current_source
where old_source.source_key = 'ca-sativex-pm-2019-12-11'
  and current_source.source_key = 'ca-sativex-dpd-2024-12-17';

-- The current DPD record confirms marketed status, dosage form, route and ingredients,
-- but this migration has not independently extracted the indication text from the new
-- 2024-12-17 monograph. Fail closed: retire the public 2019-derived indication projection
-- until the current monograph is captured and reviewed.
update public.clinical_evidence_records
set review_status = 'under-review',
    supersession_state = 'superseded',
    superseded_by_id = null,
    uncertainty = 'Historical 2019 product-monograph indication metadata is retained privately. Health Canada lists a newer SATIVEX product monograph dated 2024-12-17; current indication text must be captured and provenance-reviewed before republication.',
    updated_at = now()
where slug = 'ca-sativex-ms-spasticity-indication';

update public.clinical_condition_terms
set review_status = 'under_review',
    deprecated_at = '2026-08-14T13:55:00Z',
    verified_at = '2026-08-14T13:55:00Z',
    definition = 'Historical SATIVEX multiple-sclerosis-spasticity condition label retained pending extraction and review of the current 2024-12-17 Canadian product monograph.',
    updated_at = now()
where slug = 'multiple-sclerosis-spasticity';

-- Remove the now-invalid public change announcement rather than claim that the historical
-- SATIVEX indication record is current. The private record and source lineage remain intact.
delete from public.clinical_evidence_change_events
where evidence_record_id = (
  select id from public.clinical_evidence_records where slug = 'ca-sativex-ms-spasticity-indication'
)
  and event_type = 'published'
  and occurred_at = '2026-08-14T13:45:00Z';

comment on table public.clinical_evidence_sources is
  'Private normalized source registry. Supersession/currentness must be reconciled before a source-backed public Clinical projection is published.';
