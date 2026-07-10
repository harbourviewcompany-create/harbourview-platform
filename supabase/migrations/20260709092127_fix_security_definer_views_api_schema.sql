
-- Switch 14 SECURITY DEFINER views in the api schema to SECURITY INVOKER so that
-- RLS policies on the underlying tables are enforced for the querying user.
ALTER VIEW api.local_intel_coverage        SET (security_invoker = on);
ALTER VIEW api.education_module_sections   SET (security_invoker = on);
ALTER VIEW api.jurisdiction_playbooks      SET (security_invoker = on);
ALTER VIEW api.public_signals              SET (security_invoker = on);
ALTER VIEW api.daily_digest                SET (security_invoker = on);
ALTER VIEW api.education_modules           SET (security_invoker = on);
ALTER VIEW api.listings                    SET (security_invoker = on);
ALTER VIEW api.local_open_questions        SET (security_invoker = on);
ALTER VIEW api.local_evidence_coverage     SET (security_invoker = on);
ALTER VIEW api.local_subdivisions_intel    SET (security_invoker = on);
ALTER VIEW api.local_authorities           SET (security_invoker = on);
ALTER VIEW api.local_operating_notes       SET (security_invoker = on);
ALTER VIEW api.cc_pathway_templates        SET (security_invoker = on);
ALTER VIEW api.workspace_members           SET (security_invoker = on);
