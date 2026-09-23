-- Additional primary pathway depth: Argentina and Jamaica.
-- Current first-party sources verified 2026-09-23.
-- No adult-use market inference is made.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ARICCAME — Resolución 69/2026 cannabis and hemp licensing regime','https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','AR','Argentina','AR',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ARICCAME resolution published 2026-09-03; establishes licensing for non-psychoactive Cannabis sativa material and related commercial activities and confirms ARICCAME licensing authority under Law 27.669. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','licensing','commercialisation'],jsonb_build_object('jurisdiction_key','AR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='AR',country='Argentina',iso='AR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ARICCAME Resolution 69/2026 verified 2026-09-23.',verification_checked_at=now(),regulator_class='cannabis_regulator',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Jamaica Cannabis Licensing Authority — Retail Herb House online sales measures','https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf','JM','Jamaica','JM',1,'regulator',true,true,'caribbean','en','pdf_snapshot','monthly','verified',now()+interval '30 days','online','Primary Cannabis Licensing Authority guidance states licensed Retail Herb Houses may sell ganja for medical or therapeutic purposes under the 2016 interim regulations and describes online ordering with exchange on licensed premises. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','retail','medical'],jsonb_build_object('jurisdiction_key','JM','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='JM',country='Jamaica',iso='JM',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '30 days',network_status='online',verification_notes='Primary Jamaica CLA retail guidance verified 2026-09-23.',verification_checked_at=now(),regulator_class='cannabis_regulator',updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'AR','depth-v1-ar-medical-cannabis','Licensed medicinal cannabis and non-psychoactive cannabis value-chain activities','domestic_authorization',
'Law 27.669; Decree 405/2023; ARICCAME Resolutions 41/2026 and 69/2026',
'ARICCAME','active','2026-10-16',
'Argentina regulates cannabis and hemp value-chain activities through ARICCAME licences. Resolution 69/2026 specifically regulates non-psychoactive Cannabis sativa inflorescences, biomass and plant material and related conditioning, storage, transport and commercialisation, including local and foreign-trade operations where the regime requires a licence. The medical cannabis and industrial hemp regimes remain distinct.',
array['https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','https://www.argentina.gob.ar/normativa/nacional/norma-427162/texto'],
'needs_review',now()
from public.countries c where c.iso2='AR'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'JM','depth-v1-jm-medical-therapeutic','Licensed medical and therapeutic cannabis handling and retail','licensed_market',
'Dangerous Drugs Act as amended in 2015; Dangerous Drugs (Cannabis Licensing) (Interim) Regulations 2016',
'Cannabis Licensing Authority (CLA)','active','2016-01-01',
'Jamaica licenses handling of hemp and ganja for medical, therapeutic or scientific purposes. CLA guidance confirms licensed Retail Herb Houses may sell ganja for medical or therapeutic purposes under the interim regulations, with online ordering permitted subject to exchange/barter on the licensed premises. This is not an unrestricted adult-use retail pathway.',
array['https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf'],
'needs_review',now()
from public.countries c where c.iso2='JM'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'ARICCAME Resolution 69/2026','Articles 1-2 and Annex I','regulation',
'https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto',
'2026-09-03',current_date,
'ARICCAME Resolution 69/2026 establishes a licensing regime for non-psychoactive Cannabis sativa inflorescences, biomass and other plant material and related activities; commercial local and foreign-trade operations require the applicable ARICCAME licence.'
from public.regulatory_pathways p where p.iso_alpha2='AR' and p.slug='depth-v1-ar-medical-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Dangerous Drugs (Cannabis Licensing) (Interim) Regulations 2016','Regulation 24 / CLA retail guidance','regulation',
'https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf',
'2020-05-11',current_date,
'CLA guidance states a licensed Retail Herb House may sell ganja for medical or therapeutic purposes and permits online ordering subject to exchange or barter on the licensed premises.'
from public.regulatory_pathways p where p.iso_alpha2='JM' and p.slug='depth-v1-jm-medical-therapeutic'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://cla.org.jm/sites/default/files/documents/Interim%20Measures%20for%20Online%20Sales%20and%20Purchases%20%28Retail%20Herb%20House%29.pdf');


update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='AR' and slug='depth-v1-ar-medical-cannabis' and verification='needs_review';

update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='JM' and slug='depth-v1-jm-medical-therapeutic' and verification='needs_review';
insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'AR','effective','ARICCAME Resolution 69/2026 licensing regime effective','2026-10-16','confirmed',
'https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','ARICCAME','scheduled'
where not exists(select 1 from public.regulatory_calendar where iso2='AR' and title='ARICCAME Resolution 69/2026 licensing regime effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary ARICCAME and Jamaica CLA sources verified 2026-09-23.',
last_evaluated_at=now(),notes='Pathway-level primary evidence added; remaining dimensions require separate source-backed research.'
where jurisdiction_key in ('AR','JM') and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary pathway depth added 2026-09-23; remaining dimensions unresolved.'
where jurisdiction_key in ('AR','JM') and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
