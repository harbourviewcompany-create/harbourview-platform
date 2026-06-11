import type { EducationClaimLike, EducationClaimType, EducationReviewStatus } from './types'

export const PUBLISHABLE_REVIEW_STATUSES: ReadonlySet<EducationReviewStatus> = new Set([
  'verified_primary_source',
  'verified_professional_body',
  'verified_peer_reviewed',
  'verified_secondary_source',
])

export const NON_PUBLISHABLE_REVIEW_STATUSES: ReadonlySet<EducationReviewStatus> = new Set([
  'conflicting_sources',
  'stale_source',
  'jurisdiction_unclear',
  'clinical_review_required',
  'legal_review_required',
  'review_pending',
  'do_not_publish',
])

export const HIGH_RISK_CLAIM_TYPES: ReadonlySet<EducationClaimType> = new Set([
  'medical_scientific',
  'clinical_workflow',
  'dosage_reference',
  'pharmacist_workflow',
  'legal_regulatory',
  'import_export',
  'licensing',
  'professional_obligation',
])

export function isPublishableEducationClaim(claim: EducationClaimLike) {
  if (claim.visibility !== 'public') return false
  if (!PUBLISHABLE_REVIEW_STATUSES.has(claim.review_status)) return false
  if (claim.review_status === 'do_not_publish') return false
  if (claim.evidence_grade === 'X_conflict_or_unverified') return false
  if (HIGH_RISK_CLAIM_TYPES.has(claim.claim_type)) {
    return claim.review_status === 'verified_primary_source' ||
      claim.review_status === 'verified_professional_body' ||
      claim.review_status === 'verified_peer_reviewed'
  }
  return true
}

export function isLockedEducationModule(input: {
  claimType?: EducationClaimType
  reviewStatus?: EducationReviewStatus
  isCountrySpecific?: boolean
}) {
  if (input.isCountrySpecific) return true
  if (input.claimType && HIGH_RISK_CLAIM_TYPES.has(input.claimType)) return true
  if (input.reviewStatus && NON_PUBLISHABLE_REVIEW_STATUSES.has(input.reviewStatus)) return true
  return false
}
