-- Harbourview recovery pre-cutover inventory (read-only).
-- Run on recovery project vxosexkwpqbswusapook. Do not use this SQL as
-- authorization to cut over: source truth, identities, storage, secrets,
-- authenticated smoke, and rollback are external, independently required gates.
with source_evidence as (
  select count(distinct e.jurisdiction_key) as jurisdictions
  from public.jurisdiction_data_depth_evidence e
  join public.source_registry r on r.id=e.source_registry_id
  join public.source_snapshots s
    on s.id=e.source_snapshot_id and s.source_id=r.id
  where e.dimension_key='regulator'
    and e.contract_version='v2'
    and e.verification_status='verified'
    and e.source_url=r.source_url
    and s.fetch_status='success'
    and s.raw_html_hash ~ '^[0-9a-fA-F]{64}$'
),
inventory as (
  select
    (select count(*) from public.countries) as countries,
    (select count(*) from public.jurisdiction_data_depth_dimensions
      where contract_version='2026-09-23.v2') as canonical_dimensions,
    (select count(*) from public.jurisdiction_data_depth_dimension_state
      where contract_version='2026-09-23.v2') as dimension_states,
    (select jurisdictions from source_evidence) as verified_regulator_jurisdictions,
    (select count(*) from auth.users) as auth_users,
    (select count(*) from cron.job where active) as active_cron_jobs,
    (select count(*) from pg_class t
      join pg_namespace n on n.oid=t.relnamespace
      where n.nspname='public' and t.relkind in ('r','p') and not t.relrowsecurity) as unprotected_public_tables
)
select now() as checked_at_utc,inventory.*,
  (countries=291 and canonical_dimensions=32
   and dimension_states=9312) as depth_matrix_gate,
  (verified_regulator_jurisdictions>=55) as regulator_evidence_gate,
  (auth_users>0) as nonempty_auth_only_not_parity,
  (active_cron_jobs=0) as background_jobs_safely_paused,
  (unprotected_public_tables=0) as public_rls_enabled_gate,
  false as external_original_data_parity_verified,
  false as external_authenticated_smoke_verified,
  false as cutover_authorized
from inventory;
