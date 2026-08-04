import { describe, expect, it } from 'vitest'
import { PAGE_SOURCE_REQUIREMENTS, getRequiredCommandCentreSourceKeys } from '@/lib/dashboard/commandCentreSourcePlan'
import { COMMAND_CENTRE_PAGE_IDS } from '@/lib/platform/commandCentreRegistry'

describe('Command Centre demand-driven source plan', () => {
  it('defines a source plan for every supported desktop page', () => {
    expect(Object.keys(PAGE_SOURCE_REQUIREMENTS).sort()).toEqual([...COMMAND_CENTRE_PAGE_IDS].sort())
  })

  it('does not load marketplace or genetics sources for settings', () => {
    const settings = getRequiredCommandCentreSourceKeys('settings')
    expect(settings.size).toBe(0)
    expect(settings.has('marketplaceRows')).toBe(false)
    expect(settings.has('cultivarPassports')).toBe(false)
  })

  it('loads only the marketplace source family for marketplace operations', () => {
    const marketplace = getRequiredCommandCentreSourceKeys('marketplace')
    expect(marketplace.has('marketplaceRows')).toBe(true)
    expect(marketplace.has('operatorLicenceMatrix')).toBe(true)
    expect(marketplace.has('dailyDigest')).toBe(false)
    expect(marketplace.has('cultivarPassports')).toBe(false)
  })

  it('loads genetics records only for the genetics page', () => {
    const genetics = getRequiredCommandCentreSourceKeys('genetics')
    expect(genetics).toEqual(new Set(['cultivarPassports', 'serviceProviders', 'collaborationProjects', 'countryIntel']))
  })
})
