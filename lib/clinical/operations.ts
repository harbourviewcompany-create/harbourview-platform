export type ClinicalIntakeStatus =
  | 'queued'
  | 'snapshot-required'
  | 'extraction-required'
  | 'provenance-review'
  | 'qualified-review'
  | 'grading-review'
  | 'conflict-review'
  | 'publication-ready'
  | 'published'
  | 'superseded'
  | 'deferred'
  | 'rejected'

export type ClinicalCoverageStatus =
  | 'source-identified'
  | 'snapshot-captured'
  | 'extracted'
  | 'reviewed'
  | 'published'
  | 'deferred'
  | 'rejected'

export type ClinicalReviewQueueRow = {
  intakeId: string
  intakeStatus: ClinicalIntakeStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  coverageStatus: ClinicalCoverageStatus
  intendedConditions: string[]
  intendedJurisdictions: string[]
  intendedPublicationScope: 'source-metadata' | 'clinical-synthesis'
  assignedUserId: string | null
  reviewDueAt: string | null
  notes: string | null
  sourceId: string
  sourceKey: string
  sourceType: string
  sourceTitle: string
  publisher: string
  sourceUrl: string
  doi: string | null
  pmid: string | null
  din: string | null
  sourceVersion: string | null
  currentness: 'current' | 'superseded' | 'withdrawn' | 'unknown'
  latestSnapshotId: string | null
  retrievedAt: string
}

export type ClinicalFreshnessQueueRow = {
  id: string
  slug: string
  title: string
  reviewStatus: 'published' | 'under-review'
  freshnessStatus: 'current' | 'stale' | 'review-required' | 'source-degraded'
  reviewDueAt: string | null
  sourceCurrentnessCheckedAt: string | null
  freshnessReason: string | null
  sourceKey: string | null
  sourceCurrentness: string | null
  sourceUrl: string | null
}

export type ClinicalReviewerCredentialRow = {
  id: string
  userId: string
  profession: 'clinician' | 'pharmacist'
  jurisdiction: string
  credentialReference: string
  verificationSourceUrl: string
  verificationStatus: 'pending' | 'verified' | 'expired' | 'revoked' | 'rejected'
  verifiedByUserId: string | null
  verifiedAt: string | null
  validFrom: string | null
  validUntil: string | null
}

export type ClinicalOperationsMetrics = {
  publishedConditions: number
  publishedRecords: number
  underReviewRecords: number
  staleOrReviewRequired: number
  unresolvedMaterialConflicts: number
  ungradedPublishedRecords: number
  sourcesWithoutSnapshot: number
  oldestVerifiedAt: string | null
  newestVerifiedAt: string | null
}

export type ClinicalOperationsDashboard = {
  reviewQueue: ClinicalReviewQueueRow[]
  freshnessQueue: ClinicalFreshnessQueueRow[]
  credentials: ClinicalReviewerCredentialRow[]
  metrics: ClinicalOperationsMetrics | null
}
