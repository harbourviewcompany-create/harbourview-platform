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
-- version 20260722003232.
--
-- Rewriting this file cannot affect production: 20260722003232 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Third bug, different in kind from the first two: Greece got flagged as "prohibited" because
-- one of five steps says "No pathway exists for recreational/adult-use retail" -- true and
-- correctly worded, but only about recreational use specifically. The other four steps describe
-- a real medical/export pathway (EOF authorisation, GMP, INCB registration). Whole-array
-- substring matching can't distinguish "the whole country has no pathway" from "recreational
-- specifically doesn't, medical does" -- and that bifurcated status is the NORM in cannabis law
-- (Greece, Turkey, North Macedonia and most of this dataset all have exactly this shape), not an
-- edge case. Removing the two broadest, most qualifier-prone phrases ('no pathway exists',
-- 'no operational...pathway') that caused this; keeping only the phrases confirmed against real
-- false negatives (Iran/Kuwait/Malaysia) that describe the entire country having no pathway, not
-- a single carved-out activity within it.

CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    NOT (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS has_market_pathway,
    (
      steps = '[]'::jsonb
      OR estimated_cost_range ILIKE 'Not applicable%'
      OR estimated_cost_range ILIKE '%no operating commercial%'
      OR estimated_cost_range ILIKE '%no established commercial%'
      OR steps::text ILIKE '%no licensing pathway%'
      OR steps::text ILIKE '%not currently registered%'
      OR steps::text ILIKE '%categorically prohibited%'
    ) AS looks_prohibited
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
    (program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%' OR program_status ILIKE 'Adult-Use%')
      AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
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
  END AS conflict_type,
  (cc.last_reviewed_date < jp.last_reviewed) AS briefing_predates_playbook
FROM jp
JOIN cc ON cc.country_iso2 = jp.country_iso2
LEFT JOIN mm ON mm.country_iso2 = jp.country_iso2
WHERE
  (jp.looks_prohibited AND cc.status_says_reform)
  OR (jp.has_market_pathway AND cc.status_says_prohibited)
  OR (jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity)
ORDER BY jp.country_iso2;

COMMENT ON VIEW public.jurisdiction_cross_table_conflicts IS
  'Heuristic triage worklist for cc_jurisdiction_briefings vs jurisdiction_playbooks disagreement -- NOT a fact-checker. Note "Decriminalized" was deliberately dropped from status_says_reform: personal decriminalization and commercial-market legality are different questions (see Trinidad/Grenada in the 19-Jul-2026 audit), and conflating them produces false positives. Even after three rounds of fixes (state-fanout, array-length-as-pathway-proxy, whole-array substring matching flattening bifurcated medical/recreational status), every hit still requires a human or agent to read both entries before concluding anything -- this narrows 200+ rows to a short list, it does not replace judgment.';
