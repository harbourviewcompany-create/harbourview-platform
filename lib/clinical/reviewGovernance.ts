/**
 * Clinical publication-gate vocabularies and request contracts.
 *
 * Control document: docs/control/CLINICAL_PUBLICATION_GATE_20260819.md
 *
 * The database enforces the gate; this module exists so the application speaks
 * the same vocabulary as `clinical_require_publication_review()` and
 * `clinical_require_credentialed_qualified_review()` rather than re-deriving it.
 * Every value below is taken from a live CHECK constraint or trigger predicate.
 */

import { z } from 'zod'

/** `clinical_evidence_reviews.review_type` CHECK. */
export const CLINICAL_REVIEW_TYPES = ['provenance', 'clinical', 'methodology'] as const
export type ClinicalReviewType = (typeof CLINICAL_REVIEW_TYPES)[number]

/** `clinical_evidence_reviews.reviewer_type` CHECK. */
export const CLINICAL_REVIEWER_TYPES = ['system', 'analyst', 'clinician', 'pharmacist'] as const
export type ClinicalReviewerType = (typeof CLINICAL_REVIEWER_TYPES)[number]

/**
 * Reviewer types the credential trigger accepts for a qualified review.
 * Mirrors `clinical_require_credentialed_qualified_review()`.
 */
export const CLINICAL_QUALIFIED_REVIEWER_TYPES = ['clinician', 'pharmacist'] as const
export type ClinicalQualifiedReviewerType = (typeof CLINICAL_QUALIFIED_REVIEWER_TYPES)[number]

/** Review types that require a verified, credential-bound reviewer. */
export const CLINICAL_CREDENTIALED_REVIEW_TYPES = ['clinical', 'methodology'] as const

/** `clinical_evidence_reviews.decision` CHECK. */
export const CLINICAL_REVIEW_DECISIONS = ['approved', 'needs-changes', 'rejected'] as const
export type ClinicalReviewDecision = (typeof CLINICAL_REVIEW_DECISIONS)[number]

/** `clinical_reviewer_credentials.verification_status` CHECK. */
export const CLINICAL_CREDENTIAL_STATUSES = ['pending', 'verified', 'expired', 'revoked', 'rejected'] as const
export type ClinicalCredentialStatus = (typeof CLINICAL_CREDENTIAL_STATUSES)[number]

/** GRADE certainty vocabulary, shared with `clinical_evidence_records.evidence_strength`. */
export const CLINICAL_CERTAINTY = ['high', 'moderate', 'low', 'very-low', 'ungraded', 'conflicted'] as const
export type ClinicalCertainty = (typeof CLINICAL_CERTAINTY)[number]

/** A GRADE assessment may only start from a rateable certainty. */
export const CLINICAL_STARTING_CERTAINTY = ['high', 'moderate', 'low', 'very-low'] as const

/** GRADE downgrade domains: risk of bias, inconsistency, indirectness, imprecision. */
export const CLINICAL_GRADE_DOMAIN_RATINGS = ['not-assessed', 'not-serious', 'serious', 'very-serious'] as const
export type ClinicalGradeDomainRating = (typeof CLINICAL_GRADE_DOMAIN_RATINGS)[number]

/** Publication bias uses its own vocabulary rather than the serious/very-serious scale. */
export const CLINICAL_PUBLICATION_BIAS_RATINGS = [
  'not-assessed',
  'undetected',
  'suspected',
  'strongly-suspected',
] as const
export type ClinicalPublicationBiasRating = (typeof CLINICAL_PUBLICATION_BIAS_RATINGS)[number]

/**
 * Certainty values that force the credentialed-clinician branch of
 * `clinical_require_publication_review()`. An `ungraded` record still needs a
 * provenance review, but not a clinician.
 */
export const CLINICAL_GRADED_CERTAINTY = ['high', 'moderate', 'low', 'very-low', 'conflicted'] as const

export function requiresQualifiedClinicalReview(input: {
  publicationScope?: string | null
  evidenceStrength?: string | null
}): boolean {
  if (input.publicationScope === 'clinical-synthesis') return true
  return CLINICAL_GRADED_CERTAINTY.includes(
    (input.evidenceStrength ?? '') as (typeof CLINICAL_GRADED_CERTAINTY)[number],
  )
}

/**
 * Pure mirror of the publication trigger, for surfacing *why* a record cannot be
 * published before anyone attempts the write. The database remains the authority —
 * this never grants publication, it only explains a refusal in advance.
 */
export type PublicationReadiness = {
  ready: boolean
  blockers: string[]
}

export function evaluatePublicationReadiness(input: {
  publicationScope?: string | null
  evidenceStrength?: string | null
  hasApprovedProvenanceReview: boolean
  hasValidCredentialedClinicalReview: boolean
}): PublicationReadiness {
  const blockers: string[] = []

  if (!input.hasApprovedProvenanceReview) {
    blockers.push('No approved provenance review is recorded for this record.')
  }

  if (requiresQualifiedClinicalReview(input) && !input.hasValidCredentialedClinicalReview) {
    blockers.push(
      'Graded certainty or clinical synthesis requires an approved review by a clinician or ' +
        'pharmacist whose credential is verified and current at the review date.',
    )
  }

  return { ready: blockers.length === 0, blockers }
}

const HttpsUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\//, 'Verification source must be an https:// URL')

/**
 * Registering a reviewer credential.
 *
 * `verification_source_url` is required even for a pending credential: the point
 * of the record is that a third party can re-check the licence against a register.
 */
export const ClinicalCredentialInputSchema = z.object({
  user_id: z.string().uuid(),
  profession: z.enum(CLINICAL_QUALIFIED_REVIEWER_TYPES),
  jurisdiction: z.string().trim().min(2).max(120),
  credential_reference: z.string().trim().min(2).max(120),
  verification_source_url: HttpsUrl,
  verification_status: z.enum(CLINICAL_CREDENTIAL_STATUSES).default('pending'),
  valid_from: z.string().date().optional().nullable(),
  valid_until: z.string().date().optional().nullable(),
})
export type ClinicalCredentialInput = z.infer<typeof ClinicalCredentialInputSchema>

/**
 * A GRADE assessment is bound to the review that produced it — the schema makes
 * `review_id` NOT NULL — so it is recorded with the review, never ahead of it.
 */
export const ClinicalGradeAssessmentInputSchema = z.object({
  grading_method_key: z.string().trim().min(2).max(80),
  starting_certainty: z.enum(CLINICAL_STARTING_CERTAINTY),
  risk_of_bias: z.enum(CLINICAL_GRADE_DOMAIN_RATINGS),
  inconsistency: z.enum(CLINICAL_GRADE_DOMAIN_RATINGS),
  indirectness: z.enum(CLINICAL_GRADE_DOMAIN_RATINGS),
  imprecision: z.enum(CLINICAL_GRADE_DOMAIN_RATINGS),
  publication_bias: z.enum(CLINICAL_PUBLICATION_BIAS_RATINGS),
  final_certainty: z.enum(CLINICAL_CERTAINTY),
  assessment_rationale: z.string().trim().min(20).max(4000),
})
export type ClinicalGradeAssessmentInput = z.infer<typeof ClinicalGradeAssessmentInputSchema>

export const ClinicalEvidenceReviewInputSchema = z
  .object({
    evidence_record_id: z.string().uuid(),
    review_type: z.enum(CLINICAL_REVIEW_TYPES),
    reviewer_type: z.enum(CLINICAL_REVIEWER_TYPES),
    reviewer_identity: z.string().trim().min(2).max(200),
    reviewer_user_id: z.string().uuid().optional().nullable(),
    reviewer_credential_id: z.string().uuid().optional().nullable(),
    decision: z.enum(CLINICAL_REVIEW_DECISIONS),
    rationale: z.string().trim().min(20).max(4000),
    reviewed_at: z.string().datetime().optional(),
    grade_assessment: ClinicalGradeAssessmentInputSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const needsCredential =
      value.decision === 'approved' &&
      (CLINICAL_CREDENTIALED_REVIEW_TYPES as readonly string[]).includes(value.review_type)

    if (!needsCredential) return

    if (!(CLINICAL_QUALIFIED_REVIEWER_TYPES as readonly string[]).includes(value.reviewer_type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewer_type'],
        message: 'An approved clinical or methodology review must be by a clinician or pharmacist.',
      })
    }
    if (!value.reviewer_user_id || !value.reviewer_credential_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewer_credential_id'],
        message: 'An approved clinical or methodology review must name a credential-bound reviewer.',
      })
    }
  })
export type ClinicalEvidenceReviewInput = z.infer<typeof ClinicalEvidenceReviewInputSchema>
