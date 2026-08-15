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
-- version 20260720025910.
--
-- Rewriting this file cannot affect production: 20260720025910 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Per-source signal yield: which sources produce real signals vs junk. Re-runnable as the backfill grows.
create or replace view public.source_yield_report as
select
  regexp_replace(url, '^https?://(www\.)?([^/]+).*', '\2') as domain,
  count(*) as classified,
  count(*) filter (where quality_label='signal') as signals,
  round(100.0*count(*) filter (where quality_label='signal')/count(*), 0) as signal_pct,
  count(*) filter (where quality_label in ('spam','nav','boilerplate')) as junk,
  round(100.0*count(*) filter (where quality_label in ('spam','nav','boilerplate'))/count(*), 0) as junk_pct,
  count(*) filter (where quality_label='duplicate') as dupes,
  count(*) filter (where reviewed_by='auto:v1') as promoted
from public.signals
where quality_label is not null and url is not null
group by 1;
