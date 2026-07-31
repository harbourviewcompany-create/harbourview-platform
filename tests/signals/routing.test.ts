import { describe, expect, it } from 'vitest'
import { roleFamilies } from '@/lib/roles/role-families'
import {
  INTERNAL_ROLE_FAMILY,
  ROUTABLE_ROLE_FAMILIES,
  ROUTING_VERSION,
  SIGNAL_ROUTING_SELECT,
  explainMatch,
  isRouted,
  matchesOperatorProfile,
  resolveRoleFamilies,
  roleFamilyLabel,
  signalCountryIso2,
  type OperatorProfile,
} from '@/lib/signals/routing'

/** A Lesotho cultivator exporting to Germany — the pilot corridor. */
const lesothoCultivator: OperatorProfile = {
  countryIso2: ['LS'],
  roleFamilies: ['cultivation_production'],
  destinationIso2: ['DE'],
}

const routed = (over: Record<string, unknown> = {}) => ({
  routing_version: ROUTING_VERSION,
  routed_at: '2026-07-31T00:00:00Z',
  ...over,
})

describe('routing vocabulary', () => {
  it('is derived from roleFamilies so the two cannot drift', () => {
    expect(ROUTABLE_ROLE_FAMILIES.length).toBe(roleFamilies.length - 1)
    for (const key of ROUTABLE_ROLE_FAMILIES) {
      expect(roleFamilies.some((family) => family.key === key)).toBe(true)
    }
  })

  it('never routes to the internal admin family', () => {
    // Routing customer signals into Harbourview's own review-queue family would
    // also offer it as a subscribable audience.
    expect(ROUTABLE_ROLE_FAMILIES).not.toContain(INTERNAL_ROLE_FAMILY)
    expect(roleFamilies.some((family) => family.key === INTERNAL_ROLE_FAMILY)).toBe(true)
  })

  it('exposes labels for the digest explanation line', () => {
    expect(roleFamilyLabel('trade_distribution')).toBe('Trade & distribution')
    expect(roleFamilyLabel('nonsense')).toBe('nonsense')
  })

  it('is a literal select string supabase-js can parse', () => {
    expect(SIGNAL_ROUTING_SELECT).not.toContain(' ')
    expect(SIGNAL_ROUTING_SELECT.split(',')).toContain('role_families')
  })
})

describe('resolveRoleFamilies', () => {
  it('accepts known families and normalises case and whitespace', () => {
    expect(resolveRoleFamilies({ role_families: [' Cultivation_Production '] })).toEqual([
      'cultivation_production',
    ])
  })

  it('drops families the classifier invented', () => {
    // An LLM will occasionally emit a plausible-looking family. Passing it
    // through would silently widen a subscriber's digest.
    expect(resolveRoleFamilies({ role_families: ['cultivation_production', 'vibes_and_energy'] })).toEqual([
      'cultivation_production',
    ])
  })

  it('drops the internal family even if the classifier emits it', () => {
    expect(resolveRoleFamilies({ role_families: [INTERNAL_ROLE_FAMILY] })).toEqual([])
  })

  it('de-duplicates', () => {
    expect(
      resolveRoleFamilies({ role_families: ['trade_distribution', 'trade_distribution'] }),
    ).toEqual(['trade_distribution'])
  })

  it('tolerates malformed values without throwing', () => {
    expect(resolveRoleFamilies({ role_families: null })).toEqual([])
    expect(resolveRoleFamilies({ role_families: 'trade_distribution' })).toEqual([])
    expect(resolveRoleFamilies({ role_families: [null, 42, {}] })).toEqual([])
    expect(resolveRoleFamilies({})).toEqual([])
  })
})

describe('isRouted', () => {
  it('distinguishes unrouted from routed-to-nothing', () => {
    // These mean different things: the first must fall back to geography-only
    // matching, the second must match nobody.
    expect(isRouted({ role_families: null })).toBe(false)
    expect(isRouted(routed({ role_families: [] }))).toBe(true)
  })
})

describe('signalCountryIso2', () => {
  it('prefers the structured column', () => {
    expect(signalCountryIso2({ country_iso2: 'ls', country: 'Germany' })).toBe('LS')
  })

  it('falls back to the free-text country — 11% of the feed has no iso2', () => {
    expect(signalCountryIso2({ country: 'Lesotho' })).toBe('LS')
    expect(signalCountryIso2({ country: 'United States' })).toBe('US')
  })

  it('maps alpha-3 correctly rather than truncating it', () => {
    // "AUT" truncated to "AU" would file Austrian regulation under Australia.
    expect(signalCountryIso2({ country: 'Austria' })).toBe('AT')
    expect(signalCountryIso2({ country: 'Australia' })).toBe('AU')
  })

  it('returns null for non-countries instead of fabricating geography', () => {
    expect(signalCountryIso2({ country: 'Global' })).toBeNull()
    expect(signalCountryIso2({})).toBeNull()
  })
})

describe('matchesOperatorProfile', () => {
  it('matches home jurisdiction and role family', () => {
    const signal = routed({ country_iso2: 'LS', role_families: ['cultivation_production'] })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('matches the export destination', () => {
    const signal = routed({ country_iso2: 'DE', role_families: ['cultivation_production'] })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('excludes the right country with the wrong role family', () => {
    // A Lesotho cultivator does not want Lesotho pharmacy-dispensing news.
    const signal = routed({ country_iso2: 'LS', role_families: ['pharmacy_dispensing'] })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(false)
  })

  it('excludes the right role family in an irrelevant country', () => {
    const signal = routed({ country_iso2: 'US', role_families: ['cultivation_production'] })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(false)
  })

  it('excludes US dispensary retail news outright', () => {
    const signal = routed({ country_iso2: 'US', role_families: ['pharmacy_dispensing'] })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(false)
  })

  it('passes unrouted signals through on geography alone', () => {
    // Requiring a role family before the backfill lands would empty every feed.
    expect(matchesOperatorProfile({ country_iso2: 'LS' }, lesothoCultivator)).toBe(true)
    expect(matchesOperatorProfile({ country_iso2: 'US' }, lesothoCultivator)).toBe(false)
  })

  it('sends a routed-to-nothing signal to nobody', () => {
    expect(matchesOperatorProfile(routed({ country_iso2: 'LS', role_families: [] }), lesothoCultivator)).toBe(
      false,
    )
  })

  it('does not filter by geography when the operator declared none', () => {
    const global: OperatorProfile = { countryIso2: [], roleFamilies: ['cultivation_production'] }
    expect(matchesOperatorProfile(routed({ country_iso2: 'PE', role_families: ['cultivation_production'] }), global)).toBe(true)
  })

  it('applies the impact floor', () => {
    const strict: OperatorProfile = { ...lesothoCultivator, minImpact: 'high' }
    const base = { country_iso2: 'LS', role_families: ['cultivation_production'] }
    expect(matchesOperatorProfile(routed({ ...base, impact: 'high' }), strict)).toBe(true)
    expect(matchesOperatorProfile(routed({ ...base, impact: 'medium' }), strict)).toBe(false)
    // An unclassified impact must not sneak past a floor the operator set.
    expect(matchesOperatorProfile(routed(base), strict)).toBe(false)
  })
})

describe('explainMatch', () => {
  it('names the home jurisdiction and what it touches', () => {
    const signal = routed({ country_iso2: 'LS', role_families: ['cultivation_production'] })
    expect(explainMatch(signal, lesothoCultivator)).toBe(
      'Affects your LS cultivation & production operations',
    )
  })

  it('calls a destination an export lane', () => {
    const signal = routed({ country_iso2: 'DE', role_families: ['cultivation_production'] })
    expect(explainMatch(signal, lesothoCultivator)).toBe(
      'Affects your DE export lane (cultivation & production)',
    )
  })

  it('returns null for a non-match so no caller can explain what it should not have sent', () => {
    const signal = routed({ country_iso2: 'US', role_families: ['pharmacy_dispensing'] })
    expect(explainMatch(signal, lesothoCultivator)).toBeNull()
  })

  it('still explains an unrouted signal', () => {
    expect(explainMatch({ country_iso2: 'LS' }, lesothoCultivator)).toBe('Affects your LS operations')
  })
})
