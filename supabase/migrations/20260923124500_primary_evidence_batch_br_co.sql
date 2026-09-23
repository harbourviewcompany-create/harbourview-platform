-- Primary-source regulatory evidence tranche: Brazil and Colombia.
-- Research verified against current government/regulator publications on 2026-09-23.
-- No source hashes are fabricated; executable publication remains gated on source capture.

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — 2026 cannabis production, cultivation and medicinal-product framework','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal','BR','Brazil','BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ANVISA publication covering RDC 1.012/2026, RDC 1.013/2026, RDC 1.014/2026 and the updated medicinal-product framework; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='BR',country='Brazil',iso='BR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ANVISA cannabis regulatory publication verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — RDC 1.023/2026 medicinal cannabis labelling, dispensing and export','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-alinha-normas-a-regras-de-cannabis-aprovada-em-janeiro','BR','Brazil', 'BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary ANVISA publication documenting 2026 rules for labelling, dispensing, product classification and export of medicinal cannabis products and active pharmaceutical ingredients; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','export'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='BR',country='Brazil',iso='BR',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary ANVISA medicinal-cannabis export publication verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia Ministry of Health — Cannabis de uso medicinal','https://www.minsalud.gov.co/salud/medicamentos-y-tecnologias/Paginas/cannabis-uso-medicinal.aspx','CO','Colombia','CO',1,'government_regulator',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Colombian Ministry of Health page documenting licences, quotas and the medical/scientific cannabis framework; verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','licensing'],jsonb_build_object('jurisdiction_key','CO','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='CO',country='Colombia',iso='CO',tier=1,source_type='government_regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Colombian Ministry of Health cannabis source verified 2026-09-23.',verification_checked_at=now(),regulator_class='health_authority',updated_at=now();

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia SUIN-Juriscol — Decreto 613 de 2017','https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463','CO','Colombia','CO',1,'legal',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Colombian legal publication: Decreto 613 entered into force and was published 2017-04-10 and regulates import, export, cultivation, production, manufacture, storage, transport, commercialisation and distribution for medical and scientific purposes; verified 2026-09-23.','2026-09-23','legislature',array['legal','regulatory'],jsonb_build_object('jurisdiction_key','CO','primary_legal_source',true))
on conflict (source_url) do update set jurisdiction_code='CO',country='Colombia',iso='CO',tier=1,source_type='legal',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Colombian legal source verified 2026-09-23.',verification_checked_at=now(),regulator_class='legislature',updated_at=now();

update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2 in ('BR','CO')
  and active=true
  and evidence_key not in ('primary-evidence-br-20260923','primary-evidence-co-20260923');

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-br-20260923','BR','medical_limited_trade',
 'Brazil permits a controlled medicinal/pharmaceutical cannabis production framework for authorized legal entities and regulates medicinal cannabis products through ANVISA. The 2026 framework includes controlled cultivation for medicinal/pharmaceutical purposes, research controls, medicinal product manufacture/import rules, and 2026 rules covering export of medicinal cannabis products and active pharmaceutical ingredients. The cited framework does not establish a general adult-use commercial market.',
 'Agência Nacional de Vigilância Sanitária (ANVISA), Brazil',
 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal',
 '2026-08-04',now(),now()+interval '180 days',true),
('primary-evidence-co-20260923','CO','medical_limited_trade',
 'Colombia has a regulated medical/scientific cannabis market-access framework. Decreto 613 de 2017 regulates import, export, cultivation, production, manufacture, acquisition, storage, transport, commercialisation and distribution of cannabis and derivatives for medical and scientific purposes, with licensing and quota controls administered by the competent authorities. The cited framework does not establish general adult-use commercial retail.',
 'Colombia Ministry of Health and Social Protection / SUIN-Juriscol',
 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463',
 '2017-04-10',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-br-20260923','BR','primary-evidence-claim:br-medical-framework-20260923',
 'Brazil has a controlled cannabis framework for medicinal/pharmaceutical production and research, with ANVISA authorization, security, traceability and product controls; 2026 rules also provide for export of medicinal cannabis products and active pharmaceutical ingredients.',
 'any','national','Agência Nacional de Vigilância Sanitária (ANVISA), Brazil','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-regras-para-producao-de-cannabis-medicinal','2026-08-04',now(),now(),now()+interval '180 days','verified'),
('primary-evidence-co-20260923','CO','primary-evidence-claim:co-medical-framework-20260923',
 'Colombia regulates cannabis import, export, cultivation, production, manufacture, storage, transport, commercialisation and distribution for medical and scientific purposes through a licensed and quota-controlled framework.',
 'any','national','Colombia Ministry of Health and Social Protection / SUIN-Juriscol','https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463','2017-04-10',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    applicability='applicable',
    evidence_basis='Primary regulator/legal sources verified 2026-09-23.',
    last_evaluated_at=now(),
    notes='Primary regulatory evidence and claims refreshed 2026-09-23.'
where jurisdiction_key in ('BR','CO')
  and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Primary regulatory evidence and claims refreshed 2026-09-23.'
where jurisdiction_key in ('BR','CO')
  and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');
