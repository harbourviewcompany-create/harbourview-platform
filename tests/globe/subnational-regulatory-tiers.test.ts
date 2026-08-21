import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { usStates } from '@/data/globe/us-states'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { germanyBundeslaender } from '@/data/globe/germany-bundeslaender'
import { australiaStates } from '@/data/globe/australia-states'
import { US_STATE_REGULATORY_TIERS } from '@/data/globe/us-state-tiers'
import { CANADA_PROVINCE_REGULATORY_TIERS } from '@/data/globe/canada-province-tiers'
import { GERMANY_STATE_REGULATORY_TIERS } from '@/data/globe/germany-state-tiers'
import { AUSTRALIA_STATE_REGULATORY_TIERS } from '@/data/globe/australia-state-tiers'
import {
  SUBNATIONAL_REGULATORY_TIER_DEFAULTS,
  buildRegulatoryTierMap,
  resolveRegulatoryTierForEntry,
} from '@/data/globe/subnational-regulatory-tiers'
import type { RegulatoryTier } from '@/lib/globe/globe-materials'

function geometryCodes(rows: readonly { iso2: string }[]) {
  return rows.map((row) => row.iso2).sort()
}

function tierCounts(map: Record<string, RegulatoryTier>) {
  return Object.values(map).reduce<Record<RegulatoryTier, number>>(
    (counts, tier) => {
      counts[tier] += 1
      return counts
    },
    {
      legal_commercial_access: 0,
      medical_limited_trade: 0,
      domestic_only: 0,
      cbd_hemp_only: 0,
      prohibited: 0,
    },
  )
}

describe('subnational regulatory tiers', () => {
  it('matches every rendered subnational geometry identifier exactly', () => {
    expect(Object.keys(US_STATE_REGULATORY_TIERS).sort()).toEqual(geometryCodes(usStates))
    expect(Object.keys(CANADA_PROVINCE_REGULATORY_TIERS).sort()).toEqual(geometryCodes(canadaProvinces))
    expect(Object.keys(GERMANY_STATE_REGULATORY_TIERS).sort()).toEqual(geometryCodes(germanyBundeslaender))
    expect(Object.keys(AUSTRALIA_STATE_REGULATORY_TIERS).sort()).toEqual(geometryCodes(australiaStates))

    expect(usStates).toHaveLength(51)
    expect(canadaProvinces).toHaveLength(13)
    expect(germanyBundeslaender).toHaveLength(16)
    expect(australiaStates).toHaveLength(8)
    expect(Object.keys(SUBNATIONAL_REGULATORY_TIER_DEFAULTS)).toHaveLength(88)
  })

  it('preserves the intended tier distribution', () => {
    expect(tierCounts(US_STATE_REGULATORY_TIERS)).toEqual({
      legal_commercial_access: 0,
      medical_limited_trade: 17,
      domestic_only: 25,
      cbd_hemp_only: 8,
      prohibited: 1,
    })
    expect(tierCounts(CANADA_PROVINCE_REGULATORY_TIERS).domestic_only).toBe(13)
    expect(tierCounts(GERMANY_STATE_REGULATORY_TIERS).domestic_only).toBe(16)
    expect(tierCounts(AUSTRALIA_STATE_REGULATORY_TIERS).medical_limited_trade).toBe(8)
  })

  it('lets live database rows override static defaults', () => {
    const map = buildRegulatoryTierMap([
      { iso2: 'US-CA', regulatoryTier: 'prohibited' },
      { iso2: 'CA-ON', regulatoryTier: 'medical_limited_trade' },
      { iso2: 'DE-BE', regulatoryTier: null },
    ])

    expect(map['US-CA']).toBe('prohibited')
    expect(map['CA-ON']).toBe('medical_limited_trade')
    expect(map['DE-BE']).toBe('domestic_only')
    expect(map['AU-NSW']).toBe('medical_limited_trade')
  })

  it('resolves a subnational tier before falling back to its parent', () => {
    expect(
      resolveRegulatoryTierForEntry('US-CA', 'US', {
        US: 'prohibited',
        'US-CA': 'domestic_only',
      }),
    ).toBe('domestic_only')

    expect(
      resolveRegulatoryTierForEntry('US-CA', 'US', {
        US: 'medical_limited_trade',
      }),
    ).toBe('medical_limited_trade')

    expect(resolveRegulatoryTierForEntry('US-CA', 'US')).toBeNull()
  })

  it('keeps migration identifiers, centroids and tiers aligned with geometry', () => {
    const migration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260820130000_seed_subnational_regulatory_tiers.sql'),
      'utf8',
    )
    const rowPattern = /\('([^']+)', '((?:US|CA|DE|AU)-[A-Z]{2,3})', '[^']+', (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), '([^']+)'\)/g
    const rows = Array.from(migration.matchAll(rowPattern), (match) => ({
      name: match[1],
      iso2: match[2],
      lat: Number(match[3]),
      lng: Number(match[4]),
      tier: match[5] as RegulatoryTier,
    }))
    const geometry = new Map(
      [...usStates, ...canadaProvinces, ...germanyBundeslaender, ...australiaStates].map((entry) => [
        entry.iso2,
        entry,
      ]),
    )

    expect(rows).toHaveLength(88)
    expect(new Set(rows.map((row) => row.iso2)).size).toBe(88)

    for (const row of rows) {
      const entry = geometry.get(row.iso2)
      expect(entry, row.iso2).toBeDefined()
      expect(row.lng, `${row.iso2} lng`).toBe(entry?.centroid[0])
      expect(row.lat, `${row.iso2} lat`).toBe(entry?.centroid[1])
      expect(row.tier, `${row.iso2} tier`).toBe(SUBNATIONAL_REGULATORY_TIER_DEFAULTS[row.iso2])
    }

    expect(migration).toMatch(/on conflict \(iso_alpha2\) do update/i)
  })
})
