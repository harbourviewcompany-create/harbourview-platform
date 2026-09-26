-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924113301
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

-- Reconcile legacy jurisdiction_dimension_coverage states into the v2 291x32 matrix.
-- verified_populated and verified_empty are explicit evidence outcomes; open remains unresolved.
alter table public.jurisdiction_data_depth_dimension_state disable row level security;

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
    end as dimension_key,
    c.status,
    c.applicability,
    c.evidence_basis,
    c.parent_jurisdiction_key,
    c.last_evaluated_at
  from public.jurisdiction_dimension_coverage c
  where c.dimension_key in (
    'verified_regulatory_evidence','verified_regulatory_claims','verified_pathways',
    'verified_format_rules','market_metrics','trade_flows','signals','source_registry',
    'source_snapshots','regulatory_calendar'
  )
)
update public.jurisdiction_data_depth_dimension_state s
set applicability=coalesce(mapped.applicability,'unknown'),
    status=case
      when mapped.applicability='not_applicable' then 'complete'
      when mapped.status in ('verified_populated','verified_empty') then 'complete'
      when mapped.status in ('complete','missing','blocked','stale','conflict') then mapped.status
      else 'unmeasured'
    end,
    evidence_basis=mapped.evidence_basis,
    parent_jurisdiction_key=mapped.parent_jurisdiction_key,
    last_evaluated_at=coalesce(mapped.last_evaluated_at,now()),
    updated_at=now()
from mapped
where s.jurisdiction_key=mapped.jurisdiction_key
  and s.dimension_key=mapped.dimension_key
  and s.contract_version='2026-09-23.v2'
  and mapped.dimension_key is not null;

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;
