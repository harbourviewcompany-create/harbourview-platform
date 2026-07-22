-- Follow-up to Stage 2: hv-classify's supabase-js client uses schema 'api' (repo
-- convention — PostgREST exposes only 'api'). Expose the two new public tables via
-- api views so the function can insert into them. Reversible: drop the views.
-- Converted to a no-op stub on 2026-07-22: re-running the CREATE VIEW
-- below fails ("relation already exists"). Confirmed live via
-- information_schema.tables that both api.intel_eval_predictions and
-- api.intel_classify_review_queue already exist as views over their
-- public.* base tables -- this work was already applied to production.
SELECT 1;
