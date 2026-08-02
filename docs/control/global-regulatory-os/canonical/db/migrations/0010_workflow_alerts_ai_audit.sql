BEGIN;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS publication;

ALTER TABLE registry.entities ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE;
ALTER TABLE registry.people ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE;

CREATE TABLE workflow.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  case_type text NOT NULL,
  title text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  classification data_classification NOT NULL DEFAULT 'customer_confidential',
  status record_status NOT NULL DEFAULT 'draft',
  owner_subject_id uuid REFERENCES iam.subjects(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE TABLE workflow.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  case_id uuid REFERENCES workflow.cases(id) ON DELETE CASCADE,
  source_type text,
  source_id uuid,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'open',
  priority risk_tier NOT NULL DEFAULT 'moderate',
  owner_subject_id uuid REFERENCES iam.subjects(id),
  reviewer_subject_id uuid REFERENCES iam.subjects(id),
  due_at timestamptz,
  completion_evidence_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE TABLE workflow.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  review_type text NOT NULL,
  risk risk_tier NOT NULL,
  assigned_to uuid REFERENCES iam.subjects(id),
  decision review_decision,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  rationale text,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workflow.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner_subject_id uuid REFERENCES iam.subjects(id),
  query_definition jsonb NOT NULL,
  status record_status NOT NULL DEFAULT 'approved',
  UNIQUE (tenant_id, name)
);
CREATE TABLE workflow.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  watchlist_id uuid REFERENCES workflow.watchlists(id) ON DELETE CASCADE,
  event_types text[] NOT NULL,
  materiality_threshold risk_tier NOT NULL DEFAULT 'moderate',
  delivery_channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  routing jsonb NOT NULL DEFAULT '{}'::jsonb,
  digest_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  status record_status NOT NULL DEFAULT 'approved'
);
CREATE TABLE workflow.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  alert_rule_id uuid REFERENCES workflow.alert_rules(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  event_key text NOT NULL,
  materiality risk_tier NOT NULL,
  title text NOT NULL,
  explanation jsonb NOT NULL,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_key)
);
CREATE TABLE workflow.alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_event_id uuid NOT NULL REFERENCES workflow.alert_events(id) ON DELETE CASCADE,
  recipient_subject_id uuid REFERENCES iam.subjects(id),
  channel text NOT NULL,
  destination text,
  status alert_delivery_status NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  provider_reference text
);

CREATE TABLE ai.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key text NOT NULL,
  version text NOT NULL,
  provider text NOT NULL,
  deployment_region text,
  permitted_data_classes data_classification[] NOT NULL DEFAULT ARRAY['public'::data_classification],
  maximum_risk_class ai_risk_class NOT NULL DEFAULT 'B',
  status model_status NOT NULL DEFAULT 'draft',
  model_card jsonb NOT NULL,
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  UNIQUE (model_key, version)
);
CREATE TABLE ai.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key text NOT NULL,
  version integer NOT NULL,
  purpose text NOT NULL,
  risk_class ai_risk_class NOT NULL,
  system_template text NOT NULL,
  output_schema jsonb NOT NULL,
  status model_status NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  UNIQUE (prompt_key, version)
);
CREATE TABLE ai.model_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES ai.models(id),
  prompt_id uuid NOT NULL REFERENCES ai.prompts(id),
  purpose text NOT NULL,
  risk_class ai_risk_class NOT NULL,
  input_hash text NOT NULL,
  redaction_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_evidence_ids uuid[] NOT NULL DEFAULT '{}',
  output_hash text,
  output_location text,
  token_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  status text NOT NULL CHECK (status IN ('queued','running','succeeded','failed','blocked','discarded')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE TABLE ai.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai.models(id),
  prompt_id uuid REFERENCES ai.prompts(id),
  evaluation_set_key text NOT NULL,
  evaluation_version text NOT NULL,
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  language text,
  metrics jsonb NOT NULL,
  failures jsonb NOT NULL DEFAULT '[]'::jsonb,
  status record_status NOT NULL DEFAULT 'candidate',
  evaluated_at timestamptz NOT NULL,
  approved_by uuid REFERENCES iam.subjects(id)
);
CREATE TABLE ai.human_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_run_id uuid NOT NULL REFERENCES ai.model_runs(id),
  subject_id uuid NOT NULL REFERENCES iam.subjects(id),
  original_output_hash text,
  replacement_output jsonb NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publication.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  release_type text NOT NULL,
  release_key text NOT NULL,
  version integer NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL,
  evidence_bundle_id uuid REFERENCES evidence.evidence_bundles(id),
  visibility visibility_class NOT NULL,
  classification data_classification NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  valid_from timestamptz,
  valid_to timestamptz,
  approved_by uuid REFERENCES iam.subjects(id),
  published_at timestamptz,
  UNIQUE (tenant_id, release_key, version)
);
CREATE TABLE governance.corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  materiality correction_materiality NOT NULL,
  issue_summary text NOT NULL,
  root_cause text,
  prior_value jsonb,
  corrected_value jsonb,
  affected_release_ids uuid[] NOT NULL DEFAULT '{}',
  customer_notification_required boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'candidate',
  reported_by uuid REFERENCES iam.subjects(id),
  approved_by uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE TABLE governance.data_quality_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  version integer NOT NULL,
  target_object_type text NOT NULL,
  severity risk_tier NOT NULL,
  rule_definition jsonb NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (rule_key, version)
);
CREATE TABLE governance.data_quality_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES governance.data_quality_rules(id),
  object_type text NOT NULL,
  object_id uuid,
  run_id uuid,
  passed boolean NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE governance.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES iam.subjects(id) ON DELETE SET NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id uuid,
  request_id text,
  source_ip inet,
  user_agent text,
  before_hash text,
  after_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workflow_tasks_tenant_status_idx ON workflow.tasks(tenant_id, status, due_at);
CREATE INDEX alert_events_tenant_occurred_idx ON workflow.alert_events(tenant_id, occurred_at DESC);
CREATE INDEX model_runs_tenant_created_idx ON ai.model_runs(tenant_id, created_at DESC);
CREATE INDEX audit_events_tenant_occurred_idx ON governance.audit_events(tenant_id, occurred_at DESC);
COMMIT;
