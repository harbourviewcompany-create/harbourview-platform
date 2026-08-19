import { describe, expect, it } from 'vitest'
import { deriveRegulatoryTier } from '@/lib/globe/derive-regulatory-tier'

describe('deriveRegulatoryTier (import-aware full-prose classifier)', () => {
  it('returns null for empty briefing text', () => {
    expect(deriveRegulatoryTier('')).toBeNull()
    expect(deriveRegulatoryTier(null)).toBeNull()
    expect(deriveRegulatoryTier(undefined)).toBeNull()
  })

  it('promotes licensed medical import markets to legal_commercial_access (Germany-style)', () => {
    const de =
      'Adult-use social club framework (CanG 2024) | Europe\'s largest medical import market with licensed importers.'
    expect(deriveRegulatoryTier(de)).toBe('legal_commercial_access')
  })

  it('promotes affirmative export industry language to legal_commercial_access', () => {
    expect(deriveRegulatoryTier('Medical Legal - Export Industry Leader')).toBe(
      'legal_commercial_access',
    )
    expect(deriveRegulatoryTier('Licensed Export Industry')).toBe('legal_commercial_access')
  })

  it('keeps established medical access when trade licensing alone is under discussion', () => {
    expect(deriveRegulatoryTier('Medical legal; export licensing under discussion')).toBe(
      'medical_limited_trade',
    )
    expect(deriveRegulatoryTier('Medical legal | import licensing under review')).toBe(
      'medical_limited_trade',
    )
  })

  it('does not treat explicitly negated export language as commercial access', () => {
    const samples = [
      'Medical legal; prescription programme; no licensed export industry',
      'Medical legal | no export industry',
      'Medical legal; without export permit',
      'Medical legal; not an export industry',
      'Medical legal; no longer has an export industry',
      'Medical legal; does not have an export industry',
    ]

    for (const sample of samples) {
      expect(deriveRegulatoryTier(sample), sample).toBe('medical_limited_trade')
    }
  })

  it('does not treat explicitly negated import language as commercial access', () => {
    const samples = [
      'Medical legal | no licensed importers',
      'Medical legal; no commercial import pathway',
      'Medical legal; without import permit',
      'Medical legal; not an import market',
      'Medical legal; no longer has an import market',
      'Medical legal; does not operate an import market',
    ]

    for (const sample of samples) {
      expect(deriveRegulatoryTier(sample), sample).toBe('medical_limited_trade')
    }
  })

  it('treats full-prose field separators as clause boundaries', () => {
    expect(
      deriveRegulatoryTier(
        'Medical legal; no licensed export industry | Licensed export permit now active',
      ),
    ).toBe('legal_commercial_access')
    expect(
      deriveRegulatoryTier(
        'Medical legal; no commercial import pathway | Licensed importers operate under active permits',
      ),
    ).toBe('legal_commercial_access')
  })

  it('allows a current affirmative trade clause after historical negative language', () => {
    const samples = [
      'Medical legal; no export industry historically; licensed export permit now active',
      'Medical legal; no export industry historically but licensed export permit now active',
      'Medical legal; no export industry historically and licensed export permit now active',
      'Medical legal; no licensed export industry; licensed importers operate under active permits',
    ]

    for (const sample of samples) {
      expect(deriveRegulatoryTier(sample), sample).toBe('legal_commercial_access')
    }
  })

  it('does not mistake future medical legalization wording for established medical access', () => {
    expect(deriveRegulatoryTier('Medical legalization under discussion')).toBe('prohibited')
    expect(deriveRegulatoryTier('Medical legalisation remains under review')).toBe('prohibited')
  })

  it('classifies pure adult-use / social clubs without commercial trade as domestic_only', () => {
    expect(deriveRegulatoryTier('Personal cultivation legal since 2021; social clubs')).toBe(
      'domestic_only',
    )
    expect(deriveRegulatoryTier('Home cultivation legal; no commercial market')).toBe(
      'domestic_only',
    )
  })

  it('classifies medical-only regimes without import/export as medical_limited_trade (Brazil-style)', () => {
    expect(
      deriveRegulatoryTier('Medical legal; prescription programme; no licensed export industry'),
    ).toBe('medical_limited_trade')
  })

  it('upgrades medical + commercial import pathway to legal_commercial_access', () => {
    expect(
      deriveRegulatoryTier(
        'Medical legal | licensed import pathway for pharmaceutical cannabis products',
      ),
    ).toBe('legal_commercial_access')
  })

  it('classifies federal adult-use as legal_commercial_access', () => {
    expect(deriveRegulatoryTier('Adult-use legal — federal; licensed producers')).toBe(
      'legal_commercial_access',
    )
  })

  it('classifies prohibited + licensed hemp as cbd_hemp_only', () => {
    expect(
      deriveRegulatoryTier('Cannabis prohibited; industrial hemp cultivation licensed'),
    ).toBe('cbd_hemp_only')
  })

  it('defaults unambiguous prohibition to prohibited', () => {
    expect(deriveRegulatoryTier('Strict prohibition; no lawful commercial pathway')).toBe(
      'prohibited',
    )
  })
})
