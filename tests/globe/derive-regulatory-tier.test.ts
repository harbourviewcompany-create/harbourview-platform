import { describe, expect, it } from 'vitest'
import { deriveRegulatoryTier } from '@/lib/globe/derive-regulatory-tier'

describe('deriveRegulatoryTier (import-aware classifier)', () => {
  it('returns null for empty briefing text', () => {
    expect(deriveRegulatoryTier('')).toBeNull()
    expect(deriveRegulatoryTier(null)).toBeNull()
    expect(deriveRegulatoryTier(undefined)).toBeNull()
  })

  it('promotes licensed medical import markets to legal_commercial_access (Germany-style)', () => {
    const de =
      'Adult-use social club framework (CanG 2024); Europe\'s largest medical import market with licensed importers.'
    expect(deriveRegulatoryTier(de)).toBe('legal_commercial_access')
  })

  it('promotes export industry language to legal_commercial_access', () => {
    expect(deriveRegulatoryTier('Medical Legal - Export Industry Leader')).toBe(
      'legal_commercial_access',
    )
    expect(deriveRegulatoryTier('Licensed Export Industry')).toBe('legal_commercial_access')
  })

  it('does not promote export that is only under discussion', () => {
    expect(deriveRegulatoryTier('Medical legal; export licensing under discussion')).toBe(
      'medical_limited_trade',
    )
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
        'Medical legal; licensed import pathway for pharmaceutical cannabis products',
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
