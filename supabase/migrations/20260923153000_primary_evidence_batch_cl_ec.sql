-- Primary-source evidence tranche: Chile and Ecuador.
-- Verified against government/regulator sources on 2026-09-23.
-- Unsupported dimensions remain unresolved.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Chile ISP — narcotics/psychotropics control and cannabis procedures','https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','CL','Chile','CL',1,'regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','ISP states it controls lawful narcotics and psychotropics nationally and identifies requirements for import, export, domestic distribution, dispensing and destruction; cannabis procedures are included in the official framework. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','import','export','distribution','dispensing'],jsonb_build_object('jurisdiction_key','CL','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Chile ISP controlled-substances and cannabis procedures verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Ecuador ARCSA — cannabis/hemp finished-product technical regulation','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','EC','Ecuador','EC',1,'regulator',true,true,'south_america','es','pdf_snapshot','monthly','verified',now()+interval '30 days','online','ARCSA regulation establishes controls for non-psychoactive cannabis/hemp finished products, including manufacturing, commercialization and import requirements, and specifies ARCSA authorization/registration conditions. Verified 2026-09-23.','2026-09-23','medicines_regulator',array['regulatory','hemp','finished_products','import'],jsonb_build_object('jurisdiction_key','EC','primary_regulator',true))
on conflict (source_url) do update set verification_notes='ARCSA cannabis/hemp finished-product regulation verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '30 days',updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-cl-20260923','CL','medical_limited_trade',
 'Chile applies controlled-substance requirements to cannabis and derivatives. The ISP identifies official requirements for import/export certificates, domestic distribution, dispensing and transport, while pharmaceutical products require sanitary registration before distribution or use.',
 'Instituto de Salud Pública de Chile (ISP)',
 'https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/',
 '2011-06-25',now(),now()+interval '180 days',true),
('primary-evidence-ec-20260923','EC','medical_limited_trade',
 'Ecuador regulates medicinal cannabis/cannabinoid products through ARCSA and health regulations. The ARCSA technical regulation establishes authorization and registration controls for non-psychoactive cannabis/hemp finished products, including manufacture, commercialization and import.',
 'Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA)',
 'https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf',
 '2021-02-03',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-cl-20260923','CL','primary-evidence-claim:cl-controlled-cannabis-framework-20260923',
 'Chile requires controlled-substance authorization procedures for cannabis-related import/export and regulated domestic distribution/dispensing; pharmaceutical products also require sanitary registration before distribution or use.',
 'any','national','Instituto de Salud Pública de Chile (ISP)','https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','2011-06-25',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-ec-20260923','EC','primary-evidence-claim:ec-nonpsychoactive-cannabis-product-controls-20260923',
 'Ecuador requires ARCSA authorization/registration controls for specified finished products containing non-psychoactive cannabis or hemp, including imported products, and requires authorized establishments for applicable manufacturing and commercialization.',
 'non_psychoactive','national','Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA)','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','2021-02-03',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'CL','depth-v1-cl-controlled-medical-cannabis','Controlled medicinal cannabis and pharmaceutical distribution/import pathway','domestic_authorization',
'DS 404/1983; DS 3/2010; Law 20.000 and implementing controlled-substance rules',
'Instituto de Salud Pública de Chile','active',null,
'Chile subjects cannabis-related controlled substances to ISP authorization and control. Official ISP material identifies annual forecasts, official import/export certificates, controlled-product distribution documentation, prescription-based dispensing, transport authorization and destruction controls. Pharmaceutical products require sanitary registration before distribution or use.',
array['https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','https://www.ispch.cl/anamed/medicamentos/registro-sanitario-de-productos-farmaceuticos/'],
'needs_review',now()
from public.countries c where c.iso2='CL'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'EC','depth-v1-ec-nonpsychoactive-cannabis-products','Regulated non-psychoactive cannabis/hemp product pathway','licensed_market',
'ARCSA-DE-002-2021-MAFG; Acuerdo Ministerial 109; medicinal-cannabis therapeutic-use regulations',
'ARCSA / Ministry of Health','active','2021-02-03',
'Ecuador regulates specified finished products containing non-psychoactive cannabis or hemp. ARCSA rules require operating authorization and product registration/notification as applicable; imported finished products are subject to registration/notification requirements, while applicable medicines and medicinal products are subject to pharmaceutical controls.',
array['https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/06/Acuerdo-Ministerial-148_Reglamento-para-el-uso-terapeutico-prescripcion-y-dispensacion-del-cannabis-medicinal-y-productos-farmaceuticos-que-contienen-cannabinoides.pdf'],
'needs_review',now()
from public.countries c where c.iso2='EC'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'DS 404/1983 and DS 3/2010','Controlled substances and pharmaceutical registration','regulator',
'https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/','2011-06-25',current_date,
'ISP identifies import/export, distribution, dispensing and transport controls for controlled substances and its official cannabis procedures.'
from public.regulatory_pathways p where p.iso_alpha2='CL' and p.slug='depth-v1-cl-controlled-medical-cannabis'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.ispch.cl/anamed/medicamentos/estupefacientes-y-psicotropicos/');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'ARCSA-DE-002-2021-MAFG','Arts. 8-12','regulator',
'https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf','2021-02-03',current_date,
'Regulates manufacture, commercialization and import of specified finished products containing non-psychoactive cannabis/hemp and requires applicable ARCSA authorization or registration.'
from public.regulatory_pathways p where p.iso_alpha2='EC' and p.slug='depth-v1-ec-nonpsychoactive-cannabis-products'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.controlsanitario.gob.ec/wp-content/uploads/downloads/2021/02/Resolucion-ARCSA-DE-002-2021-MAFG_Normativa-Tecnica-Sanitaria-para-la-regulacion-y-control-de-productos-terminados-de-uso-y-consumo-humano-que-contengan-Cannabis-No-Psicoactivo-o-Canamo.pdf');

update public.regulatory_pathways p set verification='verified',last_verified_at=now()
where p.iso_alpha2 in ('CL','EC') and p.slug in ('depth-v1-cl-controlled-medical-cannabis','depth-v1-ec-nonpsychoactive-cannabis-products') and p.verification='needs_review';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary government/regulator sources verified 2026-09-23.',last_evaluated_at=now(),
notes='Primary evidence tranche added; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('CL','EC') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Primary evidence tranche added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('CL','EC') and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
