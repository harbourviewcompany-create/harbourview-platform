-- Schema drift detection: catches public tables missing api-schema exposure
-- before they cause a production 404, rather than after.

CREATE TABLE IF NOT EXISTS public.schema_drift_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name text NOT NULL UNIQUE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz
);

ALTER TABLE public.schema_drift_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schema_drift_alerts_admin_only ON public.schema_drift_alerts;
CREATE POLICY schema_drift_alerts_admin_only ON public.schema_drift_alerts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.schema_drift_allowlist (
  table_name text PRIMARY KEY,
  reason text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_drift_allowlist (table_name, reason) VALUES
  ('_claude_scratch', 'scratch table, never REST-accessible'),
  ('_counterparty_enrich_jobs', 'internal job queue'),
  ('_counterparty_jobs', 'internal job queue'),
  ('_country_enrich_jobs', 'internal job queue'),
  ('_digest_jobs', 'internal job queue'),
  ('_editorial_digest_jobs', 'internal job queue'),
  ('_education_gen_jobs', 'internal job queue'),
  ('_education_regen_jobs', 'internal job queue'),
  ('_push_staging', 'internal staging table for github-bridge'),
  ('_sig_extract_jobs', 'internal job queue'),
  ('country_intel_backup_20260630', 'point-in-time backup, not for REST access'),
  ('education_module_sections_backup_20260705', 'point-in-time backup, not for REST access'),
  ('dead_letter_tasks', 'internal error queue, service_role only via direct SQL'),
  ('worker_leases', 'internal job coordination, no REST need'),
  ('llm_rate_limits', 'internal rate limiting state'),
  ('pipeline_tasks', 'internal pipeline coordination'),
  ('intelligence_jobs', 'internal job queue'),
  ('source_fetch_jobs', 'internal job queue'),
  ('source_fetch_runs', 'internal job queue'),
  ('hv_job_attempts', 'internal job tracking, paired with hv_processing_jobs'),
  ('status_history', 'internal audit trail, admin dashboard queries via service_role'),
  ('audit_events', 'internal audit trail, service_role only'),
  ('internal_admin_notes', 'admin-only notes, intentionally not REST-exposed'),
  ('project_control_refs', 'internal project scaffolding refs')
ON CONFLICT (table_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_tables_missing_from_api_schema()
RETURNS TABLE(table_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT t.table_name
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables a WHERE a.table_schema = 'api' AND a.table_name = t.table_name)
    AND NOT EXISTS (SELECT 1 FROM public.schema_drift_allowlist al WHERE al.table_name = t.table_name)
  ORDER BY t.table_name;
$fn$;

CREATE OR REPLACE FUNCTION api.get_tables_missing_from_api_schema()
RETURNS TABLE(table_name text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_tables_missing_from_api_schema() $fn$;

GRANT EXECUTE ON FUNCTION public.get_tables_missing_from_api_schema() TO service_role;
GRANT EXECUTE ON FUNCTION api.get_tables_missing_from_api_schema() TO service_role;

CREATE OR REPLACE VIEW api.schema_drift_alerts AS SELECT * FROM public.schema_drift_alerts;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.schema_drift_alerts TO service_role;

-- Seed the ledger with everything missing at migration time so only NEW
-- drift (created after this point) triggers an alert email.
INSERT INTO public.schema_drift_alerts (object_name, first_seen_at)
SELECT table_name, now() FROM public.get_tables_missing_from_api_schema()
ON CONFLICT (object_name) DO NOTHING;

SELECT cron.schedule(
  'schema-drift-monitor',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/schema-drift-monitor',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $cron$
);

NOTIFY pgrst, 'reload schema';
