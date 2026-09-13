-- Clinical API surface for PostgREST (schema api only).
-- security_invoker views so underlying public RLS applies to the caller JWT.

CREATE OR REPLACE VIEW api.clinical_patients
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_patients;

CREATE OR REPLACE VIEW api.clinical_care_team
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_care_team;

CREATE OR REPLACE VIEW api.clinical_consent_records
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_consent_records;

CREATE OR REPLACE VIEW api.clinical_encounters
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_encounters;

CREATE OR REPLACE VIEW api.clinical_calculations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_calculations;

CREATE OR REPLACE VIEW api.clinical_recommendations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_recommendations;

CREATE OR REPLACE VIEW api.clinical_prescriptions
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_prescriptions;

CREATE OR REPLACE VIEW api.clinical_dispensing_events
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_dispensing_events;

CREATE OR REPLACE VIEW api.clinical_jurisdiction_authority
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_jurisdiction_authority;

CREATE OR REPLACE VIEW api.clinical_clinician_links
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_clinician_links;

CREATE OR REPLACE VIEW api.clinical_my_professional
WITH (security_invoker = true) AS
SELECT p.id,p.full_name,p.title,p.credential_type,p.verification_status,p.status,p.licence_number,p.licence_jurisdiction,p.clinical_role,p.user_id,p.countries,p.specialties
FROM public.hv_professionals p WHERE p.user_id = (SELECT auth.uid());

GRANT SELECT, INSERT, UPDATE ON api.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_care_team TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_encounters TO authenticated;
GRANT SELECT, INSERT ON api.clinical_calculations TO authenticated;
GRANT SELECT, INSERT ON api.clinical_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_prescriptions TO authenticated;
GRANT SELECT, INSERT ON api.clinical_dispensing_events TO authenticated;
GRANT SELECT ON api.clinical_jurisdiction_authority TO authenticated;
GRANT SELECT ON api.clinical_clinician_links TO authenticated;
GRANT SELECT ON api.clinical_my_professional TO authenticated;

GRANT ALL ON api.clinical_patients TO service_role;
GRANT ALL ON api.clinical_care_team TO service_role;
GRANT ALL ON api.clinical_consent_records TO service_role;
GRANT ALL ON api.clinical_encounters TO service_role;
GRANT ALL ON api.clinical_calculations TO service_role;
GRANT ALL ON api.clinical_recommendations TO service_role;
GRANT ALL ON api.clinical_prescriptions TO service_role;
GRANT ALL ON api.clinical_dispensing_events TO service_role;
GRANT ALL ON api.clinical_jurisdiction_authority TO service_role;
GRANT ALL ON api.clinical_clinician_links TO service_role;
GRANT ALL ON api.clinical_my_professional TO service_role;
