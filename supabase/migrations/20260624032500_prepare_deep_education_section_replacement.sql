-- Replay-only handoff from the concise education seed to the reviewed deep
-- education content series beginning at 20260624032532.
--
-- Production already records the deep series and therefore takes the no-op path.
-- A zero-state replay removes the earlier concise rows only when all 60 rows still
-- match the untouched baseline identity, heading, type, and timestamp signature.
-- Any partial or reviewed environment fails closed instead of deleting content.

do $education_deep_replacement$
declare
  expected_headings constant jsonb := $expected${"03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:1": "Overview", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:2": "Scheduling Classifications & Storage Obligations", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:3": "Labelling Standards for Dispensing Compliance", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:4": "Dispensing Workflow & Patient Counselling", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:5": "Common Pitfalls & Next Steps", "5c3b131f-f733-4295-9f52-5d6cb2058410:1": "Overview", "5c3b131f-f733-4295-9f52-5d6cb2058410:2": "Market Prioritisation Framework", "5c3b131f-f733-4295-9f52-5d6cb2058410:3": "Regulatory Pathway Analysis by Market", "5c3b131f-f733-4295-9f52-5d6cb2058410:4": "Competitive Positioning & Differentiation", "5c3b131f-f733-4295-9f52-5d6cb2058410:5": "Execution Planning & KPIs", "6bff2f95-b4b5-4487-8455-26a5d110e742:1": "Overview", "6bff2f95-b4b5-4487-8455-26a5d110e742:2": "EU-GMP Certification Requirements", "6bff2f95-b4b5-4487-8455-26a5d110e742:3": "Phytosanitary & Import Permits", "6bff2f95-b4b5-4487-8455-26a5d110e742:4": "GDP Logistics Requirements", "6bff2f95-b4b5-4487-8455-26a5d110e742:5": "Common Pitfalls", "7520ef89-8758-4436-860c-e016c53a6d32:1": "Overview", "7520ef89-8758-4436-860c-e016c53a6d32:2": "Plant Variety Protection & Utility Patents", "7520ef89-8758-4436-860c-e016c53a6d32:3": "Cultivar Documentation Standards", "7520ef89-8758-4436-860c-e016c53a6d32:4": "Licensing & Commercialising Cultivar IP", "7520ef89-8758-4436-860c-e016c53a6d32:5": "Common Pitfalls & Next Steps", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:1": "Overview", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:2": "Assessment Domains & Key Questions", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:3": "Running the Assessment: Process & Tools", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:4": "Interpreting Results & Prioritising Remediation", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:5": "Next Steps: From Assessment to Action", "ac01db02-2182-43a3-a1f3-54fd05e56621:1": "Overview", "ac01db02-2182-43a3-a1f3-54fd05e56621:2": "Monitoring Frameworks & Information Sources", "ac01db02-2182-43a3-a1f3-54fd05e56621:3": "Regulatory Change Impact Assessment", "ac01db02-2182-43a3-a1f3-54fd05e56621:4": "Regulatory Engagement & Advocacy", "ac01db02-2182-43a3-a1f3-54fd05e56621:5": "Building a Regulatory Intelligence System", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:1": "Overview", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:2": "Temperature Control Requirements", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:3": "Narcotics Security in Transit", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:4": "GDP Qualification of Logistics Providers", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:5": "Deviation Management & Next Steps", "b4882b28-7039-471f-b580-c19786752be6:1": "Overview", "b4882b28-7039-471f-b580-c19786752be6:2": "Regulatory Prescribing Frameworks", "b4882b28-7039-471f-b580-c19786752be6:3": "Product Selection & Cannabinoid Dosing Principles", "b4882b28-7039-471f-b580-c19786752be6:4": "Documentation & Record-Keeping Requirements", "b4882b28-7039-471f-b580-c19786752be6:5": "Common Pitfalls & Next Steps", "b64698bc-edf3-4b93-96fc-0e9c991a0135:1": "Overview", "b64698bc-edf3-4b93-96fc-0e9c991a0135:2": "Required Analyte Panels by Market", "b64698bc-edf3-4b93-96fc-0e9c991a0135:3": "ISO 17025 & GMP Laboratory Qualification", "b64698bc-edf3-4b93-96fc-0e9c991a0135:4": "Batch Release & Specification Management", "b64698bc-edf3-4b93-96fc-0e9c991a0135:5": "Common Pitfalls & Next Steps", "b65b8dbd-4e12-46fe-8928-99cf520770b1:1": "Overview", "b65b8dbd-4e12-46fe-8928-99cf520770b1:2": "Identifying Licensed Importers by Market", "b65b8dbd-4e12-46fe-8928-99cf520770b1:3": "Importer Due Diligence & Qualification", "b65b8dbd-4e12-46fe-8928-99cf520770b1:4": "Distribution Agreement Key Terms", "b65b8dbd-4e12-46fe-8928-99cf520770b1:5": "Common Pitfalls & Next Steps", "cb3bf297-51ed-4c85-bded-7370e1748d94:1": "Overview", "cb3bf297-51ed-4c85-bded-7370e1748d94:2": "Core Documents Every Proof Pack Needs", "cb3bf297-51ed-4c85-bded-7370e1748d94:3": "Market-Specific Documentation Requirements", "cb3bf297-51ed-4c85-bded-7370e1748d94:4": "Maintaining & Updating Your Proof Pack", "cb3bf297-51ed-4c85-bded-7370e1748d94:5": "Presenting Your Proof Pack to Buyers & Regulators", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:1": "Overview", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:2": "Core GMP Principles Applied to Cannabis", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:3": "EU-GMP Certification Process", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:4": "Documentation & Change Control", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:5": "Common Pitfalls & Next Steps"}$expected$::jsonb;
  target_module_ids constant uuid[] := array[
    '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587'::uuid,
    '5c3b131f-f733-4295-9f52-5d6cb2058410'::uuid,
    '6bff2f95-b4b5-4487-8455-26a5d110e742'::uuid,
    '7520ef89-8758-4436-860c-e016c53a6d32'::uuid,
    '8d4ba66c-776e-44a2-9bc6-7c1e95054a83'::uuid,
    'ac01db02-2182-43a3-a1f3-54fd05e56621'::uuid,
    'af5161a6-07fd-4a1c-9ea7-bd125cd658fe'::uuid,
    'b4882b28-7039-471f-b580-c19786752be6'::uuid,
    'b64698bc-edf3-4b93-96fc-0e9c991a0135'::uuid,
    'b65b8dbd-4e12-46fe-8928-99cf520770b1'::uuid,
    'cb3bf297-51ed-4c85-bded-7370e1748d94'::uuid,
    'edc533ae-e077-4eac-8cb4-01f974a4ce5d'::uuid
  ];
  deep_series_already_applied boolean;
  target_row_count integer;
  exact_baseline_count integer;
  created_timestamp_count integer;
  updated_timestamp_count integer;
  timestamps_untouched boolean;
  deleted_row_count integer;
begin
  if to_regclass('public.education_module_sections') is null then
    raise exception 'education_module_sections must exist before deep-content replacement';
  end if;

  if to_regclass('supabase_migrations.schema_migrations') is null then
    raise exception 'Supabase migration ledger is unavailable; refusing education-content replacement';
  end if;

  select exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260624032532'
  )
  into deep_series_already_applied;

  if deep_series_already_applied then
    raise notice 'Deep education section series already recorded; preserving current content';
    return;
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where expected_headings ? (module_id::text || ':' || section_order::text)
        and expected_headings ->> (module_id::text || ':' || section_order::text) = heading
        and block_type = 'text'
    )::integer,
    count(distinct created_at)::integer,
    count(distinct updated_at)::integer,
    coalesce(bool_and(created_at = updated_at), true)
  into
    target_row_count,
    exact_baseline_count,
    created_timestamp_count,
    updated_timestamp_count,
    timestamps_untouched
  from public.education_module_sections
  where module_id = any(target_module_ids);

  if target_row_count = 0 then
    raise notice 'No concise education rows found; deep series will populate the table';
    return;
  end if;

  if target_row_count <> 60
     or exact_baseline_count <> 60
     or created_timestamp_count <> 1
     or updated_timestamp_count <> 1
     or not timestamps_untouched then
    raise exception
      'Education content differs from untouched 60-row baseline (rows %, matches %, created timestamps %, updated timestamps %, untouched %); manual reconciliation required',
      target_row_count,
      exact_baseline_count,
      created_timestamp_count,
      updated_timestamp_count,
      timestamps_untouched;
  end if;

  delete from public.education_module_sections
  where module_id = any(target_module_ids);

  get diagnostics deleted_row_count = row_count;

  if deleted_row_count <> 60 then
    raise exception 'Expected to replace 60 concise education rows, deleted %', deleted_row_count;
  end if;

  raise notice 'Removed untouched concise education seed; reviewed deep-content series now owns the 60 section keys';
end
$education_deep_replacement$;
