-- Evidence architecture hardening 005.
-- Operational capture queue for verified facts that still lack a qualifying immutable snapshot.
-- This migration creates no evidence and never auto-links a fact to an unrelated snapshot.

create or replace view public.v_jurisdiction_evidence_capture_queue
with (security_invoker = on) as
select
  'rule' evidence_kind,
  r.id evidence_id,
  r.jurisdiction_key,
  r.rule_dimension dimension_key,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end capture_status,
  sr.id source_registry_id,
  sr.source_name,
  sr.source_url registered_source_url
from public.jurisdiction_regulatory_rules r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'regulator',
  r.id,
  r.jurisdiction_key,
  'regulator',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_regulators r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'change',
  r.id,
  r.jurisdiction_key,
  r.dimension_key,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_regulatory_changes r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'participant',
  r.id,
  r.jurisdiction_key,
  r.participant_type,
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_market_participants r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'relationship',
  r.id,
  r.jurisdiction_key,
  'relationships',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_relationships r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false)

union all

select
  'opportunity',
  r.id,
  r.jurisdiction_key,
  'opportunities',
  r.source_url,
  r.source_snapshot_id,
  r.verified_at,
  case
    when r.source_snapshot_id is null then 'missing_snapshot_reference'
    when g.snapshot_id is null then 'snapshot_not_qualifying'
    else 'none'
  end,
  sr.id,
  sr.source_name,
  sr.source_url
from public.jurisdiction_opportunities r
left join public.v_jurisdiction_verified_snapshot_gate g on g.snapshot_id=r.source_snapshot_id
left join public.source_registry sr on sr.source_url=r.source_url
where r.verification_status='verified'
  and not coalesce(g.qualifying_snapshot,false);

grant select on public.v_jurisdiction_evidence_capture_queue to authenticated, service_role;

comment on view public.v_jurisdiction_evidence_capture_queue is
  'Operational queue for verified structured evidence lacking a qualifying immutable source snapshot. It identifies capture work but never fabricates or auto-links provenance.';
