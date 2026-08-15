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
-- version 20260705110051.
--
-- Rewriting this file cannot affect production: 20260705110051 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Fresh security advisor scan caught two grant overreaches introduced this
-- session, both mine to fix:
--
-- 1. api.scraper_source_state was granted SELECT/INSERT/UPDATE/DELETE to
--    anon and authenticated -- this is server-only scraper pipeline state
--    tracking, matching exactly the class of table the 2026-06-23 audit
--    classified as "server-side-only pipeline/admin tables... no anon/
--    authenticated access intended" (_push_staging, adi_cache, etc). Should
--    have been service_role only from the start.
--
-- 2. api.get_proprietary_datasets() is callable by anon AND authenticated --
--    Postgres grants EXECUTE to PUBLIC by default on function creation
--    unless explicitly revoked, and my migration didn't revoke it. This
--    returns internal business metrics for an admin-only page
--    (/admin/proprietary-intelligence) and should never have been callable
--    by a logged-in-but-non-admin user, let alone anonymously.

revoke select, insert, update, delete on api.scraper_source_state from anon, authenticated;

revoke execute on function api.get_proprietary_datasets() from public, anon, authenticated;
grant execute on function api.get_proprietary_datasets() to service_role;

notify pgrst, 'reload schema';
