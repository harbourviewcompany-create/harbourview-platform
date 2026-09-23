-- Primary Qatar legal provenance: Law No. 9 of 1987.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='QA' and active=true;

insert into public.source_registry (
source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class
) values (
'Qatar Legal Portal (Al Meezan) — Law No. 9 of 1987 on Narcotic Drugs and Dangerous Psychotropic Substances',
'https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=',
'Qatar',true,'Qatar','QA','en','monthly','verified','QA',1,false,'statute',true,
'Primary Qatar legal portal text. Law No. 9/1987 remains in force. Articles 28–30 prohibit cultivation and dealings in plants listed in Schedule 4 except specified plant parts, while allowing narrowly authorized scientific/research cultivation or importation by designated institutions.',
'official_gazette'
) on conflict (source_url) do update set is_active=true,jurisdiction_code='QA',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values (
'primary-evidence-qa-law9-1987','QA','prohibited',
'Qatar Law No. 9 of 1987 controls narcotic drugs and prohibited plants. Articles 28–29 prohibit cultivation and import/export/ownership/possession/sale and related dealings in plants listed in Schedule 4, except specified plant parts; Article 30 permits narrow scientific/research authorization. The cited law does not establish general commercial cannabis retail.',
'Qatar Legal Portal — Al Meezan',
'https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=',
'1987-01-01',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values (
'primary-evidence-qa-law9-1987','QA','primary-evidence-claim:qa-law9-1987',
'Qatar law prohibits cultivation and commercial dealings in plants listed in the narcotics law''s Schedule 4 except legally specified exceptions; narrow scientific/research authorization exists, but the cited law does not establish general commercial cannabis retail.',
'any','national','Qatar Legal Portal — Al Meezan',
'https://www.almeezan.qa/LawView.aspx?LawID=3989&language=en&opt=',
'1987-01-01',now(),now(),now()+interval '180 days','verified');

insert into public.jurisdiction_dimension_coverage
(jurisdiction_key,dimension_key,status,applicability,evidence_basis,last_evaluated_at)
select 'QA',v.dimension_key,v.status,v.applicability,v.evidence_basis,now()
from (values
('verified_pathways','verified_empty','applicable','Primary Qatar narcotics law provides prohibition and narrow scientific authorization but no general commercial cannabis pathway.'),
('verified_format_rules','verified_empty','applicable','Primary Qatar narcotics law does not establish general commercial cannabis product-format rules.')
) v(dimension_key,status,applicability,evidence_basis)
on conflict (jurisdiction_key,dimension_key) do update set
status=excluded.status,applicability=excluded.applicability,evidence_basis=excluded.evidence_basis,last_evaluated_at=now();

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Qatar Legal Portal source: Law No. 9 of 1987.',
last_evaluated_at=now()
where jurisdiction_key='QA'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='QA'
and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');
