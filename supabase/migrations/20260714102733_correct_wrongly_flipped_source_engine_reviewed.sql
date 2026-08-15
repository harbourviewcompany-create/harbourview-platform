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
-- version 20260714102733.
--
-- Rewriting this file cannot affect production: 20260714102733 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- ROOT-CAUSE FIX for the Intel/Signals feed quality problem.
--
-- Diagnosis (verified, not assumed):
--   * The feed readers (lib/regulatory-signals/public.ts, jurisdictionSynthesis,
--     dashboardServerData x3, dashboard/digest, dashboard/signals — 7+ consumers) all filter
--     signals on reviewed = true. reviewed=true is treated as "passed quality review".
--   * The ingest (promote_snapshot_to_signals) CORRECTLY inserts SOURCE_ENGINE rows with
--     reviewed = false. So the writer was never the problem.
--   * At some point on/before 2026-07-05, an untracked bulk UPDATE flipped 528 SOURCE_ENGINE
--     rows to reviewed = true. Their avg score (33) is LOWER than the unreviewed SOURCE_ENGINE
--     pool (41), so the flip did not select for quality — it was a mistake, not curation.
--   * Since 2026-07-06 (HAR-28 hardening disabled the old promote HTTP path), 4,146 new
--     SOURCE_ENGINE rows are all correctly reviewed = false and ZERO have been wrongly flipped.
--     The corruption source is already stopped; these 528 are stranded historical rows.
--   * signals has no reviewed_by/reviewed_at/curator column, so none of the 528 can represent a
--     tracked human review — they are unambiguously the bulk-flip artifacts.
--
-- Fix: restore the 528 wrongly-flipped SOURCE_ENGINE rows to reviewed = false (their original,
-- ingest-set value). This makes every reviewed=true reader correct simultaneously — the raw
-- scraper dumps (incl. the "--> STATUS AS AT" UN-treaty scrape) drop out of every feed at once,
-- while the ~75 genuinely-reviewed curated signals across all other categories are untouched.
--
-- Scope guard: ONLY SOURCE_ENGINE + reviewed=true. Never touches curated categories
-- (regulatory, financial, market, supply, intelligence, GAZETTE, etc.).

UPDATE public.signals
SET reviewed = false
WHERE cat = 'SOURCE_ENGINE'
  AND reviewed = true;
