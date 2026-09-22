-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260921004056
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

-- Production security hardening for three tables that are not intended as public APIs.
alter table public._claude_push_staging enable row level security;
alter table public.legal_data_hunter_pulls enable row level security;
alter table public.cannabinoid_compounds enable row level security;

revoke all on table public._claude_push_staging from anon, authenticated;
revoke all on table public.legal_data_hunter_pulls from anon, authenticated;
revoke all on table public.cannabinoid_compounds from anon, authenticated;

-- The repair RPC is an internal service operation; it must never be callable by PUBLIC/anon.
revoke all on function public.hv_rules_repair_limited_analysis(integer) from public, anon, authenticated;
grant execute on function public.hv_rules_repair_limited_analysis(integer) to service_role;
