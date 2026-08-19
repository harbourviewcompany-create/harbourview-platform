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
const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null)
const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
const num = (value: unknown) => (typeof value === 'number' ? value : Number(value ?? 0))

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
    retrievedAt: String(row.retrieved_at ?? ''),
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

export type ClinicalOperationsLoadNote = {
  source: string
  message: string
}

export type ClinicalOperationsDashboardResult = ClinicalOperationsDashboard & {
  loadNotes: ClinicalOperationsLoadNote[]
}

/**
 * Soft-load clinical ops dashboard. Missing views/RPC must not crash the UI
 * (especially on mobile where the global error boundary is hard to recover from).
 */
export async function loadClinicalOperationsDashboard(): Promise<ClinicalOperationsDashboardResult> {
  const supabase = await createSupabaseServiceClient()
  const loadNotes: ClinicalOperationsLoadNote[] = []

  const [reviewQueueResult, freshnessResult, credentialsResult, metricsResult] = await Promise.all([
    supabase
      .schema('api')
      .from('clinical_evidence_review_queue')
      .select('*')
      .order('priority', { ascending: false })
      .order('retrieved_at', { ascending: false })
      .limit(100),
    supabase
      .schema('api')
      .from('clinical_evidence_freshness_queue')
      .select('*')
      .order('review_due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    supabase
      .schema('public')
      .from('clinical_reviewer_credentials')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.schema('public').rpc('clinical_evidence_corpus_metrics'),
  ])

  if (reviewQueueResult.error) {
    loadNotes.push({ source: 'review_queue', message: reviewQueueResult.error.message })
  }
  if (freshnessResult.error) {
    loadNotes.push({ source: 'freshness_queue', message: freshnessResult.error.message })
  }
  if (credentialsResult.error) {
    loadNotes.push({ source: 'credentials', message: credentialsResult.error.message })
  }
  if (metricsResult.error) {
    loadNotes.push({ source: 'metrics', message: metricsResult.error.message })
  }

  const metricsRow = Array.isArray(metricsResult.data)
    ? (metricsResult.data[0] as Row | undefined)
    : undefined
  const metrics: ClinicalOperationsMetrics | null = metricsRow
    ? {
        publishedConditions: num(metricsRow.published_conditions),
        publishedRecords: num(metricsRow.published_records),
        underReviewRecords: num(metricsRow.under_review_records),
        staleOrReviewRequired: num(metricsRow.stale_or_review_required),
        unresolvedMaterialConflicts: num(metricsRow.unresolved_material_conflicts),
        ungradedPublishedRecords: num(metricsRow.ungraded_published_records),
        sourcesWithoutSnapshot: num(metricsRow.sources_without_snapshot),
        oldestVerifiedAt: text(metricsRow.oldest_verified_at),
        newestVerifiedAt: text(metricsRow.newest_verified_at),
      }
    : null

  return {
    reviewQueue: (reviewQueueResult.data ?? []).map((row) => mapReviewQueue(row as Row)),
    freshnessQueue: (freshnessResult.data ?? []).map((row) => mapFreshness(row as Row)),
    credentials: (credentialsResult.data ?? []).map((row) => mapCredential(row as Row)),
    metrics,
    loadNotes,
  }
}

export type ClinicalSourceInspection = {
  source: Row
  snapshots: Row[]
  extractions: Row[]
  records: Row[]
  reviews: Row[]
  conflicts: Row[]
  publicationVersions: Row[]
}

export async function loadClinicalSourceInspection(sourceId: string): Promise<ClinicalSourceInspection> {
  const supabase = await createSupabaseServiceClient()
  const sourceResult = await supabase
    .schema('public')
    .from('clinical_evidence_sources')
    .select('*')
    .eq('id', sourceId)
    .single()
  if (sourceResult.error || !sourceResult.data) throw new Error('clinical_source_not_found')

  const [snapshotsResult, extractionsResult, recordsResult] = await Promise.all([
    supabase
      .schema('public')
      .from('clinical_evidence_source_snapshots')
      .select('*')
      .eq('source_id', sourceId)
      .order('retrieved_at', { ascending: false }),
    supabase
      .schema('public')
      .from('clinical_evidence_extractions')
      .select('*')
      .eq('source_id', sourceId)
      .order('extracted_at', { ascending: false }),
    supabase
      .schema('public')
      .from('clinical_evidence_records')
      .select('*')
      .eq('primary_source_registry_id', sourceId)
      .order('updated_at', { ascending: false }),
  ])

  const recordIds = (recordsResult.data ?? []).map((row) => String((row as Row).id))
  let reviews: Row[] = []
  let conflicts: Row[] = []
  let publicationVersions: Row[] = []
  if (recordIds.length > 0) {
    const [reviewsResult, conflictAResult, conflictBResult, versionsResult] = await Promise.all([
      supabase
        .schema('public')
        .from('clinical_evidence_reviews')
        .select('*')
        .in('evidence_record_id', recordIds)
        .order('reviewed_at', { ascending: false }),
      supabase
        .schema('public')
        .from('clinical_evidence_conflicts')
        .select('*')
        .in('evidence_record_a_id', recordIds)
        .order('created_at', { ascending: false }),
      supabase
        .schema('public')
        .from('clinical_evidence_conflicts')
        .select('*')
        .in('evidence_record_b_id', recordIds)
        .order('created_at', { ascending: false }),
      supabase
        .schema('public')
        .from('clinical_evidence_publication_versions')
        .select('*')
        .in('evidence_record_id', recordIds)
        .order('recorded_at', { ascending: false }),
    ])
    reviews = (reviewsResult.data ?? []) as Row[]
    const byId = new Map<string, Row>()
    for (const row of [...(conflictAResult.data ?? []), ...(conflictBResult.data ?? [])] as Row[]) {
      byId.set(String(row.id), row)
    }
    conflicts = Array.from(byId.values())
    publicationVersions = (versionsResult.data ?? []) as Row[]
  }

  return {
    source: sourceResult.data as Row,
    snapshots: (snapshotsResult.data ?? []) as Row[],
    extractions: (extractionsResult.data ?? []) as Row[],
    records: (recordsResult.data ?? []) as Row[],
    reviews,
    conflicts,
    publicationVersions,
  }
}
