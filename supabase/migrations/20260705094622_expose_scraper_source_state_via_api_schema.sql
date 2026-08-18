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
-- version 20260705094622.
--
-- Rewriting this file cannot affect production: 20260705094622 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Same root cause as the earlier hv_artifacts gap: PostgREST on this project
-- exposes only the `api` schema by default. lib/scrapers/ingestor.ts makes
-- raw REST calls to /rest/v1/scraper_source_state with no schema profile
-- header, so every read and write has 404'd since day one (confirmed: 0 rows
-- ever written, despite the scrape cron running daily since 2026-06-06).
--
-- A simple 1:1 view on a single table with a primary key is automatically
-- updatable in Postgres — this fixes both the SELECT (fetchSourceStates) and
-- the upsert (on_conflict=source_id) the ingestor already does, no code
-- change needed.

create or replace view api.scraper_source_state as
select source_id, cadence_hours, last_run_at, last_success_at, consecutive_failures, last_error, updated_at
from public.scraper_source_state;

grant select, insert, update, delete on api.scraper_source_state to service_role, authenticated, anon;
