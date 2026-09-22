-- Primary-source enrichment for Kentucky, Nebraska, Utah, Indiana and North Carolina.
-- Live data was verified on 2026-09-22. Keep this migration aligned with the
-- production data changes; no synthetic snapshots or hashes are introduced.

update public.source_registry
set jurisdiction='Utah', country='United States', iso='US', sub_region='Utah',
    jurisdiction_code='US-UT', source_type='government_regulator',
    regulator_class='other', tier=1, relevance_status='active',
    verification_notes='Official Utah government source verified 2026-09-22.',
    verification_checked_at=now(), updated_at=now()
where source_url='https://medicalcannabis.utah.gov';

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,sub_region,requires_translation,notes,
 region,language,adapter,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,
 publish_cadence,source_type,crawl_allowed,next_crawl_at,consecutive_failures,network_status,
 content_change_rate,verification_notes,verification_checked_at,content_type,metadata,regulator_class)
values
('Kentucky Medical Cannabis Program','https://kymedcan.ky.gov/Pages/index.aspx','Kentucky',true,'United States','US','Kentucky',false,
 'Official Kentucky Office of Medical Cannabis program source.','north_america','en','html_snapshot','daily','active','US-KY',1,false,
 null,'government_regulator',true,now(),0,'online',0.2,'Official state program source verified 2026-09-22.',now(),
 array['regulation','licensing','market_access']::text[],jsonb_build_object('authority','Kentucky Cabinet for Health and Family Services'),'other'),
('Nebraska Medical Cannabis Commission','https://lcc.nebraska.gov/medical-cannabis/overview','Nebraska',true,'United States','US','Nebraska',false,
 'Official Nebraska government source for medical cannabis program.','north_america','en','html_snapshot','daily','active','US-NE',1,false,
 null,'government_regulator',true,now(),0,'online',0.2,'Official Nebraska government source verified 2026-09-22.',now(),
 array['regulation','licensing','market_access']::text[],jsonb_build_object('authority','Nebraska Medical Cannabis Commission'),'other'),
('Indiana Attorney General — Cannabis Controlled Substances Opinion','https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf','Indiana',true,'United States','US','Indiana',false,
 'Official Indiana Attorney General opinion addressing cannabis and THC controlled-substance treatment.','north_america','en','html_snapshot','daily','active','US-IN',1,false,
 null,'government_legal',true,now(),0,'online',0.15,'Official Indiana Attorney General source verified 2026-09-22.',now(),
 array['law','controlled_substances']::text[],jsonb_build_object('authority','Indiana Attorney General'),'other'),
('North Carolina Executive Order No. 16 — Advisory Council on Cannabis','https://governor.nc.gov/executive-order-no-16-establishing-north-carolina-advisory-council-cannabis','North Carolina',true,'United States','US','North Carolina',false,
 'Official North Carolina Governor executive order concerning statewide cannabis regulatory policy study.','north_america','en','html_snapshot','daily','active','US-NC',1,false,
 null,'government_legal',true,now(),0,'online',0.2,'Official North Carolina government source verified 2026-09-22.',now(),
 array['law','policy','market_regulation']::text[],jsonb_build_object('authority','Office of the Governor of North Carolina'),'other')
on conflict (source_url) do update set
 is_active=true, relevance_status='active', jurisdiction_code=excluded.jurisdiction_code,
 verification_notes=excluded.verification_notes, verification_checked_at=excluded.verification_checked_at,
 updated_at=now();

update public.regulatory_market_access_evidence
set authority_name='Kentucky Medical Cannabis Program',
    authority_url='https://kymedcan.ky.gov/Pages/index.aspx',
    source_effective_date='2026-09-22', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Kentucky operates a regulated medical cannabis program under KRS Chapter 218B with licensed cannabis businesses and dispensaries; the official program states cannabis consumption outside the medical program remains illegal.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-ky-20260831';

update public.regulatory_market_access_evidence
set authority_name='Nebraska Medical Cannabis Commission',
    authority_url='https://lcc.nebraska.gov/medical-cannabis/overview',
    source_effective_date='2026-07-01', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Nebraska has a state medical cannabis regulatory program; Nebraska government reported permanent medical-marijuana regulations were approved July 1, 2026 and filed to become law five days after receipt.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-ne-20260831';

update public.regulatory_market_access_evidence
set authority_name='Indiana Attorney General',
    authority_url='https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf',
    source_effective_date='2023-01-01', verified_at=now(),
    expires_at=now()+interval '180 days',
    rationale='Indiana Attorney General Opinion 2023-1 states cannabis extracts are controlled substances under Indiana law, subject to limited hemp/low-THC exceptions; no state medical or adult-use commercial cannabis retail pathway is established by the cited opinion.',
    source_snapshot_sha256=null
where evidence_key='ncsl-us-in-20260831';

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,
 source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('ncsl-us-ky-20260831','US-KY','primary-evidence-claim:ncsl-us-ky-20260831',
 'Kentucky operates a regulated medical cannabis program with licensed cannabis businesses and dispensaries; cannabis consumption outside the medical cannabis program remains illegal.',
 'any','jurisdiction','Kentucky Medical Cannabis Program','https://kymedcan.ky.gov/Pages/index.aspx','2026-09-22',now(),now(),now()+interval '180 days','verified'),
('ncsl-us-ne-20260831','US-NE','primary-evidence-claim:ncsl-us-ne-20260831',
 'Nebraska has a regulated medical cannabis program, with permanent medical-marijuana regulations approved by state government in July 2026.',
 'any','jurisdiction','Nebraska Medical Cannabis Commission','https://lcc.nebraska.gov/medical-cannabis/overview','2026-07-01',now(),now(),now()+interval '180 days','verified'),
('ncsl-us-in-20260831','US-IN','primary-evidence-claim:ncsl-us-in-20260831',
 'Indiana law treats cannabis extracts as controlled substances, subject to limited hemp/low-THC exceptions; no statewide medical or adult-use commercial cannabis retail pathway is established by the cited Indiana Attorney General opinion.',
 'any','jurisdiction','Indiana Attorney General','https://www.in.gov/attorneygeneral/files/Official-Opinion-2023-1.pdf','2023-01-01',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set
 claim_text=excluded.claim_text, authority_name=excluded.authority_name, authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date, retrieved_at=excluded.retrieved_at,
 verified_at=excluded.verified_at, expires_at=excluded.expires_at,
 evidence_status='verified', updated_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-KY','depth-v1-us-ky','Kentucky medical cannabis commercial access','medical_access_program',
 'KRS Chapter 218B','Kentucky Cabinet for Health and Family Services','active','2025-01-01',
 'Kentucky operates a regulated medical cannabis program with licensed cultivators, processors, producers, safety compliance facilities and dispensaries.',
 'Patients access medical cannabis through the state program and authorized practitioners.',
 '{https://kymedcan.ky.gov/Pages/index.aspx}'::text[],'needs_review','2026-09-22',
 ARRAY['cancer','chronic severe intractable or debilitating pain','epilepsy or intractable seizure disorder','multiple sclerosis',
 'chronic nausea or cyclical vomiting syndrome','post-traumatic stress disorder']::text[],'authorized medical practitioners',18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-NE','depth-v1-us-ne','Nebraska medical cannabis commercial access','medical_access_program',
 'Nebraska Medical Cannabis Act and implementing regulations','Nebraska Medical Cannabis Commission','active','2026-07-01',
 'Nebraska maintains a state medical cannabis regulatory program with permanent medical-marijuana regulations approved in July 2026.',
 'Medical cannabis access is governed through the state commission and applicable regulations.',
 '{https://lcc.nebraska.gov/medical-cannabis/overview}'::text[],'needs_review','2026-09-22',
 ARRAY['qualifying medical conditions']::text[],null,18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,
 prescription_notes,source_urls,verification,last_verified_at,qualifying_conditions,prescriber_scope,min_age,reimbursement)
select c.id,'US-UT','depth-v1-us-ut','Utah medical cannabis commercial access','medical_access_program',
 'Utah Code Title 26B and Title 58; Utah medical cannabis administrative rules','Utah Center for Medical Cannabis / Utah Department of Agriculture and Food','active','2026-05-06',
 'Utah operates a regulated medical cannabis program with patient registration, licensed medical cannabis pharmacies and state-specific product and dispensing controls.',
 'Medical cannabis is accessed through the state electronic verification system and licensed medical cannabis pharmacies.',
 '{https://medicalcannabis.utah.gov/}'::text[],'needs_review','2026-09-22',
 ARRAY['qualifying medical conditions']::text[],'authorized medical providers',18,null
from public.countries c where c.iso_alpha2='US'
on conflict (slug) do nothing;

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'KRS Chapter 218B',null,'regulator',
 'https://kymedcan.ky.gov/Pages/index.aspx','2025-01-01','2026-09-22',
 'Official Kentucky Medical Cannabis Program describes the statutory program and licensed medical cannabis businesses.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ky'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Nebraska Medical Cannabis Act and 2026 permanent regulations',null,'regulator',
 'https://lcc.nebraska.gov/medical-cannabis/overview','2026-07-01','2026-09-22',
 'Official Nebraska government source identifies the state medical cannabis regulatory program; permanent regulations were approved July 1, 2026.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ne'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',rp.id,'Utah Code Title 26B / Title 58',null,'regulator',
 'https://medicalcannabis.utah.gov/resources/utah-medical-cannabis-law/','2026-05-06','2026-09-22',
 'Official Utah Center for Medical Cannabis lists governing code, administrative rules and the 2026 law update.'
from public.regulatory_pathways rp where rp.slug='depth-v1-us-ut'
and not exists (select 1 from public.regulatory_citations rc where rc.entity_type='pathway' and rc.entity_id=rp.id);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug in ('depth-v1-us-ky','depth-v1-us-ne','depth-v1-us-ut');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key='source_registry' and jurisdiction_key in ('US-KY','US-NE','US-UT','US-IN','US-NC');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where dimension_key in ('verified_regulatory_evidence','verified_regulatory_claims','verified_pathways')
  and jurisdiction_key in ('US-KY','US-NE','US-UT','US-IN');
