-- Primary Ghana format and regulatory-calendar enrichment from NACOC and Ghana Ministry of the Interior.
insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,effective_date,packaging_labelling)
select '5796e807-c701-4c51-80a5-fdaf74a60ddb',pf.id,'permitted',
'{"licensed_processing":true,"low_thc_max":0.3}'::jsonb,
'Ghana NACOC processing licence identifies oils and extracts as finished goods produced under licensed processing; applicable low-THC and compliance controls remain in force.',
array['https://portal.ncc.gov.gh/licenses/processing'],'needs_review','2026-02-26',
'NACOC requires THC/CBD content, allergens, dosage and warnings on labels.'
from public.product_formats pf where pf.slug in ('oral_oil','extracts_concentrates')
and not exists(select 1 from public.pathway_format_rules pfr where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb' and pfr.format_id=pf.id);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'rule',pfr.id,'Ghana NACOC Processing Licence','Processing licence — finished goods','regulator',
'https://portal.ncc.gov.gh/licenses/processing','2026-02-26',current_date,
'Processing licence authorizes processing raw cannabis into finished goods such as oils, extracts, fabrics, or other industrial/medicinal products.'
from public.pathway_format_rules pfr
join public.product_formats pf on pf.id=pfr.format_id
where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb'
and pf.slug in ('oral_oil','extracts_concentrates')
and not exists(select 1 from public.regulatory_citations c where c.entity_type='rule' and c.entity_id=pfr.id and c.citation_url='https://portal.ncc.gov.gh/licenses/processing');

update public.pathway_format_rules pfr set verification='verified',updated_at=now()
from public.product_formats pf
where pfr.pathway_id='5796e807-c701-4c51-80a5-fdaf74a60ddb'
and pfr.format_id=pf.id and pf.slug in ('oral_oil','extracts_concentrates');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'GH','effective','Ghana Cannabis Regulatory Programme opened for implementation','2026-02-26','confirmed',
'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/','Republic of Ghana — Ministry of the Interior','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='GH' and title='Ghana Cannabis Regulatory Programme opened for implementation');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'GH','effective','NACOC presents first cannabis cultivation licences','2026-07-31','confirmed',
'https://www.ncc.gov.gh/2026/07/%F0%9D%90%8D%F0%9D%90%80%F0%9D%90%82%F0%9D%90%8E%F0%9D%90%82-%F0%9D%90%AB%F0%9D%90%AC%F0%9D%90%AC%F0%9D%90%A7%F0%9D%90%AD%F0%9D%90%AC-%F0%9D%90%82%F0%9D%90%9A%F0%9D%90%A7/','Narcotics Control Commission — Ghana','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='GH' and title='NACOC presents first cannabis cultivation licences');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary NACOC processing rules identify oils and extracts as finished goods and prescribe product labelling; Ministry of Interior and NACOC confirm 2026 programme implementation and first licences.',
last_evaluated_at=now()
where jurisdiction_key='GH' and dimension_key in ('verified_format_rules','regulatory_calendar');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='GH' and dimension_key in ('verified_format_rules','regulatory_calendar')
and status in ('open','in_progress','blocked');
