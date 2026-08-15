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
-- version 20260720102441.
--
-- Rewriting this file cannot affect production: 20260720102441 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Automates the manual cross-check that caught 11 of 16 real errors this session, so it stops
-- depending on someone remembering to ask for it. Encodes the three error classes actually found:
--   1. polarity_conflict -- one table says prohibited, the other implies a legal/reform pathway
--      (caught Namibia, Turkey).
--   2. maturity_understated -- playbook documents a real operational program (populated steps +
--      3+ market_metrics) while the briefing says no program exists / just "interest" (caught
--      Saint Vincent).
--   3. briefing_predates_playbook -- the playbook has newer research than the briefing has
--      absorbed (staleness, cross-table version of playbook_staleness_queue).
-- Explicitly NOT caught: specific-fact errors like Grenada's wrong year, or the two neighbor-
-- conflation cases (Namibia/South Africa, Grenada/Trinidad) -- those needed a human/agent to
-- actually read and reason about the text. This is a heuristic worklist, not a fact-checker;
-- it narrows 302 rows down to a short review queue, it doesn't replace reading them.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed,
    (jsonb_array_length(steps) > 0) AS has_market_pathway,
    (steps = '[]'::jsonb AND estimated_cost_range ILIKE 'Not applicable%') AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count
  FROM public.market_metrics
  GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    (program_status ILIKE 'Prohibited%') AS status_says_prohibited,
    (program_status ILIKE 'Decriminalized%' OR program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%') AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
)
SELECT
  jp.country_iso2,
  jp.country_name,
  jp.difficulty AS playbook_difficulty,
  jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status,
  cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform
      THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited
      THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity
      THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
    WHEN cc.last_reviewed_date < jp.last_reviewed
      THEN 'briefing_predates_playbook: playbook has newer research the briefing may not reflect'
    ELSE NULL
  END AS conflict_type
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
  OR (cc.last_reviewed_date < jp.last_reviewed)
ORDER BY
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform THEN 1
    WHEN jp.has_market_pathway AND cc.status_says_prohibited THEN 1
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity THEN 2
    ELSE 3
  END;

COMMENT ON VIEW public.jurisdiction_cross_table_conflicts IS
  'Automated version of the manual cc_jurisdiction_briefings-vs-jurisdiction_playbooks audit from 19-Jul-2026 that found 11/16 real discrepancies. Re-run after any batch touching either table.';

-- Expose both QA views through the api schema (matching the pattern used for content tables)
-- but restrict to service_role only -- these are internal review worklists, not user-facing
-- content, so they should not carry the anon/authenticated SELECT grants content views get.

CREATE OR REPLACE VIEW api.jurisdiction_cross_table_conflicts AS
  SELECT * FROM public.jurisdiction_cross_table_conflicts;

CREATE OR REPLACE VIEW api.playbook_staleness_queue AS
  SELECT * FROM public.playbook_staleness_queue;

REVOKE ALL ON api.jurisdiction_cross_table_conflicts FROM anon, authenticated;
GRANT SELECT ON api.jurisdiction_cross_table_conflicts TO service_role, postgres;

REVOKE ALL ON api.playbook_staleness_queue FROM anon, authenticated;
GRANT SELECT ON api.playbook_staleness_queue TO service_role, postgres;
