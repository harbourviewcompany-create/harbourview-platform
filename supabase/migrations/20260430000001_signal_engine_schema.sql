-- =============================================================================
-- Harbourview Signal Engine V1 — Schema Migration
-- Milestone 1: Database Foundation
-- =============================================================================

-- Enable pgvector (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- source_documents
-- Root table for every external or manually entered document.
-- =============================================================================
CREATE TABLE IF NOT EXISTS source_documents (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url                  text,
  source_title                text,
  source_domain               text,
  source_type                 text NOT NULL DEFAULT 'manual_admin_entry',
  source_access_type          text NOT NULL DEFAULT 'manual_admin_entry'
                                CHECK (source_access_type IN (
                                  'public_web', 'uploaded_file', 'licensed_database',
                                  'partner_submission', 'manual_admin_entry',
                                  'email_forward', 'private_source'
                                )),
  source_permission_status    text NOT NULL DEFAULT 'uncertain'
                                CHECK (source_permission_status IN (
                                  'allowed', 'uncertain', 'restricted', 'blocked'
                                )),
  source_reuse_allowed        boolean,
  source_date                 date,
  discovered_at               timestamptz NOT NULL DEFAULT now(),
  last_seen_at                timestamptz,
  raw_text                    text,
  cleaned_text                text,
  raw_text_retention_status   text NOT NULL DEFAULT 'retained'
                                CHECK (raw_text_retention_status IN (
                                  'retained', 'redacted', 'removed', 'not_stored'
                                )),
  language_code               text,
  checksum                    text,
  source_credibility_score    numeric(6,4),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- source_chunks
-- Text chunks derived from source_documents, with optional embeddings.
-- =============================================================================
CREATE TABLE IF NOT EXISTS source_chunks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id   uuid NOT NULL REFERENCES source_documents (id) ON DELETE CASCADE,
  chunk_index          integer NOT NULL,
  chunk_text           text NOT NULL,
  embedding            vector(384),
  token_estimate       integer,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, chunk_index)
);

-- =============================================================================
-- signal_duplicate_groups
-- Groups of near-duplicate signal candidates.
-- canonical_signal_candidate_id FK added after signal_candidates is created.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_duplicate_groups (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_signal_candidate_id   uuid,   -- FK added below after signal_candidates
  duplicate_reason                text,
  similarity_score                numeric(6,4),
  created_at                      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_candidates
-- Core table. Each row is a candidate commercial signal extracted from a source.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_candidates (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id              uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  source_chunk_id                 uuid REFERENCES source_chunks (id) ON DELETE SET NULL,
  duplicate_group_id              uuid REFERENCES signal_duplicate_groups (id) ON DELETE SET NULL,

  signal_type                     text NOT NULL
                                    CHECK (signal_type IN (
                                      'supplier_lead', 'buyer_demand', 'seller_listing',
                                      'used_equipment', 'surplus_inventory',
                                      'facility_liquidation', 'packaging_supply',
                                      'cannabis_inventory', 'service_provider',
                                      'business_opportunity', 'policy_change',
                                      'regulatory_signal', 'market_entry_signal',
                                      'counterparty_signal', 'ignore'
                                    )),
  marketplace_category            text
                                    CHECK (marketplace_category IN (
                                      'new_products', 'used_surplus', 'cannabis_inventory',
                                      'wanted_requests', 'services', 'business_opportunities',
                                      'supplier_directory', 'policy_regulatory_signal', 'ignore'
                                    )),

  title                           text NOT NULL,
  summary                         text,
  inferred_company_name           text,
  inferred_location               text,
  inferred_product_type           text,

  jurisdiction_country            text,
  jurisdiction_region             text,
  jurisdiction_city               text,
  jurisdiction_confidence         numeric(6,4),
  jurisdiction_source             text,

  -- Scores (all nullable unless otherwise noted)
  model_confidence_score          numeric(6,4),
  source_credibility_score        numeric(6,4),
  recency_score                   numeric(6,4),
  evidence_strength_score         numeric(6,4),
  category_fit_score              numeric(6,4),
  novelty_score                   numeric(6,4),
  commercial_relevance_score      numeric(6,4),
  commercial_actionability_score  numeric(6,4),
  final_signal_score              numeric(6,4),
  score_breakdown                 jsonb NOT NULL DEFAULT '{}',
  relevance_score                 numeric(6,4),
  rerank_score                    numeric(6,4),
  confidence_score                numeric(6,4),

  status                          text NOT NULL DEFAULT 'needs_review'
                                    CHECK (status IN (
                                      'needs_review', 'needs_source_check',
                                      'needs_contact_enrichment', 'needs_compliance_review',
                                      'needs_pricing_check', 'priority_review',
                                      'approved', 'rejected', 'duplicate', 'archived',
                                      'ready_for_outreach', 'outreach_sent',
                                      'converted_to_listing', 'converted_to_supplier',
                                      'converted_to_wanted_request', 'converted_to_dossier'
                                    )),
  review_notes                    text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

-- Back-fill the FK from signal_duplicate_groups to signal_candidates
ALTER TABLE signal_duplicate_groups
  ADD CONSTRAINT fk_duplicate_groups_canonical_signal
  FOREIGN KEY (canonical_signal_candidate_id)
  REFERENCES signal_candidates (id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- =============================================================================
-- signal_evidence
-- Supporting evidence for a signal candidate.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_evidence (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id     uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  source_document_id      uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  source_chunk_id         uuid REFERENCES source_chunks (id) ON DELETE SET NULL,
  evidence_type           text NOT NULL,
  evidence_claim_type     text NOT NULL DEFAULT 'source_statement'
                            CHECK (evidence_claim_type IN (
                              'source_statement', 'model_inference', 'operator_verification',
                              'commercial_interpretation', 'regulatory_interpretation',
                              'external_confirmation'
                            )),
  evidence_text           text NOT NULL,
  source_url              text,
  confidence_score        numeric(6,4),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_review_events
-- Audit log for every status change or review action on a signal candidate.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_review_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  reviewer_id          uuid,
  event_type           text NOT NULL,
  old_value            jsonb,
  new_value            jsonb,
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_jobs
-- Job queue for async processing tasks (embedding, classification, dedup, etc.).
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      text NOT NULL,
  target_type   text NOT NULL,
  target_id     uuid,
  status        text NOT NULL DEFAULT 'queued'
                  CHECK (status IN (
                    'queued', 'processing', 'completed', 'failed', 'cancelled'
                  )),
  attempts      integer NOT NULL DEFAULT 0,
  max_attempts  integer NOT NULL DEFAULT 3,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  failed_at     timestamptz,
  error_code    text,
  error_message text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_risk_flags
-- Per-candidate risk and quality flags set by model or reviewer.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_risk_flags (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  flag                 text NOT NULL
                         CHECK (flag IN (
                           'stale', 'duplicate', 'restricted_source',
                           'insufficient_evidence', 'unclear_counterparty',
                           'unclear_jurisdiction', 'unverified_licence_claim',
                           'high_compliance_risk', 'low_commercial_value',
                           'likely_spam', 'not_cannabis_relevant',
                           'not_marketplace_relevant'
                         )),
  severity             text NOT NULL DEFAULT 'medium'
                         CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- model_prompt_versions
-- Versioned prompts / queries used for model tasks.
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_prompt_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name         text NOT NULL,
  version           text NOT NULL,
  prompt_or_query   text NOT NULL,
  labels            jsonb,
  active            boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_name, version)
);

-- =============================================================================
-- model_call_logs
-- Audit log for every external model invocation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_call_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider             text NOT NULL,
  model_name           text NOT NULL,
  model_task           text NOT NULL,
  prompt_version_id    uuid REFERENCES model_prompt_versions (id) ON DELETE SET NULL,
  input_hash           text,
  input_excerpt        text,
  output_json          jsonb,
  latency_ms           integer,
  token_or_unit_count  integer,
  status               text NOT NULL
                         CHECK (status IN ('success', 'failed', 'skipped', 'mock')),
  error_message        text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- entities
-- Deduplicated company / operator / organisation registry.
-- =============================================================================
CREATE TABLE IF NOT EXISTS entities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type           text NOT NULL,
  name                  text NOT NULL,
  website               text,
  domain                text,
  country               text,
  region                text,
  verification_status   text NOT NULL DEFAULT 'unverified',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_entity_mentions
-- Links signal candidates to resolved entities.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_entity_mentions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  entity_id            uuid REFERENCES entities (id) ON DELETE SET NULL,
  mentioned_name       text NOT NULL,
  mention_role         text,
  confidence_score     numeric(6,4),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_conversions
-- Records when a signal is promoted to a real marketplace or dossier record.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_conversions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id     uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  conversion_type         text NOT NULL
                            CHECK (conversion_type IN (
                              'marketplace_listing', 'supplier_directory_record',
                              'wanted_request', 'private_brokerage_opportunity',
                              'dossier_item'
                            )),
  converted_record_id     uuid,
  converted_record_table  text,
  reviewer_id             uuid,
  conversion_notes        text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_processing_errors
-- Structured error log linking jobs, sources, and candidates.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_processing_errors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_job_id        uuid REFERENCES signal_jobs (id) ON DELETE SET NULL,
  source_document_id   uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  signal_candidate_id  uuid REFERENCES signal_candidates (id) ON DELETE SET NULL,
  error_code           text NOT NULL,
  error_message        text,
  error_context        jsonb NOT NULL DEFAULT '{}',
  resolved             boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- source_documents
CREATE INDEX IF NOT EXISTS idx_source_documents_checksum
  ON source_documents (checksum);
CREATE INDEX IF NOT EXISTS idx_source_documents_source_domain
  ON source_documents (source_domain);
CREATE INDEX IF NOT EXISTS idx_source_documents_permission_status
  ON source_documents (source_permission_status);

-- source_chunks — standard btree
CREATE INDEX IF NOT EXISTS idx_source_chunks_source_document_id
  ON source_chunks (source_document_id);

-- source_chunks — ivfflat cosine (skip gracefully if extension unavailable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    BEGIN
      EXECUTE $sql$
        CREATE INDEX IF NOT EXISTS idx_source_chunks_embedding
          ON source_chunks USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
      $sql$;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ivfflat index creation skipped: %', SQLERRM;
    END;
  END IF;
END $$;

-- signal_candidates
CREATE INDEX IF NOT EXISTS idx_signal_candidates_status
  ON signal_candidates (status);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_marketplace_category
  ON signal_candidates (marketplace_category);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_signal_type
  ON signal_candidates (signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_final_signal_score
  ON signal_candidates (final_signal_score);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_source_document_id
  ON signal_candidates (source_document_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_duplicate_group_id
  ON signal_candidates (duplicate_group_id);

-- signal_evidence
CREATE INDEX IF NOT EXISTS idx_signal_evidence_signal_candidate_id
  ON signal_evidence (signal_candidate_id);

-- signal_jobs
CREATE INDEX IF NOT EXISTS idx_signal_jobs_status_scheduled_at
  ON signal_jobs (status, scheduled_at);

-- signal_risk_flags
CREATE INDEX IF NOT EXISTS idx_signal_risk_flags_signal_candidate_id
  ON signal_risk_flags (signal_candidate_id);

-- model_call_logs
CREATE INDEX IF NOT EXISTS idx_model_call_logs_model_name_task
  ON model_call_logs (model_name, model_task);

-- entities
CREATE INDEX IF NOT EXISTS idx_entities_domain
  ON entities (domain);
CREATE INDEX IF NOT EXISTS idx_entities_name
  ON entities (name);

-- signal_entity_mentions
CREATE INDEX IF NOT EXISTS idx_signal_entity_mentions_signal_candidate_id
  ON signal_entity_mentions (signal_candidate_id);

-- signal_conversions
CREATE INDEX IF NOT EXISTS idx_signal_conversions_signal_candidate_id
  ON signal_conversions (signal_candidate_id);

-- signal_processing_errors
CREATE INDEX IF NOT EXISTS idx_signal_processing_errors_resolved
  ON signal_processing_errors (resolved);
