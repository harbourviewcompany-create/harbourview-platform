-- Bind an authoritative Angola legal publication for full-depth source acquisition.
-- This source is evidence for the legal/import surface it directly addresses;
-- downstream dimension adjudication remains fail-closed when semantics are unsupported.

insert into public.source_registry (
  source_name,
  source_url,
  jurisdiction,
  iso,
  is_active,
  crawl_allowed,
  source_type,
  tier,
  regulator_class,
  verification_notes
)
select
  'Angola — Diário da República / Lei n.º 14/25 (OGE 2026)',
  'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf',
  'Angola',
  'AO',
  true,
  true,
  'official_legal',
  1,
  'official_gazette',
  'Primary-source binding: official Diário da República publication dated 30 Dec 2025. Relevant to import restrictions and other customs/legal evidence. Do not infer unrelated dimensions from this source.'
where not exists (
  select 1
  from public.source_registry
  where source_url = 'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf'
);
