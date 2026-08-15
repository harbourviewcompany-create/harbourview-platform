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
-- version 20260705101423.
--
-- Rewriting this file cannot affect production: 20260705101423 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- lib/intelligence-engine/orchestrator.ts (the intelligence-ingest cron, runs
-- 4x/day) has always written previous_hash + changed on every snapshot save --
-- neither column has ever existed. Every successful-fetch save has been
-- failing outright with a schema-cache error since before this table's
-- earliest visible logs. Confirmed via code: these drive the orchestrator's
-- own content-diff dedup logic ("skip re-running AI extraction on identical
-- pages") -- not decorative, genuinely load-bearing for that optimization.
--
-- Also fixes a second, compounding bug in the same insert: the code writes
-- processing_status='pending_extraction' on every successful fetch, but the
-- CHECK constraint never allowed that value -- only pending/processing/
-- extracted/translated/failed/skipped. Even with the columns added, every
-- successful capture would still have been rejected by this constraint.
-- 'pending_extraction' is intentionally distinct from the generic 'pending'
-- used by other source_snapshots consumers (run_signal_extraction, hv-extract)
-- so it can route specifically to /api/cron/intelligence-extract without
-- colliding with those other pipelines -- extending the constraint rather
-- than changing the code to reuse 'pending' preserves that separation.

alter table source_snapshots add column if not exists previous_hash text;
alter table source_snapshots add column if not exists changed boolean default false;

alter table source_snapshots drop constraint source_snapshots_processing_status_check;
alter table source_snapshots add constraint source_snapshots_processing_status_check
  check (processing_status = any (array['pending','pending_extraction','processing','extracted','translated','failed','skipped']));

notify pgrst, 'reload schema';
