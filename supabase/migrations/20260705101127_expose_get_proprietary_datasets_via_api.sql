-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260705101127.
--
-- Rewriting this file cannot affect production: 20260705101127 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Same pattern as api.get_command_centre_stats() -- a thin passthrough wrapper
-- in the api schema PostgREST actually serves. Failing since 2026-06-07 on
-- /admin/proprietary-intelligence (PGRST202: function not found).
create or replace function api.get_proprietary_datasets()
returns table(id text, name text, category text, record_count bigint, freshness_days integer, coverage_markets text[], coverage_categories text[], last_updated timestamptz, completeness_pct integer, status text)
language sql
stable
security definer
set search_path to ''
as $$
  select * from public.get_proprietary_datasets();
$$;

grant execute on function api.get_proprietary_datasets() to service_role, authenticated;

notify pgrst, 'reload schema';
