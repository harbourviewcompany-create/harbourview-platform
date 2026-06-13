import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildPublicEducationDTO, assertNoAdminEducationFields } from '@/lib/education/dto'
import { isLockedEducationModule, isPublishableEducationClaim } from '@/lib/education/review-status'
import { DEFAULT_EDUCATION_SELECTION, selectionAllowsRestrictedEducation } from '@/lib/education/country-role'
import { shouldRunEducationPlaceholderSeed } from '@/lib/education/placeholders'
import type { EducationClaimLike, EducationReviewStatus } from '@/lib/education/types'

const repoRoot = process.cwd()

const baseClaim: EducationClaimLike = {
  claim_key: 'claim.test.public-glossary',
  claim_type: 'glossary_definition',
  public_safe_summary: 'Public summary.',
  jurisdiction_scope: ['GLOBAL'],
  audience_roles: ['patient_general'],
  visibility: 'public',
  evidence_grade: 'A_primary_binding',
  review_status: 'verified_primary_source',
}

const blockedStatuses: EducationReviewStatus[] = [
  'review_pending',
  'clinical_review_required',
  'legal_review_required',
  'conflicting_sources',
  'stale_source',
  'jurisdiction_unclear',
  'do_not_publish',
]

describe('education release guardrails', () => {
  it('blocks non-publishable review states', () => {
    for (const status of blockedStatuses) {
      expect(isPublishableEducationClaim({ ...baseClaim, review_status: status }), status).toBe(false)
    }
  })

  it('keeps high-risk claim types locked unless primary/professional/peer reviewed and public', () => {
    expect(isPublishableEducationClaim({ ...baseClaim, claim_type: 'legal_regulatory', review_status: 'verified_secondary_source' })).toBe(false)
    expect(isPublishableEducationClaim({ ...baseClaim, claim_type: 'dosage_reference', review_status: 'review_pending' })).toBe(false)
    expect(isPublishableEducationClaim({ ...baseClaim, claim_type: 'medical_scientific', visibility: 'admin_only' })).toBe(false)
    expect(isPublishableEducationClaim({ ...baseClaim, claim_type: 'legal_regulatory', review_status: 'verified_primary_source' })).toBe(true)
  })

  it('strips admin-only data from public DTOs', () => {
    const dto = buildPublicEducationDTO({
      ...baseClaim,
      title: 'Public title',
      claim_text: 'private raw claim',
      admin_notes: 'private note',
      reviewer: 'operator',
      conflict_notes: 'private conflict',
      legal_risk_level: 'high',
    })
    expect(dto).toEqual({
      id: undefined,
      slug: 'claim.test.public-glossary',
      title: 'Public title',
      domain: undefined,
      public_safe_summary: 'Public summary.',
      jurisdiction_scope: ['GLOBAL'],
      audience_roles: ['patient_general'],
      visibility: 'public',
      review_status: 'published_source_backed',
      last_verified_at: null,
    })
  })

  it('throws when admin fields appear in public payloads', () => {
    expect(() => assertNoAdminEducationFields({ admin_notes: 'x' })).toThrow(/admin-only education fields/)
  })

  it('keeps locked modules and default country-role selection from unlocking restricted content', () => {
    expect(isLockedEducationModule({ claimType: 'import_export' })).toBe(true)
    expect(isLockedEducationModule({ isCountrySpecific: true })).toBe(true)
    expect(selectionAllowsRestrictedEducation(DEFAULT_EDUCATION_SELECTION)).toBe(false)
  })

  it('keeps placeholder seed disabled unless explicit gate is set', () => {
    expect(shouldRunEducationPlaceholderSeed({})).toBe(false)
    expect(shouldRunEducationPlaceholderSeed({ HARBOURVIEW_EDUCATION_SEED_PLACEHOLDERS: '1' })).toBe(true)
  })

  it('keeps education routes mounted and public route free of raw-table queries', () => {
    const publicRoute = readFileSync(join(repoRoot, 'app/education/page.tsx'), 'utf8')
    const adminRoutePath = join(repoRoot, 'app/admin/(protected)/education/page.tsx')
    expect(publicRoute).toContain('export default')
    expect(existsSync(adminRoutePath)).toBe(true)
    expect(publicRoute).not.toContain('createClient')
    expect(publicRoute).not.toContain('from(')
    expect(publicRoute).not.toContain('education_claims')
    expect(publicRoute).not.toContain('education_source_registry')
  })

  it('keeps admin education behind the existing protected admin guard', () => {
    const protectedLayout = readFileSync(join(repoRoot, 'app/admin/(protected)/layout.tsx'), 'utf8')
    const adminRoute = readFileSync(join(repoRoot, 'app/admin/(protected)/education/page.tsx'), 'utf8')
    expect(protectedLayout).toContain('await requireAdminAuth()')
    expect(adminRoute).toContain('await requireAdminAuth()')
  })
})
