-- Primary Montenegro regulatory provenance: 2026 drug-control amendments.
update public.regulatory_market_access_evidence set active=false where jurisdiction_iso2='ME' and active=true;

insert into public.source_registry
(source_name,source_url,jurisdiction,is_active,country,iso,language,crawl_cadence,relevance_status,jurisdiction_code,tier,requires_auth,source_type,crawl_allowed,verification_notes,regulator_class)
values
('Montenegro Official Gazette — Law amending the Law on Prevention of Drug Abuse (117/2026)',
'https://www.sluzbenilist.me/propisi/396958','Montenegro',true,'Montenegro','ME','me','monthly','verified','ME',1,false,'statute',true,
'Current official-gazette entry published and effective 2026-08-07. The entry amends the national drug-abuse prevention law; the 2025 controlled-drug list entered into force 2026-01-02.',
'official_gazette')
on conflict (source_url) do update set is_active=true,jurisdiction_code='ME',verification_notes=excluded.verification_notes,updated_at=now();

insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('primary-evidence-me-drug-law-2026','ME','prohibited',
'Montenegro''s current official-gazette record shows the amended Law on Prevention of Drug Abuse effective 7 August 2026. The official 2025 drug list, effective 2 January 2026, is issued under that law. The cited primary materials do not establish a general commercial cannabis retail pathway.',
'Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now()+interval '180 days',true);

insert into public.regulatory_market_access_claims
(evidence_key,jurisdiction_iso2,claim_key,claim_text,product_class,jurisdiction_scope,authority_name,authority_url,source_effective_date,retrieved_at,verified_at,expires_at,evidence_status)
values
('primary-evidence-me-drug-law-2026','ME','primary-evidence-claim:me-drug-law-2026',
'Montenegro''s current drug-control framework was amended effective 7 August 2026; the official drug list effective 2 January 2026 operates under that framework. The cited primary sources do not establish general commercial cannabis retail.',
'any','national','Official Gazette of Montenegro','https://www.sluzbenilist.me/propisi/396958','2026-08-07',now(),now(),now()+interval '180 days','verified');

insert into public.regulatory_calendar
(iso2,event_type,title,expected_date,confidence,source_url,source_label,status)
select 'ME','effective','2026 amendments to Montenegro drug-abuse prevention law effective','2026-08-07','confirmed',
'https://www.sluzbenilist.me/propisi/396958','Official Gazette of Montenegro','effective'
where not exists (select 1 from public.regulatory_calendar where iso2='ME' and title='2026 amendments to Montenegro drug-abuse prevention law effective');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',
evidence_basis='Primary Official Gazette of Montenegro source and current drug-control framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',
evidence_basis='Primary cited drug-control sources do not establish a general commercial cannabis pathway or commercial cannabis product-format framework.',last_evaluated_at=now()
where jurisdiction_key='ME' and dimension_key in ('verified_pathways','verified_format_rules');

update public.jurisdiction_data_depth_tasks set status='verified',updated_at=now()
where jurisdiction_key='ME' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','regulatory_calendar','verified_pathways','verified_format_rules')
and status in ('open','in_progress','blocked');