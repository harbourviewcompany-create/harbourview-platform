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
-- version 20260720023832.
--
-- Rewriting this file cannot affect production: 20260720023832 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Schedule the quality pipeline (idempotent: cron.schedule updates an existing job by name).
select cron.schedule('hv-quality-pipeline', '*/2 * * * *', $$select public.hv_pipeline_tick()$$);
select cron.schedule('hv-quality-promote', '*/10 * * * *', $$select public.hv_quality_promote_tick()$$);
