import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolveGlobeRegulatoryTier, resolvePublishedRegulatoryTier } from '@/lib/globe/supabaseGlobeData'

describe('evidence-backed Market Access publication', () => {
  const now = Date.parse('2026-08-31T12:10:00Z')

  it('publishes a tier only when evidence metadata is complete and current', () => {
    expect(resolvePublishedRegulatoryTier({
      verified_regulatory_tier: 'legal_commercial_access',
      regulatory_tier_evidence_key: 'e1',
      regulatory_tier_verified_at: '2026-08-30T00:00:00Z',
      regulatory_tier_expires_at: '2027-01-01T00:00:00Z',
    }, now)).toBe('legal_commercial_access')
  })

  it.each([
    ['missing evidence key', { verified_regulatory_tier: 'legal_commercial_access', regulatory_tier_verified_at: '2026-08-30T00:00:00Z', regulatory_tier_expires_at: '2027-01-01T00:00:00Z' }],
    ['missing verification time', { verified_regulatory_tier: 'legal_commercial_access', regulatory_tier_evidence_key: 'e1', regulatory_tier_expires_at: '2027-01-01T00:00:00Z' }],
    ['expired evidence', { verified_regulatory_tier: 'legal_commercial_access', regulatory_tier_evidence_key: 'e1', regulatory_tier_verified_at: '2026-01-01T00:00:00Z', regulatory_tier_expires_at: '2026-08-31T12:09:59Z' }],
    ['future verification', { verified_regulatory_tier: 'legal_commercial_access', regulatory_tier_evidence_key: 'e1', regulatory_tier_verified_at: '2026-09-01T00:00:00Z', regulatory_tier_expires_at: '2027-01-01T00:00:00Z' }],
    ['malformed expiry', { verified_regulatory_tier: 'legal_commercial_access', regulatory_tier_evidence_key: 'e1', regulatory_tier_verified_at: '2026-08-30T00:00:00Z', regulatory_tier_expires_at: 'not-a-date' }],
    ['legacy tier survives without published evidence', { regulatory_tier: 'legal_commercial_access' }],
    ['retired publication fields are null', { verified_regulatory_tier: null, regulatory_tier_evidence_key: null, regulatory_tier_verified_at: null, regulatory_tier_expires_at: null, regulatory_tier: 'legal_commercial_access' }],
  ])('fails closed to neutral for %s', (_label, row) => {
    expect(resolvePublishedRegulatoryTier(row, now)).toBeNull()
  })

  it('uses the reviewed legacy tier only as a time-bounded coverage fallback', () => {
    expect(resolveGlobeRegulatoryTier({
      regulatory_tier: 'legal_commercial_access',
      regulatory_tier_needs_review: false,
      regulatory_tier_last_derived_at: '2026-08-30T00:00:00Z',
    }, now)).toEqual({ tier: 'legal_commercial_access', provenance: 'legacy' })
  })

  it('does not use a stale or review-flagged legacy tier as fallback', () => {
    expect(resolveGlobeRegulatoryTier({
      regulatory_tier: 'legal_commercial_access',
      regulatory_tier_needs_review: true,
      regulatory_tier_last_derived_at: '2026-08-30T00:00:00Z',
    }, now)).toEqual({ tier: null, provenance: null })
    expect(resolveGlobeRegulatoryTier({
      regulatory_tier: 'legal_commercial_access',
      regulatory_tier_needs_review: false,
      regulatory_tier_last_derived_at: '2026-01-01T00:00:00Z',
    }, now)).toEqual({ tier: null, provenance: null })
  })

  it('loads both evidence-backed publication fields and legacy coverage fields', () => {
    const source = readFileSync('lib/globe/supabaseGlobeData.ts', 'utf8')
    const select = source.match(/\.select\(\s*'([^']+)'\s*\)/)?.[1] ?? ''
    expect(select).toContain('verified_regulatory_tier')
    expect(select).toContain('regulatory_tier')
    expect(select).toContain('regulatory_tier_needs_review')
    expect(select).toContain('regulatory_tier_last_derived_at')
  })

  it('restricts parent inheritance to CA, AU and DE and explicitly excludes US', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    expect(migration).toContain("e.parent_iso2 in ('CA','AU','DE')")
    expect(migration).not.toContain("e.parent_iso2 in ('CA','AU','DE','US')")
  })

  it('contains all 51 US state/DC evidence rows exactly once', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    const matches = [...migration.matchAll(/\(\s*'(US-[A-Z]{2})'\s*,\s*'(?:domestic_only|medical_limited_trade|cbd_hemp_only)'\s*\)/g)]
    const iso = matches.map((m) => m[1])
    expect(iso).toHaveLength(51)
    expect(new Set(iso).size).toBe(51)
  })

  it('does not manufacture the two unattributed 20260830 migration bodies', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    expect(migration).not.toContain('20260830140000_full_regulatory_tier_coverage')
    expect(migration).not.toContain('20260830141000_subnational_regulatory_tier_evidence_alignment')
  })

  it('keeps retired non-primary evidence fail-closed at the publication boundary', () => {
    const source = readFileSync('lib/globe/supabaseGlobeData.ts', 'utf8')
    expect(source).toMatch(/\brow\.regulatory_tier(?!_)/)
    expect(source).toContain('if (!tier || !row.regulatory_tier_evidence_key')
    expect(source).toContain('return null')
  })
})
