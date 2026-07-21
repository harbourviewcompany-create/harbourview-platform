-- hv-classify is a single-document classifier: its own system prompt says
-- "duplicate = only when explicitly told of a specific other item;
-- otherwise do not use" -- it structurally cannot detect duplicates without
-- cross-document context (that's Stage 4 dedup/clustering, not built yet).
-- The prior version of this view counted every duplicate-truth row the
-- classifier called 'signal' as a false positive, which was penalizing
-- Stage 2's precision for a job that belongs to Stage 4. A duplicate-truth
-- row IS a real signal (just a syndicated repeat of an already-sampled
-- event) -- predicting 'signal' on it is the correct single-document
-- judgment. This fix folds duplicate-truth rows into the signal bucket for
-- precision/recall/content-type purposes, while leaving quality_accuracy
-- (the strict 5-way exact-match metric) untouched so the duplicate-
-- detection gap stays visible rather than hidden. Root-caused + fixed
-- 2026-07-21 while validating Stage 2 against the eval gate.
--
-- (v2: first attempt at this migration failed -- CREATE OR REPLACE VIEW
-- can't reorder/insert existing columns, only append. This version moves
-- the new duplicate_truth_rows column to the end of the select list.)
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
