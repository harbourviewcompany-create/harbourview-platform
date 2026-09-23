-- Primary Moldova hemp cultivation depth.
update public.regulatory_market_access_evidence set active=false,expires_at=now()
where jurisdiction_iso2='MD' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Moldova — Regulation on cultivation of plants containing narcotic or psychotropic substances',
 'https://www.legis.md/cautare/downloadpdf/97922','MD','Moldova','MD',1,'statute',true,true,
 'europe','ro','html_snapshot','weekly','verified',now()+interval '7 days','online',
 'Official Moldova legislation portal; hemp is defined as Cannabis and authorized cultivation is permitted for seed/fibre and scientific purposes.',
 '2026-09-23','drug_control_authority',array['legislation','regulation'],jsonb_build_object('primary_source',true))
on conflict(source_url) do update set jurisdiction_code='MD',is_active=true,relevance_status='verified',
next_crawl_at=now()+interval '7 days',verification_notes='Primary Moldova regulation verified 2026-09-23.',
verification_checked_at=now(),updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-md-hemp-cultivation-20260923','MD','cbd_hemp_only',
 'Moldova permits authorized cultivation of hemp (defined in the regulation as any plant of the Cannabis species) for scientific purposes and for production of seed and fibre, subject to authorization by the permanent drug-control committee. The cited primary regulation does not establish an adult-use cannabis retail pathway or medicinal cannabis commercial pathway.',
 'Republic of Moldova — Ministry of Justice legislation portal',
 'https://www.legis.md/cautare/downloadpdf/97922',null,now(),now()+interval '180 days',true)
on conflict(evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,
authority_name=excluded.authority_name,authority_url=excluded.authority_url,
verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-md-hemp-cultivation-20260923','MD',
 'primary-evidence-claim:md-hemp-cultivation-20260923',
 'Moldova permits authorized cultivation of hemp for scientific purposes and production of seed or fibre; the cited primary regulation requires authorization and does not establish adult-use cannabis retail.',
 'any','national','Republic of Moldova — Ministry of Justice legislation portal',
 'https://www.legis.md/cautare/downloadpdf/97922',now(),now(),now()+interval '180 days','verified')
on conflict(claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,
authority_url=excluded.authority_url,retrieved_at=now(),verified_at=now(),
expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,legal_basis,regulator,status,effective_date,summary,source_urls,verification,last_verified_at,qualifying_conditions)
values
((select id from public.countries where iso_alpha2='MD'),'MD',
 'depth-v1-md-authorized-hemp','Authorized hemp cultivation for seed, fibre and scientific purposes',
 'domestic_authorization',
 'Regulation on cultivation of plants containing narcotic or psychotropic substances',
 'Permanent Committee for Drug Control','active',null,
 'Authorized persons and legal entities may cultivate hemp for scientific purposes and/or production of seed and fibre, subject to an activity authorization. This is not an adult-use retail pathway.',
 '{https://www.legis.md/cautare/downloadpdf/97922}','needs_review',now(),
 ARRAY['authorization required','seed and fibre production','scientific purposes'])
where not exists (select 1 from public.regulatory_pathways p where p.iso_alpha2='MD' and p.slug='depth-v1-md-authorized-hemp');

update public.regulatory_pathways
set name='Authorized hemp cultivation for seed, fibre and scientific purposes',
    pathway_type='domestic_authorization',
    legal_basis='Regulation on cultivation of plants containing narcotic or psychotropic substances',
    regulator='Permanent Committee for Drug Control',
    status='active',
    effective_date=null,
    summary='Authorized persons and legal entities may cultivate hemp for scientific purposes and/or production of seed and fibre, subject to an activity authorization. This is not an adult-use retail pathway.',
    source_urls='{https://www.legis.md/cautare/downloadpdf/97922}',
    last_verified_at=now(),
    qualifying_conditions=ARRAY['authorization required','seed and fibre production','scientific purposes']
where iso_alpha2='MD' and slug='depth-v1-md-authorized-hemp';

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
select 'pathway',id,'Moldova cultivation regulation','Paragraph 4 — hemp cultivation','statute',
'https://www.legis.md/cautare/downloadpdf/97922',null,current_date,
'Hemp is defined as any plant of the Cannabis species; cultivation is permitted for scientific purposes and/or production of seed and fibre when the required authorization is held.'
from public.regulatory_pathways
where slug='depth-v1-md-authorized-hemp'
and not exists(select 1 from public.regulatory_citations c where c.entity_type='pathway'
and c.entity_id=public.regulatory_pathways.id
and c.citation_url='https://www.legis.md/cautare/downloadpdf/97922');

update public.regulatory_pathways set verification='verified',last_verified_at=now(),updated_at=now()
where slug='depth-v1-md-authorized-hemp';

update public.jurisdiction_dimension_coverage
set status='verified_populated',
evidence_basis='Primary Moldova regulation verifies source provenance, hemp cultivation evidence, verified authorization pathway and regulatory claim.',
last_evaluated_at=now(),notes='Verified 2026-09-23 from Moldova legislation portal.'
where jurisdiction_key='MD'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now(),
notes='Verified 2026-09-23 from Moldova primary regulation.'
where jurisdiction_key='MD'
and dimension_key in('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
