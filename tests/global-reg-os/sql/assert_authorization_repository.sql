\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE test_ids (key text PRIMARY KEY, id uuid NOT NULL);
WITH a AS (INSERT INTO iam.tenants(slug,legal_name) VALUES ('phase0-a','Phase Zero A') RETURNING id)
INSERT INTO test_ids SELECT 'tenant_a',id FROM a;
WITH b AS (INSERT INTO iam.tenants(slug,legal_name) VALUES ('phase0-b','Phase Zero B') RETURNING id)
INSERT INTO test_ids SELECT 'tenant_b',id FROM b;
WITH s AS (INSERT INTO iam.subjects(external_subject,email,display_name,subject_type) VALUES ('phase0-owner','phase0-owner@example.invalid','Phase 0 Owner','user') RETURNING id)
INSERT INTO test_ids SELECT 'subject',id FROM s;
INSERT INTO iam.memberships(tenant_id,subject_id,role_key)
SELECT (SELECT id FROM test_ids WHERE key='tenant_a'),(SELECT id FROM test_ids WHERE key='subject'),'organization_owner';

-- Test-fixture access only. Without this grant the runtime role fails on the
-- temporary fixture before the authorization and RLS assertions are reached.
GRANT SELECT ON test_ids TO hv_tenant_runtime;

SET LOCAL ROLE hv_public_runtime;
SELECT count(*) FROM public_api.jurisdictions;
DO $$ BEGIN
  PERFORM 1 FROM evidence.snapshots LIMIT 1;
  RAISE EXCEPTION 'hv_public_runtime unexpectedly read raw evidence';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
RESET ROLE;

SET LOCAL ROLE hv_tenant_runtime;
SELECT set_config('app.tenant_id',(SELECT id::text FROM test_ids WHERE key='tenant_a'),true);
SELECT set_config('app.subject_id',(SELECT id::text FROM test_ids WHERE key='subject'),true);
SELECT set_config('app.platform_roles','',true);
DO $$
DECLARE a uuid := (SELECT id FROM test_ids WHERE key='tenant_a');
DECLARE b uuid := (SELECT id FROM test_ids WHERE key='tenant_b');
BEGIN
  IF NOT app.is_tenant_member(a) THEN RAISE EXCEPTION 'Tenant membership not recognized'; END IF;
  IF app.is_tenant_member(b) THEN RAISE EXCEPTION 'Cross-tenant membership leak'; END IF;
  INSERT INTO compliance.organization_profiles(tenant_id,name,profile_version,facts,facts_hash)
  VALUES (a,'Authorized profile',1,'{}','phase0-authorized');
  BEGIN
    INSERT INTO compliance.organization_profiles(tenant_id,name,profile_version,facts,facts_hash)
    VALUES (b,'Unauthorized profile',1,'{}','phase0-denied');
    RAISE EXCEPTION 'Cross-tenant insert unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
