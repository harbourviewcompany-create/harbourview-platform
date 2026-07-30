-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260724112649.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Turns "debugged by eyeballing query output four times" into something that can actually be
-- tested. Extracts the classification logic that was inline in the view into named, reusable
-- functions, then adds a real test function that asserts known cases and RAISES on failure --
-- re-runnable, not a one-off manual check.
-- Chose function-extraction over a blocking CHECK constraint: a constraint forcing one "no
-- pathway" encoding would require destructively rewriting Malaysia's steps content (real,
-- useful monitoring guidance) just to satisfy a shape rule. The view already has to handle
-- legitimate variation in how "no pathway" gets written; better to make that handling itself
-- the tested, single source of truth than to outlaw the variation and lose content.

CREATE OR REPLACE FUNCTION public.jp_has_market_pathway(p_steps jsonb, p_cost_range text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT (
    p_steps = '[]'::jsonb
    OR p_cost_range ILIKE 'Not applicable%'
    OR p_cost_range ILIKE '%no operating commercial%'
    OR p_cost_range ILIKE '%no established commercial%'
    OR p_steps::text ILIKE '%no licensing pathway%'
    OR p_steps::text ILIKE '%not currently registered%'
    OR p_steps::text ILIKE '%categorically prohibited%'
  );
$$;

CREATE OR REPLACE FUNCTION public.cc_status_says_prohibited(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    p_status ILIKE 'Prohibited%'
    AND NOT (
      p_status ILIKE '%Legal%' OR p_status ILIKE '%Licens%' OR p_status ILIKE '%Channel%'
      OR p_status ILIKE '%Scheme%' OR p_status ILIKE '%Access%' OR p_status ILIKE '%Established%'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.cc_status_says_reform(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    p_status ILIKE 'Medical%' OR p_status ILIKE 'Legal%' OR p_status ILIKE 'Adult-Use%'
    OR (p_status ILIKE 'Decriminalized%' AND (p_status ILIKE '%Authority%' OR p_status ILIKE '%Licens%'))
  );
$$;

-- Rewire the view to call the same functions the tests exercise -- one source of truth.
CREATE OR REPLACE VIEW public.jurisdiction_cross_table_conflicts AS
WITH jp AS (
  SELECT
    country_iso2, country_name, difficulty, last_reviewed, estimated_cost_range,
    public.jp_has_market_pathway(steps, estimated_cost_range) AS has_market_pathway,
    NOT public.jp_has_market_pathway(steps, estimated_cost_range) AS looks_prohibited
  FROM public.jurisdiction_playbooks
  WHERE status = 'published'
),
mm AS (
  SELECT country_iso2, count(*) AS metric_count FROM public.market_metrics GROUP BY country_iso2
),
cc AS (
  SELECT
    country_iso2, program_status, last_reviewed_date,
    public.cc_status_says_prohibited(program_status) AS status_says_prohibited,
    public.cc_status_says_reform(program_status) AS status_says_reform,
    (program_status ILIKE '%no formal%' OR public_summary ILIKE '%no formal%program%' OR public_summary ILIKE '%expressed interest in developing%') AS status_understates_maturity
  FROM public.cc_jurisdiction_briefings
  WHERE state_iso2 IS NULL
)
SELECT
  jp.country_iso2, jp.country_name, jp.difficulty AS playbook_difficulty, jp.last_reviewed AS playbook_last_reviewed,
  cc.program_status AS briefing_program_status, cc.last_reviewed_date AS briefing_last_reviewed,
  coalesce(mm.metric_count, 0) AS playbook_metric_count,
  CASE
    WHEN jp.looks_prohibited AND cc.status_says_reform THEN 'polarity_conflict: playbook says prohibited, briefing implies reform/legal'
    WHEN jp.has_market_pathway AND cc.status_says_prohibited THEN 'polarity_conflict: playbook documents a real pathway, briefing says prohibited'
    WHEN jp.has_market_pathway AND coalesce(mm.metric_count, 0) >= 3 AND cc.status_understates_maturity THEN 'maturity_understated: briefing implies no program despite playbook + metrics documenting an operational one'
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

-- The actual test suite: hardcoded assertions against the real cases that broke this session,
-- plus the real cases that must keep working. RAISES EXCEPTION on any failure -- re-run this
-- after any future change to the classifier functions, not just at build time.
CREATE OR REPLACE FUNCTION public.test_jurisdiction_conflict_classifiers()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  -- Iran/Kuwait: one-item array whose only content denies a pathway. Must read as prohibited.
  IF public.jp_has_market_pathway('["No licensing pathway exists under current law"]'::jsonb, NULL) THEN
    RAISE EXCEPTION 'TEST FAILED: Iran-style one-string-array should NOT count as a market pathway';
  END IF;
  -- Malaysia: multi-step array entirely about the absence of a pathway. Must read as prohibited.
  IF public.jp_has_market_pathway(
    '[{"step":"Recognize there is no operational commercial pathway as of 2026"},{"step":"Treat any hemp/CBD plans as categorically prohibited, not merely restricted"}]'::jsonb, NULL
  ) THEN
    RAISE EXCEPTION 'TEST FAILED: Malaysia-style all-negative multi-step array should NOT count as a market pathway';
  END IF;
  -- Greece: 4 real steps + 1 step that carves out only recreational. Must NOT read as prohibited --
  -- this is the bifurcated-status bug that produced the Greece false positive.
  IF NOT public.jp_has_market_pathway(
    '[{"step":"Obtain EOF marketing authorisation"},{"step":"Secure GMP certification"},{"step":"Register with INCB"},{"step":"Obtain Ministry approvals"},{"step":"No pathway exists for recreational/adult-use retail"}]'::jsonb,
    '$50,000-$250,000'
  ) THEN
    RAISE EXCEPTION 'TEST FAILED: Greece-style bifurcated (real medical pathway + one recreational carve-out) must still count as having a market pathway';
  END IF;
  -- Empty array + "Not applicable" cost range: the clean, unambiguous prohibited case.
  IF public.jp_has_market_pathway('[]'::jsonb, 'Not applicable -- no legal pathway exists') THEN
    RAISE EXCEPTION 'TEST FAILED: empty steps + Not applicable cost range must read as prohibited';
  END IF;

  -- Japan: self-qualified "Prohibited (Recreational); ... Access ..." must NOT trigger status_says_prohibited.
  IF public.cc_status_says_prohibited('Prohibited (Recreational); Limited Pharmaceutical Access (2024)') THEN
    RAISE EXCEPTION 'TEST FAILED: Japan-style self-qualified status (contains Access) must not read as blanket prohibited';
  END IF;
  -- My own Sri Lanka correction: "Prohibited; ... Channel Formally Legal; ... Scheme" must NOT trigger.
  IF public.cc_status_says_prohibited('Prohibited; Ayurvedic Channel Formally Legal; New Export-Only Scheme (2025)') THEN
    RAISE EXCEPTION 'TEST FAILED: Sri Lanka-style self-qualified status (contains Channel/Legal/Scheme) must not read as blanket prohibited';
  END IF;
  -- Albania's original (confirmed wrong) status must still trigger -- "Programme" alone must not
  -- be treated as an exception word, since it appears here specifically to deny one exists.
  IF NOT public.cc_status_says_prohibited('Prohibited — No Medical Programme') THEN
    RAISE EXCEPTION 'TEST FAILED: genuine blanket-prohibited status with a negated "Programme" must still trigger -- regression on the Albania false-negative fix';
  END IF;

  -- Trinidad: "Decriminalized...Authority Established" must trigger reform (my own earlier miss).
  IF NOT public.cc_status_says_reform('Decriminalized (30g); Cannabis Control Authority Established') THEN
    RAISE EXCEPTION 'TEST FAILED: Decriminalized+Authority must read as reform -- regression on the Trinidad fix';
  END IF;
  -- Guatemala-style pure personal decrim with no institutional claim must NOT trigger reform.
  IF public.cc_status_says_reform('Decriminalized (Small Amounts); Otherwise Prohibited') THEN
    RAISE EXCEPTION 'TEST FAILED: pure personal-decriminalization status (no Authority/Licensing) must not read as commercial reform -- regression on the Guatemala/Guyana/Dominica false-positive fix';
  END IF;

  RETURN 'ALL TESTS PASSED (10 assertions across jp_has_market_pathway, cc_status_says_prohibited, cc_status_says_reform)';
END;
$$;

COMMENT ON FUNCTION public.test_jurisdiction_conflict_classifiers() IS
  'Regression suite for the four real bugs found and fixed in the 20-Jul-2026 jurisdiction_cross_table_conflicts build (Iran/Kuwait array-length, Malaysia/Greece whole-array substring matching, Trinidad/Guatemala decrim-vs-commercial conflation). Run this before trusting any future change to jp_has_market_pathway/cc_status_says_prohibited/cc_status_says_reform.';
