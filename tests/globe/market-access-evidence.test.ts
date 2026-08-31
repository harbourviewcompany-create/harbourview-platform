import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolvePublishedRegulatoryTier } from '@/lib/globe/supabaseGlobeData'

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
  ])('fails closed to neutral for %s', (_label, row) => {
    expect(resolvePublishedRegulatoryTier(row, now)).toBeNull()
  })

  it('keeps the legacy regex tier out of the public globe query', () => {
    const source = readFileSync('lib/globe/supabaseGlobeData.ts', 'utf8')
    const select = source.match(/\.select\(\s*'([^']+)'\s*\)/)?.[1] ?? ''
    expect(select).toContain('verified_regulatory_tier')
    expect(select.split(',').map((x) => x.trim())).not.toContain('regulatory_tier')
  })

  it('restricts parent inheritance to CA, AU and DE and explicitly excludes US', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    expect(migration).toContain("e.parent_iso2 in ('CA','AU','DE')")
    expect(migration).not.toContain("e.parent_iso2 in ('CA','AU','DE','US')")
  })

  it('contains all 51 US state/DC evidence rows exactly once', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    const matches = [...migration.matchAll(/\('US-[A-Z]{2}','(?:domestic_only|medical_limited_trade|cbd_hemp_only)'\)/g)]
    const iso = matches.map((m) => m[0].slice(2, 7))
    expect(iso).toHaveLength(51)
    expect(new Set(iso).size).toBe(51)
  })

  it('does not manufacture the two unattributed 20260830 migration bodies', () => {
    const migration = readFileSync('supabase/migrations/20260831130000_evidence_backed_market_access_authority.sql', 'utf8')
    expect(migration).not.toContain('20260830140000_full_regulatory_tier_coverage')
    expect(migration).not.toContain('20260830141000_subnational_regulatory_tier_evidence_alignment')
  })
})
