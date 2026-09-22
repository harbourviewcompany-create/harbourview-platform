-- Complete the full-depth contract with an explicit jurisdiction x dimension state matrix.
-- Unknown applicability is intentionally distinct from not-applicable. No facts are inferred.
create table if not exists public.jurisdiction_data_depth_dimension_state (
  jurisdiction_key text not null,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on delete cascade,
  contract_version text not null default '2026-09-22.v1',
  applicability text not null default 'unknown'
    check (applicability in ('applicable','not_applicable','unknown')),
  status text not null default 'unmeasured'
    check (status in ('complete','missing','blocked','stale','conflict','unmeasured')),
  blocker_reason text,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  primary_source_count integer not null default 0 check (primary_source_count >= 0),
  latest_verified_at timestamptz,
  freshness_deadline timestamptz,
  confidence text check (confidence is null or confidence in ('high','medium','low','unknown')),
  evidence_basis text,
  parent_jurisdiction_key text,
  last_evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key, dimension_key, contract_version)
);

create index if not exists jurisdiction_data_depth_dimension_state_status_idx
  on public.jurisdiction_data_depth_dimension_state(status, applicability, dimension_key);
create index if not exists jurisdiction_data_depth_dimension_state_jurisdiction_idx
  on public.jurisdiction_data_depth_dimension_state(jurisdiction_key, dimension_key);

alter table public.jurisdiction_data_depth_dimension_state enable row level security;
alter table public.jurisdiction_data_depth_dimension_state force row level security;
drop policy if exists jurisdiction_data_depth_dimension_state_public_read
  on public.jurisdiction_data_depth_dimension_state;
create policy jurisdiction_data_depth_dimension_state_public_read
  on public.jurisdiction_data_depth_dimension_state
  for select to anon, authenticated using (true);
grant select on public.jurisdiction_data_depth_dimension_state to anon, authenticated;

-- Seed the full matrix from the canonical country universe. Every state starts
-- unmeasured/unknown; this is the required fail-closed baseline.
insert into public.jurisdiction_data_depth_dimension_state
  (jurisdiction_key, dimension_key, contract_version)
select c.iso_alpha2, d.dimension_key, d.contract_version
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
on conflict (jurisdiction_key, dimension_key, contract_version) do nothing;

-- Map the existing 11-dimension evidence system into the new contract.
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
    'country_intel','verified_regulatory_evidence','verified_regulatory_claims',
    'verified_pathways','verified_format_rules','market_metrics','trade_flows',
    'signals','source_registry','source_snapshots','regulatory_calendar'
  )
)
update public.jurisdiction_data_depth_dimension_state s
set
  applicability = case
    when mapped.applicability = 'applicable' then 'applicable'
    when mapped.applicability = 'not_applicable' then 'not_applicable'
    else 'unknown'
  end,
  status = case
    when mapped.status in ('verified_populated','verified_empty','not_applicable') then
      case when mapped.applicability = 'not_applicable' then 'complete' else 'complete' end
    when mapped.status = 'blocked' then 'blocked'
    when mapped.status = 'open' then 'missing'
    else 'unmeasured'
  end,
  blocker_reason = case
    when mapped.status = 'blocked' then coalesce(mapped.evidence_basis, 'Blocked by unresolved evidence requirement.')
    when mapped.status = 'open' then 'Evidence-backed enrichment required; no completion inferred.'
    else null
  end,
  evidence_basis = mapped.evidence_basis,
  parent_jurisdiction_key = mapped.parent_jurisdiction_key,
  last_evaluated_at = mapped.last_evaluated_at,
  updated_at = now()
from mapped
where s.jurisdiction_key = mapped.jurisdiction_key
  and s.dimension_key = mapped.dimension_key
  and s.contract_version = '2026-09-22.v1';

-- Fill measurable provenance/freshness fields from the existing evidence layer.
update public.jurisdiction_data_depth_dimension_state s
set
  evidence_count = case s.dimension_key
    when 'source_registry' then coalesce(v.registered_source_rows,0)
    when 'source_snapshot' then coalesce(v.successful_snapshot_rows,0)
    when 'claims' then coalesce(v.verified_claim_rows,0)
    when 'pathways' then coalesce(v.verified_pathway_rows,0)
    when 'format_rules' then coalesce(v.verified_format_rule_rows,0)
    when 'market_metrics' then coalesce(v.metric_rows,0)
    when 'trade_flows' then coalesce(v.trade_flow_rows,0)
    when 'signals' then coalesce(v.signal_rows,0)
    when 'calendar' then coalesce(v.calendar_rows,0)
    when 'regulatory_status' then coalesce(v.current_verified_evidence_rows,0)
    else s.evidence_count
  end,
  primary_source_count = case
    when s.dimension_key in ('source_registry','source_snapshot','claims','regulatory_status')
      then coalesce(v.official_source_rows,0)
    else s.primary_source_count
  end,
  latest_verified_at = case s.dimension_key
    when 'source_registry' then v.latest_source_check
    when 'source_snapshot' then v.latest_snapshot_at
    when 'claims' then v.latest_evidence_verified_at
    when 'regulatory_status' then v.latest_evidence_verified_at
    when 'pathways' then v.latest_pathway_verified_at
    when 'market_metrics' then v.latest_metric_updated_at
    when 'trade_flows' then v.latest_trade_verified_at
    when 'signals' then v.latest_signal_at
    when 'calendar' then v.latest_calendar_update
    else s.latest_verified_at
  end,
  freshness_deadline = case
    when d.freshness_days is not null and (
      case s.dimension_key
        when 'source_registry' then v.latest_source_check
        when 'source_snapshot' then v.latest_snapshot_at
        when 'claims' then v.latest_evidence_verified_at
        when 'regulatory_status' then v.latest_evidence_verified_at
        when 'pathways' then v.latest_pathway_verified_at
        when 'market_metrics' then v.latest_metric_updated_at
        when 'trade_flows' then v.latest_trade_verified_at
        when 'signals' then v.latest_signal_at
        when 'calendar' then v.latest_calendar_update
        else s.latest_verified_at
      end
    ) is not null
      then (
        case s.dimension_key
          when 'source_registry' then v.latest_source_check
          when 'source_snapshot' then v.latest_snapshot_at
          when 'claims' then v.latest_evidence_verified_at
          when 'regulatory_status' then v.latest_evidence_verified_at
          when 'pathways' then v.latest_pathway_verified_at
          when 'market_metrics' then v.latest_metric_updated_at
          when 'trade_flows' then v.latest_trade_verified_at
          when 'signals' then v.latest_signal_at
          when 'calendar' then v.latest_calendar_update
          else s.latest_verified_at
        end
      ) + make_interval(days => d.freshness_days)
    else null
  end,
  status = case
    when s.applicability = 'not_applicable' then 'complete'
    when d.freshness_days is not null and (
      case s.dimension_key
        when 'source_registry' then v.latest_source_check
        when 'source_snapshot' then v.latest_snapshot_at
        when 'claims' then v.latest_evidence_verified_at
        when 'regulatory_status' then v.latest_evidence_verified_at
        when 'pathways' then v.latest_pathway_verified_at
        when 'market_metrics' then v.latest_metric_updated_at
        when 'trade_flows' then v.latest_trade_verified_at
        when 'signals' then v.latest_signal_at
        when 'calendar' then v.latest_calendar_update
        else s.latest_verified_at
      end
    ) + make_interval(days => d.freshness_days) < now()
      then 'stale'
    else s.status
  end,
  updated_at = now()
from public.jurisdiction_data_depth_dimensions d
join public.v_jurisdiction_data_depth v
  on v.jurisdiction_key = s.jurisdiction_key
where d.dimension_key = s.dimension_key
  and d.contract_version = s.contract_version
  and s.contract_version = '2026-09-22.v1';

create or replace view public.v_jurisdiction_data_depth_contract
with (security_invoker = on) as
select
  s.jurisdiction_key,
  c.country_name,
  s.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  s.applicability,
  s.status,
  s.blocker_reason,
  s.evidence_count,
  s.primary_source_count,
  s.latest_verified_at,
  s.freshness_deadline,
  s.confidence,
  s.evidence_basis,
  s.parent_jurisdiction_key,
  s.last_evaluated_at,
  s.contract_version
from public.jurisdiction_data_depth_dimension_state s
join public.countries c on c.iso_alpha2 = s.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d
  on d.dimension_key = s.dimension_key
 and d.contract_version = s.contract_version;

create or replace view public.v_jurisdiction_data_depth_summary
with (security_invoker = on) as
select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(
    100.0 * count(*) filter (where status='complete')
    / nullif(count(*) filter (where applicability <> 'unknown'),0), 2
  ) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or (applicability='not_applicable' and status='complete')
    or (applicability='applicable' and status='complete')
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_contract
group by jurisdiction_key;

create or replace view public.v_jurisdiction_data_depth_integrity
with (security_invoker = on) as
select
  count(distinct jurisdiction_key) as jurisdiction_count,
  count(*) as matrix_rows,
  count(distinct dimension_key) as dimension_count,
  count(*) filter (where applicability='unknown') as unknown_applicability_rows,
  count(*) filter (where status='unmeasured') as unmeasured_rows,
  count(*) filter (where status in ('blocked','stale','conflict')) as blocked_or_exception_rows,
  count(*) filter (where applicability='applicable' and status='complete') as applicable_complete_rows,
  count(*) filter (where applicability='not_applicable' and status='complete') as not_applicable_complete_rows,
  count(*) filter (where applicability='applicable' and status<>'complete') as applicable_incomplete_rows,
  (count(distinct jurisdiction_key)=291) as expected_jurisdiction_count,
  (count(distinct dimension_key)=32) as expected_dimension_count,
  (count(*)=291*32) as expected_matrix_size,
  (
    count(distinct jurisdiction_key)=291
    and count(distinct dimension_key)=32
    and count(*)=291*32
    and count(*) filter (where applicability='unknown')=0
    and count(*) filter (where status in ('missing','blocked','stale','conflict','unmeasured'))=0
  ) as full_depth_ready;

grant select on public.v_jurisdiction_data_depth_contract to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_summary to anon, authenticated;
grant select on public.v_jurisdiction_data_depth_integrity to anon, authenticated;

comment on table public.jurisdiction_data_depth_dimension_state is
'Authoritative jurisdiction x dimension state matrix. Unknown applicability, missing evidence, stale evidence and conflicts are never treated as complete.';
comment on view public.v_jurisdiction_data_depth_integrity is
'Fail-closed integrity gate for the 291 x 32 full-depth contract. full_depth_ready is true only when every cell is explicitly applicable or not-applicable and complete.';
