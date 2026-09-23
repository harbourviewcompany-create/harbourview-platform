-- Primary-source pathway depth for Brazil and Colombia.
-- Only dimensions directly supported by first-party sources are populated.
-- Unsupported product-format detail remains unresolved rather than inferred.

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'BR','depth-v1-br-medicinal-pharmaceutical','Controlled medicinal/pharmaceutical cannabis cultivation and production','domestic_authorization',
'ANVISA RDC 1.012/2026, RDC 1.013/2026, RDC 1.014/2026 and RDC 1.015/2026',
'Agência Nacional de Vigilância Sanitária (ANVISA)','active','2026-08-04',
'Legal entities may undertake expressly authorized Cannabis sativa L. cultivation for medicinal/pharmaceutical or research purposes under ANVISA authorization and applicable sanitary controls. Medicinal cannabis products are subject to authorization requirements for manufacture/import; this pathway does not establish general adult-use retail.',
array['https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-publica-perguntas-e-respostas-sobre-a-autorizacao-sanitaria-de-produtos-de-cannabis'],
'needs_review',now()
from public.countries c where c.iso2='BR'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at)
select c.id,'CO','depth-v1-co-medical-scientific','Medical and scientific cannabis cultivation, manufacture and commercial distribution','domestic_authorization',
'Ley 1787 de 2016; Decreto 613 de 2017; Decreto 1138 de 2025 and implementing resolutions',
'Ministry of Health and Social Protection / Ministry of Justice and Law / INVIMA','active','2017-04-10',
'Colombia maintains a licensed medical/scientific framework covering cultivation, manufacture of derivatives, import, export, storage, transport, commercialisation and distribution, with quotas and product controls. The 2025 reform further addresses access to medical cannabis and implementation of new product/licensing rules.',
array['https://www.minsalud.gov.co/salud/medicamentos-y-tecnologias/Paginas/cannabis-uso-medicinal.aspx','https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436'],
'needs_review',now()
from public.countries c where c.iso2='CO'
on conflict(slug) do update set name=excluded.name,pathway_type=excluded.pathway_type,legal_basis=excluded.legal_basis,regulator=excluded.regulator,status=excluded.status,effective_date=excluded.effective_date,summary=excluded.summary,source_urls=excluded.source_urls,verification='verified',last_verified_at=now();

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'RDC 1.013/2026','Cannabis cultivation requirements','regulation',
'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026',
'2026-02-03',current_date,
'ANVISA states RDC 1.013/2026 establishes requirements for cultivation of Cannabis sativa L. varieties with THC at or below 0.3% exclusively for medicinal, pharmaceutical or research purposes, with cultivation beginning only after ANVISA Special Authorization.'
from public.regulatory_pathways p where p.iso_alpha2='BR' and p.slug='depth-v1-br-medicinal-pharmaceutical'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026');

insert into public.regulatory_citations(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',p.id,'Decreto 613 de 2017','Title 11 / medical-scientific cannabis framework','statute',
'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463',
'2017-04-10',current_date,
'The Colombian framework regulates import, export, cultivation, production, manufacture, acquisition, storage, transport, commercialisation and distribution of cannabis and derivatives for medical and scientific purposes.'
from public.regulatory_pathways p where p.iso_alpha2='CO' and p.slug='depth-v1-co-medical-scientific'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway' and c.entity_id=p.id and c.citation_url='https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos%2F30030463');


update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='BR' and slug='depth-v1-br-medicinal-pharmaceutical' and verification='needs_review';

update public.regulatory_pathways set verification='verified',last_verified_at=now() where iso_alpha2='CO' and slug='depth-v1-co-medical-scientific' and verification='needs_review';
insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'BR','effective','ANVISA medicinal cannabis cultivation framework effective','2026-08-04','confirmed',
'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/rdcs-no-1-012-2026-e-no-1-013-2026',
'ANVISA','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='BR' and title='ANVISA medicinal cannabis cultivation framework effective');

insert into public.regulatory_calendar(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'CO','effective','Decreto 1138 de 2025 medical cannabis reform','2025-10-27','confirmed',
'https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=268436',
'Colombia Ministry of Health / Función Pública','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='CO' and title='Decreto 1138 de 2025 medical cannabis reform');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary regulatory pathway and citation sources verified 2026-09-23.',
last_evaluated_at=now(),
notes='Pathway-level primary evidence added; unsupported format details remain unresolved.'
where jurisdiction_key in ('BR','CO') and dimension_key in ('verified_pathways','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
notes='Primary pathway/calendar depth added 2026-09-23; unsupported dimensions remain unresolved.'
where jurisdiction_key in ('BR','CO') and dimension_key in ('verified_pathways','regulatory_calendar');
