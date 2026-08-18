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
-- version 20260722185019.
--
-- Rewriting this file cannot affect production: 20260722185019 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

comment on table public.signal_classifications is
  'DEPRECATED 2026-07-22: not wired to live promotion or cron automation (Pipeline A). '
  'Still holds 929 real staged rows from a 2026-07-19/20 test window, and hv-classify '
  'mode=pool could still write here if invoked manually -- do not assume this table is '
  'empty or inert. Pipeline B (hv_classify_corpus_* writing directly to '
  'signals.quality_label + hv_promote_signals) is the canonical production promotion '
  'path. See docs/control/STAGE3_PROMOTION.md.';

comment on function api.promote_classified_signals(numeric, boolean, integer) is
  'DEPRECATED 2026-07-22: not part of the live promotion path, superseded by '
  'public.hv_promote_signals (Pipeline B). No evidence this was ever invoked with '
  'p_dry_run=false. Do not wire to production without re-verifying against Pipeline B '
  'first. See docs/control/STAGE3_PROMOTION.md.';
