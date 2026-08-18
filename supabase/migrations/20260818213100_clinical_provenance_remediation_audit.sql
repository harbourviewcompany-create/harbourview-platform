-- Record reconciliation counts in the private Clinical operations audit trail.
-- This migration does not publish or delete clinical content.

insert into public.clinical_evidence_operation_events (
  entity_type,
  entity_id,
  event_type,
  event_payload,
  recorded_at
)
values (
  'corpus',
  null,
  'prescriber-provenance-remediation',
  jsonb_build_object(
    'evidence_records_withheld', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'under-review'
        and coalesce(freshness_reason, '') ilike '%Prescriber provenance remediation%'
    ),
    'interaction_records_withheld', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'monitoring_records_withheld', (
      select count(*)
      from public.clinical_monitoring_protocols
      where review_status = 'under-review'
        and provenance_status = 'review-required'
    ),
    'remaining_published_noninspectable_evidence', (
      select count(*)
      from public.clinical_evidence_records
      where review_status = 'published'
        and not public.clinical_source_is_prescriber_inspectable(primary_source_url)
    ),
    'remaining_published_noninspectable_interactions', (
      select count(*)
      from public.clinical_medication_interactions
      where review_status = 'published'
        and (
          not public.clinical_source_is_prescriber_inspectable(primary_source_url)
          or btrim(coalesce(source_locator, '')) = ''
        )
    ),
    'recorded_by_migration', '20260818213100_clinical_provenance_remediation_audit.sql'
  ),
  now()
);
