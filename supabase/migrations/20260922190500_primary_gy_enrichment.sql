-- Primary Guyana regulatory enrichment; fail-closed on unsupported dimensions.
update public.regulatory_market_access_evidence
set active=false,expires_at=now()
where evidence_key='hv-mkt-gy-20260907';

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-gy-narcotics-20260922','GY','prohibited','Guyana''s Narcotic Drugs and Psychotropic Substances (Control) Act defines cannabis as a narcotic and criminalizes unauthorized possession, trafficking, production, sale and distribution; the 2022 amendment does not create a commercial cannabis market.','Parliament of Guyana','https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf','1988-01-01',now(),now()+interval '180 days',true)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=now(),expires_at=now()+interval '180 days',active=true;

update public.regulatory_market_access_claims
set evidence_key='primary-evidence-gy-narcotics-20260922',
    claim_key='primary-evidence-claim:gy-narcotics-20260922',
    evidence_status='verified',
    claim_text='Guyana controls cannabis as a narcotic drug and prohibits unauthorized possession, trafficking, production, sale and distribution; no commercial cannabis market is established by the cited primary law.',
    authority_name='Parliament of Guyana',
    authority_url='https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf',
    verified_at=now(),retrieved_at=now(),expires_at=now()+interval '180 days'
where claim_key='market-access:hv-mkt-gy-20260907';

insert into public.source_registry
(source_name,source_url,jurisdiction_code,country,iso,tier,source_type,crawl_allowed,is_active,region,language,adapter,crawl_cadence,relevance_status,next_crawl_at,network_status,verification_notes,verification_checked_at,regulator_class,content_type,metadata)
values
('Parliament of Guyana — Narcotic Drugs and Psychotropic Substances (Control) Act','https://parliament.gov.gy/documents/acts/8534-act_2_of_1988_narcotic_drug__psychotropic_substances_control.pdf','GY','Guyana','GY',1,'regulator',true,true,'south_america','en','html_snapshot','weekly','verified',now()+interval '7 days','online','Primary Guyana narcotics statute verified 2026-09-22.','2026-09-22','drug_control_authority',array['legislation'],jsonb_build_object('primary_source',true))
on conflict (source_url) do update set jurisdiction_code='GY',country='Guyana',iso='GY',tier=1,source_type='regulator',crawl_allowed=true,is_active=true,relevance_status='verified',next_crawl_at=now()+interval '7 days',network_status='online',verification_notes='Primary Guyana narcotics statute verified 2026-09-22.',verification_checked_at=now(),regulator_class='drug_control_authority',updated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',evidence_basis='Primary Guyana narcotics statute verifies cannabis prohibition; no commercial pathway established by cited source.',last_evaluated_at=now(),notes='Verified 2026-09-22 from Parliament of Guyana primary statute.'
where jurisdiction_key='GY' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_dimension_coverage
set status='verified_empty',evidence_basis='Primary statute establishes prohibition but no commercial cannabis pathway.',last_evaluated_at=now(),notes='No commercial cannabis pathway supported by cited primary statute; fail-closed.'
where jurisdiction_key='GY' and dimension_key='verified_pathways';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes='Verified from primary Guyana statutory source on 2026-09-22.'
where jurisdiction_key='GY' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways');
