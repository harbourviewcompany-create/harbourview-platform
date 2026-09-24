-- Must return zero rows after the evidence-integrity migration.

-- Exact contract and source-policy coverage.
select 'dimension_contract' as defect, count(*) as observed
from public.jurisdiction_data_depth_dimensions
where contract_version='2026-09-23.v2'
having count(*) <> 32;

select 'matrix_contract' as defect, count(*) as observed
from public.jurisdiction_data_depth_dimension_state
where contract_version='2026-09-23.v2'
having count(*) <> 9312;

select 'source_policy_contract' as defect, count(*) as observed
from public.jurisdiction_depth_source_policy
having count(*) <> 32;

-- Public views must use security_invoker.
with required_views(view_name) as (
  values
    ('v_jurisdiction_depth_integrity'),
    ('v_jurisdiction_depth_research_queue'),
    ('v_depth_evidence_gate')
)
select r.view_name, 'missing_security_invoker' as defect
from required_views r
join pg_class c on c.relname=r.view_name and c.relkind='v'
join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
where not coalesce((
  select bool_or(option_name='security_invoker' and option_value='true')
  from pg_options_to_table(c.reloptions)
),false);

-- No application write access to evidence, conflict, research, or source-policy tables.
with protected_tables(table_name) as (
  values
    ('jurisdiction_depth_evidence'),
    ('jurisdiction_depth_conflicts'),
    ('jurisdiction_depth_research_queue'),
    ('jurisdiction_depth_source_policy')
)
select p.table_name, 'application_write_access' as defect
from protected_tables p
where has_table_privilege('anon',format('public.%I',p.table_name),'insert,update,delete')
   or has_table_privilege('authenticated',format('public.%I',p.table_name),'insert,update,delete');

-- A publication-verified evidence row must carry the minimum provenance contract.
select evidence_id, 'verified_without_provenance' as defect
from public.jurisdiction_depth_evidence
where evidence_state in ('verified','verified_not_applicable')
  and (
    source_url is null or btrim(source_url)=''
    or source_snapshot_sha256 is null or btrim(source_snapshot_sha256)=''
    or retrieved_at is null
    or verified_at is null
    or applicability='unknown'
  );

-- Inferred evidence can never be publication-verified.
select evidence_id, 'inference_marked_verified' as defect
from public.jurisdiction_depth_evidence
where inference_used
  and evidence_state in ('verified','verified_not_applicable');

-- Open conflicts cannot have been marked resolved by accident.
select conflict_id, 'invalid_resolved_conflict' as defect
from public.jurisdiction_depth_conflicts
where status='resolved'
  and (resolved_at is null or resolution_basis is null or resolution_evidence_id is null);

-- Resolved research items must point to evidence.
select research_id, 'resolved_without_evidence' as defect
from public.jurisdiction_depth_research_queue
where status='resolved'
  and linked_evidence_id is null;

-- Strict depth gate remains fail-closed until every cell has valid evidence or
-- an explicit verified-not-applicable determination.
select 'strict_depth_gate' as defect, gate
from public.v_depth_evidence_gate
where gate <> 'GO';
