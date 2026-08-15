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
-- version 20260719092425.
--
-- Rewriting this file cannot affect production: 20260719092425 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Connects the signals pipeline to jurisdiction_playbooks so playbooks don't silently age into
-- stale reference copy. Surfaces two cases:
--   1. 'stale' / 'never_reviewed': a published playbook where a real regulatory signal postdates
--      (or the playbook has never had) a last_reviewed date.
--   2. 'unresearched_with_live_signal': a draft (unresearched) country that already has a live
--      regulatory signal -- a prioritization bump for the research queue.
-- Filtered to the meaningful signal categories (regulatory/GAZETTE/PARLIAMENTARY/LICENSING) at
-- score >= 60 to exclude SOURCE_ENGINE ingestion noise (8,255 of 8,330 signal rows, avg score 41).

CREATE OR REPLACE VIEW public.playbook_staleness_queue AS
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.status AS playbook_status,
  jp.last_reviewed,
  jp.confidence_label,
  s.date::date AS signal_date,
  s.score AS signal_score,
  s.cat AS signal_category,
  s.headline AS signal_headline,
  s.url AS signal_url,
  CASE
    WHEN jp.status = 'draft' THEN 'unresearched_with_live_signal'
    WHEN jp.last_reviewed IS NULL THEN 'never_reviewed'
    WHEN s.date::date > jp.last_reviewed THEN 'stale'
    ELSE 'current'
  END AS staleness_flag
FROM public.jurisdiction_playbooks jp
JOIN public.signals s ON s.country_iso2 = jp.country_iso2
WHERE s.cat IN ('regulatory', 'GAZETTE', 'PARLIAMENTARY', 'LICENSING')
  AND s.score >= 60
  AND (jp.status = 'draft' OR jp.last_reviewed IS NULL OR s.date::date > jp.last_reviewed)
ORDER BY s.score DESC, s.date::date DESC;

COMMENT ON VIEW public.playbook_staleness_queue IS
  'Signals-to-playbooks refresh queue. Re-run after each signals ingestion pass or before starting a new jurisdiction_playbooks batch to catch drift.';
