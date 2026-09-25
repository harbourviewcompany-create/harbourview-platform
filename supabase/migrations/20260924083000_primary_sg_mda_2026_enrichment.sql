-- Primary Singapore regulatory provenance: Misuse of Drugs Act 1973 current version.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='SG' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Singapore Statutes Online — Misuse of Drugs Act 1973',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'Singapore',true,'Singapore','SG','en','monthly','verified','SG',1,false,'statute',true,
'Current official legislation version as at 19 September 2026. The Act contains offences for trafficking, manufacture, import/export, possession, consumption and cultivation of cannabis; cannabis is a controlled drug.',
'legislature'
) on conflict (source_url) do update set is_active=true,jurisdiction_code='SG',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-sg-mda-2026','SG','prohibited',
'Singapore''s current Misuse of Drugs Act 1973 controls cannabis as a controlled drug and establishes offences covering trafficking, manufacture, import/export, possession, consumption and cultivation. The current official legislation is stated as at 19 September 2026. The cited framework does not establish general commercial cannabis access.',
'Singapore Attorney-General''s Chambers — Singapore Statutes Online',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'2026-09-19',now(),now()+interval '180 days',true
);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-sg-mda-2026','SG','primary-evidence-claim:sg-mda-2026',
'Singapore''s current Misuse of Drugs Act controls cannabis and provides offences for trafficking, manufacture, import/export, possession, consumption and cultivation; the cited law does not establish general commercial cannabis retail.',
'any','national','Singapore Attorney-General''s Chambers — Singapore Statutes Online',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'2026-09-19',now(),now(),now()+interval '180 days','verified'
);

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'SG','effective','Misuse of Drugs Act — current legislation version verified as at 19 September 2026',
'2026-09-19','confirmed',
'https://sso.agc.gov.sg/Act/MDA1973?ProvIds=pr10A-&ValidDate=20260601',
'Singapore Attorney-General''s Chambers — Singapore Statutes Online','effective'
where not exists (
select 1 from public.regulatory_calendar where iso2='SG' and title='Misuse of Drugs Act — current legislation version verified as at 19 September 2026'
);

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Singapore Statutes Online source: current Misuse of Drugs Act 1973.',
last_evaluated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary Singapore Misuse of Drugs Act establishes controlled-drug prohibitions/offences but no general commercial cannabis pathway or commercial cannabis product-format framework.',
last_evaluated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now()
where jurisdiction_key='SG'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');