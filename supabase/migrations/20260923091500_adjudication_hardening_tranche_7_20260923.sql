-- Adjudication hardening tranche 7.
-- 1) Remove the Lebanon classification from the publishable tier set because
-- the prior source was secondary (Library of Congress), not first-party.
-- 2) Record only dimension states directly supported by current first-party
-- 2026 evidence for Brazil and Singapore. No parent inheritance.

update public.regulatory_market_access_evidence
set active=false
where evidence_key='primary-evidence-lb-20260923';

update public.countries
set verified_regulatory_tier=null,
    regulatory_tier_evidence_key=null
where iso_alpha2='LB'
  and regulatory_tier_evidence_key='primary-evidence-lb-20260923';

update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',
    status='blocked',
    blocker_reason='Prior Lebanon tier classification relied on a Library of Congress secondary legal-monitor source rather than a first-party Lebanese authority surface. No first-party source meeting the current publication bar has been bound yet; do not retain the classification as verified.',
    evidence_count=0,
    primary_source_count=0,
    confidence='high',
    evidence_basis='evidence-quality adjudication: first-party source required for publishable tier',
    last_evaluated_at=now(),
    updated_at=now()
where jurisdiction_key='LB'
  and dimension_key='regulatory_tier'
  and contract_version='2026-09-23.v2';

-- Brazil: Anvisa 2026 framework directly supports these dimensions.
update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=now(),
    freshness_deadline=now()+interval '180 days',
    confidence='high',
    evidence_basis='Anvisa RDC 1.012/2026, RDC 1.013/2026 and 2026 cannabis product framework',
    last_evaluated_at=now(),
    updated_at=now()
where jurisdiction_key='BR'
  and dimension_key in ('pathways','commercial_activity','import','export','access_rules','calendar')
  and contract_version='2026-09-23.v2';

-- Singapore: current 2026 MDA/CNB sources directly support the prohibited
-- commercial/import/export/possession/consumption/cultivation state.
update public.jurisdiction_data_depth_dimension_state
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=now(),
    freshness_deadline=now()+interval '180 days',
    confidence='high',
    evidence_basis='Singapore Misuse of Drugs Act current 2026 version and Central Narcotics Bureau cannabis guidance',
    last_evaluated_at=now(),
    updated_at=now()
where jurisdiction_key='SG'
  and dimension_key in ('access_rules','commercial_activity','import','export')
  and contract_version='2026-09-23.v2';

select * from api.refresh_verified_market_access_tiers('primary-evidence-br-20260923');
select * from api.refresh_verified_market_access_tiers('primary-evidence-sg-20260923');
