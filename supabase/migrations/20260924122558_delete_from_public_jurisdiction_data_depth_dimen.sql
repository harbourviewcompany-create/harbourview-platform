-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924122558
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

delete from public.jurisdiction_data_depth_dimension_state
where dimension_key='jurisdiction_intelligence';

delete from public.jurisdiction_data_depth_dimensions
where dimension_key='jurisdiction_intelligence';

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
    select 1 from public.jurisdiction_data_depth_dimensions d
    where d.dimension_key=old.dimension_key and d.contract_version='2026-09-23.v2'
  )
  and not exists (
    select 1 from public.jurisdiction_data_depth_dimension_state current_state
    where current_state.jurisdiction_key=old.jurisdiction_key
      and current_state.dimension_key=old.dimension_key
      and current_state.contract_version='2026-09-23.v2'
  );

delete from public.jurisdiction_data_depth_dimension_state
where contract_version='2026-09-22.v1';

insert into public.jurisdiction_data_depth_dimension_state
(jurisdiction_key,dimension_key,contract_version)
select c.iso_alpha2,d.dimension_key,'2026-09-23.v2'
from public.countries c
cross join public.jurisdiction_data_depth_dimensions d
where d.contract_version='2026-09-23.v2'
on conflict (jurisdiction_key,dimension_key,contract_version) do nothing;

do $$
declare dimension_count integer; jurisdiction_count integer; matrix_count integer; expected_count integer; invalid_extra integer;
begin
select count(*) into dimension_count from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2';
select count(*) into jurisdiction_count from public.countries;
select count(*) into matrix_count from public.jurisdiction_data_depth_dimension_state where contract_version='2026-09-23.v2';
expected_count := jurisdiction_count * dimension_count;
select count(*) into invalid_extra from public.jurisdiction_data_depth_dimensions where contract_version='2026-09-23.v2' and dimension_key='jurisdiction_intelligence';
if dimension_count <> 32 then raise exception '291x32 invariant: expected 32 dimensions, found %',dimension_count; end if;
if jurisdiction_count <> 291 then raise exception '291x32 invariant: expected 291 jurisdictions, found %',jurisdiction_count; end if;
if matrix_count <> expected_count then raise exception '291x32 invariant: expected % rows, found %',expected_count,matrix_count; end if;
if invalid_extra <> 0 then raise exception '291x32 invariant: jurisdiction_intelligence remains'; end if;
end $$;
