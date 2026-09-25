-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260922101846
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

create table if not exists public.jurisdiction_data_depth_tasks (
  jurisdiction_key text not null,
  dimension_key text not null,
  jurisdiction_level text not null,
  status text not null default 'open',
  priority integer not null default 100,
  evidence_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (jurisdiction_key,dimension_key),
  constraint jurisdiction_data_depth_tasks_status_check check (status in ('open','in_progress','verified','blocked','not_applicable')),
  constraint jurisdiction_data_depth_tasks_level_check check (jurisdiction_level in ('national','subnational'))
);

insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select d.jurisdiction_key,d.dimension_key,d.jurisdiction_level,'open',
       row_number() over(order by d.depth_pct asc,d.jurisdiction_key,d.dimension_key),
       true,
       'Generated from measured data-depth gap. Populate only from authoritative or explicitly qualified sources; do not infer missing regulatory facts.'
from (
  select v.*,
    unnest(array[
      case when v.active_country_intel_rows=0 then 'country_intel' end,
      case when v.current_verified_evidence_rows=0 then 'verified_regulatory_evidence' end,
      case when v.verified_claim_rows=0 then 'verified_regulatory_claims' end,
      case when v.verified_pathway_rows=0 then 'verified_pathways' end,
      case when v.verified_format_rule_rows=0 then 'verified_format_rules' end,
      case when v.jurisdiction_level='national' and v.metric_rows=0 then 'market_metrics' end,
      case when v.jurisdiction_level='national' and v.trade_flow_rows=0 then 'trade_flows' end,
      case when v.jurisdiction_level='national' and v.signal_rows=0 then 'signals' end,
      case when v.active_source_rows=0 then 'source_registry' end,
      case when v.successful_snapshot_rows=0 then 'source_snapshots' end,
      case when v.open_calendar_rows=0 then 'regulatory_calendar' end
    ]) as dimension_key
  from public.v_jurisdiction_data_depth v
) d
where d.dimension_key is not null
on conflict (jurisdiction_key,dimension_key) do update
set priority=excluded.priority,
    jurisdiction_level=excluded.jurisdiction_level,
    updated_at=now();

create index if not exists idx_jurisdiction_data_depth_tasks_status_priority
on public.jurisdiction_data_depth_tasks(status,priority);

create index if not exists idx_jurisdiction_data_depth_tasks_jurisdiction
on public.jurisdiction_data_depth_tasks(jurisdiction_key);

alter table public.jurisdiction_data_depth_tasks enable row level security;
drop policy if exists "public read depth tasks" on public.jurisdiction_data_depth_tasks;
create policy "public read depth tasks" on public.jurisdiction_data_depth_tasks
for select to anon,authenticated using (true);

grant select on public.jurisdiction_data_depth_tasks to anon,authenticated;
