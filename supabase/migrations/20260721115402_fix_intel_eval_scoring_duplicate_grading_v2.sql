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
-- version 20260721115402.
--
-- Rewriting this file cannot affect production: 20260721115402 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Retry of fix_intel_eval_scoring_duplicate_grading: CREATE OR REPLACE VIEW
-- can't reorder/insert existing columns, only append. Moved the new
-- duplicate_truth_rows column to the end of the select list.
CREATE OR REPLACE VIEW api.intel_eval_scoring AS
WITH graded AS (
  SELECT
    p.run_id,
    p.signal_id,
    p.quality_label AS pred_quality,
    p.content_type AS pred_content,
    CASE
      WHEN e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) THEN e.quality_label
      ELSE e.draft_quality_label
    END AS truth_quality,
    CASE
      WHEN e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) THEN e.content_type
      ELSE e.draft_content_type
    END AS truth_content,
    e.label_status = ANY (ARRAY['confirmed'::text, 'corrected'::text]) AS is_human_truth
  FROM intel_eval_predictions p
  JOIN intel_eval_set e ON e.signal_id = p.signal_id
),
graded_adj AS (
  SELECT
    *,
    CASE WHEN truth_quality = 'duplicate' THEN 'signal' ELSE truth_quality END AS truth_quality_graded
  FROM graded
)
SELECT
  run_id,
  count(*) AS n,
  count(*) FILTER (WHERE is_human_truth) AS n_human_truth,
  round(avg((pred_quality = truth_quality)::integer), 3) AS quality_accuracy,
  count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text) AS tp_signal,
  count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded <> 'signal'::text) AS fp_signal,
  count(*) FILTER (WHERE pred_quality <> 'signal'::text AND truth_quality_graded = 'signal'::text) AS fn_signal,
  round(
    count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text)::numeric
    / NULLIF(count(*) FILTER (WHERE pred_quality = 'signal'::text), 0)::numeric, 3
  ) AS signal_precision,
  round(
    count(*) FILTER (WHERE pred_quality = 'signal'::text AND truth_quality_graded = 'signal'::text)::numeric
    / NULLIF(count(*) FILTER (WHERE truth_quality_graded = 'signal'::text), 0)::numeric, 3
  ) AS signal_recall,
  round(
    avg((pred_content = truth_content)::integer) FILTER (WHERE truth_quality_graded = 'signal'::text AND pred_quality = 'signal'::text), 3
  ) AS content_type_accuracy_on_signals,
  count(*) FILTER (WHERE truth_quality = 'duplicate') AS duplicate_truth_rows
FROM graded_adj
GROUP BY run_id;
