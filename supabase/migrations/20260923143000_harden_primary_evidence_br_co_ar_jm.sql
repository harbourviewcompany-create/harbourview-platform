-- Evidence-depth correction/hardening for BR, CO, AR and JM.
-- This migration only strengthens source-backed dimensions and corrects overbroad
-- claims; it does not mark unsupported 291x32 cells complete.

-- Brazil: add exact 2026 product-framework effective date and a dedicated
-- medicinal-product pathway source.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('ANVISA — RDC 1.015/2026 cannabis medicinal product authorization','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-perguntas-e-respostas-sobre-a-autorizacao-sanitaria-de-produtos-de-cannabis','BR','Brazil','BR',1,'regulator',true,true,'south_america','pt','html_snapshot','weekly','verified',now()+interval '7 days','online','ANVISA states RDC 1.015/2026 updated the authorization framework for manufacture and import of human medicinal cannabis products and entered into force 2026-05-04. Verified 2026-09-23.','2026-09-23','health_authority',array['regulatory','medicinal_products'],jsonb_build_object('jurisdiction_key','BR','primary_regulator',true))
on conflict (source_url) do update set verification_notes='ANVISA states RDC 1.015/2026 entered into force 2026-05-04 and updated the medicinal cannabis product authorization framework; verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

-- Colombia: retain medical-limited classification but explicitly record the
-- 2025 reform's medical-only finished-product restriction.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Colombia — Decreto 1138 de 2025 medical cannabis access reform','https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436','CO','Colombia','CO',1,'legal',true,true,'south_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary government legal text dated 2025-10-27. It states cannabis as a finished product for direct human or veterinary consumption may only be commercialized for medical purposes and establishes transition/technical-regulation provisions. Verified 2026-09-23.','2026-09-23','executive_legal',array['legal','medical','commercialisation'],jsonb_build_object('jurisdiction_key','CO','primary_legal_source',true))
on conflict (source_url) do update set verification_notes='Primary Colombian government legal text verified 2026-09-23; medical-only finished-product commercialization language captured.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '7 days',updated_at=now();

-- Argentina: correct the pathway description to match the actual 2026
-- resolution: horticultural hemp, THC <1%, not a generic medicinal-cannabis
-- commercial pathway.
update public.regulatory_pathways
set name='Licensed horticultural hemp production and trade',
    pathway_type='licensed_market',
    legal_basis='ARICCAME Resolution 69/2026',
    effective_date='2026-10-16',
    summary='Resolution 69/2026 establishes ARICCAME licences for production, conditioning, storage, commercialisation and related activities involving horticultural hemp with THC below 1%, including licences for derivative products and foreign trade. This record is not evidence of an adult-use cannabis retail market and is distinct from Argentina medical-cannabis pathways.',
    source_urls=array['https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto','https://www.argentina.gob.ar/noticias/ariccame-regula-las-actividades-vinculadas-al-canamo-con-fines-horticolas'],
    verification='verified',last_verified_at=now()
where iso_alpha2='AR' and slug='depth-v1-ar-medical-cannabis';

-- Argentina: calendar description likewise must identify the hemp regime.
update public.regulatory_calendar
set title='ARICCAME Resolution 69/2026 horticultural hemp licensing regime effective',
    status='scheduled',confidence='confirmed',
    source_url='https://www.argentina.gob.ar/normativa/nacional/norma-429625/texto'
where iso2='AR' and title like 'ARICCAME Resolution 69/2026 licensing regime effective';

-- Jamaica: add current regulator licensing/fee evidence, without using
-- pandemic-era online ordering as evidence of current general retail.
insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Jamaica CLA — current licence application requirements and fees','https://www.cla.org.jm/application-requirements-and-process/','JM','Jamaica','JM',1,'regulator',true,true,'caribbean','en','html_snapshot','monthly','verified',now()+interval '30 days','online','Current CLA licensing page documents five licence categories, application review, supporting documents and current processing/licence fees. Verified 2026-09-23.','2026-09-23','cannabis_regulator',array['licensing','fees','regulatory'],jsonb_build_object('jurisdiction_key','JM','primary_regulator',true))
on conflict (source_url) do update set verification_notes='Current CLA licensing and application page verified 2026-09-23.',verification_checked_at=now(),relevance_status='verified',is_active=true,next_crawl_at=now()+interval '30 days',updated_at=now();

update public.regulatory_pathways
set summary='Jamaica licenses handling of ganja for medical, therapeutic or scientific purposes. Current CLA materials document a multi-stage licensing process and separate licence categories for cultivation, processing, transport, retail and research/development. Pandemic-era online ordering is retained only as historical evidence and is not treated as current general retail authorization.',
    source_urls=array['https://www.cla.org.jm/application-requirements-and-process/','https://www.cla.org.jm/schedule-of-fees/','https://cla.org.jm/sites/default/files/documents/Press%20release-Cannabis%20Licensing%20Authority-%20Herbhouses%20can%20now%20sell%20online%20%28final%29.pdf'],
    verification='verified',last_verified_at=now()
where iso_alpha2='JM' and slug='depth-v1-jm-medical-therapeutic';

-- Mark only the directly strengthened dimensions. Do not use a pathway
-- record as evidence for unrelated depth dimensions.
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='BR' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='CO' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='AR' and dimension_key in ('source_registry','verified_pathways','regulatory_calendar');
update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
last_evaluated_at=now()
where jurisdiction_key='JM' and dimension_key in ('source_registry','verified_pathways');

