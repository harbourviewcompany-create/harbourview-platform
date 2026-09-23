-- Primary Guatemala regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set tier='prohibited',
    rationale='Guatemala''s Health Code prohibits cultivation and harvesting of cannabis; therapeutic consumption of controlled substances is permitted only by prescription and medical supervision.',
    authority_name='Congress of the Republic of Guatemala / Ministry of Public Health',
    authority_url='https://www.congreso.gob.gt/detalle_pdf/decretos/1217',
    source_effective_date='1992-09-23',
    verified_at=now(),
    expires_at=now()+interval '180 days',
    active=true
where evidence_key='hv-mkt-complete-gt-20260913';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Guatemala Congress — Decree 48-92 Narcotics Law','https://www.congreso.gob.gt/detalle_pdf/decretos/1217','GT','Guatemala','GT',1,'regulator',true,true,'central_america','es','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary statutory source verified 2026-09-22.','2026-09-22','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='GT',country='Guatemala',iso='GT',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary statutory source verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('hv-mkt-complete-gt-20260913','GT','primary-evidence-claim:gt-controlled-cannabis-20260922','Guatemala prohibits cultivation and harvesting of cannabis under its Health Code; therapeutic consumption of controlled substances is permitted only by prescription and medical supervision.','any','national','Congress of the Republic of Guatemala / Ministry of Public Health','https://www.congreso.gob.gt/detalle_pdf/decretos/1217','1992-09-23',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.regulatory_pathways
(country_id,iso_alpha2,slug,name,pathway_type,status,effective_date,source_urls,verification,last_verified_at)
values
((select id from public.countries where iso_alpha2='GT'),'GT','depth-v1-gt-medical','Prescription-only therapeutic controlled-substance access','medical_access_program','active','1999-08-31',array['https://www.congreso.gob.gt/detalle_pdf/decretos/566'],'needs_review',now())
on conflict (slug) do update set source_urls=excluded.source_urls,last_verified_at=now();

insert into public.regulatory_citations
(entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt)
values
('pathway',(select id from public.regulatory_pathways where slug='depth-v1-gt-medical'),'Decreto 32-99 reforming Decreto 48-92','Article 3 — Uso legal','regulator','https://www.congreso.gob.gt/detalle_pdf/decretos/566','1999-08-31',current_date,'Only legally authorized persons may use drugs under strict responsibility for medical treatment.');

update public.regulatory_pathways
set verification='verified',source_urls=array['https://www.congreso.gob.gt/detalle_pdf/decretos/566'],last_verified_at=now(),updated_at=now()
where slug='depth-v1-gt-medical';

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Guatemalan statutory sources verify prohibited cannabis cultivation and prescription-only therapeutic controlled-substance access.',last_evaluated_at=now(),notes='Verified 2026-09-22 from Congress and Ministry of Health sources.'
where jurisdiction_key='GT' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Guatemalan statutory sources on 2026-09-22.'
where jurisdiction_key='GT' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
