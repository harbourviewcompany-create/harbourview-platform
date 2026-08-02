BEGIN;
CREATE SCHEMA IF NOT EXISTS compliance;

CREATE TABLE compliance.organization_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  profile_version integer NOT NULL,
  facts jsonb NOT NULL,
  facts_hash text NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_by uuid REFERENCES iam.subjects(id),
  UNIQUE (tenant_id, name, profile_version)
);
CREATE TABLE compliance.obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  provision_id uuid NOT NULL REFERENCES regulatory.provisions(id),
  obligation_key text NOT NULL,
  version integer NOT NULL,
  modality obligation_modality NOT NULL,
  subject_concept_id uuid REFERENCES ontology.concepts(id),
  action_concept_id uuid REFERENCES ontology.concepts(id),
  object_concept_id uuid REFERENCES ontology.concepts(id),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  exceptions jsonb NOT NULL DEFAULT '{}'::jsonb,
  trigger_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  frequency_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  deadline_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  responsible_role_concept_id uuid REFERENCES ontology.concepts(id),
  evidence_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  filing_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_requirement jsonb NOT NULL DEFAULT '{}'::jsonb,
  consequence jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_tier risk_tier NOT NULL,
  effective_from timestamptz,
  effective_to timestamptz,
  status record_status NOT NULL DEFAULT 'candidate',
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  UNIQUE (obligation_key, version)
);
CREATE TABLE compliance.applicability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id uuid NOT NULL REFERENCES compliance.obligations(id),
  rule_key text NOT NULL,
  version integer NOT NULL,
  source_dsl jsonb NOT NULL,
  compiled_ast jsonb NOT NULL,
  required_inputs text[] NOT NULL DEFAULT '{}',
  risk_tier risk_tier NOT NULL,
  status record_status NOT NULL DEFAULT 'candidate',
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  UNIQUE (rule_key, version)
);
CREATE TABLE compliance.applicability_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES compliance.organization_profiles(id),
  rule_id uuid NOT NULL REFERENCES compliance.applicability_rules(id),
  as_of timestamptz NOT NULL,
  input_snapshot jsonb NOT NULL,
  input_hash text NOT NULL,
  result applicability_result NOT NULL,
  reason_trace jsonb NOT NULL,
  missing_inputs text[] NOT NULL DEFAULT '{}',
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  review_status record_status NOT NULL DEFAULT 'candidate',
  reviewed_by uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, profile_id, rule_id, as_of, input_hash)
);
CREATE TABLE compliance.controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  control_key text NOT NULL,
  version integer NOT NULL,
  name text NOT NULL,
  objective text NOT NULL,
  procedure text,
  frequency_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_role text,
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (tenant_id, control_key, version)
);
CREATE TABLE compliance.obligation_controls (
  obligation_id uuid NOT NULL REFERENCES compliance.obligations(id),
  control_id uuid NOT NULL REFERENCES compliance.controls(id),
  mapping_type text NOT NULL CHECK (mapping_type IN ('satisfies','partially_satisfies','supports','conflicts')),
  rationale text,
  PRIMARY KEY (obligation_id, control_id)
);
CREATE TABLE compliance.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  assessment_type text NOT NULL,
  scope jsonb NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  opened_at timestamptz,
  closed_at timestamptz,
  created_by uuid REFERENCES iam.subjects(id)
);
CREATE TABLE compliance.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES compliance.assessments(id),
  control_id uuid REFERENCES compliance.controls(id),
  obligation_id uuid REFERENCES compliance.obligations(id),
  severity risk_tier NOT NULL,
  title text NOT NULL,
  description text,
  status record_status NOT NULL DEFAULT 'draft',
  owner_subject_id uuid REFERENCES iam.subjects(id),
  due_at timestamptz,
  closure_evidence_ids uuid[] NOT NULL DEFAULT '{}'
);
CREATE INDEX applicability_tenant_result_idx ON compliance.applicability_evaluations(tenant_id, result, as_of DESC);
CREATE INDEX obligations_geo_effective_idx ON compliance.obligations(jurisdiction_id, effective_from, effective_to);
COMMIT;
