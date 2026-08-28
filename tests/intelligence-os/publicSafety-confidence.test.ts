import { describe, it, expect } from 'vitest'
import {
  assertPublicSafe,
  FORBIDDEN_PUBLIC_FIELD_NAMES,
} from '@/lib/intelligence-os/publicSafety'
import type { PublicRegulatorySignal } from '@/lib/regulatory-signals/types'

describe('publicSafety vs public signal DTO contract', () => {
  it('does not forbid confidence_score (Pipeline B public instrument)', () => {
    expect(FORBIDDEN_PUBLIC_FIELD_NAMES).not.toContain('confidence_score')
  })

  it('still forbids legacy score and private commercial scores', () => {
    expect(FORBIDDEN_PUBLIC_FIELD_NAMES).toContain('score')
    expect(FORBIDDEN_PUBLIC_FIELD_NAMES).toContain('commercial_relevance_score')
    expect(FORBIDDEN_PUBLIC_FIELD_NAMES).toContain('compliance_risk_score')
    expect(FORBIDDEN_PUBLIC_FIELD_NAMES).toContain('quality_confidence')
  })

  it('accepts a minimal PublicRegulatorySignal with confidence_score set', () => {
    const signal: PublicRegulatorySignal = {
      id: 'sig-1',
      slug: 'sig-1',
      headline: 'Example regulatory update',
      signal_type: 'regulatory_guidance',
      confidence: 'high',
      impact_level: 'moderate',
      country_code: 'DE',
      country_name: 'Germany',
      region: 'EU',
      jurisdiction: 'Germany',
      regulator_name: 'BfArM',
      signal_date: '2026-08-01',
      source_tier: 'tier_1_official',
      source_type: 'regulator',
      canonical_source_url: 'https://example.com/notice',
      public_summary: 'Public summary of the notice.',
      public_implication: 'Operators should review import permit timing.',
      published_at: '2026-08-01',
      last_reviewed_at: '2026-08-01',
      content_type: 'regulatory',
      confidence_score: 92,
      corroboration_count: 2,
      original_language: null,
      original_language_label: null,
      translated: false,
      country_slug: 'germany',
    }

    expect(() => assertPublicSafe(signal)).not.toThrow()
  })

  it('rejects a payload that includes private_notes', () => {
    expect(() =>
      assertPublicSafe({
        id: 'x',
        headline: 'ok',
        private_notes: 'internal only',
      }),
    ).toThrow(/private_notes/)
  })

  it('rejects a payload that projects legacy score', () => {
    expect(() =>
      assertPublicSafe({
        id: 'x',
        headline: 'ok',
        score: 99,
      }),
    ).toThrow(/score/)
  })
})
