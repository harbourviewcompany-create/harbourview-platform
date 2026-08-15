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
-- version 20260713212905.
--
-- Rewriting this file cannot affect production: 20260713212905 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- get_corridor_stats is only ever called via the /api/corridors/data route, which uses the
-- service-role key. anon/authenticated EXECUTE was over-granted (get_command_centre_stats, the
-- pattern it should match, is service_role-only). Revoke the unnecessary exposure.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM anon, authenticated;

-- Also revoke on the underlying public function in case it was granted there too.
REVOKE EXECUTE ON FUNCTION public.get_corridor_stats(text) FROM anon, authenticated;
