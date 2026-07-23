-- Stage 2 (INTELLIGENCE_ARCHITECTURE_SPEC.md): the classifier validation harness.
-- Stores hv-classify predictions and grades them against the human-labelled
-- intel_eval_set. VALIDATION ONLY — nothing here touches the promotion path.
-- Additive + reversible. Rollback:
--   drop view if exists api.intel_eval_scoring;
--   drop function if exists api.intel_eval_rows_needing_prediction(text,int);
--   drop table if exists public.intel_eval_predictions;

-- Converted to a no-op stub on 2026-07-21: re-running the CREATE TABLE
-- below fails ("relation already exists"). Confirmed live via
-- information_schema.columns that public.intel_eval_predictions already
-- exists with exactly the 10 columns this file defines -- the real work
-- was already applied to production under the neighboring version
-- 20260718074506 (same filename, applied ~2.5 days later).
SELECT 1;
