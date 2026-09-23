-- Reconcile the 32-dimension matrix with the actual adjudicated regulatory tier.
-- This is deliberately evidence-backed: only current verified tiers with active
-- evidence and a primary authority URL are promoted to complete.

update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=e.verified_at,
    freshness_deadline=e.expires_at,
    confidence='high',
    evidence_basis='active regulatory_market_access_evidence bound to current verified tier',
    last_evaluated_at=now(),
    updated_at=now()
from public.countries c
join public.regulatory_market_access_evidence e
  on e.evidence_key=c.regulatory_tier_evidence_key
 and e.jurisdiction_iso2=c.iso_alpha2
 and e.active=true
where s.jurisdiction_key=c.iso_alpha2
  and s.dimension_key='regulatory_tier'
  and s.contract_version='2026-09-23.v2'
  and c.verified_regulatory_tier is not null
  and e.authority_url is not null
  and e.authority_url <> '';

-- A current authoritative regulator surface can satisfy the regulator dimension
-- only where a jurisdiction-specific primary source exists. No parent source is
-- inherited by a child.
update public.jurisdiction_data_depth_dimension_state s
set applicability='applicable',
    status='complete',
    evidence_count=1,
    primary_source_count=1,
    latest_verified_at=p.verified_at,
    freshness_deadline=p.expires_at,
    confidence='high',
    evidence_basis='jurisdiction-specific regulatory_market_access_primary_sources',
    parent_jurisdiction_key=p.parent_iso2,
    last_evaluated_at=now(),
    updated_at=now()
from public.regulatory_market_access_primary_sources p
where s.jurisdiction_key=p.jurisdiction_iso2
  and s.dimension_key='regulator'
  and s.contract_version='2026-09-23.v2'
  and p.authority_url is not null
  and p.authority_url <> ''
  and p.verified_at is not null
  and p.expires_at > now()
  and p.jurisdiction_iso2 = p.jurisdiction_iso2;

-- Re-evaluate the full-depth gate after evidence reconciliation.
