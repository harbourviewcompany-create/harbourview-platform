-- Explicit per-jurisdiction/per-dimension coverage state.
-- This prevents "missing row" from being confused with "not applicable" or
-- parent-inherited data. Inherited data is never counted as local evidence.

create table if not exists public.jurisdiction_dimension_coverage (
  jurisdiction_key text not null,
  dimension_key text not null,
  status text not null check (status in ('verified_populated','verified_empty','not_applicable','inherited','open','blocked')),
  applicability text not null default 'applicable' check (applicability in ('applicable','not_applicable','inherited')),
  evidence_basis text,
  parent_jurisdiction_key text,
  last_evaluated_at timestamptz not null default now(),
  notes text,
  primary key (jurisdiction_key,dimension_key)
);

create index if not exists idx_jdc_status_priority on public.jurisdiction_dimension_coverage(status,dimension_key);
create index if not exists idx_jdc_jurisdiction on public.jurisdiction_dimension_coverage(jurisdiction_key);

alter table public.jurisdiction_dimension_coverage enable row level security;
drop policy if exists jurisdiction_dimension_coverage_public_read on public.jurisdiction_dimension_coverage;
create policy jurisdiction_dimension_coverage_public_read on public.jurisdiction_dimension_coverage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_dimension_coverage to anon,authenticated;

with dims as (
  select unnest(array[
    'country_intel','verified_regulatory_evidence','verified_regulatory_claims',
    'verified_pathways','verified_format_rules','market_metrics','trade_flows',
    'signals','source_registry','source_snapshots','regulatory_calendar'
  ]) dimension_key
),
base as (select * from public.v_jurisdiction_data_depth),
seed as (
  select
    b.jurisdiction_key,d.dimension_key,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational' then 'not_applicable'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational' then 'inherited'
      when d.dimension_key='country_intel' and b.active_country_intel_rows>0 then 'verified_populated'
      when d.dimension_key='verified_regulatory_evidence' and b.current_verified_evidence_rows>0 then 'verified_populated'
      when d.dimension_key='verified_regulatory_claims' and b.verified_claim_rows>0 then 'verified_populated'
      when d.dimension_key='verified_pathways' and b.verified_pathway_rows>0 then 'verified_populated'
      when d.dimension_key='verified_format_rules' and b.verified_format_rule_rows>0 then 'verified_populated'
      when d.dimension_key='market_metrics' and b.metric_rows>0 then 'verified_populated'
      when d.dimension_key='trade_flows' and b.trade_flow_rows>0 then 'verified_populated'
      when d.dimension_key='signals' and b.signal_rows>0 then 'verified_populated'
      when d.dimension_key='source_registry' and b.active_source_rows>0 then 'verified_populated'
      when d.dimension_key='source_snapshots' and b.successful_snapshot_rows>0 then 'verified_populated'
      when d.dimension_key='regulatory_calendar' and b.calendar_rows>0 then 'verified_populated'
      else 'open'
    end status,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational' then 'not_applicable'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational' then 'inherited'
      else 'applicable'
    end applicability,
    case
      when d.dimension_key in ('trade_flows','market_metrics','signals') and b.jurisdiction_level='subnational'
        then 'Platform model currently defines this dimension as national-only.'
      when d.dimension_key='country_intel' and b.jurisdiction_level='subnational'
        then 'Country-level intelligence is inherited conceptually from the parent jurisdiction; no local row is counted as local evidence.'
      else null
    end evidence_basis
  from base b cross join dims d
)
insert into public.jurisdiction_dimension_coverage
(jurisdiction_key,dimension_key,status,applicability,evidence_basis,last_evaluated_at,notes)
select jurisdiction_key,dimension_key,status,applicability,evidence_basis,now(),
       case when status='open' then 'Requires evidence-backed enrichment; no inferred completion.' else null end
from seed
on conflict (jurisdiction_key,dimension_key) do update set
 status=excluded.status,applicability=excluded.applicability,
 evidence_basis=excluded.evidence_basis,last_evaluated_at=now(),notes=excluded.notes;

create or replace view public.v_jurisdiction_dimension_depth
with (security_invoker=true)
as
select
  jurisdiction_key,
  count(*) as total_dimensions,
  count(*) filter(where status in ('verified_populated','verified_empty','not_applicable')) as complete_dimensions,
  count(*) filter(where status='verified_populated') as populated_dimensions,
  count(*) filter(where status='not_applicable') as not_applicable_dimensions,
  count(*) filter(where status='inherited') as inherited_dimensions,
  count(*) filter(where status='open') as open_dimensions,
  count(*) filter(where status='blocked') as blocked_dimensions,
  round(
    100.0 * count(*) filter(where status in ('verified_populated','verified_empty','not_applicable'))
    / nullif(count(*) filter(where status <> 'inherited'),0), 1
  ) as applicable_depth_pct
from public.jurisdiction_dimension_coverage
group by jurisdiction_key;

grant select on public.v_jurisdiction_dimension_depth to anon,authenticated;
