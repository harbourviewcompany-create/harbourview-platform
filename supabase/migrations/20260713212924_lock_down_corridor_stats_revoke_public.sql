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
-- version 20260713212924.
--
-- Rewriting this file cannot affect production: 20260713212924 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- The grants are inherited via PUBLIC (the schema-default EXECUTE grant), not direct role grants —
-- same gotcha as the marketplace_public_listings_v1 view earlier. Revoke from PUBLIC, grant service_role only.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_corridor_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.get_corridor_stats(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_corridor_stats(text) TO service_role;
