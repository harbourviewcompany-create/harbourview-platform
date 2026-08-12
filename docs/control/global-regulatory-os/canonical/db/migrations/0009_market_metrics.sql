BEGIN;
CREATE SCHEMA IF NOT EXISTS market;

CREATE TABLE market.metric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL,
  version integer NOT NULL,
  canonical_name text NOT NULL,
  definition text NOT NULL,
  included_activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  excluded_activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  unit text NOT NULL,
  currency char(3),
  tax_treatment text,
  gross_net_basis text,
  period_basis text,
  methodology text NOT NULL,
  revision_policy text NOT NULL,
  owner_subject_id uuid REFERENCES iam.subjects(id),
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (metric_key, version)
);
CREATE TABLE market.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES source_ops.sources(id),
  dataset_key text UNIQUE NOT NULL,
  name text NOT NULL,
  rights jsonb NOT NULL DEFAULT '{}'::jsonb,
  refresh_frequency interval,
  classification data_classification NOT NULL DEFAULT 'commercially_restricted',
  status record_status NOT NULL DEFAULT 'draft'
);
CREATE TABLE market.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_definition_id uuid NOT NULL REFERENCES market.metric_definitions(id),
  dataset_id uuid REFERENCES market.datasets(id),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  entity_id uuid REFERENCES registry.entities(id),
  product_concept_id uuid REFERENCES ontology.concepts(id),
  channel_concept_id uuid REFERENCES ontology.concepts(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  state observation_state NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  currency char(3),
  confidence numeric(5,4),
  methodology_version text,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  revised_from_id uuid REFERENCES market.observations(id),
  status record_status NOT NULL DEFAULT 'candidate',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE market.reconciliation_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_definition_id uuid NOT NULL REFERENCES market.metric_definitions(id),
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  period_start date,
  period_end date,
  expected_value numeric,
  observed_value numeric,
  difference numeric,
  reason text,
  status record_status NOT NULL DEFAULT 'candidate',
  reviewed_by uuid REFERENCES iam.subjects(id)
);
CREATE TABLE market.forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  metric_definition_id uuid NOT NULL REFERENCES market.metric_definitions(id),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  scenario_key text,
  model_version text NOT NULL,
  baseline_observation_ids uuid[] NOT NULL,
  assumptions jsonb NOT NULL,
  forecast_values jsonb NOT NULL,
  confidence_intervals jsonb NOT NULL,
  as_of timestamptz NOT NULL,
  status record_status NOT NULL DEFAULT 'candidate',
  approved_by uuid REFERENCES iam.subjects(id)
);
CREATE INDEX observations_metric_geo_period_idx ON market.observations(metric_definition_id, jurisdiction_id, period_start, period_end);
COMMIT;
