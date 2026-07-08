-- hv_processing_jobs lives in public but PostgREST only exposes api.
-- Edge functions calling this table via REST got PGRST205 "table not found".
--
-- RLS on the base table restricts to admin role only; edge functions use
-- service_role which bypasses RLS entirely, so the api view only needs
-- service_role grants -- no anon/authenticated access for a job queue.

CREATE OR REPLACE VIEW api.hv_processing_jobs AS
SELECT * FROM public.hv_processing_jobs;

REVOKE ALL ON api.hv_processing_jobs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.hv_processing_jobs TO service_role;

NOTIFY pgrst, 'reload schema';
