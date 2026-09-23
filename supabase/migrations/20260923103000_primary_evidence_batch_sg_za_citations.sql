-- Supplemental citation enrichment for the Singapore/South Africa tranche.
-- Uses only the first-party URLs already registered in the preceding tranche.
insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence', e.id,
       'Singapore Central Narcotics Bureau — Anti-drug laws on Cannabis',
       null,'official',e.authority_url,e.source_effective_date,current_date,e.rationale
from public.regulatory_market_access_evidence e
where e.evidence_key='primary-evidence-sg-cnb-cannabis-20260923'
and not exists (select 1 from public.regulatory_citations r where r.entity_type='regulatory_market_access_evidence' and r.entity_id=e.id and r.citation_url=e.authority_url);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'regulatory_market_access_evidence', e.id,
       'Rwanda Ministerial Order 3 of 2021 — Cannabis and Cannabis Products',
       'Articles 1, 4 and 5','official',
       'https://rwandalii.org/akn/rw/act/mo/minister-of-health/2021/3/eng@2021-06-28',
       '2021-06-28',current_date,
       'The order expressly establishes licensed cultivation, processing, distribution, import and export of cannabis and cannabis products for medical or research purposes.'
from public.regulatory_market_access_evidence e
where e.evidence_key='primary-evidence-rw-fda-medical-cannabis-20260923'
and not exists (select 1 from public.regulatory_citations r where r.entity_type='regulatory_market_access_evidence' and r.entity_id=e.id and r.citation_url='https://rwandalii.org/akn/rw/act/mo/minister-of-health/2021/3/eng@2021-06-28');