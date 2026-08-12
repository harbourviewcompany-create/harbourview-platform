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
CREATE ROLE hv_context_owner LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_authenticator LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_public_runtime LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_tenant_runtime LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_analyst_runtime LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_ingestion_runtime LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE hv_governance_runtime LOGIN INHERIT CREATEDB CREATEROLE REPLICATION BYPASSRLS;
