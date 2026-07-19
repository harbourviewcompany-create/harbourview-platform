-- Follow-up to Stage 2: hv-classify's supabase-js client uses schema 'api' (repo
-- convention — PostgREST exposes only 'api'). Expose the two new public tables via
-- api views so the function can insert into them. Reversible: drop the views.
create view api.intel_eval_predictions as select * from public.intel_eval_predictions;
create view api.intel_classify_review_queue as select * from public.intel_classify_review_queue;
grant select, insert on api.intel_eval_predictions to service_role;
grant select, insert, update on api.intel_classify_review_queue to service_role;
