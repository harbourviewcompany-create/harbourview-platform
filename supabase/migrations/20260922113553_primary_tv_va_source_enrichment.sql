-- Primary source registry enrichment for Tuvalu and Holy See.
-- Tuvalu evidence replaces the secondary country-legality record with primary law.
-- Holy See source is registered as primary legal provenance; cannabis-specific qualification remains unresolved.

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Tuvalu Government Legislation — Dangerous Drugs Act 2022 Revised Edition','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','Tuvalu','Tuvalu','TV','TV','legal','legislature','Primary Tuvalu legislation; cannabis-specific provisions verified 2026-09-22.',true,true,'Current-file legal source; 2025 amendment is listed by Tuvalu legislation portal.'
where not exists(select 1 from public.source_registry where source_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf');

insert into public.source_registry
(source_name,source_url,jurisdiction,country,iso,jurisdiction_code,source_type,regulator_class,verification_notes,is_active,crawl_allowed,notes)
select 'Vatican City State — official law on illicit narcotic and psychotropic substances','https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2010/12/30/0813/01870.html','Holy See','Holy See','VA','VA','legal','legislature','Primary Vatican City State law; not treated as cannabis-specific evidence without a cannabis-specific provision.',true,true,'Primary legal source; cannabis-specific qualification remains unresolved.'
where not exists(select 1 from public.source_registry where source_url='https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2010/12/30/0813/01870.html');

update public.regulatory_market_access_evidence set active=false where evidence_key='hv-mkt-complete-tv-20260913';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
select 'primary-evidence-tv-dangerous-drugs-20260922','TV','prohibited','Tuvalu’s current-file Dangerous Drugs Act defines Indian hemp as Cannabis sativa or Cannabis indica and expressly prohibits import/export, cultivation, possession and sale of Indian hemp. The cited Act therefore supports a prohibited commercial cannabis-access tier; no lawful adult-use commercial pathway is established by the cited instrument.','Tuvalu Government Legislation — Dangerous Drugs Act','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',now(),'2027-03-22',true
where not exists(select 1 from public.regulatory_market_access_evidence where evidence_key='primary-evidence-tv-dangerous-drugs-20260922');

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
select 'primary-evidence-tv-dangerous-drugs-20260922','TV','primary-evidence-claim:primary-evidence-tv-dangerous-drugs-20260922','Tuvalu’s Dangerous Drugs Act prohibits import/export, cultivation, possession and sale of Indian hemp, defined in the Act as Cannabis sativa or Cannabis indica; no commercial cannabis retail pathway is established by the cited instrument.','any','TV','Tuvalu Government Legislation — Dangerous Drugs Act','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',now(),now(),'2027-03-22','verified'
where not exists(select 1 from public.regulatory_market_access_claims where claim_key='primary-evidence-claim:primary-evidence-tv-dangerous-drugs-20260922');

do $$
declare pid uuid;
begin
 select id into pid from public.regulatory_pathways where slug='depth-v1-tv';
 if pid is null then
   insert into public.regulatory_pathways
   (country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
   values('39d4e117-d0ae-4669-8f0c-b631afee0ef1','TV','depth-v1-tv','Tuvalu controlled-substance cannabis prohibition pathway','medical_access_program','Dangerous Drugs Act, 2022 Revised Edition, Cap. 10.10','Tuvalu Government / Senior Medical Officer framework','active','2022-12-31','The cited Tuvalu law prohibits import/export, cultivation, possession and sale of Indian hemp. It does not establish a general commercial cannabis pathway.',array['https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf'],'needs_review',now(),array[]::text[])
   returning id into pid;
 end if;
 if not exists(select 1 from public.regulatory_citations where entity_type='pathway' and entity_id=pid and citation_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf') then
   insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
   values('pathway',pid,'Dangerous Drugs Act, 2022 Revised Edition, Cap. 10.10','Sections 4, 7 and 8','regulator','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','2022-12-31',current_date,'The Act defines Indian hemp as Cannabis sativa or Cannabis indica and prohibits import/export, cultivation, possession and sale.');
 end if;
 update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now() where id=pid;
end $$;