import { describe, expect, it } from 'vitest'

import {
  isDigestPresentationEligible,
  normalizeDigestDeltaMetadata,
  selectDigestPresentationCandidates,
} from '@/lib/signals/digestDelta'

describe('Daily Brief delta intelligence', () => {
  it('suppresses unchanged repeats from presentation eligibility', () => {
    expect(isDigestPresentationEligible('unchanged_duplicate')).toBe(false)
  })

  it('allows genuinely new events', () => {
    expect(isDigestPresentationEligible('new_event')).toBe(true)
  })

  it('allows material advancements and preserves prior lineage', () => {
    const metadata = normalizeDigestDeltaMetadata({
      event_key: 'aurora-curaleaf-2026',
      prior_event_key: 'aurora-curaleaf-offer',
      delta_status: 'material_advancement',
      advancement_reason: 'The proposal advanced to a signed definitive agreement.',
      market: 'Canada',
      entities: ['Curaleaf', 'Aurora Cannabis'],
      priority_domain: 'm_and_a',
      verified_facts: ['A definitive agreement was announced.'],
      inferences: ['International medical distribution becomes more concentrated.'],
      competitive_position_change: true,
      competitive_position_detail: 'Curaleaf would gain Aurora international medical infrastructure.',
    })

    expect(metadata.deltaStatus).toBe('material_advancement')
    expect(metadata.priorEventKey).toBe('aurora-curaleaf-offer')
    expect(metadata.advancementReason).toMatch(/definitive agreement/i)
    expect(metadata.competitivePositionChange).toBe(true)
  })

  it('fails closed on unknown delta and priority-domain values', () => {
    const metadata = normalizeDigestDeltaMetadata({
      delta_status: 'probably_new',
      priority_domain: 'marketing',
      verified_facts: 'not-an-array',
      inferences: null,
    })

    expect(metadata.deltaStatus).toBeNull()
    expect(metadata.priorityDomain).toBe('other')
    expect(metadata.verifiedFacts).toEqual([])
    expect(metadata.inferences).toEqual([])
    expect(isDigestPresentationEligible(metadata.deltaStatus)).toBe(false)
  })

  it('keeps verified facts and inferences structurally separate', () => {
    const metadata = normalizeDigestDeltaMetadata({
      delta_status: 'new_event',
      verified_facts: ['Licence issued', 'Effective date published'],
      inferences: ['Market entry becomes easier'],
    })

    expect(metadata.verifiedFacts).toEqual(['Licence issued', 'Effective date published'])
    expect(metadata.inferences).toEqual(['Market entry becomes easier'])
  })

  it('turns multiple articles about one advancement into one presentation record', () => {
    const selected = selectDigestPresentationCandidates([
      { signalId: 'source-a', eventKey: 'curaleaf-aurora', deltaStatus: 'material_advancement', include: true, priorityScore: 92 },
      { signalId: 'source-b', eventKey: 'curaleaf-aurora', deltaStatus: 'material_advancement', include: true, priorityScore: 87 },
      { signalId: 'new-event', eventKey: 'health-canada-permit', deltaStatus: 'new_event', include: true, priorityScore: 80 },
      { signalId: 'repeat', eventKey: 'old-event', deltaStatus: 'unchanged_duplicate', include: true, priorityScore: 100 },
    ])

    expect(selected).toHaveLength(2)
    expect(selected.map(item => item.signalId)).toEqual(['source-a', 'new-event'])
    expect(selected.some(item => item.signalId === 'repeat')).toBe(false)
  })

  it('keeps a lower-scored corroborating record as evidence rather than a second card', () => {
    const selected = selectDigestPresentationCandidates([
      { signalId: 'canonical', eventKey: 'same-real-world-event', deltaStatus: 'new_event', include: true, priorityScore: 75 },
      { signalId: 'corroboration', eventKey: 'same-real-world-event', deltaStatus: 'new_event', include: true, priorityScore: 74 },
    ])

    expect(selected).toEqual([
      { signalId: 'canonical', eventKey: 'same-real-world-event', deltaStatus: 'new_event', include: true, priorityScore: 75 },
    ])
  })
})
