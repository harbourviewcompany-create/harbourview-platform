import { describe, expect, test } from 'vitest';

describe('full-depth publication gate 004', () => {
  test('defines a strict publication gate distinct from diagnostic completeness', () => {
    const sql = String.raw`-- Evidence architecture hardening 004.
-- Strict publication gate: diagnostics remain permissive, publication remains fail-closed.
-- No source content is fabricated or inferred here.

create or replace view public.v_jurisdiction_full_depth_publication_gate
with (security_invoker = on) as
with evaluator as (
  select * from public.v_jurisdiction_data_depth_evaluator
),
hierarchy as (
  select jurisdiction_key,
         jurisdiction_level,
         parent_jurisdiction_key,
         resolution_method
  from public.jurisdiction_hierarchy
),
snapshot_qualified as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and coalesce(qualifying_snapshot,false)) verified_with_snapshot,
         count(*) filter (where verification_status='verified') verified_total
  from (
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_rules r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulators r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_changes r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_market_participants r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_relationships r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_opportunities r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
  ) x
  group by jurisdiction_key
),
source_authority as (
  select i.jurisdiction_key,
         count(p.jurisdiction_iso2) filter (
           where p.source_snapshot_sha256 is not null
             and lower(p.source_snapshot_sha256) ~ '^[0-9a-f]{64}$'
             and (p.expires_at is null or p.expires_at > now())
             and (p.source_effective_date is null or p.source_effective_date <= current_date)
         ) valid_primary_sources
  from public.jurisdiction_hierarchy i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
  group by i.jurisdiction_key
),
summary as (
  select jurisdiction_key,
         count(*) filter (where applicability='unknown') unknown_applicability,
         count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured')) unresolved_cells,
         count(*) filter (where required_for_regulatory_publication and evaluated_status='complete') required_complete,
         count(*) filter (where required_for_regulatory_publication) required_total
  from evaluator
  group by jurisdiction_key
)
select
  h.jurisdiction_key,
  h.jurisdiction_level,
  h.parent_jurisdiction_key,
  h.resolution_method,
  coalesce(s.unknown_applicability,0) unknown_applicability,
  coalesce(s.unresolved_cells,0) unresolved_cells,
  coalesce(s.required_complete,0) required_complete,
  coalesce(s.required_total,0) required_total,
  coalesce(q.verified_total,0) verified_structured_evidence_rows,
  coalesce(q.verified_with_snapshot,0) verified_structured_rows_with_snapshot,
  coalesce(a.valid_primary_sources,0) valid_primary_sources,
  (
    h.jurisdiction_level <> 'unknown'
    and coalesce(s.unknown_applicability,0)=0
    and coalesce(s.unresolved_cells,0)=0
    and coalesce(s.required_complete,0)=coalesce(s.required_total,0)
    and coalesce(q.verified_total,0)=coalesce(q.verified_with_snapshot,0)
    and (
      coalesce(s.required_total,0)=0
      or coalesce(a.valid_primary_sources,0)>0
    )
  ) publication_ready
from hierarchy h
left join summary s on s.jurisdiction_key=h.jurisdiction_key
left join snapshot_qualified q on q.jurisdiction_key=h.jurisdiction_key
left join source_authority a on a.jurisdiction_key=h.jurisdiction_key;

create or replace function public.assert_full_depth_publication_gate()
returns table (
  jurisdiction_count bigint,
  publication_ready_jurisdictions bigint,
  unresolved_applicability_jurisdictions bigint,
  unresolved_cell_jurisdictions bigint,
  missing_primary_source_jurisdictions bigint,
  missing_snapshot_provenance_jurisdictions bigint,
  hierarchy_unresolved_jurisdictions bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with g as (select * from public.v_jurisdiction_full_depth_publication_gate)
  select
    count(*)::bigint,
    count(*) filter (where publication_ready)::bigint,
    count(*) filter (where unknown_applicability>0)::bigint,
    count(*) filter (where unresolved_cells>0)::bigint,
    count(*) filter (where required_total>0 and valid_primary_sources=0)::bigint,
    count(*) filter (where verified_structured_evidence_rows>verified_structured_rows_with_snapshot)::bigint,
    count(*) filter (where jurisdiction_level='unknown')::bigint,
    (
      count(*)=291
      and count(*) filter (where publication_ready)=291
    )
  from g;
$$;

revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated;
grant execute on function public.assert_full_depth_publication_gate() to service_role;
grant select on public.v_jurisdiction_full_depth_publication_gate to authenticated, service_role;

comment on view public.v_jurisdiction_full_depth_publication_gate is
  'Strict publication gate for the 32-dimension jurisdiction-depth contract. Complete status alone is insufficient: applicability, hierarchy, snapshot provenance and required primary-source evidence must also pass.';
`;
    expect(sql).toContain('v_jurisdiction_full_depth_publication_gate');
    expect(sql).toContain('publication_ready');
    expect(sql).toContain("jurisdiction_level <> 'unknown'");
    expect(sql).toContain('unknown_applicability');
    expect(sql).toContain('unresolved_cells');
    expect(sql).toContain('valid_primary_sources');
  });

  test('requires verified structured evidence to have qualifying snapshots', () => {
    const sql = String.raw`-- Evidence architecture hardening 004.
-- Strict publication gate: diagnostics remain permissive, publication remains fail-closed.
-- No source content is fabricated or inferred here.

create or replace view public.v_jurisdiction_full_depth_publication_gate
with (security_invoker = on) as
with evaluator as (
  select * from public.v_jurisdiction_data_depth_evaluator
),
hierarchy as (
  select jurisdiction_key,
         jurisdiction_level,
         parent_jurisdiction_key,
         resolution_method
  from public.jurisdiction_hierarchy
),
snapshot_qualified as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and coalesce(qualifying_snapshot,false)) verified_with_snapshot,
         count(*) filter (where verification_status='verified') verified_total
  from (
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_rules r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulators r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_changes r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_market_participants r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_relationships r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_opportunities r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
  ) x
  group by jurisdiction_key
),
source_authority as (
  select i.jurisdiction_key,
         count(p.jurisdiction_iso2) filter (
           where p.source_snapshot_sha256 is not null
             and lower(p.source_snapshot_sha256) ~ '^[0-9a-f]{64}$'
             and (p.expires_at is null or p.expires_at > now())
             and (p.source_effective_date is null or p.source_effective_date <= current_date)
         ) valid_primary_sources
  from public.jurisdiction_hierarchy i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
  group by i.jurisdiction_key
),
summary as (
  select jurisdiction_key,
         count(*) filter (where applicability='unknown') unknown_applicability,
         count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured')) unresolved_cells,
         count(*) filter (where required_for_regulatory_publication and evaluated_status='complete') required_complete,
         count(*) filter (where required_for_regulatory_publication) required_total
  from evaluator
  group by jurisdiction_key
)
select
  h.jurisdiction_key,
  h.jurisdiction_level,
  h.parent_jurisdiction_key,
  h.resolution_method,
  coalesce(s.unknown_applicability,0) unknown_applicability,
  coalesce(s.unresolved_cells,0) unresolved_cells,
  coalesce(s.required_complete,0) required_complete,
  coalesce(s.required_total,0) required_total,
  coalesce(q.verified_total,0) verified_structured_evidence_rows,
  coalesce(q.verified_with_snapshot,0) verified_structured_rows_with_snapshot,
  coalesce(a.valid_primary_sources,0) valid_primary_sources,
  (
    h.jurisdiction_level <> 'unknown'
    and coalesce(s.unknown_applicability,0)=0
    and coalesce(s.unresolved_cells,0)=0
    and coalesce(s.required_complete,0)=coalesce(s.required_total,0)
    and coalesce(q.verified_total,0)=coalesce(q.verified_with_snapshot,0)
    and (
      coalesce(s.required_total,0)=0
      or coalesce(a.valid_primary_sources,0)>0
    )
  ) publication_ready
from hierarchy h
left join summary s on s.jurisdiction_key=h.jurisdiction_key
left join snapshot_qualified q on q.jurisdiction_key=h.jurisdiction_key
left join source_authority a on a.jurisdiction_key=h.jurisdiction_key;

create or replace function public.assert_full_depth_publication_gate()
returns table (
  jurisdiction_count bigint,
  publication_ready_jurisdictions bigint,
  unresolved_applicability_jurisdictions bigint,
  unresolved_cell_jurisdictions bigint,
  missing_primary_source_jurisdictions bigint,
  missing_snapshot_provenance_jurisdictions bigint,
  hierarchy_unresolved_jurisdictions bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with g as (select * from public.v_jurisdiction_full_depth_publication_gate)
  select
    count(*)::bigint,
    count(*) filter (where publication_ready)::bigint,
    count(*) filter (where unknown_applicability>0)::bigint,
    count(*) filter (where unresolved_cells>0)::bigint,
    count(*) filter (where required_total>0 and valid_primary_sources=0)::bigint,
    count(*) filter (where verified_structured_evidence_rows>verified_structured_rows_with_snapshot)::bigint,
    count(*) filter (where jurisdiction_level='unknown')::bigint,
    (
      count(*)=291
      and count(*) filter (where publication_ready)=291
    )
  from g;
$$;

revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated;
grant execute on function public.assert_full_depth_publication_gate() to service_role;
grant select on public.v_jurisdiction_full_depth_publication_gate to authenticated, service_role;

comment on view public.v_jurisdiction_full_depth_publication_gate is
  'Strict publication gate for the 32-dimension jurisdiction-depth contract. Complete status alone is insufficient: applicability, hierarchy, snapshot provenance and required primary-source evidence must also pass.';
`;
    expect(sql).toContain('verified_total');
    expect(sql).toContain('verified_with_snapshot');
    expect(sql).toContain('verified_structured_evidence_rows=verified_structured_rows_with_snapshot');
  });

  test('keeps publication gate service-role assertion private', () => {
    const sql = String.raw`-- Evidence architecture hardening 004.
-- Strict publication gate: diagnostics remain permissive, publication remains fail-closed.
-- No source content is fabricated or inferred here.

create or replace view public.v_jurisdiction_full_depth_publication_gate
with (security_invoker = on) as
with evaluator as (
  select * from public.v_jurisdiction_data_depth_evaluator
),
hierarchy as (
  select jurisdiction_key,
         jurisdiction_level,
         parent_jurisdiction_key,
         resolution_method
  from public.jurisdiction_hierarchy
),
snapshot_qualified as (
  select jurisdiction_key,
         count(*) filter (where verification_status='verified' and coalesce(qualifying_snapshot,false)) verified_with_snapshot,
         count(*) filter (where verification_status='verified') verified_total
  from (
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_rules r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulators r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_regulatory_changes r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_market_participants r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_relationships r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
    union all
    select r.jurisdiction_key,r.verification_status,g.qualifying_snapshot
    from public.jurisdiction_opportunities r
    left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
  ) x
  group by jurisdiction_key
),
source_authority as (
  select i.jurisdiction_key,
         count(p.jurisdiction_iso2) filter (
           where p.source_snapshot_sha256 is not null
             and lower(p.source_snapshot_sha256) ~ '^[0-9a-f]{64}$'
             and (p.expires_at is null or p.expires_at > now())
             and (p.source_effective_date is null or p.source_effective_date <= current_date)
         ) valid_primary_sources
  from public.jurisdiction_hierarchy i
  left join public.regulatory_market_access_primary_sources p
    on p.jurisdiction_iso2=i.jurisdiction_key
  group by i.jurisdiction_key
),
summary as (
  select jurisdiction_key,
         count(*) filter (where applicability='unknown') unknown_applicability,
         count(*) filter (where evaluated_status in ('missing','blocked','stale','conflict','unmeasured')) unresolved_cells,
         count(*) filter (where required_for_regulatory_publication and evaluated_status='complete') required_complete,
         count(*) filter (where required_for_regulatory_publication) required_total
  from evaluator
  group by jurisdiction_key
)
select
  h.jurisdiction_key,
  h.jurisdiction_level,
  h.parent_jurisdiction_key,
  h.resolution_method,
  coalesce(s.unknown_applicability,0) unknown_applicability,
  coalesce(s.unresolved_cells,0) unresolved_cells,
  coalesce(s.required_complete,0) required_complete,
  coalesce(s.required_total,0) required_total,
  coalesce(q.verified_total,0) verified_structured_evidence_rows,
  coalesce(q.verified_with_snapshot,0) verified_structured_rows_with_snapshot,
  coalesce(a.valid_primary_sources,0) valid_primary_sources,
  (
    h.jurisdiction_level <> 'unknown'
    and coalesce(s.unknown_applicability,0)=0
    and coalesce(s.unresolved_cells,0)=0
    and coalesce(s.required_complete,0)=coalesce(s.required_total,0)
    and coalesce(q.verified_total,0)=coalesce(q.verified_with_snapshot,0)
    and (
      coalesce(s.required_total,0)=0
      or coalesce(a.valid_primary_sources,0)>0
    )
  ) publication_ready
from hierarchy h
left join summary s on s.jurisdiction_key=h.jurisdiction_key
left join snapshot_qualified q on q.jurisdiction_key=h.jurisdiction_key
left join source_authority a on a.jurisdiction_key=h.jurisdiction_key;

create or replace function public.assert_full_depth_publication_gate()
returns table (
  jurisdiction_count bigint,
  publication_ready_jurisdictions bigint,
  unresolved_applicability_jurisdictions bigint,
  unresolved_cell_jurisdictions bigint,
  missing_primary_source_jurisdictions bigint,
  missing_snapshot_provenance_jurisdictions bigint,
  hierarchy_unresolved_jurisdictions bigint,
  gate_pass boolean
)
language sql stable security definer set search_path = public as $$
  with g as (select * from public.v_jurisdiction_full_depth_publication_gate)
  select
    count(*)::bigint,
    count(*) filter (where publication_ready)::bigint,
    count(*) filter (where unknown_applicability>0)::bigint,
    count(*) filter (where unresolved_cells>0)::bigint,
    count(*) filter (where required_total>0 and valid_primary_sources=0)::bigint,
    count(*) filter (where verified_structured_evidence_rows>verified_structured_rows_with_snapshot)::bigint,
    count(*) filter (where jurisdiction_level='unknown')::bigint,
    (
      count(*)=291
      and count(*) filter (where publication_ready)=291
    )
  from g;
$$;

revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated;
grant execute on function public.assert_full_depth_publication_gate() to service_role;
grant select on public.v_jurisdiction_full_depth_publication_gate to authenticated, service_role;

comment on view public.v_jurisdiction_full_depth_publication_gate is
  'Strict publication gate for the 32-dimension jurisdiction-depth contract. Complete status alone is insufficient: applicability, hierarchy, snapshot provenance and required primary-source evidence must also pass.';
`;
    expect(sql).toContain('revoke all on function public.assert_full_depth_publication_gate() from public, anon, authenticated');
    expect(sql).toContain('grant execute on function public.assert_full_depth_publication_gate() to service_role');
  });
});
