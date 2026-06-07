import { describe, expect, it } from 'vitest'
import {
  hasForbiddenPublicCannabisFields,
  isPublicSafeFact,
  toPublicLegalStatusSummaryDTO,
  toPublicLicenceRegisterDTO,
  toPublicRegulatorDTO,
  type CannabisEvidenceLinkRecord,
  type CannabisJurisdictionRecord,
  type CannabisLegalRegimeRecord,
  type CannabisLicenceRegisterRecord,
  type CannabisRegulatoryAuthorityRecord,
  type CannabisSourceRecord,
} from '@/lib/intelligence/cannabisDataContract'

const jurisdiction: CannabisJurisdictionRecord = {
  id: 'jurisdiction-id',
  slug: 'fixture_jurisdiction',
  display_name: 'Fixture Jurisdiction',
  jurisdiction_type: 'sovereign_country',
  region: 'Fixture Region',
  parent: null,
}

const source: CannabisSourceRecord = {
  id: 'source-id',
  title: 'Official fixture source title',
  publisher: 'Fixture publisher',
  canonical_url: 'https://example.test/source',
  source_type: 'official_guidance',
  accessed_at: '2026-06-07T00:00:00.000Z',
  archive_path: '/internal/archive.html',
  raw_text_path: '/internal/raw.txt',
  screenshot_path: '/internal/source.png',
  pdf_path: '/internal/source.pdf',
  extraction_log: { model: 'fixture' },
  content_hash: 'secret-hash',
  notes_internal: 'internal source note',
  reviewer_notes: 'reviewer source note',
}

const evidenceLinks: CannabisEvidenceLinkRecord[] = [
  {
    subject_table: 'legal_regimes',
    subject_id: 'fact-id',
    evidence_claim_id: 'claim-id',
    source_document_id: 'source-id',
    relationship_type: 'supports',
  },
]

const legalRegime: CannabisLegalRegimeRecord = {
  id: 'fact-id',
  jurisdiction,
  plant_product_category_slug: 'medical_cannabis',
  activity: 'medical_use',
  legal_status: 'conditionally_legal',
  operational_status: 'partially_operational',
  public_summary: 'Public-safe fixture summary.',
  confidence_score: 78,
  evidence_status: 'verified',
  review_status: 'approved_public',
  exposure_level: 'public_summary_only',
  verified_at: '2026-06-07T00:00:00.000Z',
  notes_internal: 'must not leak',
  reviewer_notes: 'must not leak',
  raw_extraction_text: 'must not leak',
  unverified_lead: 'must not leak',
}

describe('cannabis data-contract public DTO boundary', () => {
  it('projects only public-safe legal summaries and excludes internal/source raw fields', () => {
    const dto = toPublicLegalStatusSummaryDTO({ regime: legalRegime, evidenceLinks, sources: [source] })

    expect(dto).not.toBeNull()
    expect(dto?.jurisdiction).toEqual({
      id: 'jurisdiction-id',
      name: 'Fixture Jurisdiction',
      slug: 'fixture_jurisdiction',
      type: 'sovereign_country',
      region: 'Fixture Region',
      parent: null,
    })
    expect(dto?.sources).toEqual([
      {
        title: 'Official fixture source title',
        publisher: 'Fixture publisher',
        canonicalUrl: 'https://example.test/source',
        sourceType: 'official_guidance',
        accessedAt: '2026-06-07T00:00:00.000Z',
      },
    ])
    expect(dto?.disclaimer).toContain('not legal, medical, treatment, compliance, import/export, prescribing, pharmacy, or licence eligibility advice')
    expect(hasForbiddenPublicCannabisFields(dto)).toBe(false)
  })

  it('rejects restricted, admin, legal-review, do-not-publish, stale, conflicting, machine-extracted, and low-confidence facts', () => {
    for (const exposure_level of ['restricted_internal', 'admin_only', 'legal_review_required', 'do_not_publish'] as const) {
      expect(toPublicLegalStatusSummaryDTO({ regime: { ...legalRegime, exposure_level }, evidenceLinks, sources: [source] })).toBeNull()
    }

    for (const evidence_status of ['stale', 'conflicting', 'machine_extracted_unreviewed', 'legal_review_required'] as const) {
      expect(toPublicLegalStatusSummaryDTO({ regime: { ...legalRegime, evidence_status }, evidenceLinks, sources: [source] })).toBeNull()
    }

    expect(toPublicLegalStatusSummaryDTO({ regime: { ...legalRegime, confidence_score: 69 }, evidenceLinks, sources: [source] })).toBeNull()
    expect(toPublicLegalStatusSummaryDTO({ regime: { ...legalRegime, review_status: 'needs_legal_review' }, evidenceLinks, sources: [source] })).toBeNull()
  })

  it('requires source/evidence linkage and no unresolved contradiction for public-safe facts', () => {
    expect(isPublicSafeFact({ fact: legalRegime, evidenceLinks: [], sources: [source] })).toBe(false)
    expect(isPublicSafeFact({ fact: legalRegime, evidenceLinks, sources: [] })).toBe(false)
    expect(
      isPublicSafeFact({
        fact: legalRegime,
        evidenceLinks,
        sources: [source],
        contradictions: [{ subject_table: 'legal_regimes', subject_id: 'fact-id', field_name: 'legal_status', status: 'open' }],
      }),
    ).toBe(false)
  })

  it('projects regulators and licence registers without private fields; registers can exist without licensees', () => {
    const authority: CannabisRegulatoryAuthorityRecord = {
      id: 'authority-id',
      jurisdiction,
      name: 'Public regulator name',
      regulator_type: 'health_authority',
      official_url: 'https://example.test/regulator',
      notes_public: 'Public note',
      notes_internal: 'must not leak',
      private_contact_data: { email: 'private@example.test' },
      confidence_score: 91,
      evidence_status: 'verified',
      review_status: 'approved_public',
      exposure_level: 'public_safe',
      verified_at: '2026-06-07T00:00:00.000Z',
    }

    const register: CannabisLicenceRegisterRecord = {
      id: 'register-id',
      jurisdiction,
      name: 'Public register name',
      register_url: 'https://example.test/register',
      is_public: true,
      extraction_status: 'not_started',
      public_summary: 'Register availability is verified; licensee extraction is not required for register existence.',
      notes_internal: 'must not leak',
      scrape_failures: { error: 'must not leak' },
      confidence_score: 82,
      evidence_status: 'partially_verified',
      review_status: 'approved_public',
      exposure_level: 'public_summary_only',
      verified_at: '2026-06-07T00:00:00.000Z',
    }

    const regulatorDto = toPublicRegulatorDTO({ authority, evidenceLinks, sources: [source] })
    const registerDto = toPublicLicenceRegisterDTO({ register, evidenceLinks, sources: [source] })

    expect(regulatorDto?.officialUrl).toBe('https://example.test/regulator')
    expect(registerDto?.availability).toBe('verified_public_register')
    expect(hasForbiddenPublicCannabisFields(regulatorDto)).toBe(false)
    expect(hasForbiddenPublicCannabisFields(registerDto)).toBe(false)
  })
})
