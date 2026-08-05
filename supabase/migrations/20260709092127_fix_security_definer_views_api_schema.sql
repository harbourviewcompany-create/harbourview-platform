-- Switch API-schema views to SECURITY INVOKER so RLS policies on underlying
-- relations are enforced for the querying user. api.daily_digest exists at
-- this chronology point. The remaining 13 views are direct-state production
-- objects whose repository creators run on 2026-07-10, so guard only those
-- not-yet-created relations and harden them explicitly in their creators.
ALTER VIEW api.daily_digest SET (security_invoker = on);

DO $guard_deferred_api_views$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'local_intel_coverage',
    'education_module_sections',
    'jurisdiction_playbooks',
    'public_signals',
    'education_modules',
    'listings',
    'local_open_questions',
    'local_evidence_coverage',
    'local_subdivisions_intel',
    'local_authorities',
    'local_operating_notes',
    'cc_pathway_templates',
    'workspace_members'
  ]
  LOOP
    IF to_regclass(format('api.%I', view_name)) IS NOT NULL THEN
      EXECUTE format('ALTER VIEW api.%I SET (security_invoker = on)', view_name);
    END IF;
  END LOOP;
END
$guard_deferred_api_views$;
