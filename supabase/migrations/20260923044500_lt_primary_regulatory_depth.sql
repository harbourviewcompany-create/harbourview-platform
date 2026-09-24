-- Primary Lithuania regulatory depth. Secondary active provenance is retired fail-closed.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where jurisdiction_iso2='LT' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Lithuania — Narcotic and Psychotropic Substances Control Act',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 'LT','Lithuania','LT',1,'legislation',true,true,'europe','lt','html_snapshot','weekly','verified',
 now()+interval '7 days','online',
 'Primary consolidated Lithuanian narcotics law; current edition from 2025-11-01.',
 '2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set
 jurisdiction_code='LT',is_active=true,relevance_status='verified',
 next_crawl_at=now()+interval '7 days',
 verification_notes='Primary consolidated Lithuanian narcotics law verified 2026-09-23.',
 verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-lt-controlled-cannabis-20260923','LT','medical_limited_trade',
 'Lithuania classifies cannabis and cannabis plants in controlled narcotics schedules. The current law prohibits cultivation of cannabis and lawful circulation of Schedule I substances except defined cases, including registered medicinal products and scientific research; licensed entities may handle controlled medicinal products. Separate hemp law governs low-THC hemp products. No adult-use commercial cannabis retail pathway is established by the cited primary law.',
 'Republic of Lithuania — Seimas legal acts',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set
 tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-lt-controlled-cannabis-20260923','LT',
 'primary-evidence-claim:lt-controlled-cannabis-20260923',
 'Lithuania controls cannabis under its narcotics framework; Schedule I substances are generally prohibited from lawful circulation except statutory exceptions such as registered medicinal products and scientific research. Cannabis cultivation is prohibited under the cited law, and no adult-use commercial retail pathway is established by this source.',
 'any','national','Republic of Lithuania — Seimas legal acts',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set
 claim_text=excluded.claim_text,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,
 retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',
 evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
select
(select id from public.countries where iso_alpha2='LT'),'LT',
 'depth-v1-lt-controlled-medicinal',
 'Controlled medicinal/research authorization under narcotics framework',
 'medical_access_program',
 'Law No. VIII-602 on Control of Narcotic and Psychotropic Substances',
 'Lithuanian State Medicines Control Agency','active','2025-11-01',
 'Schedule I controlled substances may circulate only under statutory exceptions, including registered medicinal products and scientific research, with licensing requirements for relevant controlled medicinal-product activities. This is not an adult-use retail pathway.',
 '{https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6}',
 'needs_review',now(),
 ARRAY['registered medicinal product exception','scientific research','controlled-substance licensing'])
where not exists (select 1 from public.regulatory_pathways p where p.iso_alpha2='LT' and p.slug='depth-v1-lt-controlled-medicinal');

update public.regulatory_pathways
set name='Controlled medicinal/research authorization under narcotics framework',
    pathway_type='medical_access_program',
    legal_basis='Law No. VIII-602 on Control of Narcotic and Psychotropic Substances',
    regulator='Lithuanian State Medicines Control Agency',
    status='active',
    effective_date='2025-11-01',
    summary='Schedule I controlled substances may circulate only under statutory exceptions, including registered medicinal products and scientific research, with licensing requirements for relevant controlled medicinal-product activities. This is not an adult-use retail pathway.',
    source_urls='{https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6}',
    verification='needs_review',
    last_verified_at=now(),
    qualifying_conditions=ARRAY['registered medicinal product exception','scientific research','controlled-substance licensing']
where iso_alpha2='LT' and slug='depth-v1-lt-controlled-medicinal';

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Law No. VIII-602',
 'Sections 4, 7 and 8 — controlled substances and lawful circulation exceptions',
 'statute',
 'https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6',
 '2025-11-01',current_date,
 'The law defines lawful circulation of controlled narcotic/psychotropic substances and establishes Schedule I restrictions and exceptions for registered medicinal products and scientific research.'
from public.regulatory_pathways p
where p.slug='depth-v1-lt-controlled-medicinal'
and not exists (
  select 1
  from public.regulatory_citations c
  where c.entity_type='pathway'
    and c.entity_id=p.id
    and c.citation_url='https://e-seimas.lrs.lt/portal/legalActPrint/lt?actualEditionId=dbhKmMISzP&category=TAD&documentId=TAIS.48770&jfwid=-17i2t420n6'
);

update public.regulatory_pathways
set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-lt-controlled-medicinal';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
    evidence_basis='Primary Lithuanian law verifies controlled cannabis evidence, a controlled medicinal/research pathway, and a primary source registry entry.',
    last_evaluated_at=now(),
    notes='Verified 2026-09-23 from current consolidated Law No. VIII-602.'
where jurisdiction_key='LT'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),
    notes='Verified 2026-09-23 from current Lithuanian primary law.'
where jurisdiction_key='LT'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
