-- Primary-source evidence tranche: Peru and Uruguay.
-- Sources verified 2026-09-23. Unsupported dimensions remain unresolved.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Peru DIGEMID — medicinal cannabis and derivatives regulatory framework','https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','PE','Peru','PE',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Current DIGEMID page states Laws 30681 and 31312 plus DS 004-2023-SA regulate medicinal/therapeutic cannabis, including research, production, import and commercialization; page lists licensed establishments and patient/product controls. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','medical','licensing'],jsonb_build_object('jurisdiction_key','PE','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current DIGEMID medicinal-cannabis framework verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Uruguay IRCCA — medicinal/research licensing and 2026 licence reforms','https://www.gub.uy/tramites/solicitud-licencias-cannabis-uso-medicinal-investigacion-cientifica','UY','Uruguay','UY',1,'government_regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Government procedure identifies IRCCA licensing for medicinal cannabis and scientific research, including cultivation licensing and application requirements. IRCCA 2026 Resolution 18/2026 reduced medicinal licence costs, removed production licence categories and extended licence duration retroactive to 2026-01-01. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['regulatory','licensing','medical','research'],jsonb_build_object('jurisdiction_key','UY','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Uruguay government/IRCCA medicinal and research licensing source verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Uruguay IRCCA — approved cannabis licences','https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','UY','Uruguay','UY',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Current IRCCA approved-licences page lists active licences for psychoactive cannabis cultivation for adult use and separate medicinal cultivation licences. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['licensing','adult_use','medical'],jsonb_build_object('jurisdiction_key','UY','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current IRCCA approved-licences page verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-pe-20260923','PE','medical_limited_trade',
 'Peru regulates medicinal and therapeutic cannabis through a national framework covering research, production, import and commercialization. DIGEMID states authorized products require the applicable sanitary authorization, licensed pharmacies/boticas may commercialize derivatives, and associative cultivation production is not commercialized.',
 'Dirección General de Medicamentos, Insumos y Drogas (DIGEMID), Peru',
 'https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/',
 '2023-04-18',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-pe-20260923','PE','primary-evidence-claim:pe-medical-framework-20260923',
 'Peru permits regulated medicinal and therapeutic cannabis research, production, import and commercialization; authorized products require applicable sanitary authorization and licensed pharmaceutical establishments may commercialize derivatives.',
 'any','national','Dirección General de Medicamentos, Insumos y Drogas (DIGEMID), Peru','https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','2023-04-18',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'PE','depth-v1-pe-medical-therapeutic','Licensed medicinal and therapeutic cannabis production and trade','domestic_authorization',
'Law 30681; Law 31312; Decreto Supremo 004-2023-SA',
'DIGEMID / Ministry of Health','active','2023-04-18',
'Peru regulates medicinal and therapeutic cannabis and derivatives through licensing, sanitary registration/authorization and controlled pharmaceutical distribution. DIGEMID identifies research, production, import and commercialization within the regulated framework and lists licensed establishments for import and/or commercialization.',
array['https://www.digemid.minsa.gob.pe/webDigemid/uso-medicinal-del-cannabis-y-sus-derivados/','https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa'],
'needs_review',now()
from public.countries c where c.iso2='PE'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'UY','depth-v1-uy-medicinal-research','Licensed medicinal cannabis and scientific-research production','domestic_authorization',
'Law 19.172 and implementing regulations; IRCCA Resolution 18/2026',
'Instituto de Regulación y Control del Cannabis (IRCCA)','active','2026-01-01',
'Uruguay maintains a licensing regime for medicinal cannabis and scientific research. The current government procedure requires an IRCCA licence and identifies cultivation as a licensed activity; IRCCA Resolution 18/2026 changed medicinal/research licence costs, production categories and duration with retroactive effect from 2026-01-01.',
array['https://www.gub.uy/tramites/solicitud-licencias-cannabis-uso-medicinal-investigacion-cientifica','https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/'],
'needs_review',now()
from public.countries c where c.iso2='UY'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'UY','depth-v1-uy-adult-use-cultivation','Licensed psychoactive cannabis cultivation for adult-use market',
'licensed_market','Law 19.172 and implementing regulations','IRCCA','active',null,
'IRCCA current licence records identify active licences for psychoactive cannabis cultivation for adult use. This record evidences licensed cultivation, not a claim that every retail or cross-border commercial activity is permitted.',
array['https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/'],
'needs_review',now()
from public.countries c where c.iso2='UY'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Decreto Supremo 004-2023-SA','Cannabis medicinal and therapeutic regulation','statute',
'https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa','2023-04-18',current_date,
'Approves the regulation governing medicinal and therapeutic cannabis and its derivatives.'
from public.regulatory_pathways p where p.iso_alpha2='PE' and p.slug='depth-v1-pe-medical-therapeutic'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.gob.pe/institucion/minsa/normas-legales/4139565-004-2023-sa');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'IRCCA Resolution 18/2026','Medicinal/research licence reforms','regulator',
'https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/',null,current_date,
'IRCCA reports lower medicinal licence costs, eliminated research costs and longer licence duration, retroactive to 2026-01-01.'
from public.regulatory_pathways p where p.iso_alpha2='UY' and p.slug='depth-v1-uy-medicinal-research'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/');

insert into public.regulatory_citations(entity_type,entity_id,instrument,'Licence register','regulator',
'https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/','2026-09-23',current_date,
'Current IRCCA register lists active licences for psychoactive cannabis cultivation for adult use.'
from public.regulatory_pathways p where p.iso_alpha2='UY' and p.slug='depth-v1-uy-adult-use-cultivation'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://ircca.gub.uy/proyectos-cannabis/licencias-aprobadas/');

update public.regulatory_pathways p set verification='verified',last_verified_at=now()
where p.iso_alpha2 in ('PE','UY') and p.slug in ('depth-v1-pe-medical-therapeutic','depth-v1-uy-medicinal-research','depth-v1-uy-adult-use-cultivation')
and p.verification='needs_review';

insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'UY','change','IRCCA Resolution 18/2026 medicinal/research licence reforms effective retroactively','2026-01-01','confirmed',
'https://ircca.gub.uy/ircca-adopta-medidas-con-el-objetivo-de-desburocratizar-y-favorecer-el-acceso-a-licencias/',
'IRCCA','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='UY' and title='IRCCA Resolution 18/2026 medicinal/research licence reforms effective retroactively');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government/regulator sources verified 2026-09-23.',last_evaluated_at=now(),
notes='Primary evidence tranche added; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('PE','UY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary evidence tranche added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('PE','UY') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','regulatory_calendar');
