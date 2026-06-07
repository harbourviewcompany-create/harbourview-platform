import type { ClaimReviewStatus, ClaimStatus, GeneticsEvidenceItemRow } from './types'

export const restrictedClaimTerms = [
  'verified genetics',
  'pathogen-free',
  'pathogen free',
  'true-to-type',
  'true to type',
  'ip-protected',
  'ip protected',
  'patent-protected',
  'patent protected',
  'pbr-protected',
  'pbr protected',
  'export-ready',
  'export ready',
  'import-ready',
  'import ready',
  'gmp-ready',
  'gmp ready',
  'gacp-ready',
  'gacp ready',
  'medical-grade',
  'medical grade',
  'pharmaceutical-grade',
  'pharmaceutical grade',
  'stable',
  'uniform',
  'exclusive',
  'licensed',
  'disease-resistant',
  'disease resistant',
  'high-yield',
  'high yield',
]

const reviewedStatuses: ClaimReviewStatus[] = ['approved_public', 'approved_private_only']
const publicClaimStatuses: ClaimStatus[] = ['externally_verified', 'admin_reviewed']

export function containsRestrictedClaim(value: string | null | undefined) {
  const normalized = value?.toLowerCase() ?? ''
  return restrictedClaimTerms.some((term) => normalized.includes(term))
}

export function hasReviewedEvidenceForPublicClaim(evidence: Pick<GeneticsEvidenceItemRow, 'source_label' | 'source_date' | 'jurisdiction_label' | 'review_status' | 'visibility'> | undefined) {
  return Boolean(
    evidence?.source_label &&
      evidence.source_date &&
      evidence.jurisdiction_label &&
      evidence.visibility === 'public_summary' &&
      reviewedStatuses.includes(evidence.review_status),
  )
}

export function sanitizeRestrictedClaimText(value: string | null | undefined, evidence?: Pick<GeneticsEvidenceItemRow, 'source_label' | 'source_date' | 'jurisdiction_label' | 'review_status' | 'visibility'>) {
  if (!value) return value ?? null
  if (!containsRestrictedClaim(value) || hasReviewedEvidenceForPublicClaim(evidence)) return value
  return value
    .replace(/verified genetics/gi, 'claimed genetics')
    .replace(/pathogen[- ]free/gi, 'pathogen status not publicly assessed')
    .replace(/true[- ]to[- ]type/gi, 'identity not publicly assessed')
    .replace(/(?:ip|patent|pbr)[- ]protected/gi, 'rights status not publicly assessed')
    .replace(/export[- ]ready/gi, 'export pathway not assessed')
    .replace(/import[- ]ready/gi, 'import pathway not assessed')
    .replace(/gmp[- ]ready/gi, 'GMP status not assessed')
    .replace(/gacp[- ]ready/gi, 'GACP status not assessed')
    .replace(/medical[- ]grade/gi, 'medical status not assessed')
    .replace(/pharmaceutical[- ]grade/gi, 'pharmaceutical status not assessed')
    .replace(/stable/gi, 'stability not publicly assessed')
    .replace(/uniform/gi, 'uniformity not publicly assessed')
    .replace(/exclusive/gi, 'availability subject to review')
    .replace(/licensed/gi, 'licence status subject to review')
    .replace(/disease[- ]resistant/gi, 'disease-resistance not publicly assessed')
    .replace(/high[- ]yield/gi, 'yield not publicly assessed')
}

export function publicClaimStatusFor(status: ClaimStatus, reviewStatus: ClaimReviewStatus, hasEvidence: boolean): ClaimStatus {
  if (publicClaimStatuses.includes(status) && reviewedStatuses.includes(reviewStatus) && hasEvidence) return status
  if (status === 'evidence_provided' && hasEvidence) return 'evidence_provided'
  if (status === 'claimed') return 'claimed'
  return 'not_assessed'
}
