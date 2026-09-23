-- Complete the primary Kazakhstan depth layer without inventing unsupported product formats.
insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
(
  (select id from public.countries where iso_alpha2='KZ'),
  'KZ',
  'depth-v1-kz-industrial-cannabis',
  'Licensed industrial cannabis cultivation authorization',
  'domestic_authorization',
  'Government Decree No. 797 (2025), as amended by Government Decree No. 259 (2026)',
  'Government of Kazakhstan',
  'active',
  '2025-09-26',
  'Licensed legal entities may cultivate approved cannabis varieties for industrial purposes unrelated to narcotic or psychotropic production, subject to government cultivation requirements and THC controls. This is not an adult-use retail pathway.',
  '{https://adilet.zan.kz/rus/docs/P2500000797}',
  'needs_review',
  now(),
  ARRAY['industrial purposes only','approved varieties','THC limit applies']
)
on conflict (slug) do update
set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,
    regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,
    summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now(),
    qualifying_conditions=excluded.qualifying_conditions;

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select
  'pathway',id,'Government Decree No. 797',
  'Requirements for cultivation of cannabis for industrial purposes',
  'statute','https://adilet.zan.kz/rus/docs/P2500000797',
  '2025-09-26',current_date,
  'Establishes requirements for cultivation of cannabis for industrial purposes unrelated to production or manufacture of narcotic and psychotropic substances, including THC testing and controls.'
from public.regulatory_pathways
where slug='depth-v1-kz-industrial-cannabis'
and not exists (
  select 1 from public.regulatory_citations c
  where c.entity_type='pathway'
    and c.entity_id=public.regulatory_pathways.id
    and c.citation_url='https://adilet.zan.kz/rus/docs/P2500000797'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-kz-industrial-cannabis';

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select
  'KZ','effective',
  'Industrial cannabis cultivation framework — Decree No. 797',
  'Kazakhstan established requirements for licensed industrial cannabis cultivation unrelated to narcotic or psychotropic production; the framework was amended in 2026 by Decree No. 259.',
  '2025-09-26','confirmed',
  'https://adilet.zan.kz/rus/docs/P2500000797',
  'Republic of Kazakhstan — Adilet','effective'
where not exists (
  select 1 from public.regulatory_calendar
  where iso2='KZ'
    and title='Industrial cannabis cultivation framework — Decree No. 797'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Kazakhstan legislation establishes a verified industrial-cannabis authorization pathway and confirmed effective date.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from Decree No. 797 and 2026 amendment.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',
    evidence_basis='Primary Kazakhstan sources establish industrial hemp/cannabis cultivation controls but do not establish commercial adult-use or medical product-format rules.',
    last_evaluated_at=now(),
    notes='No unsupported product formats inferred.'
where jurisdiction_key='KZ'
  and dimension_key='verified_format_rules';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified industrial authorization pathway and effective-date calendar from primary Kazakhstan sources.'
where jurisdiction_key='KZ'
  and dimension_key in ('verified_pathways','regulatory_calendar','verified_format_rules');
