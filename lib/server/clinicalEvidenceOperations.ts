import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type {
  ClinicalFreshnessQueueRow,
  ClinicalOperationsDashboard,
  ClinicalOperationsMetrics,
  ClinicalReviewerCredentialRow,
  ClinicalReviewQueueRow,
} from '@/lib/clinical/operations'

type Row = Record<string, unknown>
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
const num = (value: unknown) => typeof value === 'number' ? value : Number(value ?? 0)

function mapReviewQueue(row: Row): ClinicalReviewQueueRow {
  return {
    intakeId: String(row.intake_id),
    intakeStatus: row.intake_status as ClinicalReviewQueueRow['intakeStatus'],
    priority: row.priority as ClinicalReviewQueueRow['priority'],
    coverageStatus: row.coverage_status as ClinicalReviewQueueRow['coverageStatus'],
    intendedConditions: strings(row.intended_conditions),
    intendedJurisdictions: strings(row.intended_jurisdictions),
    intendedPublicationScope: row.intended_publication_scope as ClinicalReviewQueueRow['intendedPublicationScope'],
    assignedUserId: text(row.assigned_user_id),
    reviewDueAt: text(row.review_due_at),
    notes: text(row.notes),
    sourceId: String(row.source_id),
    sourceKey: String(row.source_key),
    sourceType: String(row.source_type),
    sourceTitle: String(row.source_title),
    publisher: String(row.publisher),
    sourceUrl: String(row.source_url),
    doi: text(row.doi),
    pmid: text(row.pmid),
    din: text(row.din),
    sourceVersion: text(row.source_version),
    currentness: row.currentness as ClinicalReviewQueueRow['currentness'],
    latestSnapshotId: text(row.latest_snapshot_id),
    retrievedAt: String(row.retrieved_at),
  }
}

function mapFreshness(row: Row): ClinicalFreshnessQueueRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    reviewStatus: row.review_status as ClinicalFreshnessQueueRow['reviewStatus'],
    freshnessStatus: row.freshness_status as ClinicalFreshnessQueueRow['freshnessStatus'],
    reviewDueAt: text(row.review_due_at),
    sourceCurrentnessCheckedAt: text(row.source_currentness_checked_at),
    freshnessReason: text(row.freshness_reason),
    sourceKey: text(row.source_key),
    sourceCurrentness: text(row.source_currentness),
    sourceUrl: text(row.source_url),
  }
}

function mapCredential(row: Row): ClinicalReviewerCredentialRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    profession: row.profession as ClinicalReviewerCredentialRow['profession'],
    jurisdiction: String(row.jurisdiction),
    credentialReference: String(row.credential_reference),
    verificationSourceUrl: String(row.verification_source_url),
    verificationStatus: row.verification_status as ClinicalReviewerCredentialRow['verificationStatus'],
    verifiedByUserId: text(row.verified_by_user_id),
    verifiedAt: text(row.verified_at),
    validFrom: text(row.valid_from),
    validUntil: text(row.valid_until),
  }
}

export async function loadClinicalOperationsDashboard(): Promise<ClinicalOperationsDashboard> {
  const supabase = await createSupabaseServiceClient()
  const [reviewQueueResult, freshnessResult, credentialsResult, metricsResult] = await Promise.all([
    supabase.schema('api').from('clinical_evidence_review_queue').select('*').order('priority', { ascending: false }).order('retrieved_at', { ascending: false }).limit(100),
    supabase.schema('api').from('clinical_evidence_freshness_queue').select('*').order('review_due_at', { ascending: true, nullsFirst: false }).limit(100),
    supabase.schema('public').from('clinical_reviewer_credentials').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.schema('public').rpc('clinical_evidence_corpus_metrics'),
  ])

  for (const result of [reviewQueueResult, freshnessResult, credentialsResult, metricsResult]) {
    if (result.error) throw new Error(`clinical_operations_query_failed:${result.error.message}`)
  }

  const metricsRow = Array.isArray(metricsResult.data) ? metricsResult.data[0] as Row | undefined : undefined
  const metrics: ClinicalOperationsMetrics | null = metricsRow ? {
    publishedConditions: num(metricsRow.published_conditions),
    publishedRecords: num(metricsRow.published_records),
    underReviewRecords: num(metricsRow.under_review_records),
    staleOrReviewRequired: num(metricsRow.stale_or_review_required),
    unresolvedMaterialConflicts: num(metricsRow.unresolved_material_conflicts),
    ungradedPublishedRecords: num(metricsRow.ungraded_published_records),
    sourcesWithoutSnapshot: num(metricsRow.sources_without_snapshot),
    oldestVerifiedAt: text(metricsRow.oldest_verified_at),
    newestVerifiedAt: text(metricsRow.newest_verified_at),
  } : null

  return {
    reviewQueue: (reviewQueueResult.data ?? []).map(row => mapReviewQueue(row as Row)),
    freshnessQueue: (freshnessResult.data ?? []).map(row => mapFreshness(row as Row)),
    credentials: (credentialsResult.data ?? []).map(row => mapCredential(row as Row)),
    metrics,
  }
}
