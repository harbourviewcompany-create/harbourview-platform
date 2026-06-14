import type { EducationClaimLike } from './types'

export const EDUCATION_PLACEHOLDER_SEED_ENV = 'HARBOURVIEW_EDUCATION_SEED_PLACEHOLDERS'

export const EDUCATION_PLACEHOLDER_TOPICS = [
  'medical-cannabis-basics',
  'product-forms',
  'doctor-prescribing-workflow',
  'pharmacist-dispensing-counseling',
  'quality-gmp-gacp-gdp',
  'import-export-readiness',
  'supplier-readiness',
  'buyer-importer-education',
] as const

export const EDUCATION_PLACEHOLDER_CLAIMS: EducationClaimLike[] = [
  {
    claim_key: 'claim.placeholder.access.country-specific',
    claim_type: 'legal_regulatory',
    public_safe_summary: 'Country-specific access education remains review-gated until official source extraction is complete.',
    jurisdiction_scope: ['GLOBAL'],
    audience_roles: ['patient_general', 'doctor', 'pharmacist', 'clinic'],
    visibility: 'admin_only',
    evidence_grade: 'X_conflict_or_unverified',
    review_status: 'review_pending',
  },
  {
    claim_key: 'claim.placeholder.reference.professional-only',
    claim_type: 'dosage_reference',
    public_safe_summary: 'Harbourview does not publish personalized dosing instructions.',
    jurisdiction_scope: ['GLOBAL'],
    audience_roles: ['doctor', 'pharmacist'],
    visibility: 'admin_only',
    evidence_grade: 'X_conflict_or_unverified',
    review_status: 'clinical_review_required',
  },
  {
    claim_key: 'claim.placeholder.quality.gmp-gacp-gdp',
    claim_type: 'quality_manufacturing',
    public_safe_summary: 'Quality education requires recognized source support before publication.',
    jurisdiction_scope: ['GLOBAL'],
    audience_roles: ['supplier', 'buyer_importer', 'licensed_producer', 'distributor', 'lab'],
    visibility: 'admin_only',
    evidence_grade: 'X_conflict_or_unverified',
    review_status: 'review_pending',
  },
]

export function shouldRunEducationPlaceholderSeed(env: Record<string, string | undefined> = process.env) {
  return env[EDUCATION_PLACEHOLDER_SEED_ENV] === '1'
}
