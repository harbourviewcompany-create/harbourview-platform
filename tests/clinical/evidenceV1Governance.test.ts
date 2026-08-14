import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  synthesizeClinicalEvidence,
  type ClinicalEvidenceRecordDTO,
} from '@/lib/clinical/evidence'

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260814134500_clinical_evidence_v1_governance.sql'),
  'utf8',
)

const record = (overrides: Partial<ClinicalEvidenceRecordDTO> = {}): ClinicalEvidenceRecordDTO => ({
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'fixture',
  title: 'Regulated product indication',
  summary: 'Source metadata only.',
  condition: 'Dravet syndrome',
  conditionAliases: ['DS'],
  population: 'Patients 2 years and older',
  intervention: 'Cannabidiol',
  formulation: 'Oral solution',
  cannabinoid: ['CBD'],
  interventionClass: 'regulated-cannabinoid-drug',
  comparator: null,
  outcome: 'Authorized indication metadata',
  evidenceType: 'product-monograph',
  evidenceStrength: 'ungraded',
  evidenceStrengthMethod: 'Harbourview Clinical Evidence V1',
  uncertainty: 'No independent efficacy conclusion.',
  conflictStatus: 'none',
  jurisdiction: ['Canada'],
  professionRelevance: ['doctor'],
  primarySource: { title: 'Product monograph', publisher: 'Health Canada-reviewed source', url: 'https://example.test/source' },
  publicationDate: '2024-10-30',
  effectiveDate: null,
  verifiedAt: '2026-08-14T13:45:00Z',
  supersessionState: 'current',
  supersededById: null,
  reviewStatus: 'published',
  gradingMethodKey: 'harbourview-clinical-evidence-v1',
  publicationScope: 'source-metadata',
  ...overrides,
})

describe('Clinical Evidence V1 governance', () => {
  it('defines versioned condition vocabulary and normalized source provenance', () => {
    for (const token of [
      'vocabulary_version', 'source_system', 'source_identifier', 'source_version',
      'clinical_evidence_sources', 'doi text', 'pmid text', 'din text',
      'clinical_condition_evidence_links',
    ]) expect(migration).toContain(token)
  })

  it('keeps extraction, review and contradiction work private', () => {
    for (const table of ['clinical_evidence_sources', 'clinical_evidence_extractions', 'clinical_evidence_reviews', 'clinical_evidence_conflicts']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
    }
    expect(migration).not.toContain('grant select on public.clinical_evidence_extractions to anon')
    expect(migration).not.toContain('grant select on public.clinical_evidence_reviews to anon')
    expect(migration).toContain('clinical_evidence_has_review_role')
  })

  it('requires provenance review before publication and qualified clinical review before graded synthesis', () => {
    expect(migration).toContain('clinical evidence publication requires an approved provenance review')
    expect(migration).toContain('clinical synthesis or graded certainty requires an approved clinician/pharmacist review')
    expect(migration).toContain("r.reviewer_type in ('clinician','pharmacist')")
  })

  it('stages systematic reviews as under-review rather than publishing automated efficacy claims', () => {
    expect(migration).toContain("'review-cbd-lgs-ds-tsc-2022'")
    expect(migration).toContain("'review-nabiximols-ms-spasticity-2024'")
    expect(migration).toContain("'clinical-synthesis'")
    expect(migration).toContain("'under-review'")
  })

  it('seeds only regulated-drug indication metadata as public condition evidence', () => {
    expect(migration).toContain("'ca-epidiolex-lgs-indication'")
    expect(migration).toContain("'ca-epidiolex-dravet-indication'")
    expect(migration).toContain("'ca-epidiolex-tsc-indication'")
    expect(migration).toContain("'ca-sativex-ms-spasticity-indication'")
    expect(migration).toContain("'regulated-cannabinoid-drug'")
    expect(migration).toContain('not general cannabis or cultivar evidence')
  })

  it('synthesizes counts and provenance state without inventing efficacy', () => {
    const synthesis = synthesizeClinicalEvidence([
      record(),
      record({ id: '22222222-2222-2222-2222-222222222222', interventionClass: 'general-cannabis', evidenceType: 'regulatory-guidance' }),
    ])
    expect(synthesis.recordCount).toBe(2)
    expect(synthesis.regulatedDrugRecordCount).toBe(1)
    expect(synthesis.generalCannabisRecordCount).toBe(1)
    expect(synthesis.gradedRecordCount).toBe(0)
    expect(synthesis.summary).toContain('does not infer efficacy or comparative superiority')
  })
})
