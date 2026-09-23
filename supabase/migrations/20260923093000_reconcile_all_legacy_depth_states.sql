-- Final-pass reconciliation for the 291 x 32 control plane.
-- The legacy jurisdiction_dimension_coverage table is an evidence ledger;
-- verified_populated and verified_empty are both complete states when the
-- ledger explicitly records applicability. Unmeasured/unknown remain unresolved.
-- This migration is intentionally idempotent and does not inherit parent evidence.

with mapped as (
  select
    c.jurisdiction_key,
    case c.dimension_key
      when 'verified_regulatory_evidence' then 'regulatory_status'
      when 'verified_regulatory_claims' then 'claims'
      when 'verified_pathways' then 'pathways'
      when 'verified_format_rules' then 'format_rules'
      when 'market_metrics' then 'market_metrics'
      when 'trade_flows' then 'trade_flows'
      when 'signals' then 'signals'
      when 'source_registry' then 'source_registry'
      when 'source_snapshots' then 'source_snapshot'
      when 'regulatory_calendar' then 'calendar'
      when 'country_intel' then 'jurisdiction_intelligence'
    end as dimension_key,
    c.status,c.applicability,c.evidence_basis,c.parent_jurisdiction_key,c.last_evaluated_at
  from public.jurisdiction_dimension_coverage c
  where c.dimension_key in (
    'verified_regulatory_evidence','verified_regulatory_claims','verified_pathways',
    'verified_format_rules','market_metrics','trade_flows','signals','source_registry',
    'source_snapshots','regulatory_calendar','country_intel'
  )
)
update public.jurisdiction_data_depth_dimension_state s
set applicability=coalesce(m.applicability,'unknown'),
    status=case
      when m.applicability='not_applicable' then 'complete'
      when m.status in ('verified_populated','verified_empty','complete') then 'complete'
      when m.status in ('missing','blocked','stale','conflict') then m.status
      else 'unmeasured'
    end,
    evidence_basis=m.evidence_basis,
    parent_jurisdiction_key=m.parent_jurisdiction_key,
    last_evaluated_at=coalesce(m.last_evaluated_at,now()),
    updated_at=now()
from mapped m
where s.jurisdiction_key=m.jurisdiction_key
  and s.dimension_key=m.dimension_key
  and s.contract_version='2026-09-23.v2'
  and m.dimension_key is not null;

-- Explicitly preserve the fail-closed state for Lebanon after secondary-source
-- removal and Fiji while their first-party publication bars are unmet.
update public.jurisdiction_data_depth_dimension_state
set status='blocked',applicability='applicable',
    confidence='high',last_evaluated_at=now(),updated_at=now()
where contract_version='2026-09-23.v2'
  and ((jurisdiction_key='LB' and dimension_key='regulatory_tier')
    or (jurisdiction_key='FJ' and dimension_key='regulatory_tier'));

-- The tier dimension is authoritative only when the current verified tier points
-- to active evidence for the same jurisdiction.
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

-- No inferred completion: regulator requires a current jurisdiction-specific
-- primary source and a live validity window.
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
  and p.expires_at > now();

-- Recalculate evidence counters for dimensions whose backing ledger has rows.
update public.jurisdiction_data_depth_dimension_state s
set evidence_count=src.evidence_count,
    primary_source_count=src.primary_source_count,
    latest_verified_at=src.latest_verified_at,
    freshness_deadline=src.freshness_deadline,
    last_evaluated_at=now(),updated_at=now()
from (
  select jurisdiction_iso2 jurisdiction_key,'claims' dimension_key,
         count(*) evidence_count,
         count(*) filter(where authority_url is not null and authority_url<>'') primary_source_count,
         max(verified_at) latest_verified_at,max(expires_at) freshness_deadline
  from public.regulatory_market_access_claims
  group by jurisdiction_iso2
) src
where s.jurisdiction_key=src.jurisdiction_key
  and s.dimension_key=src.dimension_key
  and s.contract_version='2026-09-23.v2';

-- Hard invariant: this migration never changes the matrix cardinality.
do $$
declare v_j integer; v_m integer;
begin
 select count(distinct jurisdiction_key),count(*) into v_j,v_m
 from public.v_jurisdiction_full_depth_291;
 if v_j<>291 or v_m<>9312 then
   raise exception 'Full-depth matrix cardinality failed after reconciliation: jurisdictions %, rows %, expected 291/9312',v_j,v_m;
 end if;
end $$;
