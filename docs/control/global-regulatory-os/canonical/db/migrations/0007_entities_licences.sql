BEGIN;
CREATE SCHEMA IF NOT EXISTS registry;

CREATE TABLE registry.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  entity_kind entity_kind NOT NULL,
  legal_name text NOT NULL,
  normalized_name text NOT NULL,
  registration_identifier text,
  registration_authority_id uuid REFERENCES geo.authorities(id),
  status record_status NOT NULL DEFAULT 'candidate',
  visibility visibility_class NOT NULL DEFAULT 'tenant',
  classification data_classification NOT NULL DEFAULT 'customer_confidential',
  valid_from date,
  valid_to date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX entities_official_id_unique ON registry.entities(jurisdiction_id, registration_identifier) WHERE registration_identifier IS NOT NULL;
CREATE INDEX entities_name_idx ON registry.entities(normalized_name);
CREATE TABLE registry.entity_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES registry.entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_type text NOT NULL,
  language text,
  valid_from date,
  valid_to date,
  evidence_ids uuid[] NOT NULL DEFAULT '{}'
);
CREATE TABLE registry.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  birth_date date,
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  classification data_classification NOT NULL DEFAULT 'personal',
  status record_status NOT NULL DEFAULT 'candidate',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE registry.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid REFERENCES registry.entities(id),
  from_person_id uuid REFERENCES registry.people(id),
  to_entity_id uuid REFERENCES registry.entities(id),
  to_person_id uuid REFERENCES registry.people(id),
  relationship_kind relationship_kind NOT NULL,
  ownership_percent numeric(7,4),
  confidence numeric(5,4),
  valid_from date,
  valid_to date,
  status record_status NOT NULL DEFAULT 'candidate',
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  CHECK ((from_entity_id IS NOT NULL) <> (from_person_id IS NOT NULL)),
  CHECK ((to_entity_id IS NOT NULL) <> (to_person_id IS NOT NULL))
);
CREATE TABLE registry.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES registry.entities(id),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  facility_name text,
  address jsonb NOT NULL,
  geolocation point,
  status record_status NOT NULL DEFAULT 'candidate',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE registry.licence_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid NOT NULL REFERENCES geo.jurisdictions(id),
  authority_id uuid REFERENCES geo.authorities(id),
  concept_id uuid REFERENCES ontology.concepts(id),
  class_code text NOT NULL,
  name text NOT NULL,
  authorized_activities uuid[] NOT NULL DEFAULT '{}',
  status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (jurisdiction_id, class_code)
);
CREATE TABLE registry.licences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES registry.entities(id),
  facility_id uuid REFERENCES registry.facilities(id),
  licence_class_id uuid NOT NULL REFERENCES registry.licence_classes(id),
  authority_id uuid REFERENCES geo.authorities(id),
  licence_number text NOT NULL,
  status licence_status NOT NULL,
  issued_at date,
  effective_from date,
  expires_at date,
  status_changed_at timestamptz,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  record_status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (authority_id, licence_number, effective_from)
);
CREATE TABLE registry.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES registry.entities(id),
  facility_id uuid REFERENCES registry.facilities(id),
  certification_type text NOT NULL,
  certificate_number text,
  issuing_authority_id uuid REFERENCES geo.authorities(id),
  status certification_status NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at date,
  expires_at date,
  evidence_ids uuid[] NOT NULL DEFAULT '{}'
);
CREATE TABLE registry.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES registry.facilities(id),
  authority_id uuid REFERENCES geo.authorities(id),
  inspection_type text,
  inspected_at date,
  outcome text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  status record_status NOT NULL DEFAULT 'candidate'
);
CREATE TABLE registry.enforcement_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES registry.entities(id),
  facility_id uuid REFERENCES registry.facilities(id),
  authority_id uuid REFERENCES geo.authorities(id),
  enforcement_type text NOT NULL,
  severity risk_tier NOT NULL,
  occurred_at timestamptz,
  resolved_at timestamptz,
  description text,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  status record_status NOT NULL DEFAULT 'candidate'
);
CREATE TABLE registry.counterparty_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES iam.tenants(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES registry.entities(id),
  risk_score numeric(6,3),
  risk_status text,
  score_version text,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  status record_status NOT NULL DEFAULT 'candidate',
  UNIQUE (tenant_id, entity_id)
);
COMMIT;
