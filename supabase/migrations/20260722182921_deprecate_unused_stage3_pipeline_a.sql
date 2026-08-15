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
-- version 20260722182921.
--
-- Rewriting this file cannot affect production: 20260722182921 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Per Tyler's decision (2026-07-22): Pipeline B (hv_classify_corpus_* /
-- hv_promote_signals / hv_dedup_assign) is canonical -- it's the one actually proven
-- in production and now has continuous automation enabled. Pipeline A
-- (signal_classifications / api.promote_classified_signals) was never wired to
-- anything and is now formally deprecated. Marker only -- no drop, no data touched,
-- fully reversible. See docs/control/STAGE3_PROMOTION.md for full context.
comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: unused staging table for Pipeline A (api.promote_classified_signals), '
  'never wired to production. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is canonical. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: never wired to production, superseded by public.hv_promote_signals '
  '(Pipeline B). Do not call. See docs/control/STAGE3_PROMOTION.md.';
