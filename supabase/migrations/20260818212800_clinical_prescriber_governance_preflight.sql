-- Clinical Prescriber OS production-ledger preflight.
--
-- This migration intentionally performs no schema or data mutation. It fails
-- closed when the earlier Clinical Evidence V1/V1.1 governance foundation is
-- not present. Production currently has later Clinical seed versions without
-- all of these governance objects, so operators must reconcile/apply the
-- missing historical governance migrations before any Prescriber OS repair.
--
-- Safe outcomes:
--   * required governance is present -> this migration is a no-op;
--   * required governance is absent  -> raise before later reconciliation DDL.

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
  IF to_regclass('public.clinical_evidence_source_snapshots') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_source_snapshots');
  END IF;
  IF to_regclass('public.clinical_evidence_grade_assessments') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_grade_assessments');
  END IF;
  IF to_regclass('public.clinical_evidence_operation_events') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_operation_events');
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
      AND column_name = 'primary_source_registry_id'
  ) THEN
    missing := array_append(missing, 'clinical_evidence_records.primary_source_registry_id');
  END IF;

  IF to_regprocedure('public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamp with time zone)') IS NULL THEN
    missing := array_append(missing, 'public.clinical_reviewer_credential_is_valid(uuid,uuid,text,timestamptz)');
  END IF;
  IF to_regprocedure('public.clinical_evidence_has_review_role()') IS NULL THEN
    missing := array_append(missing, 'public.clinical_evidence_has_review_role()');
  END IF;

  IF cardinality(missing) > 0 THEN
    RAISE EXCEPTION
      'Clinical Prescriber OS governance preflight failed. Reconcile the missing Clinical Evidence V1/V1.1 governance migrations before this release. Missing: %',
      array_to_string(missing, ', ');
  END IF;
END
$preflight$;

comment on table public.clinical_evidence_records is
  'Clinical evidence records. Prescriber OS migrations require the Evidence V1/V1.1 governance foundation to be present before reconciliation proceeds.';
