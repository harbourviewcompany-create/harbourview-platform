BEGIN;
CREATE SCHEMA IF NOT EXISTS ontology;
CREATE SCHEMA IF NOT EXISTS regulatory;

CREATE TABLE ontology.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_key text NOT NULL,
  family text NOT NULL,
  parent_id uuid REFERENCES ontology.concepts(id),
  canonical_label text NOT NULL,
  description text,
  version integer NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  status record_status NOT NULL DEFAULT 'draft',
  UNIQUE (concept_key, version)
);
CREATE TABLE ontology.term_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES ontology.concepts(id),
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  source_term text NOT NULL,
  language text,
  mapping_relationship text NOT NULL CHECK (mapping_relationship IN ('exact','broader','narrower','conditional','disputed','unmapped')),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  confidence numeric(5,4),
  valid_from timestamptz,
  valid_to timestamptz,
  reviewer_id uuid REFERENCES iam.subjects(id),
  status record_status NOT NULL DEFAULT 'candidate'
);
CREATE TABLE regulatory.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  authority_id uuid REFERENCES geo.authorities(id),
  document_id uuid REFERENCES evidence.documents(id),
  instrument_type text NOT NULL,
  canonical_identifier text,
  title text NOT NULL,
  legal_effect legal_effect NOT NULL DEFAULT 'unknown',
  status record_status NOT NULL DEFAULT 'candidate',
  enacted_at timestamptz,
  effective_from timestamptz,
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (jurisdiction_id, canonical_identifier)
);
CREATE TABLE regulatory.instrument_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES regulatory.instruments(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL REFERENCES evidence.document_versions(id),
  version_label text,
  legal_status text,
  effective_from timestamptz,
  effective_to timestamptz,
  supersedes_id uuid REFERENCES regulatory.instrument_versions(id),
  status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (instrument_id, document_version_id)
);
CREATE TABLE regulatory.provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_version_id uuid NOT NULL REFERENCES regulatory.instrument_versions(id) ON DELETE CASCADE,
  parent_provision_id uuid REFERENCES regulatory.provisions(id),
  passage_id uuid NOT NULL REFERENCES evidence.passages(id),
  provision_key text NOT NULL,
  heading text,
  provision_type text,
  normalized_text text,
  effective_from timestamptz,
  effective_to timestamptz,
  status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (instrument_version_id, provision_key)
);
CREATE TABLE regulatory.regulatory_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  instrument_id uuid REFERENCES regulatory.instruments(id),
  from_version_id uuid REFERENCES regulatory.instrument_versions(id),
  to_version_id uuid REFERENCES regulatory.instrument_versions(id),
  change_kind change_kind NOT NULL,
  title text NOT NULL,
  summary text,
  materiality risk_tier NOT NULL DEFAULT 'moderate',
  published_at timestamptz,
  effective_at timestamptz,
  status record_status NOT NULL DEFAULT 'candidate',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE regulatory.change_provisions (
  change_id uuid NOT NULL REFERENCES regulatory.regulatory_changes(id) ON DELETE CASCADE,
  provision_id uuid NOT NULL REFERENCES regulatory.provisions(id),
  relationship text NOT NULL CHECK (relationship IN ('added','modified','removed','affected','context')),
  PRIMARY KEY (change_id, provision_id, relationship)
);
CREATE TABLE regulatory.interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  interpretation_type text NOT NULL,
  statement text NOT NULL,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  uncertainty text,
  risk_tier risk_tier NOT NULL,
  legal_review_required boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'candidate',
  visibility visibility_class NOT NULL DEFAULT 'tenant',
  classification data_classification NOT NULL DEFAULT 'customer_confidential',
  created_by uuid REFERENCES iam.subjects(id),
  approved_by uuid REFERENCES iam.subjects(id),
  approved_at timestamptz,
  effective_from timestamptz,
  effective_to timestamptz
);
CREATE TABLE regulatory.interpretation_evidence (
  interpretation_id uuid NOT NULL REFERENCES regulatory.interpretations(id) ON DELETE CASCADE,
  passage_id uuid NOT NULL REFERENCES evidence.passages(id),
  relationship text NOT NULL DEFAULT 'supports',
  PRIMARY KEY (interpretation_id, passage_id)
);
CREATE INDEX provisions_version_idx ON regulatory.provisions(instrument_version_id);
CREATE INDEX changes_geo_effective_idx ON regulatory.regulatory_changes(jurisdiction_id, effective_at DESC);
COMMIT;
