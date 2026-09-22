-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922110659
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace view public.v_jurisdiction_depth_integrity
with (security_invoker = true)
as
select
  d.jurisdiction_key,
  d.country_name,
  d.jurisdiction_level,
  count(c.dimension_key) as dimension_cells,
  count(*) filter (where c.status='verified_populated') as verified_populated_cells,
  count(*) filter (where c.status='not_applicable') as not_applicable_cells,
  count(*) filter (where c.status='inherited') as inherited_cells,
  count(*) filter (where c.status='open') as open_cells,
  count(*) filter (where c.status='blocked') as blocked_cells,
  round(100.0 * (
    count(*) filter (where c.status='verified_populated')
    + count(*) filter (where c.status='not_applicable')
  ) / nullif(
    count(*) filter (where c.applicability='applicable')
    + count(*) filter (where c.applicability='not_applicable'),0
  ),1) as applicable_depth_pct,
  bool_and(c.dimension_key='country_intel' or c.status <> 'inherited') as no_non_country_inheritance,
  bool_and(c.dimension_key not in ('market_metrics','trade_flows','signals')
    or d.jurisdiction_level <> 'subnational'
    or c.status='not_applicable') as subnational_applicability_consistent,
  bool_and(c.dimension_key <> 'verified_regulatory_evidence' or c.status='verified_populated') as regulatory_evidence_fail_closed,
  (count(c.dimension_key)=11 and count(*) filter(where c.status='open')=0 and count(*) filter(where c.status='blocked')=0) as full_depth_ready
from public.v_jurisdiction_data_depth d
left join public.jurisdiction_dimension_coverage c on c.jurisdiction_key=d.jurisdiction_key
group by d.jurisdiction_key,d.country_name,d.jurisdiction_level;
grant select on public.v_jurisdiction_depth_integrity to anon, authenticated;
