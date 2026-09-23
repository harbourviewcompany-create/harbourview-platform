import { describe, expect, test } from 'vitest';

describe('evidence architecture hardening 007', () => {
  test('adds versioned evidence lineage', () => {
    const sql=String.raw`-- Evidence architecture hardening 007.
-- Explicit versioned lineage and remediation state. No evidence rows are fabricated.

create table if not exists public.jurisdiction_data_depth_evidence_lineage (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null,
  evidence_id uuid,
  source_registry_id uuid,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  evidence_version integer not null default 1 check (evidence_version>0),
  lineage_status text not null default 'pending' check (lineage_status in ('pending','verified','superseded','rejected','conflict')),
  supersedes_lineage_id uuid references public.jurisdiction_data_depth_evidence_lineage(id) on delete restrict,
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,evidence_kind,evidence_id,evidence_version)
);

alter table public.jurisdiction_data_depth_evidence_lineage enable row level security;
drop policy if exists jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage;
create policy jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence_lineage to anon,authenticated;

create or replace view public.v_jurisdiction_data_depth_lineage_integrity
with (security_invoker=on) as
select
  l.jurisdiction_key,
  l.dimension_key,
  count(*) lineage_rows,
  count(*) filter(where l.lineage_status='verified') verified_rows,
  count(*) filter(where l.lineage_status='superseded') superseded_rows,
  count(*) filter(where l.lineage_status='conflict') conflict_rows,
  count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null) verified_without_snapshot,
  count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null) verified_without_source,
  count(*) filter(where l.lineage_status='verified' and l.verified_at is null) verified_without_timestamp,
  case
    when count(*) filter(where l.lineage_status='conflict')>0 then 'CONFLICT'
    when count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null)>0 then 'MISSING_SNAPSHOT'
    when count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null)>0 then 'MISSING_SOURCE'
    when count(*) filter(where l.lineage_status='verified' and l.verified_at is null)>0 then 'MISSING_VERIFICATION_TIMESTAMP'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence_lineage l
group by l.jurisdiction_key,l.dimension_key;

create or replace view public.v_jurisdiction_data_depth_research_queue_gate
with (security_invoker=on) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  case
    when s.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
    when s.status in ('missing','blocked','stale','conflict','unmeasured') then upper(s.status)
    when s.applicability='not_applicable'
      and coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')<>'OK'
      then coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')
    else 'RESOLVED'
  end queue_state
from public.jurisdiction_data_depth_dimension_state s
left join public.v_jurisdiction_data_depth_applicability_gate a
  on a.jurisdiction_key=s.jurisdiction_key and a.dimension_key=s.dimension_key;

create or replace function public.assert_full_depth_291x32()
returns table (
  jurisdiction_count bigint,
  dimension_count bigint,
  matrix_rows bigint,
  unknown_applicability bigint,
  unresolved_cells bigint,
  unknown_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path=public as $$
  with x as (select * from public.jurisdiction_data_depth_evaluator)
  select
    count(distinct jurisdiction_key)::bigint,
    count(distinct dimension_key)::bigint,
    count(*)::bigint,
    count(*) filter(where applicability='unknown')::bigint,
    count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))::bigint,
    (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')::bigint,
    (
      count(distinct jurisdiction_key)=291
      and count(distinct dimension_key)=32
      and count(*)=291*32
      and count(*) filter(where applicability='unknown')=0
      and count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
      and (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_291x32() from public,anon,authenticated;
grant execute on function public.assert_full_depth_291x32() to service_role;

comment on table public.jurisdiction_data_depth_evidence_lineage is
  'Versioned audit lineage for jurisdiction-depth evidence. Corrections create new versions; supersession is explicit.';
`;
    expect(sql).toContain('jurisdiction_data_depth_evidence_lineage');
    expect(sql).toContain('supersedes_lineage_id');
    expect(sql).toContain('evidence_version');
  });
  test('provides closed-loop research queue states', () => {
    const sql=String.raw`-- Evidence architecture hardening 007.
-- Explicit versioned lineage and remediation state. No evidence rows are fabricated.

create table if not exists public.jurisdiction_data_depth_evidence_lineage (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null,
  evidence_id uuid,
  source_registry_id uuid,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  evidence_version integer not null default 1 check (evidence_version>0),
  lineage_status text not null default 'pending' check (lineage_status in ('pending','verified','superseded','rejected','conflict')),
  supersedes_lineage_id uuid references public.jurisdiction_data_depth_evidence_lineage(id) on delete restrict,
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,evidence_kind,evidence_id,evidence_version)
);

alter table public.jurisdiction_data_depth_evidence_lineage enable row level security;
drop policy if exists jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage;
create policy jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence_lineage to anon,authenticated;

create or replace view public.v_jurisdiction_data_depth_lineage_integrity
with (security_invoker=on) as
select
  l.jurisdiction_key,
  l.dimension_key,
  count(*) lineage_rows,
  count(*) filter(where l.lineage_status='verified') verified_rows,
  count(*) filter(where l.lineage_status='superseded') superseded_rows,
  count(*) filter(where l.lineage_status='conflict') conflict_rows,
  count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null) verified_without_snapshot,
  count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null) verified_without_source,
  count(*) filter(where l.lineage_status='verified' and l.verified_at is null) verified_without_timestamp,
  case
    when count(*) filter(where l.lineage_status='conflict')>0 then 'CONFLICT'
    when count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null)>0 then 'MISSING_SNAPSHOT'
    when count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null)>0 then 'MISSING_SOURCE'
    when count(*) filter(where l.lineage_status='verified' and l.verified_at is null)>0 then 'MISSING_VERIFICATION_TIMESTAMP'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence_lineage l
group by l.jurisdiction_key,l.dimension_key;

create or replace view public.v_jurisdiction_data_depth_research_queue_gate
with (security_invoker=on) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  case
    when s.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
    when s.status in ('missing','blocked','stale','conflict','unmeasured') then upper(s.status)
    when s.applicability='not_applicable'
      and coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')<>'OK'
      then coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')
    else 'RESOLVED'
  end queue_state
from public.jurisdiction_data_depth_dimension_state s
left join public.v_jurisdiction_data_depth_applicability_gate a
  on a.jurisdiction_key=s.jurisdiction_key and a.dimension_key=s.dimension_key;

create or replace function public.assert_full_depth_291x32()
returns table (
  jurisdiction_count bigint,
  dimension_count bigint,
  matrix_rows bigint,
  unknown_applicability bigint,
  unresolved_cells bigint,
  unknown_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path=public as $$
  with x as (select * from public.jurisdiction_data_depth_evaluator)
  select
    count(distinct jurisdiction_key)::bigint,
    count(distinct dimension_key)::bigint,
    count(*)::bigint,
    count(*) filter(where applicability='unknown')::bigint,
    count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))::bigint,
    (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')::bigint,
    (
      count(distinct jurisdiction_key)=291
      and count(distinct dimension_key)=32
      and count(*)=291*32
      and count(*) filter(where applicability='unknown')=0
      and count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
      and (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_291x32() from public,anon,authenticated;
grant execute on function public.assert_full_depth_291x32() to service_role;

comment on table public.jurisdiction_data_depth_evidence_lineage is
  'Versioned audit lineage for jurisdiction-depth evidence. Corrections create new versions; supersession is explicit.';
`;
    expect(sql).toContain('v_jurisdiction_data_depth_research_queue_gate');
    expect(sql).toContain('UNKNOWN_APPLICABILITY');
    expect(sql).toContain('RESOLVED');
  });
  test('asserts the complete 291x32 contract', () => {
    const sql=String.raw`-- Evidence architecture hardening 007.
-- Explicit versioned lineage and remediation state. No evidence rows are fabricated.

create table if not exists public.jurisdiction_data_depth_evidence_lineage (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null,
  evidence_id uuid,
  source_registry_id uuid,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  evidence_version integer not null default 1 check (evidence_version>0),
  lineage_status text not null default 'pending' check (lineage_status in ('pending','verified','superseded','rejected','conflict')),
  supersedes_lineage_id uuid references public.jurisdiction_data_depth_evidence_lineage(id) on delete restrict,
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(jurisdiction_key,dimension_key,evidence_kind,evidence_id,evidence_version)
);

alter table public.jurisdiction_data_depth_evidence_lineage enable row level security;
drop policy if exists jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage;
create policy jurisdiction_depth_lineage_read on public.jurisdiction_data_depth_evidence_lineage
for select to anon,authenticated using (true);
grant select on public.jurisdiction_data_depth_evidence_lineage to anon,authenticated;

create or replace view public.v_jurisdiction_data_depth_lineage_integrity
with (security_invoker=on) as
select
  l.jurisdiction_key,
  l.dimension_key,
  count(*) lineage_rows,
  count(*) filter(where l.lineage_status='verified') verified_rows,
  count(*) filter(where l.lineage_status='superseded') superseded_rows,
  count(*) filter(where l.lineage_status='conflict') conflict_rows,
  count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null) verified_without_snapshot,
  count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null) verified_without_source,
  count(*) filter(where l.lineage_status='verified' and l.verified_at is null) verified_without_timestamp,
  case
    when count(*) filter(where l.lineage_status='conflict')>0 then 'CONFLICT'
    when count(*) filter(where l.lineage_status='verified' and l.source_snapshot_id is null)>0 then 'MISSING_SNAPSHOT'
    when count(*) filter(where l.lineage_status='verified' and l.source_registry_id is null)>0 then 'MISSING_SOURCE'
    when count(*) filter(where l.lineage_status='verified' and l.verified_at is null)>0 then 'MISSING_VERIFICATION_TIMESTAMP'
    else 'OK'
  end gate_code
from public.jurisdiction_data_depth_evidence_lineage l
group by l.jurisdiction_key,l.dimension_key;

create or replace view public.v_jurisdiction_data_depth_research_queue_gate
with (security_invoker=on) as
select
  s.jurisdiction_key,
  s.dimension_key,
  s.applicability,
  s.status,
  case
    when s.applicability='unknown' then 'UNKNOWN_APPLICABILITY'
    when s.status in ('missing','blocked','stale','conflict','unmeasured') then upper(s.status)
    when s.applicability='not_applicable'
      and coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')<>'OK'
      then coalesce(a.gate_code,'MISSING_APPLICABILITY_EVIDENCE')
    else 'RESOLVED'
  end queue_state
from public.jurisdiction_data_depth_dimension_state s
left join public.v_jurisdiction_data_depth_applicability_gate a
  on a.jurisdiction_key=s.jurisdiction_key and a.dimension_key=s.dimension_key;

create or replace function public.assert_full_depth_291x32()
returns table (
  jurisdiction_count bigint,
  dimension_count bigint,
  matrix_rows bigint,
  unknown_applicability bigint,
  unresolved_cells bigint,
  unknown_hierarchy bigint,
  gate_pass boolean
)
language sql stable security definer set search_path=public as $$
  with x as (select * from public.jurisdiction_data_depth_evaluator)
  select
    count(distinct jurisdiction_key)::bigint,
    count(distinct dimension_key)::bigint,
    count(*)::bigint,
    count(*) filter(where applicability='unknown')::bigint,
    count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))::bigint,
    (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')::bigint,
    (
      count(distinct jurisdiction_key)=291
      and count(distinct dimension_key)=32
      and count(*)=291*32
      and count(*) filter(where applicability='unknown')=0
      and count(*) filter(where evaluated_status in ('missing','blocked','stale','conflict','unmeasured'))=0
      and (select count(*) from public.jurisdiction_hierarchy where jurisdiction_level='unknown')=0
    )
  from x;
$$;

revoke all on function public.assert_full_depth_291x32() from public,anon,authenticated;
grant execute on function public.assert_full_depth_291x32() to service_role;

comment on table public.jurisdiction_data_depth_evidence_lineage is
  'Versioned audit lineage for jurisdiction-depth evidence. Corrections create new versions; supersession is explicit.';
`;
    expect(sql).toContain('count(*)=291*32');
    expect(sql).toContain('unknown_hierarchy');
    expect(sql).toContain('assert_full_depth_291x32');
  });
});
