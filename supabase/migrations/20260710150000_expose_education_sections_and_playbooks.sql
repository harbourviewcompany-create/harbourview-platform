-- Found via live API log traffic on a real country page request, not the
-- static information_schema audit -- these were actively 404ing right now.

CREATE OR REPLACE VIEW api.education_module_sections WITH (security_invoker = true) AS SELECT * FROM public.education_module_sections;
GRANT SELECT ON api.education_module_sections TO anon, authenticated;

CREATE OR REPLACE VIEW api.jurisdiction_playbooks WITH (security_invoker = true) AS SELECT * FROM public.jurisdiction_playbooks;
GRANT SELECT ON api.jurisdiction_playbooks TO anon, authenticated;

-- public_signals view existed already but was returning 406 on well-formed
-- requests with matching columns -- stale schema cache, not a real gap.
-- Force-recreate + double reload to be certain PostgREST picks it up.
DROP VIEW IF EXISTS api.public_signals;
CREATE VIEW api.public_signals WITH (security_invoker = true) AS SELECT * FROM regulatory_signals.public_signals;
GRANT SELECT ON api.public_signals TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';
