-- Harbourview Clinical Evidence Spine
-- Production migration — matches lib/clinical/evidence.ts + operations.ts + sourceCurrentness
-- Safe to apply after RLS review. Does not publish any clinical claims.
-- Idempotent: uses IF NOT EXISTS / OR REPLACE where possible.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS clinical_evidence_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  title                 text NOT NULL,
  summary               text NOT NULL,
  condition             text,
  condition_aliases     text[] NOT NULL DEFAULT '{}',
  population            text,
  intervention          text,
  formulation           text,
  cannabinoid           text[] NOT NULL DEFAULT '{}',
  intervention_class    text NOT NULL CHECK (intervention_class IN (
    'regulated-cannabinoid-drug','general-cannabis','cannabinoid-isolate',
    'cannabis-derived-formulation','non-cannabis','not-applicable'
  )),
  comparator            text,
  outcome               text,
  evidence_type         text NOT NULL CHECK (evidence_type IN (
    'regulation','regulatory-guidance','clinical-guideline','systematic-review',
    'meta-analysis','randomized-trial','observational-study',
    'pharmacovigilance-signal','product-monograph','other'
  )),
  evidence_strength     text NOT NULL CHECK (evidence_strength IN (
    'high','moderate','low','very-low','ungraded','conflicted'
  )),
  evidence_strength_method text,
  uncertainty           text,
  conflict_status       text NOT NULL DEFAULT 'none' CHECK (conflict_status IN (
    'none','mixed','material-conflict'
  )),
  jurisdiction          text[] NOT NULL DEFAULT '{}',
  profession_relevance  text[] NOT NULL DEFAULT '{}',
  primary_source_title  text NOT NULL,
  primary_source_publisher text NOT NULL,
  primary_source_url    text NOT NULL,
  primary_source_id     text,
  publication_date      date,
  effective_date        date,
  verified_at           timestamptz NOT NULL,
  supersession_state    text NOT NULL DEFAULT 'current' CHECK (supersession_state IN (
    'current','superseded','partially-superseded'
  )),
  superseded_by_id      uuid REFERENCES clinical_evidence_records(id),
  review_status         text NOT NULL DEFAULT 'under-review' CHECK (review_status IN (
    'published','under-review'
  )),
  source_registry_id    text,
  grading_method_key    text,
  publication_scope     text CHECK (publication_scope IN (
    'source-metadata','clinical-synthesis'
  )),
  freshness_status      text NOT NULL DEFAULT 'current' CHECK (freshness_status IN (
    'current','stale','review-required','source-degraded'
  )),
  review_due_at         timestamptz,
  source_currentness_checked_at timestamptz,
  freshness_reason      text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_condition
  ON clinical_evidence_records USING gin (to_tsvector('english', coalesce(condition,'') || ' ' || coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_jurisdiction
  ON clinical_evidence_records USING gin (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_review_status
  ON clinical_evidence_records (review_status);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_freshness
  ON clinical_evidence_records (freshness_status);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_records_currentness_checked
  ON clinical_evidence_records (source_currentness_checked_at NULLS FIRST);

CREATE TABLE IF NOT EXISTS clinical_evidence_change_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_record_id    uuid REFERENCES clinical_evidence_records(id),
  event_type            text NOT NULL,
  title                 text,
  summary               text,
  materiality           text CHECK (materiality IS NULL OR materiality IN ('low','medium','high')),
  jurisdiction          text[] NOT NULL DEFAULT '{}',
  profession_relevance  text[] NOT NULL DEFAULT '{}',
  occurred_at           timestamptz NOT NULL DEFAULT now(),
  verified_at           timestamptz,
  primary_source_title  text,
  primary_source_publisher text,
  primary_source_url    text,
  payload               jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_change_events_record
  ON clinical_evidence_change_events (evidence_record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_change_events_type
  ON clinical_evidence_change_events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS clinical_evidence_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_registry_id    text NOT NULL,
  snapshot_key          text NOT NULL,
  source_url            text NOT NULL,
  source_version        text,
  retrieved_at          timestamptz NOT NULL,
  media_type            text NOT NULL,
  hash_scope            text NOT NULL CHECK (hash_scope IN (
    'source-bytes','normalized-text','normalized-reviewed-extract'
  )),
  content_sha256        text NOT NULL,
  byte_size             integer,
  locator_manifest      jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_registry_id, snapshot_key)
);

CREATE INDEX IF NOT EXISTS idx_clinical_snapshots_registry
  ON clinical_evidence_snapshots (source_registry_id, retrieved_at DESC);

CREATE TABLE IF NOT EXISTS clinical_structured_extractions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_record_id    uuid NOT NULL REFERENCES clinical_evidence_records(id),
  source_snapshot_id    uuid NOT NULL REFERENCES clinical_evidence_snapshots(id),
  population            jsonb,
  intervention          jsonb,
  comparator            jsonb,
  outcomes              jsonb NOT NULL DEFAULT '[]',
  study_design          text,
  sample_size           integer,
  follow_up             text,
  effect_estimates      jsonb NOT NULL DEFAULT '[]',
  uncertainty           jsonb,
  limitations           jsonb NOT NULL DEFAULT '[]',
  source_locator        text,
  verification_status   text NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending','verified','rejected'
  )),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_outcome_evidence (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id          text NOT NULL,
  evidence_record_id    uuid NOT NULL REFERENCES clinical_evidence_records(id),
  source_snapshot_id    uuid REFERENCES clinical_evidence_snapshots(id),
  intervention_label    text,
  intervention_class    text NOT NULL,
  formulation           text,
  cannabinoids          text[] NOT NULL DEFAULT '{}',
  population_summary    text,
  comparator_summary    text,
  outcome_key           text NOT NULL,
  outcome_label         text NOT NULL,
  relationship_kind     text NOT NULL CHECK (relationship_kind IN (
    'authorized-indication','efficacy','safety','tolerability','quality-of-life','other'
  )),
  direction             text NOT NULL CHECK (direction IN (
    'benefit','harm','no-clear-effect','mixed','not-assessed'
  )),
  effect_summary        text,
  uncertainty_summary   text,
  publication_scope     text NOT NULL,
  review_status         text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_grade_assessments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_record_id    uuid NOT NULL REFERENCES clinical_evidence_records(id),
  review_id             uuid NOT NULL,
  grading_method_key    text NOT NULL,
  starting_certainty    text NOT NULL,
  risk_of_bias          text NOT NULL,
  inconsistency         text NOT NULL,
  indirectness          text NOT NULL,
  imprecision           text NOT NULL,
  publication_bias      text NOT NULL,
  final_certainty       text NOT NULL,
  assessment_rationale  text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_reviewer_credentials (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  profession            text NOT NULL CHECK (profession IN ('clinician','pharmacist')),
  jurisdiction          text NOT NULL,
  credential_reference  text NOT NULL,
  verification_status   text NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending','verified','expired','revoked','rejected'
  )),
  verified_at           timestamptz,
  valid_from            timestamptz,
  valid_until           timestamptz,
  verification_source_url text NOT NULL,
  verified_by_user_id   uuid,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_intake_queue (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_status         text NOT NULL DEFAULT 'queued',
  priority              text NOT NULL DEFAULT 'normal',
  coverage_status       text NOT NULL DEFAULT 'source-identified',
  intended_conditions   text[] NOT NULL DEFAULT '{}',
  intended_jurisdictions text[] NOT NULL DEFAULT '{}',
  intended_publication_scope text NOT NULL DEFAULT 'source-metadata',
  assigned_user_id      uuid,
  review_due_at         timestamptz,
  notes                 text,
  source_id             text NOT NULL,
  source_key            text NOT NULL,
  source_type           text NOT NULL,
  source_title          text NOT NULL,
  publisher             text NOT NULL,
  source_url            text NOT NULL,
  doi                   text,
  pmid                  text,
  din                   text,
  source_version        text,
  currentness           text NOT NULL DEFAULT 'unknown',
  latest_snapshot_id    uuid REFERENCES clinical_evidence_snapshots(id),
  retrieved_at          timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_view_audit (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  evidence_record_id    uuid NOT NULL REFERENCES clinical_evidence_records(id),
  record_verified_at    timestamptz NOT NULL,
  jurisdiction_context  text,
  viewed_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_view_audit_user
  ON clinical_view_audit (user_id, viewed_at DESC);

ALTER TABLE clinical_evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_view_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_intake_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_structured_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_outcome_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_grade_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reviewer_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY clinical_evidence_published_read ON clinical_evidence_records
    FOR SELECT TO authenticated
    USING (review_status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY clinical_view_audit_own ON clinical_view_audit
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION clinical_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_evidence_records_updated_at ON clinical_evidence_records;
CREATE TRIGGER clinical_evidence_records_updated_at
  BEFORE UPDATE ON clinical_evidence_records
  FOR EACH ROW EXECUTE FUNCTION clinical_set_updated_at();
