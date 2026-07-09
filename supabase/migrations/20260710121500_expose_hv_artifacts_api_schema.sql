-- hv_artifacts lives in public but PostgREST only exposes api.
-- hv-score inserts into this table on every promotion; every insert was
-- failing with PGRST205, which cascaded into hv_import_staging rows being
-- marked status=error en masse (510 rows affected).

CREATE OR REPLACE VIEW api.hv_artifacts AS
SELECT * FROM public.hv_artifacts;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.hv_artifacts TO service_role;

NOTIFY pgrst, 'reload schema';
