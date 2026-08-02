\set ON_ERROR_STOP on

INSERT INTO iam.tenants (id, slug, legal_name) VALUES
  ('00000000-0000-0000-0000-000000000101','tenant-alpha','Tenant Alpha'),
  ('00000000-0000-0000-0000-000000000202','tenant-beta','Tenant Beta');
INSERT INTO iam.subjects (id, external_subject, email, display_name, subject_type) VALUES
  ('00000000-0000-0000-0000-000000000011','verified|alice','alice@example.invalid','Alice','user'),
  ('00000000-0000-0000-0000-000000000022','verified|bob','bob@example.invalid','Bob','user');
INSERT INTO iam.memberships (tenant_id, subject_id, role_key) VALUES
  ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000011','organization_administrator'),
  ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000022','organization_administrator');
INSERT INTO iam.platform_role_assignments (subject_id, role_key) VALUES
  ('00000000-0000-0000-0000-000000000011','data_governance_lead');
INSERT INTO compliance.organization_profiles (tenant_id,name,profile_version,facts,facts_hash,created_by) VALUES
  ('00000000-0000-0000-0000-000000000101','Alpha profile',1,'{}','alpha','00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000202','Beta profile',1,'{}','beta','00000000-0000-0000-0000-000000000022');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='hv_untrusted_test') THEN
    CREATE ROLE hv_untrusted_test LOGIN PASSWORD 'untrusted-test-password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='hv_trusted_test') THEN
    CREATE ROLE hv_trusted_test LOGIN PASSWORD 'trusted-test-password';
  END IF;
END $$;
GRANT hv_tenant_runtime TO hv_untrusted_test;
GRANT hv_authenticator TO hv_trusted_test;
