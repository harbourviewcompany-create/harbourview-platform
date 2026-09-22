import { describe, expect, it } from 'vitest'
import {
  CORE_OPERATOR_DEPTH,
  PAGE_SOURCE_REQUIREMENTS,
  getRequiredCommandCentreSourceKeys,
} from '@/lib/dashboard/commandCentreSourcePlan'
import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'

describe('Command Centre demand-driven source plan', () => {
  it('defines a source plan for every supported desktop page', () => {
    expect(Object.keys(PAGE_SOURCE_REQUIREMENTS).sort()).toEqual([...COMMAND_CENTRE_PAGE_IDS].sort())
  })

  it('settings keeps a light coverage footprint', () => {
    const settings = getRequiredCommandCentreSourceKeys('settings')
    expect(settings.has('sourceCoverage')).toBe(true)
    expect(settings.has('marketplaceRows')).toBe(false)
    expect(settings.has('cultivarPassports')).toBe(false)
  })

  it('loads marketplace core without genetics bulk', () => {
    const marketplace = getRequiredCommandCentreSourceKeys('marketplace')
    expect(marketplace.has('marketplaceRows')).toBe(true)
    expect(marketplace.has('operatorLicenceMatrix')).toBe(true)
    expect(marketplace.has('dailyDigest')).toBe(false)
    expect(marketplace.has('cultivarPassports')).toBe(false)
  })

  it('loads genetics records for the genetics page', () => {
    const genetics = getRequiredCommandCentreSourceKeys('genetics')
    expect(genetics.has('cultivarPassports')).toBe(true)
    expect(genetics.has('signals')).toBe(true)
  })

  it('briefing loads pipeline, watchlist and evidence for command depth', () => {
    const briefing = getRequiredCommandCentreSourceKeys('briefing')
    for (const key of ['signals', 'pipeline', 'watchlistData', 'evidenceData', 'countryIntel', 'marketplaceRows'] as const) {
      expect(briefing.has(key)).toBe(true)
    }
  })

  it('null page uses briefing depth (default dashboard)', () => {
    const keys = getRequiredCommandCentreSourceKeys(null)
    expect(keys.has('pipeline')).toBe(true)
    expect(keys.has('watchlistData')).toBe(true)
    expect(keys.has('evidenceData')).toBe(true)
  })

  it('exports core operator depth keys', () => {
    expect(CORE_OPERATOR_DEPTH).toEqual(
      expect.arrayContaining(['signals', 'pipeline', 'watchlistData', 'evidenceData']),
    )
  })

  it('prices and trade-calc pull pipeline + marketplace depth', () => {
    expect(getRequiredCommandCentreSourceKeys('prices').has('pipeline')).toBe(true)
    expect(getRequiredCommandCentreSourceKeys('prices').has('marketplaceRows')).toBe(true)
    expect(getRequiredCommandCentreSourceKeys('trade-calc').has('pipeline')).toBe(true)
    expect(getRequiredCommandCentreSourceKeys('trade-calc').has('signals')).toBe(true)
  })
})
