-- Reconcile measured coverage after primary Tuvalu / Holy See source enrichment.
-- Tuvalu: promote source registry, evidence, claim, pathway, calendar and verified-empty format coverage.
-- Holy See: deactivate secondary cannabis evidence and fail closed because the registered primary law is not cannabis-specific.

update public.regulatory_market_access_evidence
set active=false
where evidence_key='hv-mkt-complete-va-20260913';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Tuvalu legislation source registry entry verified 2026-09-22.',last_evaluated_at=now(),notes='Primary legal source registered; source_registry dimension complete.'
where jurisdiction_key='TV' and dimension_key='source_registry';

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Primary Tuvalu Dangerous Drugs Act evidence and verified pathway/claim.',last_evaluated_at=now(),notes='Primary cannabis-specific prohibition evidence supports verified regulatory claim and pathway.'
where jurisdiction_key='TV' and dimension_key in ('verified_regulatory_claims','verified_pathways','verified_regulatory_evidence');

update public.jurisdiction_dimension_coverage
set status='verified_empty',applicability='applicable',evidence_basis='Tuvalu Dangerous Drugs Act Sections 4, 7 and 8 expressly prohibit import/export, cultivation, possession and sale of Indian hemp.',last_evaluated_at=now(),notes='No lawful commercial cannabis product format is established by the cited primary law.'
where jurisdiction_key='TV' and dimension_key='verified_format_rules';

insert into public.regulatory_calendar
(iso2,event_type,title,summary,expected_date,confidence,source_url,source_label,status)
select 'TV','effective','Tuvalu cannabis prohibition legal basis — current revised Act','Primary Tuvalu legislation expressly prohibits import/export, cultivation, possession and sale of Indian hemp.','2022-12-31','confirmed','https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf','Primary regulatory source','effective'
where not exists(select 1 from public.regulatory_calendar where iso2='TV' and source_url='https://www.tuvalu-legislation.tv/cms/images/LEGISLATION/PRINCIPAL/1948/1948-0006/1948-0006.pdf');

update public.jurisdiction_dimension_coverage
set status='verified_populated',applicability='applicable',evidence_basis='Confirmed regulatory calendar record derived from the verified Tuvalu pathway/legal instrument.',last_evaluated_at=now(),notes='Calendar layer populated from primary-source verified pathway.'
where jurisdiction_key='TV' and dimension_key='regulatory_calendar';

update public.jurisdiction_data_depth_tasks
set status='verified',updated_at=now(),notes=coalesce(notes,'')||' Reconciled from verified primary-source coverage on 2026-09-22.'
where jurisdiction_key='TV' and dimension_key in ('source_registry','verified_regulatory_evidence','verified_regulatory_claims','verified_pathways','verified_format_rules','regulatory_calendar');

update public.jurisdiction_data_depth_tasks
set status='blocked',updated_at=now(),notes='Blocked: no cannabis-specific primary legal/regulatory source located for the Holy See; the registered primary narcotics law is not treated as cannabis-specific evidence. Secondary aggregator evidence was deactivated.'
where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence';

update public.jurisdiction_dimension_coverage
set status='blocked',applicability='applicable',evidence_basis='No cannabis-specific primary legal/regulatory provision located; registered Vatican law is broad narcotics law and is not treated as cannabis-specific evidence.',last_evaluated_at=now(),notes='Secondary evidence deactivated; unresolved remains fail-closed.'
where jurisdiction_key='VA' and dimension_key='verified_regulatory_evidence';