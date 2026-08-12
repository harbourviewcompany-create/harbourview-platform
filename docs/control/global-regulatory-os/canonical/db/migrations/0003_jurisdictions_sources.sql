BEGIN;
CREATE SCHEMA IF NOT EXISTS geo;
CREATE SCHEMA IF NOT EXISTS source_ops;

CREATE TABLE geo.jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES geo.jurisdictions(id),
  kind jurisdiction_kind NOT NULL,
  canonical_code text,
  name text NOT NULL,
  official_name text,
  iso_alpha2 char(2),
  iso_alpha3 char(3),
  default_language text,
  timezone text,
  valid_from date,
  valid_to date,
  status record_status NOT NULL DEFAULT 'approved',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (kind, canonical_code)
);
CREATE TABLE geo.jurisdiction_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  to_jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  relationship_type text NOT NULL,
  valid_from date,
  valid_to date,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  UNIQUE (from_jurisdiction_id, to_jurisdiction_id, relationship_type, valid_from)
);
CREATE TABLE geo.authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  name text NOT NULL,
  authority_type text NOT NULL,
  canonical_uri text,
  status record_status NOT NULL DEFAULT 'approved',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE geo.coverage_registry (
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  domain_key text NOT NULL,
  maturity_level smallint NOT NULL CHECK (maturity_level BETWEEN 1 AND 13),
  coverage_status text NOT NULL,
  limitations text,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  owner_subject_id uuid REFERENCES iam.subjects(id),
  PRIMARY KEY (jurisdiction_id, domain_key)
);
CREATE TABLE source_ops.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id uuid REFERENCES geo.authorities(id),
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  source_key text UNIQUE NOT NULL,
  name text NOT NULL,
  source_class text NOT NULL,
  access_method source_access_method NOT NULL,
  canonical_uri text,
  official_status boolean NOT NULL DEFAULT false,
  language text,
  source_licence text,
  redistribution_rights jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_reviewed_at timestamptz,
  freshness_sla interval,
  schedule_expression text,
  parser_key text,
  credential_ref text,
  fallback_source_id uuid REFERENCES source_ops.sources(id),
  status record_status NOT NULL DEFAULT 'draft',
  risk_tier risk_tier NOT NULL DEFAULT 'moderate',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE source_ops.source_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES source_ops.sources(id) ON DELETE CASCADE,
  endpoint_uri text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  request_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  allowed_hosts text[] NOT NULL DEFAULT '{}',
  content_types text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE source_ops.acquisition_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES source_ops.sources(id),
  status acquisition_status NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  attempt integer NOT NULL DEFAULT 0,
  correlation_id uuid,
  http_status integer,
  bytes_received bigint,
  error_code text,
  error_detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE source_ops.source_health (
  source_id uuid PRIMARY KEY REFERENCES source_ops.sources(id) ON DELETE CASCADE,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  freshness_state freshness_state NOT NULL DEFAULT 'review_due',
  next_expected_at timestamptz,
  last_checked_at timestamptz,
  health_details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX jurisdictions_parent_idx ON geo.jurisdictions(parent_id);
CREATE INDEX sources_jurisdiction_idx ON source_ops.sources(jurisdiction_id, status);
CREATE INDEX acquisition_source_time_idx ON source_ops.acquisition_runs(source_id, scheduled_at DESC);
COMMIT;
