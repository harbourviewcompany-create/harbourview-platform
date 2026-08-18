import { describe, expect, it } from 'vitest'
import {
  buildAskClinicalResponse,
  derivePrescriberReadiness,
  isInspectableClinicalSource,
  normaliseClinicalConceptTerm,
} from '@/lib/clinical/prescriber'
import type { ClinicalEvidenceRecordDTO } from '@/lib/clinical/evidence'

function evidence(overrides: Partial<ClinicalEvidenceRecordDTO> = {}): ClinicalEvidenceRecordDTO {
  return {
    id: 'ev-1',
    slug: 'ev-1',
    title: 'Governed evidence',
    summary: 'Reviewed summary.',
    condition: 'Dravet syndrome',
    conditionAliases: ['Dravet'],
    population: 'paediatric',
    intervention: 'cannabidiol',
    formulation: 'oral solution',
    cannabinoid: ['CBD'],
    interventionClass: 'regulated-cannabinoid-drug',
    comparator: 'placebo',
    outcome: 'seizure frequency',
    evidenceType: 'guideline',
    evidenceStrength: 'moderate',
    evidenceStrengthMethod: 'source-specific',
    uncertainty: null,
    conflictStatus: 'none',
    jurisdiction: ['GB'],
    professionRelevance: ['physician'],
    primarySource: {
      title: 'Specific authoritative source',
      publisher: 'Authority',
      url: 'https://example.org/guidance/record-1',
      sourceId: 'record-1',
    },
    publicationDate: '2026-01-01',
    effectiveDate: '2026-01-01',
    verifiedAt: '2026-08-18T00:00:00Z',
    supersessionState: 'current',
    supersededById: null,
    reviewStatus: 'published',
    sourceRegistryId: 'src-1',
    gradingMethodKey: 'source-specific',
    publicationScope: 'clinical-synthesis',
    freshnessStatus: 'current',
    reviewDueAt: null,
    sourceCurrentnessCheckedAt: '2026-08-18T00:00:00Z',
    freshnessReason: null,
    ...overrides,
  }
}

describe('Prescriber Operating System contracts', () => {
  it('normalises clinical concepts without turning aliases into independent claims', () => {
    expect(normaliseClinicalConceptTerm('  Dravet   Syndrome  ')).toBe('dravet syndrome')
    expect(normaliseClinicalConceptTerm('THC:CBD — 1:1')).toBe('thc:cbd - 1:1')
  })

  it('fails generic landing-page provenance closed', () => {
    expect(isInspectableClinicalSource('https://pubmed.ncbi.nlm.nih.gov/')).toBe(false)
    expect(isInspectableClinicalSource('https://www.gov.br/anvisa')).toBe(false)
    expect(isInspectableClinicalSource('http://example.org/study')).toBe(false)
    expect(isInspectableClinicalSource('https://www.ema.europa.eu/en/medicines/human/EPAR/epidyolex')).toBe(true)
  })

  it('does not build Ask Clinical answers from unreviewed, superseded or generic-source records', () => {
    const result = buildAskClinicalResponse('What is the evidence?', [
      evidence({ reviewStatus: 'under-review' }),
      evidence({ id: 'ev-2', supersessionState: 'superseded' }),
      evidence({ id: 'ev-3', primarySource: { title: 'Search', publisher: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/', sourceId: null } }),
    ])
    expect(result.state).toBe('review-required')
    expect(result.citations).toHaveLength(0)
    expect(result.answer).toContain('none meet')
  })

  it('returns exact inspectable source citations rather than an opaque generated answer', () => {
    const result = buildAskClinicalResponse('Dravet evidence', [evidence()])
    expect(result.state).toBe('loaded')
    expect(result.citations).toHaveLength(1)
    expect(result.citations[0]?.sourceUrl).toBe('https://example.org/guidance/record-1')
    expect(result.answer).toBe('Reviewed summary.')
  })

  it('surfaces conflicts and stale sources explicitly', () => {
    expect(buildAskClinicalResponse('Question', [evidence({ conflictStatus: 'conflicted' })]).state).toBe('conflicting')
    expect(buildAskClinicalResponse('Question', [evidence({ freshnessStatus: 'stale' })]).state).toBe('stale')
  })

  it('never treats incomplete patient context as ready', () => {
    const readiness = derivePrescriberReadiness({
      hasClinicalContext: false,
      hasInspectableEvidence: true,
      authorityKnown: false,
      authorityAllowsAction: false,
      productResolved: false,
      unresolvedMajorSafetyItems: 0,
      monitoringDefined: false,
      consentConfirmed: false,
    })
    expect(readiness.state).not.toBe('ready-for-clinician-review')
    expect(readiness.dimensions.find((row) => row.key === 'consent')?.state).toBe('blocked')
    expect(readiness.dimensions.find((row) => row.key === 'authority')?.state).toBe('unknown')
  })

  it('blocks readiness when a material safety item remains unresolved', () => {
    const readiness = derivePrescriberReadiness({
      hasClinicalContext: true,
      hasInspectableEvidence: true,
      authorityKnown: true,
      authorityAllowsAction: true,
      productResolved: true,
      unresolvedMajorSafetyItems: 1,
      monitoringDefined: true,
      consentConfirmed: true,
    })
    expect(readiness.state).toBe('blocked')
    expect(readiness.dimensions.find((row) => row.key === 'safety')?.state).toBe('blocked')
  })
})
