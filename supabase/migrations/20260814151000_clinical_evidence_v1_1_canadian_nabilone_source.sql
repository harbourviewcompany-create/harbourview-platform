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
