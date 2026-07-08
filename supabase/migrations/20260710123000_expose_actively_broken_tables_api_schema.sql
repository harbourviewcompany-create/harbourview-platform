-- Batch fix: 143 public tables were found missing api-schema exposure via
-- an audit query. Rather than blanket-expose all 143 (many are internal
-- job/scratch tables that should stay REST-inaccessible), this migration
-- fixes only the ones confirmed via live API logs as actively 404ing in
-- production right now.

CREATE OR REPLACE VIEW api.education_modules AS SELECT * FROM public.education_modules;
GRANT SELECT ON api.education_modules TO anon, authenticated;

CREATE OR REPLACE VIEW api.listings AS SELECT * FROM public.listings;
GRANT SELECT, INSERT ON api.listings TO anon;
GRANT SELECT ON api.listings TO authenticated;
GRANT ALL ON api.listings TO service_role;

CREATE OR REPLACE VIEW api.local_open_questions AS SELECT * FROM public.local_open_questions;
GRANT SELECT ON api.local_open_questions TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_evidence_coverage AS SELECT * FROM public.local_evidence_coverage;
GRANT SELECT ON api.local_evidence_coverage TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_subdivisions_intel AS SELECT * FROM public.local_subdivisions_intel;
GRANT SELECT ON api.local_subdivisions_intel TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_authorities AS SELECT * FROM public.local_authorities;
GRANT SELECT ON api.local_authorities TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_operating_notes AS SELECT * FROM public.local_operating_notes;
GRANT SELECT ON api.local_operating_notes TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_intel_coverage AS SELECT * FROM public.local_intel_coverage;
GRANT SELECT ON api.local_intel_coverage TO anon, authenticated;

CREATE OR REPLACE VIEW api.cc_pathway_templates AS SELECT * FROM public.cc_pathway_templates;
GRANT SELECT ON api.cc_pathway_templates TO authenticated;

CREATE OR REPLACE VIEW api.workspace_members AS SELECT * FROM public.workspace_members;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.workspace_members TO anon, authenticated;

-- RPCs: existed in public but PostgREST only resolves functions in api schema.
CREATE OR REPLACE FUNCTION api.get_regulatory_calendar(p_iso2 text, p_limit integer)
RETURNS TABLE(id uuid, iso2 text, event_type text, title text, summary text, expected_date date, confidence text, source_url text, source_label text, status text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_regulatory_calendar(p_iso2, p_limit) $fn$;

CREATE OR REPLACE FUNCTION api.get_field_changes_for_country(p_iso2 text, p_limit integer)
RETURNS TABLE(id uuid, table_name text, field_name text, old_value text, new_value text, changed_at timestamptz, source_label text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_field_changes_for_country(p_iso2, p_limit) $fn$;

GRANT EXECUTE ON FUNCTION api.get_regulatory_calendar(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_field_changes_for_country(text, integer) TO anon, authenticated;

-- public_signals lived in regulatory_signals schema, invisible to PostgREST entirely.
CREATE OR REPLACE VIEW api.public_signals AS SELECT * FROM regulatory_signals.public_signals;
GRANT SELECT ON api.public_signals TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
