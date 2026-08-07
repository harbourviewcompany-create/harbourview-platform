-- Replay-safe restoration of the 12 core education modules referenced by the
-- immediately following section seed.
--
-- Production shows these identities were created out-of-band on 2026-06-09.
-- The repository history contains two education-module contracts: the Gap-E
-- schema uses a UUID track foreign key, while production later uses a text track
-- classification. This migration supports both without changing review state.

create temporary table hv_core_education_modules (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  audience text[] not null,
  sensitivity text not null,
  publication_state text not null,
  sort_order integer not null,
  legacy_track text not null,
  gap_track_slug text not null
) on commit drop;

insert into hv_core_education_modules values
  ('b4882b28-7039-471f-b580-c19786752be6','clinical-cannabis-prescribing','Clinical Cannabis Prescribing',array['doctor_prescriber','clinic_healthcare_operator','pharmacist'],'public','published',10,'clinical','clinical-medical'),
  ('03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587','pharmacy-dispensing-controls','Pharmacy Dispensing Controls',array['pharmacist','doctor_prescriber'],'public','published',20,'clinical','clinical-medical'),
  ('edc533ae-e077-4eac-8cb4-01f974a4ce5d','gmp-compliance-essentials','GMP Compliance Essentials',array['gmp_quality','lab_qa','cultivator_producer','general'],'public','published',20,'compliance','regulatory-compliance'),
  ('cb3bf297-51ed-4c85-bded-7370e1748d94','proof-pack-guide','Building a Proof Pack',array['exporter','cultivator_producer','importer','general'],'public','published',30,'compliance','regulatory-compliance'),
  ('8d4ba66c-776e-44a2-9bc6-7c1e95054a83','compliance-readiness-check','Compliance Readiness Self-Assessment',array['general'],'public','published',40,'compliance','regulatory-compliance'),
  ('6bff2f95-b4b5-4487-8455-26a5d110e742','export-readiness-101','Export Readiness 101',array['exporter','cultivator_producer','processor_extractor','general'],'public','published',10,'export','market-access-pathways'),
  ('7520ef89-8758-4436-860c-e016c53a6d32','genetics-ip-fundamentals','Genetics IP & Cultivar Documentation',array['geneticist_breeder','cultivator_producer','general'],'public','published',10,'genetics','industry-intelligence'),
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1','importer-pathway-guide','Importer / Buyer Pathway Guide',array['importer','wholesaler_distributor','general','distributor_wholesaler'],'public','published',10,'import','market-access-pathways'),
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe','gdp-logistics-cold-chain','GDP Logistics & Cold Chain',array['exporter','importer','wholesaler_distributor','general','distributor_wholesaler'],'public','published',10,'logistics','market-access-pathways'),
  ('5c3b131f-f733-4295-9f52-5d6cb2058410','market-access-strategy','Market Access Strategy',array['investor_operator','exporter','government_regulator','general'],'public','published',10,'market','market-access-pathways'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135','lab-testing-qa-frameworks','Lab Testing & QA Frameworks',array['lab_qa','gmp_quality','general'],'public','published',10,'quality','industry-intelligence'),
  ('ac01db02-2182-43a3-a1f3-54fd05e56621','regulatory-intelligence','Regulatory Intelligence & Monitoring',array['government_regulator','investor_operator','general'],'public','published',20,'regulatory','regulatory-compliance');

do $education_module_identity_conflicts$
declare
  conflict_rows text;
begin
  select string_agg(format('%s=>%s', expected.slug, existing.id), ', ' order by expected.slug)
  into conflict_rows
  from hv_core_education_modules expected
  join public.education_modules existing
    on existing.slug = expected.slug
   and existing.id <> expected.id;

  if conflict_rows is not null then
    raise exception 'Education module slug identity conflict: %', conflict_rows;
  end if;
end
$education_module_identity_conflicts$;

insert into public.education_modules (
  id, slug, title, audience, sensitivity, publication_state, created_at, updated_at
)
select
  id, slug, title, audience, sensitivity, publication_state,
  '2026-06-09 05:36:29.382207+00'::timestamptz,
  '2026-06-09 05:36:29.382207+00'::timestamptz
from hv_core_education_modules
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  audience = excluded.audience,
  sensitivity = excluded.sensitivity,
  publication_state = excluded.publication_state;

-- Reconcile track identity according to the schema present in the environment.
do $education_module_track_contract$
declare
  track_type text;
begin
  select pg_catalog.format_type(attribute_record.atttypid, attribute_record.atttypmod)
  into track_type
  from pg_attribute attribute_record
  where attribute_record.attrelid = 'public.education_modules'::regclass
    and attribute_record.attname = 'track_id'
    and attribute_record.attnum > 0
    and not attribute_record.attisdropped;

  if track_type = 'uuid' then
    update public.education_modules module
    set track_id = track.id
    from hv_core_education_modules expected
    join public.education_tracks track on track.slug = expected.gap_track_slug
    where module.id = expected.id;
  elsif track_type = 'text' then
    update public.education_modules module
    set track_id = expected.legacy_track
    from hv_core_education_modules expected
    where module.id = expected.id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'education_modules'
      and column_name = 'sort_order'
  ) then
    execute $sql$
      update public.education_modules module
      set sort_order = expected.sort_order
      from hv_core_education_modules expected
      where module.id = expected.id
    $sql$;
  end if;
end
$education_module_track_contract$;

do $education_module_identity_assertion$
declare
  missing_ids uuid[];
begin
  select array_agg(expected.id order by expected.id)
  into missing_ids
  from hv_core_education_modules expected
  where not exists (
    select 1 from public.education_modules module
    where module.id = expected.id
  );

  if missing_ids is not null then
    raise exception 'Core education module restoration incomplete: %', missing_ids;
  end if;
end
$education_module_identity_assertion$;
