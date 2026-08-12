BEGIN;
CREATE SCHEMA IF NOT EXISTS evidence;

CREATE TABLE evidence.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES source_ops.sources(id),
  acquisition_run_id uuid REFERENCES source_ops.acquisition_runs(id),
  canonical_uri text,
  retrieved_at timestamptz NOT NULL,
  published_at timestamptz,
  issued_at timestamptz,
  effective_from timestamptz,
  effective_to timestamptz,
  http_status integer,
  mime_type text,
  byte_length bigint,
  content_hash text NOT NULL,
  binary_hash text,
  storage_uri text NOT NULL,
  object_version text,
  object_lock_status text,
  response_headers_hash text,
  language text,
  duplicate_of_snapshot_id uuid REFERENCES evidence.snapshots(id),
  classification data_classification NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, content_hash)
);
CREATE TABLE evidence.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES source_ops.sources(id),
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  authority_id uuid REFERENCES geo.authorities(id),
  document_kind document_kind NOT NULL,
  source_identifier text,
  canonical_title text NOT NULL,
  language text,
  status record_status NOT NULL DEFAULT 'candidate',
  classification data_classification NOT NULL DEFAULT 'public',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (source_id, source_identifier)
);
CREATE TABLE evidence.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES evidence.documents(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES evidence.snapshots(id),
  version_label text,
  published_at timestamptz,
  effective_from timestamptz,
  effective_to timestamptz,
  supersedes_version_id uuid REFERENCES evidence.document_versions(id),
  parser_key text,
  parser_version text,
  ocr_engine text,
  ocr_version text,
  ocr_confidence numeric(5,4),
  normalized_text_uri text,
  processing_run_id uuid,
  status record_status NOT NULL DEFAULT 'candidate',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, snapshot_id)
);
CREATE TABLE evidence.passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES evidence.document_versions(id) ON DELETE CASCADE,
  parent_passage_id uuid REFERENCES evidence.passages(id),
  passage_kind text NOT NULL,
  ordinal integer,
  page_number integer,
  section_identifier text,
  article_identifier text,
  paragraph_identifier text,
  table_identifier text,
  character_start integer,
  character_end integer,
  original_text text,
  normalized_text text,
  stable_anchor text NOT NULL,
  content_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (document_version_id, stable_anchor)
);
CREATE TABLE evidence.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id uuid NOT NULL REFERENCES evidence.passages(id) ON DELETE CASCADE,
  target_language text NOT NULL,
  translated_text text NOT NULL,
  provider text,
  model text,
  model_version text,
  confidence numeric(5,4),
  human_review_status record_status NOT NULL DEFAULT 'candidate',
  reviewer_id uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (passage_id, target_language, model_version)
);
CREATE TABLE evidence.document_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version_id uuid NOT NULL REFERENCES evidence.document_versions(id),
  to_version_id uuid NOT NULL REFERENCES evidence.document_versions(id),
  structural_diff jsonb NOT NULL,
  semantic_summary text,
  change_kind change_kind NOT NULL,
  materiality risk_tier,
  model_run_id uuid,
  reviewed_by uuid REFERENCES iam.subjects(id),
  review_status record_status NOT NULL DEFAULT 'candidate',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_version_id, to_version_id)
);
CREATE TABLE evidence.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  truth_class truth_class NOT NULL,
  claim_text text NOT NULL,
  structured_claim jsonb NOT NULL DEFAULT '{}'::jsonb,
  jurisdiction_id uuid REFERENCES geo.jurisdictions(id),
  effective_from timestamptz,
  effective_to timestamptz,
  confidence numeric(5,4),
  uncertainty_reason text,
  status record_status NOT NULL DEFAULT 'candidate',
  visibility visibility_class NOT NULL DEFAULT 'tenant',
  classification data_classification NOT NULL DEFAULT 'customer_confidential',
  superseded_claim_id uuid REFERENCES evidence.claims(id),
  created_by uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE evidence.claim_evidence (
  claim_id uuid NOT NULL REFERENCES evidence.claims(id) ON DELETE CASCADE,
  passage_id uuid NOT NULL REFERENCES evidence.passages(id),
  relationship text NOT NULL CHECK (relationship IN ('supports','contradicts','context','methodology')),
  citation_confidence numeric(5,4),
  quoted_passage text,
  PRIMARY KEY (claim_id, passage_id, relationship)
);
CREATE TABLE evidence.evidence_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES iam.tenants(id),
  bundle_type text NOT NULL,
  manifest jsonb NOT NULL,
  manifest_hash text NOT NULL,
  storage_uri text,
  classification data_classification NOT NULL,
  created_by uuid REFERENCES iam.subjects(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX snapshots_source_retrieved_idx ON evidence.snapshots(source_id, retrieved_at DESC);
CREATE INDEX passages_version_idx ON evidence.passages(document_version_id, ordinal);
CREATE INDEX claims_jurisdiction_status_idx ON evidence.claims(jurisdiction_id, status);
COMMIT;
