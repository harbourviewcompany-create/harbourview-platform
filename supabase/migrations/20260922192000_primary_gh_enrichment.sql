-- Primary Ghana regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set tier='medical_limited_trade',
    rationale='Section 43 of the Narcotics Control Commission Act 2020 (Act 1019), as amended by Act 1100 and implemented by LI 2475, licenses cannabis cultivation only where THC does not exceed 0.3% on a dry weight basis, for industrial or medicinal purposes. NACOC describes licensing for cultivation, processing, import, export, laboratory, storage, transport, distribution and sale; recreational cannabis remains prohibited.',
    authority_name='Narcotics Control Commission (NACOC), Ghana',
    authority_url='https://www.ncc.gov.gh/cannabis-regulations/',
    source_effective_date='2026-07-31',
    verified_at=now(),expires_at=now()+interval '180 days',active=true
where evidence_key='hv-mkt-gh-20260907';

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('hv-mkt-gh-20260907','GH','primary-evidence-claim:gh-cannabis-framework-20260922','Ghana has a licensed low-THC cannabis framework: cannabis at or below 0.3% THC may be cultivated for approved industrial and medicinal purposes, with regulated activities including processing, import, export, transport, storage, distribution and sale; recreational cannabis remains prohibited.','any','national','Narcotics Control Commission (NACOC), Ghana','https://www.ncc.gov.gh/cannabis-regulations/','2026-07-31',now(),now(),now()+interval '180 days','verified')
on conflict (claim_key) do update set claim_text=excluded.claim_text,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,retrieved_at=now(),verified_at=now(),expires_at=now()+interval '180 days',evidence_status='verified';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Ghana Narcotics Control Commission — Cannabis Regulations','https://www.ncc.gov.gh/cannabis-regulations/','GH','Ghana','GH',1,'regulator',true,true,'africa','en','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary NACOC cannabis regulatory source verified 2026-09-22.','2026-09-22','drug_control_authority',array['regulatory'],jsonb_build_object('jurisdiction_key','GH','primary_regulator',true))
on conflict (source_url) do update set jurisdiction_code='GH',country='Ghana',iso='GH',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary NACOC cannabis regulatory source verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary NACOC source and verified regulatory evidence/claim/pathway.',last_evaluated_at=now(),notes='Verified 2026-09-22 from primary NACOC source.'
where jurisdiction_key='GH' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary NACOC source on 2026-09-22.'
where jurisdiction_key='GH' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
