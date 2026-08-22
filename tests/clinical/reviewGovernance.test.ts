import { describe, expect, it } from 'vitest'
import {
  CLINICAL_GRADE_DOMAIN_RATINGS,
  CLINICAL_PUBLICATION_BIAS_RATINGS,
  CLINICAL_QUALIFIED_REVIEWER_TYPES,
  CLINICAL_REVIEWER_TYPES,
  CLINICAL_REVIEW_TYPES,
  ClinicalCredentialInputSchema,
  ClinicalEvidenceReviewInputSchema,
  evaluatePublicationReadiness,
  requiresQualifiedClinicalReview,
} from '@/lib/clinical/reviewGovernance'

const baseReview = {
  evidence_record_id: '00000000-0000-4000-8000-000000000001',
  reviewer_identity: 'Registrant of record',
  rationale: 'Checked the cited monograph against the published register entry line by line.',
}

describe('clinical publication-gate vocabularies', () => {
  it('mirrors the database CHECK vocabularies exactly', () => {
    expect([...CLINICAL_REVIEW_TYPES]).toEqual(['provenance', 'clinical', 'methodology'])
    expect([...CLINICAL_REVIEWER_TYPES]).toEqual(['system', 'analyst', 'clinician', 'pharmacist'])
    expect([...CLINICAL_QUALIFIED_REVIEWER_TYPES]).toEqual(['clinician', 'pharmacist'])
  })

  it('keeps publication bias on its own scale, not the serious/very-serious one', () => {
    expect([...CLINICAL_PUBLICATION_BIAS_RATINGS]).toEqual([
      'not-assessed',
      'undetected',
      'suspected',
      'strongly-suspected',
    ])
    expect(CLINICAL_PUBLICATION_BIAS_RATINGS).not.toContain('very-serious')
    expect(CLINICAL_GRADE_DOMAIN_RATINGS).toContain('very-serious')
  })
})

describe('requiresQualifiedClinicalReview', () => {
  it('requires a clinician for every graded certainty and for clinical synthesis', () => {
    for (const evidenceStrength of ['high', 'moderate', 'low', 'very-low', 'conflicted']) {
      expect(requiresQualifiedClinicalReview({ evidenceStrength })).toBe(true)
    }
    expect(requiresQualifiedClinicalReview({ publicationScope: 'clinical-synthesis' })).toBe(true)
  })

  it('does not require one for an ungraded source-metadata record', () => {
    expect(
      requiresQualifiedClinicalReview({ publicationScope: 'source-metadata', evidenceStrength: 'ungraded' }),
    ).toBe(false)
    expect(requiresQualifiedClinicalReview({})).toBe(false)
  })
})

describe('evaluatePublicationReadiness', () => {
  it('blocks a graded record that has neither review, naming both gates', () => {
    const result = evaluatePublicationReadiness({
      evidenceStrength: 'high',
      hasApprovedProvenanceReview: false,
      hasValidCredentialedClinicalReview: false,
    })
    expect(result.ready).toBe(false)
    expect(result.blockers).toHaveLength(2)
    expect(result.blockers[0]).toContain('provenance')
  })

  it('still blocks a graded record that only has provenance', () => {
    const result = evaluatePublicationReadiness({
      evidenceStrength: 'moderate',
      hasApprovedProvenanceReview: true,
      hasValidCredentialedClinicalReview: false,
    })
    expect(result.ready).toBe(false)
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0]).toContain('clinician or pharmacist')
  })

  it('clears an ungraded record on provenance alone', () => {
    expect(
      evaluatePublicationReadiness({
        evidenceStrength: 'ungraded',
        publicationScope: 'source-metadata',
        hasApprovedProvenanceReview: true,
        hasValidCredentialedClinicalReview: false,
      }).ready,
    ).toBe(true)
  })

  it('clears a graded record once both gates are satisfied', () => {
    expect(
      evaluatePublicationReadiness({
        evidenceStrength: 'high',
        hasApprovedProvenanceReview: true,
        hasValidCredentialedClinicalReview: true,
      }),
    ).toEqual({ ready: true, blockers: [] })
  })
})

describe('ClinicalEvidenceReviewInputSchema', () => {
  it('rejects an approved clinical review with no credential binding', () => {
    const result = ClinicalEvidenceReviewInputSchema.safeParse({
      ...baseReview,
      review_type: 'clinical',
      reviewer_type: 'clinician',
      decision: 'approved',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an approved clinical review by an analyst', () => {
    const result = ClinicalEvidenceReviewInputSchema.safeParse({
      ...baseReview,
      review_type: 'clinical',
      reviewer_type: 'analyst',
      decision: 'approved',
      reviewer_user_id: '00000000-0000-4000-8000-000000000002',
      reviewer_credential_id: '00000000-0000-4000-8000-000000000003',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a provenance review with no credential — the trigger does not require one', () => {
    const result = ClinicalEvidenceReviewInputSchema.safeParse({
      ...baseReview,
      review_type: 'provenance',
      reviewer_type: 'analyst',
      decision: 'approved',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a credential-bound clinical approval', () => {
    const result = ClinicalEvidenceReviewInputSchema.safeParse({
      ...baseReview,
      review_type: 'clinical',
      reviewer_type: 'pharmacist',
      decision: 'approved',
      reviewer_user_id: '00000000-0000-4000-8000-000000000002',
      reviewer_credential_id: '00000000-0000-4000-8000-000000000003',
    })
    expect(result.success).toBe(true)
  })

  it('requires a substantive rationale rather than a rubber stamp', () => {
    const result = ClinicalEvidenceReviewInputSchema.safeParse({
      ...baseReview,
      rationale: 'ok',
      review_type: 'provenance',
      reviewer_type: 'analyst',
      decision: 'approved',
    })
    expect(result.success).toBe(false)
  })
})

describe('ClinicalCredentialInputSchema', () => {
  const base = {
    user_id: '00000000-0000-4000-8000-000000000002',
    profession: 'clinician' as const,
    jurisdiction: 'Canada',
    credential_reference: 'CPSO-123456',
  }

  it('requires an https verification source a third party can re-check', () => {
    expect(
      ClinicalCredentialInputSchema.safeParse({
        ...base,
        verification_source_url: 'http://register.example.org/123456',
      }).success,
    ).toBe(false)
    expect(
      ClinicalCredentialInputSchema.safeParse({
        ...base,
        verification_source_url: 'https://register.example.org/123456',
      }).success,
    ).toBe(true)
  })

  it('defaults a new credential to pending rather than verified', () => {
    const parsed = ClinicalCredentialInputSchema.parse({
      ...base,
      verification_source_url: 'https://register.example.org/123456',
    })
    expect(parsed.verification_status).toBe('pending')
  })

  it('refuses a profession the credential validator would never match', () => {
    expect(
      ClinicalCredentialInputSchema.safeParse({
        ...base,
        profession: 'analyst',
        verification_source_url: 'https://register.example.org/123456',
      }).success,
    ).toBe(false)
  })
})
