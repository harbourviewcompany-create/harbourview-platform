-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the text production ran, read
-- back from supabase_migrations.schema_migrations.statements for version
-- 20260715085610, with the one documented deviation described next.
--
-- Rewriting this file cannot affect production: 20260715085610 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs
-- (this file no longer carries the stub marker, so that script leaves it alone;
-- re-deriving it by hand must preserve the deviation below.)
--
-- DEVIATION FROM THE RECORDED BODY — THREE APPENDED COLUMNS
-- --------------------------------------------------------
-- Same cause, and the same remedy, as the two deviations already documented in
-- 20260626110925_remote_applied_repair.sql.
--
-- What production ran here was a twenty-nine-column list. That was correct in
-- production, where api.signals genuinely held twenty-seven columns at the time
-- and this migration appended `reviewed_by` / `reviewed_at` — which is the whole
-- point of the migration and is preserved below.
--
-- It is not correct in a zero-state replay. 20260626110925 cannot issue its
-- recorded `SELECT * FROM public.signals`, because public.signals is created by
-- 20260618210840_public_signals_foundation_replay.sql with all fifty-three of its
-- final columns, so `SELECT *` would build a far wider view than production had.
-- That migration therefore pins api.signals to an explicit thirty-two-column
-- list — the twenty-nine below plus `editorial_title`, `editorial_blurb` and
-- `country_iso2`.
--
-- Replaying the recorded twenty-nine-column body against that thirty-two-column
-- view asks CREATE OR REPLACE VIEW to drop three columns, which it cannot do:
--
--   ERROR:  cannot drop columns from view
--
-- Reproduced on PostgreSQL 16.13 by replaying 20260626110925's api.signals
-- statement followed by the previous contents of this file.
--
-- The workaround was to list this file in REPLAY_ZERO_STATE_SKIPS in
-- scripts/prepare-production-faithful-migration-replay.mjs, so replay never ran
-- it at all. That made the replay green at the cost of silently not executing a
-- migration — including the `security_invoker = on` stamp it exists to set.
--
-- The fix is to append the three columns 20260626110925 already pinned, in that
-- exact order. `CREATE OR REPLACE VIEW` can append but cannot drop or reorder,
-- and the recorded twenty-nine-column list is an exact ordered prefix of
-- 20260626110925's thirty-two, so this replays as a no-op replace that still
-- applies `security_invoker = on`. The three later definitions of this view —
-- 20260720200000 (thirty-two, identical), 20260722103428 (thirty-two, identical)
-- and 20260912103723 (forty-eight, prefix-extension) — remain pure appends.
--
-- Production is unaffected either way: the version is already in
-- schema_migrations and the live view has carried all three columns since
-- 20260722103428.
--
-- The three appended columns are marked inline below so the recorded body stays
-- legible.

create or replace view api.signals
  with (security_invoker = on)
  as
select
  id,
  date,
  cat,
  pri,
  score,
  headline,
  summary,
  source,
  url,
  verification,
  tier,
  lang,
  company,
  country,
  in_network,
  lane_r,
  lane_e,
  lane_t,
  top_lane,
  query_pack,
  commercial_impact,
  reviewed,
  action,
  created_at,
  embedding_1024,
  embedding_model,
  embedded_at,
  reviewed_by,
  reviewed_at,
  -- replay-fidelity deviation: these three are already on the view at this
  -- point in replay, pinned by 20260626110925, and are appended here so this
  -- replace cannot narrow it. See the header.
  editorial_title,
  editorial_blurb,
  country_iso2
from public.signals;
