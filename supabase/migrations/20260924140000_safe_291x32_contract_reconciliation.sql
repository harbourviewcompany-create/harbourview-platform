-- Safely reconcile the 291 x 32 control-plane contract.
-- This migration is idempotent and is safe whether the prior 33-dimension
-- migration was applied or rolled back. It never creates regulatory facts.

-- Remove the accidental analyst-synthesis dimension from the contracted matrix
-- before removing its dimension definition. It remains outside this matrix.
delete from public.jurisdiction_data_depth_dimension_state
where dimension_key='jurisdiction_intelligence';

delete from public.jurisdiction_data_depth_dimensions
where dimension_key='jurisdiction_intelligence';

-- The dimension registry is keyed by dimension_key, not contract version.
-- Never relabel every historical row: doing so can collide with an existing
-- v2 state row. The exact contract version is assigned only to the 32 keys.
update public.jurisdiction_data_depth_dimensions
set contract_version='2026-09-23.v2'
where dimension_key in (
  'identity','hierarchy','regulatory_status','regulatory_tier',
  'source_registry','source_snapshot','claims','pathways','format_rules',
  'access_rules','commercial_activity','import','export','distribution',
  'testing','packaging_labeling','tax_fees','regulator','calendar',
  'change_history','market_metrics','trade_flows','participants','buyers',
  'sellers','counterparties','relationships','opportunities','signals',
  'freshness','uncertainty','research_queue'
);

-- If an earlier contract-version transition left v1 state rows, copy only
-- rows that do not already have a v2 equivalent, then remove the v1 rows.
-- This avoids a primary-key collision when v2 rows were pre-created.
insert into public.jurisdiction_data_depth_dimension_state (
  jurisdiction_key, dimension_key, contract_version, applicability, status,
  blocker_reason, evidence_count, primary_source_count, latest_verified_at,
  freshness_deadline, confidence, evidence_basis, parent_jurisdiction_key,
  last_evaluated_at, updated_at
)
select
  old.jurisdiction_key, old.dimension_key, '2026-09-23.v2',
  old.applicability, old.status, old.blocker_reason, old.evidence_count,
  old.primary_source_count, old.latest_verified_at, old.freshness_deadline,
  old.confidence, old.evidence_basis, old.parent_jurisdiction_key,
  old.last_evaluated_at, old.updated_at
from public.jurisdiction_data_depth_dimension_state old
where old.contract_version='2026-09-22.v1'
  and exists (
    select 1
    from public.jurisdiction_data_depth_dimensions d
    where d.dimension_key=old.dimension_key
      and d.contract_version='2026-09-23.v2'
  )
  and not exists (
    select 1
    from public.jurisdiction_data_depth_dimension_state current_state
    where current_state.jurisdiction_key=old.jurisdiction_key
      and current_state.dimension_key=old.dimension_key
      and current_state.contract_version='2026-09-23.v2'
  );

delete from public.jurisdiction_data_depth_dimension_state
where contract_version='2026-09-22.v1';

-- Guarantee the matrix has one state row for every canonical jurisdiction
-- and every one of the exact 32 dimensions.
insert into public.jurisdiction_data_depth_dimension_state
(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,'2026-09-23.v2'
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

do $$
declare
  dimension_count integer;
  jurisdiction_count integer;
  matrix_count integer;
  expected_count integer;
  invalid_extra integer;
begin
  select count(*) into dimension_count
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2';

  select count(*) into jurisdiction_count
  from public.countries;

  select count(*) into matrix_count
  from public.jurisdiction_data_depth_dimension_state
  where contract_version='2026-09-23.v2';

  expected_count := jurisdiction_count * dimension_count;

  select count(*) into invalid_extra
  from public.jurisdiction_data_depth_dimensions
  where contract_version='2026-09-23.v2'
    and dimension_key='jurisdiction_intelligence';

  if dimension_count <> 32 then
    raise exception '291x32 contract invariant failed: expected 32 dimensions, found %', dimension_count;
  end if;

  if jurisdiction_count <> 291 then
    raise exception '291x32 contract invariant failed: expected 291 jurisdictions, found %', jurisdiction_count;
  end if;

  if matrix_count <> expected_count then
    raise exception '291x32 matrix invariant failed: expected % rows, found %', expected_count, matrix_count;
  end if;

  if invalid_extra <> 0 then
    raise exception '291x32 contract invariant failed: jurisdiction_intelligence remains in the contracted dimensions';
  end if;
end $$;
