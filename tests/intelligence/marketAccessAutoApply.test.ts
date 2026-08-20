import { describe, expect, it } from 'vitest'
import {
  extractMarketAccessImpactsRuleBased,
  isEligibleForMarketAccessExtraction,
  type EligibleSignal,
} from '@/lib/intelligence/marketAccessAutoApply'

function signal(partial: Partial<EligibleSignal> & { id: string }): EligibleSignal {
  return {
    quality_confidence: 0.95,
    quality_label: 'signal',
    content_type: 'regulatory',
    country_iso2: 'DE',
    reviewed: true,
    title_en: '',
    summary_en: '',
    ...partial,
  }
}

describe('isEligibleForMarketAccessExtraction', () => {
  it('rejects missing id or country', () => {
    expect(
      isEligibleForMarketAccessExtraction(
        signal({ id: '', country_iso2: 'DE' }),
      ),
    ).toBe(false)
    expect(
      isEligibleForMarketAccessExtraction(
        signal({ id: 's1', country_iso2: null }),
      ),
    ).toBe(false)
  })

  it('rejects low confidence', () => {
    expect(
      isEligibleForMarketAccessExtraction(
        signal({ id: 's1', quality_confidence: 0.5 }),
      ),
    ).toBe(false)
  })

  it('accepts high-confidence regulatory quality_label', () => {
    expect(
      isEligibleForMarketAccessExtraction(
        signal({ id: 's1', quality_label: 'regulatory', quality_confidence: 0.9 }),
      ),
    ).toBe(true)
  })

  it('accepts reviewed high-confidence without quality_label', () => {
    expect(
      isEligibleForMarketAccessExtraction(
        signal({
          id: 's1',
          quality_label: null,
          content_type: null,
          reviewed: true,
          quality_confidence: 0.9,
        }),
      ),
    ).toBe(true)
  })
})

describe('extractMarketAccessImpactsRuleBased', () => {
  it('maps export / commercial retail language to legal_commercial_access', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-export',
        title_en: 'Germany expands licensed export hub for medical cannabis',
        summary_en: 'New commercial retail pathways under Pillar 2.',
      }),
    )
    expect(impacts.some((i) => i.proposed_status === 'legal_commercial_access')).toBe(
      true,
    )
  })

  it('maps medical programme language to medical_limited_trade', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-med',
        country_iso2: 'BR',
        title_en: 'ANVISA expands medical cannabis programme access',
        summary_en: 'Prescription pathway widened for patients.',
      }),
    )
    expect(impacts.some((i) => i.proposed_status === 'medical_limited_trade')).toBe(
      true,
    )
  })

  it('maps adult-use / social clubs to domestic_only', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-au',
        title_en: 'Adult-use social clubs and home cultivation legalised',
        summary_en: 'Personal cultivation and possession legal under new act.',
      }),
    )
    expect(impacts.some((i) => i.proposed_status === 'domestic_only')).toBe(true)
  })

  it('maps ban language to prohibited', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-ban',
        title_en: 'Government bans cannabis and THC products',
        summary_en: 'Marijuana prohibited under new schedule.',
      }),
    )
    expect(impacts.some((i) => i.proposed_status === 'prohibited')).toBe(true)
  })

  it('does not treat under-consideration medical reform as expansion', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-maybe',
        title_en: 'Medical cannabis reform under consideration',
        summary_en: 'No medical programme yet; under consideration only.',
      }),
    )
    expect(impacts.some((i) => i.proposed_status === 'medical_limited_trade')).toBe(
      false,
    )
  })

  it('returns empty for ineligible signals', () => {
    expect(
      extractMarketAccessImpactsRuleBased(
        signal({ id: 's-low', quality_confidence: 0.2 }),
      ),
    ).toEqual([])
  })

  it('damps confidence by signal quality_confidence', () => {
    const impacts = extractMarketAccessImpactsRuleBased(
      signal({
        id: 's-damp',
        quality_confidence: 0.9,
        title_en: 'Licensed export industry expands',
      }),
    )
    expect(impacts.length).toBeGreaterThan(0)
    for (const i of impacts) {
      expect(i.confidence).toBeLessThanOrEqual(0.99)
      expect(i.confidence).toBeGreaterThan(0.7)
    }
  })
})
