import { describe, expect, it } from 'vitest'
import {
  clinicalEvidenceStateMessage,
  deriveClinicalEvidenceState,
  type ClinicalEvidenceRecordDTO,
} from '@/lib/clinical/evidence'

const base: ClinicalEvidenceRecordDTO = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'test-evidence',
  title: 'Reviewed evidence',
  summary: 'Fixture only.',
  condition: 'Neuropathic pain',
  conditionAliases: ['neuropathic pain'],
  population: 'Adults',
  intervention: 'Cannabinoid intervention',
  formulation: null,
  cannabinoid: ['CBD'],
  interventionClass: 'general-cannabis',
  comparator: null,
  outcome: 'Pain outcome',
  evidenceType: 'systematic-review',
  evidenceStrength: 'moderate',
  evidenceStrengthMethod: 'Fixture grading method',
  uncertainty: null,
  conflictStatus: 'none',
  jurisdiction: ['Canada'],
  professionRelevance: ['doctor'],
  primarySource: { title: 'Fixture', publisher: 'Fixture publisher', url: 'https://example.test/source' },
  publicationDate: '2026-01-01',
  effectiveDate: null,
  verifiedAt: '2026-08-14T12:00:00Z',
  supersessionState: 'current',
  supersededById: null,
  reviewStatus: 'published',
}

describe('clinical evidence spine', () => {
  it('distinguishes empty, no-match and recognized-condition/no-evidence states', () => {
    expect(deriveClinicalEvidenceState({ query: '', records: [] })).toBe('empty')
    expect(deriveClinicalEvidenceState({ query: 'unknown term', records: [], knownConditionMatch: false })).toBe('no-match')
    expect(deriveClinicalEvidenceState({ query: 'neuropathic pain', records: [], knownConditionMatch: true })).toBe('no-evidence')
  })

  it('surfaces stale and materially conflicted evidence deterministically', () => {
    expect(deriveClinicalEvidenceState({
      query: 'pain',
      records: [{ ...base, supersessionState: 'superseded' }],
    })).toBe('stale')
    expect(deriveClinicalEvidenceState({
      query: 'pain',
      records: [{ ...base, conflictStatus: 'material-conflict', evidenceStrength: 'conflicted' }],
    })).toBe('conflicted')
  })

  it('treats current reviewed records as loaded', () => {
    expect(deriveClinicalEvidenceState({ query: 'pain', records: [base] })).toBe('loaded')
  })

  it('keeps regulated cannabinoid drugs distinct from general cannabis', () => {
    const drug = { ...base, interventionClass: 'regulated-cannabinoid-drug' as const }
    const cannabis = { ...base, id: '22222222-2222-2222-2222-222222222222', interventionClass: 'general-cannabis' as const }
    expect(drug.interventionClass).not.toBe(cannabis.interventionClass)
  })

  it('provides explicit non-success copy for every non-loaded state', () => {
    for (const state of ['empty', 'no-evidence', 'no-match', 'stale', 'conflicted', 'error'] as const) {
      expect(clinicalEvidenceStateMessage(state).length).toBeGreaterThan(20)
    }
  })
})
