-- Primary Mauritius medicinal-cannabis depth.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2='MU' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Mauritius — Dangerous Drugs Act (current revised text)',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 'MU','Mauritius','MU',1,'legislation',true,true,'africa','en','html_snapshot','weekly','verified',
 now()+interval '7 days','online',
 'Official Mauritius Laws portal current Dangerous Drugs Act; medicinal cannabis provisions and definitions reviewed 2026-09-23.',
 '2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set jurisdiction_code='MU',is_active=true,relevance_status='verified',
next_crawl_at=now()+interval '7 days',
verification_notes='Official Mauritius Laws portal current Dangerous Drugs Act verified 2026-09-23.',
verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-mu-medicinal-cannabis-20260923','MU','medical_limited_trade',
 'Mauritius prohibits general cannabis cultivation and commercial trade under the Dangerous Drugs Act, but its medicinal-cannabis provisions establish a controlled medical pathway. The current law defines medicinal cannabis as a cannabis product in specified forms including capsules, oil-based solutions/suspensions and oro-mucosal spray, with THC concentration and volume limits; medicinal cannabis importation is restricted to Ministry-authorized channels.',
 'Attorney-General''s Office / Government of Mauritius',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,
authority_name=excluded.authority_name,authority_url=excluded.authority_url,
source_effective_date=excluded.source_effective_date,verified_at=now(),
expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-mu-medicinal-cannabis-20260923','MU',
 'primary-evidence-claim:mu-medicinal-cannabis-20260923',
 'Mauritius maintains a controlled medicinal-cannabis pathway under the Dangerous Drugs Act. The law defines medicinal cannabis in specified pharmaceutical forms and restricts importation to Ministry-authorized channels; general cannabis cultivation and Schedule I commercial trade remain prohibited outside statutory exceptions.',
 'any','national','Attorney-General''s Office / Government of Mauritius',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,
authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
((select id from public.countries where iso_alpha2='MU'),'MU',
 'depth-v1-mu-medicinal-cannabis','Controlled medicinal cannabis pathway','medical_access_program',
 'Dangerous Drugs Act 2000 as amended by Act 17 of 2022','Ministry responsible for Health','active','2023-03-10',
 'Controlled medicinal cannabis may be supplied through the statutory medical framework; importation requires Ministry authorization and the law defines permitted medicinal-cannabis dosage forms.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),ARRAY['Ministry authorization for import','prescription/medical use','specified dosage forms']);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Dangerous Drugs Act 2000 as amended',
 'Medicinal cannabis provisions including importation and definition','statute',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',current_date,'The current Act defines medicinal cannabis and provides controlled importation and medical-use provisions.'
from public.regulatory_pathways
where slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway'
and c.entity_id=public.regulatory_pathways.id
and c.citation_url='https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act');

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-mu-medicinal-cannabis';

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true),
 'Medicinal cannabis is defined by law in this dosage form.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='capsules'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true,'max_thc_mg_per_ml',30,'max_total_volume_ml',60),
 'Medicinal cannabis may be an oil-based solution or suspension within statutory THC and volume limits.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='oral_oil'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.pathway_format_rules
(pathway_id,format_id,status,conditions,notes,source_urls,verification,last_verified_at,effective_date)
select p.id,f.id,'permitted',jsonb_build_object('medicinal_cannabis',true,'max_thc_mg_per_ml',30,'max_total_volume_ml',60),
 'Medicinal cannabis may be an oro-mucosal spray within statutory THC and volume limits.',
 '{https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act}',
 'needs_review',now(),'2023-03-10'
from public.regulatory_pathways p join public.product_formats f on f.slug='oromucosal_spray'
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.pathway_format_rules r where r.pathway_id=p.id and r.format_id=f.id);

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'rule',r.id,'Dangerous Drugs Act 2000 as amended',
 'Definition of medicinal cannabis and permitted dosage forms','statute',
 'https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act',
 '2023-03-10',current_date,
 'The Act defines medicinal cannabis as a capsule, oil-based solution or suspension, or oro-mucosal spray, with statutory THC concentration and volume limits.'
from public.pathway_format_rules r
join public.regulatory_pathways p on p.id=r.pathway_id
where p.slug='depth-v1-mu-medicinal-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='rule'
and c.entity_id=r.id
and c.citation_url='https://lawsofmauritius.govmu.org/portal/viewlegislationdocument/web/?docnumber=&doctitle=RGFuZ2Vyb3VzIERydWdzIEFjdA%3D%3D&doctype=act');

update public.pathway_format_rules r
set verification='verified',last_verified_at=now(),updated_at=now()
from public.regulatory_pathways p
where r.pathway_id=p.id and p.slug='depth-v1-mu-medicinal-cannabis';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Mauritius law verifies source provenance, medicinal-cannabis evidence, controlled medical pathway and defined dosage forms.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from current Dangerous Drugs Act.'
where jurisdiction_key='MU'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified 2026-09-23 from current Mauritius primary law.'
where jurisdiction_key='MU'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules');
