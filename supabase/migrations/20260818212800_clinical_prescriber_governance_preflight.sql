-- Clinical Prescriber OS production-governance preflight.
--
-- This migration intentionally performs no schema or data mutation. It fails
-- closed unless the production-shaped Clinical Evidence Spine reconciliation
-- now represented by 20260819100621_clinical_evidence_spine_reconcile.sql is
-- present. Historical Evidence V1/V1.1 object names are not production
-- prerequisites for this forward reconciliation.
--
-- Safe outcomes:
--   * applied production governance contract is present -> no-op;
--   * required contract is absent -> raise before later Prescriber OS DDL.

DO $preflight$
DECLARE
  missing text[] := '{}'::text[];
BEGIN
  IF to_regclass('public.clinical_evidence_reviews') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_reviews');
  END IF;
  IF to_regclass('public.clinical_reviewer_credentials') IS NULL THEN
    missing := array_append(missing, 'public.clinical_reviewer_credentials');
  END IF;
  IF to_regclass('public.clinical_evidence_snapshots') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_snapshots');
  END IF;
  IF to_regclass('public.clinical_grade_assessments') IS NULL THEN
    missing := array_append(missing, 'public.clinical_grade_assessments');
  END IF;
  IF to_regclass('public.clinical_monitoring_protocols') IS NULL THEN
    missing := array_append(missing, 'public.clinical_monitoring_protocols');
  END IF;
  IF to_regclass('public.clinical_formulary_skus') IS NULL THEN
    missing := array_append(missing, 'public.clinical_formulary_skus');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'publication_scope'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.publication_scope');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'freshness_status'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.freshness_status');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinical_evidence_records'
      AND column_name = 'source_registry_id'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.source_registry_id');
  END IF;

  IF to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') IS NULL THEN
    missing := array_append(missing, 'public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz)');
  END IF;
  IF to_regprocedure('public.clinical_evidence_has_review_role(text[])') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_has_review_role(text[])');
  END IF;

  IF cardinality(missing) > 0 THEN
    RAISE EXCEPTION
      'Clinical Prescriber OS governance preflight failed. Apply/reconcile the production Clinical Evidence Spine contract before this release. Missing: %',
      array_to_string(missing, ', ');
  END IF;
END
$preflight$;

comment on table public.clinical_evidence_records is
  'Clinical evidence records. Prescriber OS reconciliation requires the applied production Clinical Evidence Spine governance contract.';
