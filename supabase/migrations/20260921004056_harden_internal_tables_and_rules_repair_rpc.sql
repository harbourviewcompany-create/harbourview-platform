-- Reconcile the production security hardening applied by
-- 20260921004056_harden_internal_tables_and_rules_repair_rpc.
-- Idempotent by design; no data is modified.

alter table public._claude_push_staging enable row level security;
alter table public.legal_data_hunter_pulls enable row level security;
alter table public.cannabinoid_compounds enable row level security;

revoke all on table public._claude_push_staging from anon, authenticated;
revoke all on table public.legal_data_hunter_pulls from anon, authenticated;
revoke all on table public.cannabinoid_compounds from anon, authenticated;

revoke all on function public.hv_rules_repair_limited_analysis(integer) from public, anon, authenticated;
grant execute on function public.hv_rules_repair_limited_analysis(integer) to service_role;
