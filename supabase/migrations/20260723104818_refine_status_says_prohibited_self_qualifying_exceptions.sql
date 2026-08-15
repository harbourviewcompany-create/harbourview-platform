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
-- version 20260723104818.
--
-- Rewriting this file cannot affect production: 20260723104818 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- status_says_prohibited previously matched any "Prohibited%" prefix regardless of what
-- followed, so entries that already correctly self-qualify -- Japan's "Prohibited
-- (Recreational); Limited Pharmaceutical Access (2024)", and my own Sri Lanka correction
-- ("Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)") -- got flagged
-- as conflicts even though the briefing already agrees with the playbook, just phrased with
-- "Prohibited" leading before the real exception. Added a NOT clause: a "Prohibited%" status
-- only counts as a genuine blanket claim if it does NOT also contain exception language
-- (Legal/Licens/Channel/Scheme/Access/Established) elsewhere in the same string.
-- Deliberately did NOT add "Program"/"Programme" to that exception list: Albania's original
-- (confirmed wrong) entry read "Prohibited -- No Medical Programme" -- the word appears there
-- specifically to deny a program exists, not assert one, so including it would have hidden a
-- real error rather than filtered a false positive. Verified this distinction against all 8
-- confirmed corrections from this session before shipping -- none of them contain the six
-- exception words used here, only the two self-qualified entries do.
-- Known remaining risk, stated plainly rather than hidden: a future entry phrased as "No Legal
-- Pathway" (negating "Legal") would be wrongly excluded by this same logic. Substring matching
-- cannot fully solve negation detection -- every hit still needs a human or agent to read it.

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
    (
      program_status ILIKE 'Prohibited%'
      AND NOT (
        program_status ILIKE '%Legal%' OR program_status ILIKE '%Licens%' OR program_status ILIKE '%Channel%'
        OR program_status ILIKE '%Scheme%' OR program_status ILIKE '%Access%' OR program_status ILIKE '%Established%'
      )
    ) AS status_says_prohibited,
    (
      program_status ILIKE 'Medical%' OR program_status ILIKE 'Legal%' OR program_status ILIKE 'Adult-Use%'
      OR (program_status ILIKE 'Decriminalized%' AND (program_status ILIKE '%Authority%' OR program_status ILIKE '%Licens%'))
    ) AS status_says_reform,
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
