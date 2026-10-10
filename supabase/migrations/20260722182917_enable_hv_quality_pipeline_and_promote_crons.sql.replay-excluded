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
-- version 20260722182917.
--
-- Rewriting this file cannot affect production: 20260722182917 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Enables continuous automation for the Stage 3 promotion pipeline (Pipeline B in
-- docs/control/STAGE3_PROMOTION.md), per Tyler's explicit go-ahead. Both jobs were
-- built and wired (see 20260722020100_hv_quality_promote_explicit_confidence_floor.sql
-- for the just-fixed 0.65 confidence floor they now run under) but left inactive
-- pending this decision. This migration only flips their `active` flag -- job bodies
-- are unchanged.
--
-- hv-quality-pipeline (jobid 47, */2 min): translate/classify/embed/entity dispatch+harvest.
-- hv-quality-promote  (jobid 48, */10 min): dedup + promote (hv_promote_signals(0.65)).
--
-- Rollback: select cron.alter_job(47, active => false); select cron.alter_job(48, active => false);
-- Guarded because pg_cron job IDs are database-local. Production recorded 47/48,
-- but a zero-state replay or a Supabase Preview branch assigns its own IDs, where
-- a bare cron.alter_job(47, ...) raises instead of no-opping. The CI replay skips
-- this file via REPLAY_ZERO_STATE_SKIPS; Supabase Preview does not run the prep
-- script and executes it, so the guard has to live in the file. The immediately
-- following 20260722185015 resolves the same two jobs by name and applies the
-- same active=true state, so a skipped alter here loses nothing.
do $$
begin
  if exists (select 1 from cron.job where jobid = 47) then
    perform cron.alter_job(47, active => true);
  end if;
  if exists (select 1 from cron.job where jobid = 48) then
    perform cron.alter_job(48, active => true);
  end if;
end $$;
