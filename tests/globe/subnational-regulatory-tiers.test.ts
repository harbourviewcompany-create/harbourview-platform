import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { usStates } from '@/data/globe/us-states'
import { canadaProvinces } from '@/data/globe/canada-provinces'
import { germanyBundeslaender } from '@/data/globe/germany-bundeslaender'
import { australiaStates } from '@/data/globe/australia-states'
import {
  buildRegulatoryTierMap,
  resolveRegulatoryTierForEntry,
} from '@/data/globe/subnational-regulatory-tiers'

function geometryCodes(rows: readonly { iso2: string }[]) {
  return rows.map((row) => row.iso2).sort()
}

describe('subnational regulatory tiers', () => {
  it('keeps the complete supported geometry universe explicit', () => {
    expect(usStates).toHaveLength(51)
    expect(canadaProvinces).toHaveLength(13)
    expect(germanyBundeslaender).toHaveLength(16)
    expect(australiaStates).toHaveLength(8)

    const allCodes = geometryCodes([
      ...usStates,
      ...canadaProvinces,
      ...germanyBundeslaender,
      ...australiaStates,
    ])
    expect(allCodes).toHaveLength(88)
    expect(new Set(allCodes).size).toBe(88)
  })

  it('provides a tier for every supported rendered region and lets live rows override', () => {
    const map = buildRegulatoryTierMap([])
    const allCodes = [
      ...usStates.map((row) => row.iso2),
      ...canadaProvinces.map((row) => row.iso2),
      ...germanyBundeslaender.map((row) => row.iso2),
      ...australiaStates.map((row) => row.iso2),
    ]

    expect(Object.keys(map)).toHaveLength(88)
    for (const iso2 of allCodes) expect(map[iso2], iso2).toBeDefined()

    const liveOverride = buildRegulatoryTierMap([
      { iso2: 'US-CA', regulatoryTier: 'legal_commercial_access' },
      { iso2: 'CA-ON', regulatoryTier: null },
    ])
    expect(liveOverride['US-CA']).toBe('legal_commercial_access')
    expect(liveOverride['CA-ON']).toBe('domestic_only')
  })

  it('never inherits a missing region tier from its parent country', () => {
    expect(
      resolveRegulatoryTierForEntry('US-CA', 'US', {
        US: 'medical_limited_trade',
        'US-CA': 'domestic_only',
      }),
    ).toBe('domestic_only')

    expect(
      resolveRegulatoryTierForEntry('US-CA', 'US', {
        US: 'medical_limited_trade',
      }),
    ).toBeNull()

    expect(resolveRegulatoryTierForEntry('US-CA', 'US')).toBeNull()
  })

  it('keeps all 88 rendered geometry identifiers represented in the historical DB seed', () => {
    const migration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260820140000_seed_subnational_regulatory_tiers.sql'),
      'utf8',
    )
    const rowPattern = /\('([^']+)', '((?:US|CA|DE|AU)-[A-Z]{2,3})', '[^']+', (-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?), '([^']+)'\)/g
    const rows = Array.from(migration.matchAll(rowPattern), (match) => ({
      name: match[1],
      iso2: match[2],
      lat: Number(match[3]),
      lng: Number(match[4]),
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
    }
  })

  it('expands US, Germany, Canada and Australia by default so all 88 supported regions render globally', () => {
    const globeCanvas = readFileSync(
      join(process.cwd(), 'components/globe/r3f/GlobeCanvas.tsx'),
      'utf8',
    )

    expect(globeCanvas).toMatch(/subNationalIso2s\s*=\s*\['US',\s*'DE',\s*'CA',\s*'AU'\]/)
  })
})
