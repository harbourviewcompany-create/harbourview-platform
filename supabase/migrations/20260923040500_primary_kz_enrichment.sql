-- Primary Kazakhstan industrial-cannabis enrichment; fail-closed on unsupported dimensions. Idempotent source/evidence/claim writes.
update public.regulatory_market_access_evidence set active=false,expires_at=now() where evidence_key='hv-mkt-complete-kz-20260913';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-kz-industrial-hemp-20260923','KZ','cbd_hemp_only','Kazakhstan permits licensed legal entities to cultivate cannabis/hemp for industrial purposes unrelated to producing narcotic or psychotropic substances. Government Decree No. 797 sets THC at no more than 0.3% dry weight for permitted industrial cannabis and excludes narcotic-drug production. The narcotics law separately prohibits cannabis cultivation for manufacture of narcotic medicines except statutory cases.','Republic of Kazakhstan — Adilet legal information system','https://adilet.zan.kz/rus/docs/P2500000797','2025-09-26',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Kazakhstan Adilet — Government Decree No. 797 industrial cannabis THC requirements','https://adilet.zan.kz/rus/docs/P2500000797','KZ','Kazakhstan','KZ',1,'primary_legislation',true,true,'central_asia','ru','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Kazakhstan legislation verified 2026-09-23; updated through 2026.','2026-09-23','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='KZ',country='Kazakhstan',iso='KZ',tier=1,source_type='primary_legislation',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Kazakhstan legislation verified 2026-09-23.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-kz-industrial-hemp-20260923','KZ','primary-evidence-claim:kz-industrial-hemp-20260923','Kazakhstan permits licensed legal entities to cultivate listed cannabis varieties for industrial purposes unrelated to narcotic-drug production, subject to government requirements including a THC ceiling of 0.3% dry weight; this is not an adult-use commercial cannabis market.','any','national','Republic of Kazakhstan — Adilet','https://adilet.zan.kz/rus/docs/P2500000797','2025-09-26',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Kazakhstan government legislation verifies licensed industrial cannabis cultivation and 0.3% THC limit.',last_evaluated_at=now(),notes='Verified 2026-09-23 from Adilet Decree No. 797.'
where jurisdiction_key='KZ' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Kazakhstan legislation on 2026-09-23.'
where jurisdiction_key='KZ' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');
