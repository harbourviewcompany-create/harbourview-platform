-- Replay-safe restoration of the 12 core education modules referenced by the
-- immediately following section seed.
--
-- Production shows these module identities were created out-of-band on
-- 2026-06-09. This migration restores only the canonical identity, audience and
-- publication metadata required by the evidence-bearing section rows. Existing
-- review state, reviewer attribution and review timestamps are preserved.

do $education_module_identity_conflicts$
declare
  conflict_rows text;
begin
  select string_agg(format('%s=>%s', expected.slug, existing.id), ', ' order by expected.slug)
  into conflict_rows
  from (values
    ('b4882b28-7039-471f-b580-c19786752be6'::uuid, 'clinical-cannabis-prescribing'),
    ('03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587'::uuid, 'pharmacy-dispensing-controls'),
    ('edc533ae-e077-4eac-8cb4-01f974a4ce5d'::uuid, 'gmp-compliance-essentials'),
    ('cb3bf297-51ed-4c85-bded-7370e1748d94'::uuid, 'proof-pack-guide'),
    ('8d4ba66c-776e-44a2-9bc6-7c1e95054a83'::uuid, 'compliance-readiness-check'),
    ('6bff2f95-b4b5-4487-8455-26a5d110e742'::uuid, 'export-readiness-101'),
    ('7520ef89-8758-4436-860c-e016c53a6d32'::uuid, 'genetics-ip-fundamentals'),
    ('b65b8dbd-4e12-46fe-8928-99cf520770b1'::uuid, 'importer-pathway-guide'),
    ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe'::uuid, 'gdp-logistics-cold-chain'),
    ('5c3b131f-f733-4295-9f52-5d6cb2058410'::uuid, 'market-access-strategy'),
    ('b64698bc-edf3-4b93-96fc-0e9c991a0135'::uuid, 'lab-testing-qa-frameworks'),
    ('ac01db02-2182-43a3-a1f3-54fd05e56621'::uuid, 'regulatory-intelligence')
  ) as expected(id, slug)
  join public.education_modules existing
    on existing.slug = expected.slug
   and existing.id <> expected.id;

  if conflict_rows is not null then
    raise exception 'Education module slug identity conflict: %', conflict_rows;
  end if;
end
$education_module_identity_conflicts$;

insert into public.education_modules (
  id,
  slug,
  title,
  description,
  audience,
  sensitivity,
  track_id,
  publication_state,
  sort_order,
  created_at,
  updated_at,
  content_review_status,
  requires_clinical_signoff
)
values
  (
    'b4882b28-7039-471f-b580-c19786752be6',
    'clinical-cannabis-prescribing',
    'Clinical Cannabis Prescribing',
    'Controlled substance scheduling, patient eligibility frameworks, product selection guidance, and pharmacovigilance obligations.',
    array['doctor_prescriber','clinic_healthcare_operator','pharmacist'],
    'public', 'clinical', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587',
    'pharmacy-dispensing-controls',
    'Pharmacy Dispensing Controls',
    'Dispensary licence requirements, controlled substance SOPs, patient counselling obligations, and supply chain documentation.',
    array['pharmacist','doctor_prescriber'],
    'public', 'clinical', 'published', 20,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'edc533ae-e077-4eac-8cb4-01f974a4ce5d',
    'gmp-compliance-essentials',
    'GMP Compliance Essentials',
    'EU-GMP and GACP requirements, audit preparation, batch record management, and QA documentation for cannabis operators.',
    array['gmp_quality','lab_qa','cultivator_producer','general'],
    'public', 'compliance', 'published', 20,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'cb3bf297-51ed-4c85-bded-7370e1748d94',
    'proof-pack-guide',
    'Building a Proof Pack',
    'What counterparties require before commercial contact: COAs, GMP certificates, import permits, batch records, and verification evidence.',
    array['exporter','cultivator_producer','importer','general'],
    'public', 'compliance', 'published', 30,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    '8d4ba66c-776e-44a2-9bc6-7c1e95054a83',
    'compliance-readiness-check',
    'Compliance Readiness Self-Assessment',
    'Step-by-step pre-transaction compliance checklist covering licensing, documentation, product specifications, and operator verification.',
    array['general'],
    'public', 'compliance', 'published', 40,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    '6bff2f95-b4b5-4487-8455-26a5d110e742',
    'export-readiness-101',
    'Export Readiness 101',
    'EU-GMP certification, phytosanitary requirements, import permit frameworks, and GDP logistics for regulated cannabis export.',
    array['exporter','cultivator_producer','processor_extractor','general'],
    'public', 'export', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    '7520ef89-8758-4436-860c-e016c53a6d32',
    'genetics-ip-fundamentals',
    'Genetics IP & Cultivar Documentation',
    'Cultivar IP protection, phytosanitary evidence for genetics export, phenotyping records, and CITES compliance for plant material.',
    array['geneticist_breeder','cultivator_producer','general'],
    'public', 'genetics', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'b65b8dbd-4e12-46fe-8928-99cf520770b1',
    'importer-pathway-guide',
    'Importer / Buyer Pathway Guide',
    'Licensed importer obligations, import permit acquisition, GDP-compliant receiving, and wholesale distribution controls.',
    array['importer','wholesaler_distributor','general','distributor_wholesaler'],
    'public', 'import', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'af5161a6-07fd-4a1c-9ea7-bd125cd658fe',
    'gdp-logistics-cold-chain',
    'GDP Logistics & Cold Chain',
    'Good Distribution Practice requirements, temperature monitoring, carrier qualification, and cross-border documentation for cannabis shipments.',
    array['exporter','importer','wholesaler_distributor','general','distributor_wholesaler'],
    'public', 'logistics', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    '5c3b131f-f733-4295-9f52-5d6cb2058410',
    'market-access-strategy',
    'Market Access Strategy',
    'Country-by-country regulatory status, commercial pathways, named importer landscape, and distributor engagement frameworks.',
    array['investor_operator','exporter','government_regulator','general'],
    'public', 'market', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'b64698bc-edf3-4b93-96fc-0e9c991a0135',
    'lab-testing-qa-frameworks',
    'Lab Testing & QA Frameworks',
    'Certificate of Analysis interpretation, method validation, reference standards, and contaminant testing for regulated markets.',
    array['lab_qa','gmp_quality','general'],
    'public', 'quality', 'published', 10,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  ),
  (
    'ac01db02-2182-43a3-a1f3-54fd05e56621',
    'regulatory-intelligence',
    'Regulatory Intelligence & Monitoring',
    'How to track regulatory changes, interpret policy announcements, and map corridor-level risk for cross-border cannabis operations.',
    array['government_regulator','investor_operator','general'],
    'public', 'regulatory', 'published', 20,
    '2026-06-09 05:36:29.382207+00', '2026-06-09 05:36:29.382207+00',
    'original', false
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  audience = excluded.audience,
  sensitivity = excluded.sensitivity,
  track_id = excluded.track_id,
  publication_state = excluded.publication_state,
  sort_order = excluded.sort_order;

do $education_module_identity_assertion$
declare
  missing_ids uuid[];
begin
  select array_agg(expected.id order by expected.id)
  into missing_ids
  from unnest(array[
    'b4882b28-7039-471f-b580-c19786752be6'::uuid,
    '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587'::uuid,
    'edc533ae-e077-4eac-8cb4-01f974a4ce5d'::uuid,
    'cb3bf297-51ed-4c85-bded-7370e1748d94'::uuid,
    '8d4ba66c-776e-44a2-9bc6-7c1e95054a83'::uuid,
    '6bff2f95-b4b5-4487-8455-26a5d110e742'::uuid,
    '7520ef89-8758-4436-860c-e016c53a6d32'::uuid,
    'b65b8dbd-4e12-46fe-8928-99cf520770b1'::uuid,
    'af5161a6-07fd-4a1c-9ea7-bd125cd658fe'::uuid,
    '5c3b131f-f733-4295-9f52-5d6cb2058410'::uuid,
    'b64698bc-edf3-4b93-96fc-0e9c991a0135'::uuid,
    'ac01db02-2182-43a3-a1f3-54fd05e56621'::uuid
  ]) as expected(id)
  where not exists (
    select 1 from public.education_modules module
    where module.id = expected.id
  );

  if missing_ids is not null then
    raise exception 'Core education module restoration incomplete: %', missing_ids;
  end if;
end
$education_module_identity_assertion$;
