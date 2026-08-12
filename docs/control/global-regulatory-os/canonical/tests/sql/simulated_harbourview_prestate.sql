\set ON_ERROR_STOP on
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role text NOT NULL,
  PRIMARY KEY (user_id, role)
);
INSERT INTO public.profiles (id,email) VALUES ('10000000-0000-0000-0000-000000000001','preserve@example.invalid');
INSERT INTO public.user_roles (user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','admin');

-- Simulate an upgrade where security-sensitive role names already exist with
-- unsafe attributes. Canonical migrations must normalize these roles rather
-- than trusting the pre-existing definitions.
--
-- Roles in PostgreSQL are cluster-global, not per-database. run_postgres_validation.sh
-- exercises the clean-install path in its own database first, and those migrations
-- create the same hv_* roles in their normalized (safe) form. By the time this
-- fixture runs against the upgrade database, the roles therefore already exist.
--
-- A bare CREATE ROLE aborts with "role already exists". Guarding with a plain
-- IF NOT EXISTS would be worse than the error: it would leave the already-normalized
-- roles untouched, so the hostile pre-state this fixture exists to build would never
-- be established and simulated_harbourview_role_bootstrap_assert.sql would pass
-- vacuously. Force the unsafe attributes in both branches instead, so the pre-state
-- is hostile regardless of what the cluster carried in.
DO $$
DECLARE
  target_role name;
BEGIN
  FOREACH target_role IN ARRAY ARRAY[
    'hv_context_owner'::name,
    'hv_authenticator'::name,
    'hv_public_runtime'::name,
    'hv_tenant_runtime'::name,
    'hv_analyst_runtime'::name,
    'hv_ingestion_runtime'::name,
    'hv_governance_runtime'::name
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('ALTER ROLE %I LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS', target_role);
    ELSE
      EXECUTE format('CREATE ROLE %I LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS', target_role);
    END IF;
  END LOOP;
END $$;
