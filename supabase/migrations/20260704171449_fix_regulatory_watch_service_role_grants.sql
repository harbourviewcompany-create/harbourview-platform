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
-- version 20260704171449.
--
-- Rewriting this file cannot affect production: 20260704171449 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- regulatory_watch_cron (service_role) has been getting a live 403 on every
-- run: "permission denied for table sources... GRANT SELECT ON
-- regulatory_signals.sources TO service_role" (confirmed via Vercel runtime
-- error logs, recurring through 2026-07-04). The `authenticated` role has
-- full SELECT/INSERT/UPDATE/DELETE across every table in this schema, but
-- service_role -- the role the cron worker actually authenticates as --
-- was never granted schema USAGE or any table privileges at all. Mirrors
-- authenticated's existing grant shape exactly (least-surprise, not
-- broader than what already works for the other server-side role).
GRANT USAGE ON SCHEMA regulatory_signals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA regulatory_signals TO service_role;

NOTIFY pgrst, 'reload schema';
