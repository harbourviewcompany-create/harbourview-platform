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
-- version 20260722185015.
--
-- Rewriting this file cannot affect production: 20260722185015 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

do $$
declare
  v_pipeline_id bigint;
  v_promote_id bigint;
begin
  select jobid into strict v_pipeline_id from cron.job where jobname = 'hv-quality-pipeline';
  select jobid into strict v_promote_id from cron.job where jobname = 'hv-quality-promote';
  perform cron.alter_job(v_pipeline_id, active => true);
  perform cron.alter_job(v_promote_id, active => true);
end $$;
