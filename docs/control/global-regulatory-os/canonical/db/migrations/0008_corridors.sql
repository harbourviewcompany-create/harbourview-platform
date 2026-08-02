BEGIN;
CREATE SCHEMA IF NOT EXISTS trade;

CREATE TABLE trade.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  canonical_name text NOT NULL,
  product_concept_id uuid REFERENCES ontology.concepts(id),
  intended_use_concept_id uuid REFERENCES ontology.concepts(id),
  dosage_form_concept_id uuid REFERENCES ontology.concepts(id),
  substance_composition jsonb NOT NULL DEFAULT '[]'::jsonb,
  strength jsonb NOT NULL DEFAULT '{}'::jsonb,
  packaging jsonb NOT NULL DEFAULT '{}'::jsonb,
  classification data_classification NOT NULL DEFAULT 'customer_confidential',
  status record_status NOT NULL DEFAULT 'draft'
);
CREATE TABLE trade.product_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES trade.products(id) ON DELETE CASCADE,
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  classification_concept_id uuid REFERENCES ontology.concepts(id),
  controlled_status text,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  status record_status NOT NULL DEFAULT 'candidate'
);
CREATE TABLE trade.corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  corridor_key text NOT NULL,
  name text NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (tenant_id, corridor_key)
);
CREATE TABLE trade.corridor_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id uuid NOT NULL REFERENCES trade.corridors(id) ON DELETE CASCADE,
  version integer NOT NULL,
  origin_jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  destination_jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  transit_jurisdiction_ids uuid[] NOT NULL DEFAULT '{}',
  exporter_entity_id uuid REFERENCES registry.entities(id),
  importer_entity_id uuid REFERENCES registry.entities(id),
  product_id uuid NOT NULL REFERENCES trade.products(id),
  purpose_concept_id uuid REFERENCES ontology.concepts(id),
  quantity jsonb NOT NULL,
  shipping_mode text,
  as_of timestamptz NOT NULL,
  input_snapshot jsonb NOT NULL,
  input_hash text NOT NULL,
  status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (corridor_id, version)
);
CREATE TABLE trade.gate_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_key text NOT NULL,
  version integer NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  required_evidence_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluation_rule jsonb,
  reviewer_role text,
  risk_tier risk_tier NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (gate_key, version)
);
CREATE TABLE trade.corridor_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_version_id uuid NOT NULL REFERENCES trade.corridor_versions(id) ON DELETE CASCADE,
  gate_definition_id uuid NOT NULL REFERENCES trade.gate_definitions(id),
  status gate_status NOT NULL DEFAULT 'not_started',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_inputs text[] NOT NULL DEFAULT '{}',
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  evaluated_at timestamptz,
  expires_at timestamptz,
  evaluated_by uuid REFERENCES iam.subjects(id),
  UNIQUE (corridor_version_id, gate_definition_id)
);
CREATE TABLE trade.corridor_determinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_version_id uuid NOT NULL REFERENCES trade.corridor_versions(id),
  determination corridor_determination NOT NULL,
  blocking_gate_ids uuid[] NOT NULL DEFAULT '{}',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(5,4),
  valid_until timestamptz,
  specialist_review_required boolean NOT NULL DEFAULT true,
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  status record_status NOT NULL DEFAULT 'candidate'
);
CREATE TABLE trade.market_entry_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  product_ids uuid[] NOT NULL DEFAULT '{}',
  scope jsonb NOT NULL,
  status record_status NOT NULL DEFAULT 'draft',
  owner_subject_id uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE trade.required_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_gate_id uuid NOT NULL REFERENCES trade.corridor_gates(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  responsible_party text,
  required_by timestamptz,
  status text NOT NULL DEFAULT 'missing',
  evidence_bundle_id uuid REFERENCES evidence.evidence_bundles(id)
);
COMMIT;
