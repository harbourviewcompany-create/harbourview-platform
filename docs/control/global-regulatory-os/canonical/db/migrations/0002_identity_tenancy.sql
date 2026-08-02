BEGIN;
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE iam.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug citext UNIQUE NOT NULL,
  legal_name text NOT NULL,
  status record_status NOT NULL DEFAULT 'approved',
  data_region text,
  classification_ceiling data_classification NOT NULL DEFAULT 'customer_confidential',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE iam.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject text UNIQUE,
  email citext,
  display_name text,
  subject_type text NOT NULL CHECK (subject_type IN ('user','service_account')),
  status record_status NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE iam.memberships (
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES iam.subjects(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, subject_id, role_key)
);
CREATE TABLE iam.platform_role_assignments (
  subject_id uuid NOT NULL REFERENCES iam.subjects(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, role_key)
);

-- Request identity is not read from client-settable custom GUCs. A trusted
-- authenticator establishes context for one transaction; runtime roles can only
-- read it through SECURITY DEFINER accessors and cannot create or alter it.
CREATE TABLE app.trusted_request_context (
  backend_pid integer NOT NULL,
  transaction_id xid8 NOT NULL,
  subject_id uuid NOT NULL REFERENCES iam.subjects(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  established_by name NOT NULL,
  established_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (backend_pid, transaction_id)
);
ALTER TABLE app.trusted_request_context OWNER TO hv_context_owner;
REVOKE ALL ON app.trusted_request_context FROM PUBLIC;

GRANT USAGE ON SCHEMA app,iam TO hv_context_owner;
GRANT SELECT ON iam.subjects,iam.memberships,iam.platform_role_assignments TO hv_context_owner;

CREATE OR REPLACE FUNCTION app.set_trusted_request_context(
  verified_external_subject text,
  requested_tenant uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, app, iam
AS $$
DECLARE
  resolved_subject uuid;
BEGIN
  IF NOT pg_has_role(session_user, 'hv_authenticator', 'member') THEN
    RAISE EXCEPTION 'trusted request context requires hv_authenticator session membership'
      USING ERRCODE = '42501';
  END IF;

  SELECT s.id INTO resolved_subject
  FROM iam.subjects s
  WHERE s.external_subject = verified_external_subject
    AND s.status IN ('approved','published')
  LIMIT 1;

  IF resolved_subject IS NULL THEN
    RAISE EXCEPTION 'verified external subject is not mapped to an active IAM subject'
      USING ERRCODE = '28000';
  END IF;

  IF requested_tenant IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM iam.memberships m
    WHERE m.tenant_id = requested_tenant
      AND m.subject_id = resolved_subject
      AND m.valid_from <= now()
      AND (m.valid_to IS NULL OR m.valid_to > now())
  ) THEN
    RAISE EXCEPTION 'subject is not an active member of requested tenant'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM app.trusted_request_context
  WHERE backend_pid = pg_backend_pid();

  INSERT INTO app.trusted_request_context (
    backend_pid, transaction_id, subject_id, tenant_id, established_by
  ) VALUES (
    pg_backend_pid(), pg_current_xact_id(), resolved_subject, requested_tenant, session_user
  );
END;
$$;
ALTER FUNCTION app.set_trusted_request_context(text, uuid) OWNER TO hv_context_owner;

CREATE OR REPLACE FUNCTION app.clear_trusted_request_context() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, app
AS $$
  DELETE FROM app.trusted_request_context WHERE backend_pid = pg_backend_pid();
$$;
ALTER FUNCTION app.clear_trusted_request_context() OWNER TO hv_context_owner;

CREATE OR REPLACE FUNCTION app.current_subject_id() RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, app
AS $$
  SELECT c.subject_id
  FROM app.trusted_request_context c
  WHERE c.backend_pid = pg_backend_pid()
    AND c.transaction_id = pg_current_xact_id()
  LIMIT 1
$$;
ALTER FUNCTION app.current_subject_id() OWNER TO hv_context_owner;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, app
AS $$
  SELECT c.tenant_id
  FROM app.trusted_request_context c
  WHERE c.backend_pid = pg_backend_pid()
    AND c.transaction_id = pg_current_xact_id()
  LIMIT 1
$$;
ALTER FUNCTION app.current_tenant_id() OWNER TO hv_context_owner;

CREATE OR REPLACE FUNCTION app.has_platform_role(required_role text) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, app, iam
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM iam.platform_role_assignments p
    WHERE p.subject_id = app.current_subject_id()
      AND p.role_key = required_role
      AND p.valid_from <= now()
      AND (p.valid_to IS NULL OR p.valid_to > now())
  )
$$;
ALTER FUNCTION app.has_platform_role(text) OWNER TO hv_context_owner;

REVOKE ALL ON FUNCTION app.set_trusted_request_context(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.clear_trusted_request_context() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.current_subject_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.has_platform_role(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION app.set_trusted_request_context(text, uuid) TO hv_authenticator;
GRANT EXECUTE ON FUNCTION app.clear_trusted_request_context() TO hv_authenticator;
GRANT EXECUTE ON FUNCTION app.current_subject_id(),app.current_tenant_id(),app.has_platform_role(text)
  TO hv_authenticator,hv_public_runtime,hv_tenant_runtime,hv_analyst_runtime,hv_ingestion_runtime,hv_governance_runtime;
CREATE TABLE iam.reviewer_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES iam.subjects(id) ON DELETE CASCADE,
  jurisdiction_ids uuid[] NOT NULL DEFAULT '{}',
  topic_keys text[] NOT NULL DEFAULT '{}',
  language_keys text[] NOT NULL DEFAULT '{}',
  maximum_risk risk_tier NOT NULL DEFAULT 'moderate',
  legal_authority boolean NOT NULL DEFAULT false,
  quality_authority boolean NOT NULL DEFAULT false,
  trade_authority boolean NOT NULL DEFAULT false,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz
);
CREATE TABLE iam.access_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  policy_key text NOT NULL,
  version integer NOT NULL,
  policy_document jsonb NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  effective_from timestamptz,
  effective_to timestamptz,
  UNIQUE (tenant_id, policy_key, version)
);
CREATE TABLE billing.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,
  name text NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  currency char(3),
  billing_interval text,
  price_minor bigint,
  public_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES billing.plans(id),
  entitlement_key text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  usage_limit numeric,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  UNIQUE (tenant_id, entitlement_key, valid_from)
);
CREATE INDEX memberships_subject_idx ON iam.memberships(subject_id, tenant_id);
CREATE INDEX platform_role_assignments_subject_idx ON iam.platform_role_assignments(subject_id, role_key);
CREATE INDEX trusted_request_context_subject_idx ON app.trusted_request_context(subject_id, tenant_id);
CREATE INDEX entitlements_tenant_idx ON billing.entitlements(tenant_id, entitlement_key);
COMMIT;
