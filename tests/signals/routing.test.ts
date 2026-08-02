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
  signalGeoScope,
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

  it('withholds a routed-to-nothing signal even from a roleless profile', () => {
    // The classifier rejected this signal for every audience. A geography-only
    // profile must not receive it just because it declared no role filter —
    // the roleless shortcut previously ran before the signal's own families
    // were inspected.
    const geographyOnly: OperatorProfile = { countryIso2: ['LS'], roleFamilies: [] }
    expect(matchesOperatorProfile(routed({ country_iso2: 'LS', role_families: [] }), geographyOnly)).toBe(false)
  })

  it('treats an empty roleFamilies profile as no role filter', () => {
    // Regression: both review bots caught this. The migration documents an empty
    // role_families watch rule as geography-only, but `.some()` over an empty
    // profile array is false for every routed signal — so the code contradicted
    // its own schema comment, and every geography-only feed would have gone dark
    // the moment the backfill stamped routing_version.
    const geographyOnly: OperatorProfile = { countryIso2: ['LS'], roleFamilies: [] }
    expect(
      matchesOperatorProfile(routed({ country_iso2: 'LS', role_families: ['pharmacy_dispensing'] }), geographyOnly),
    ).toBe(true)
    // Geography still filters.
    expect(
      matchesOperatorProfile(routed({ country_iso2: 'US', role_families: ['pharmacy_dispensing'] }), geographyOnly),
    ).toBe(false)
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

describe('geographic scope', () => {
  // Measured over 90 days: country 10,767 · region 846 · global 517 · unknown 332.
  // An iso2-only matcher discarded the last three — 10.6% of the corpus — for
  // every operator with a declared geography.
  const cultivation = ['cultivation_production']

  it('classifies scope, inferring country for pre-geo-model rows', () => {
    expect(signalGeoScope({ geo_scope: 'region' })).toBe('region')
    expect(signalGeoScope({ geo_scope: 'GLOBAL' })).toBe('global')
    expect(signalGeoScope({ country_iso2: 'LS' })).toBe('country')
    expect(signalGeoScope({})).toBe('unknown')
  })

  it('prefers the carried country over any unusable scope value', () => {
    // An empty or out-of-vocabulary geo_scope previously fell through to
    // 'unknown', which fails open — so a row that plainly said "Lesotho" was
    // delivered to every operator, including ones who declared other countries.
    expect(signalGeoScope({ geo_scope: '', country_iso2: 'LS' })).toBe('country')
    expect(signalGeoScope({ geo_scope: 'nonsense', country_iso2: 'LS' })).toBe('country')
    expect(signalGeoScope({ geo_scope: 'unknown', country_iso2: 'LS' })).toBe('country')
    // With no country to fall back to, it is still genuinely unknown.
    expect(signalGeoScope({ geo_scope: '' })).toBe('unknown')
  })

  it('does not leak a wrong-country signal through an unusable scope value', () => {
    const signal = routed({ geo_scope: '', country_iso2: 'US', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(false)
  })

  it('matches region case-insensitively', () => {
    const signal = routed({ geo_scope: 'region', geo_region: 'AFRICA', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('delivers a regional signal to an operator inside that region', () => {
    // Lesotho is in Africa; an Africa-wide change reaches it.
    const signal = routed({ geo_scope: 'region', geo_region: 'Africa', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('delivers a regional signal via an export destination', () => {
    // Germany is in Europe; an EU-wide rule change reaches a LS→DE exporter.
    const signal = routed({ geo_scope: 'region', geo_region: 'Europe', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('withholds a regional signal from an unrelated region', () => {
    const signal = routed({ geo_scope: 'region', geo_region: 'Oceania', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(false)
  })

  it('does not fail open when every declared country IS mapped', () => {
    // Regression: the first version compared a set of REGIONS against a set of
    // COUNTRIES (`known.size < profileCountries.size`). Lesotho and South Africa
    // are both mapped and both Africa, giving 1 < 2 — so the fail-open guard
    // fired for any profile with two countries in one region (the common case)
    // and silently widened the filter it was added to make safe.
    const southernAfrica: OperatorProfile = { countryIso2: ['LS', 'ZA'], roleFamilies: cultivation }
    const europe = routed({ geo_scope: 'region', geo_region: 'Europe', role_families: cultivation })
    expect(matchesOperatorProfile(europe, southernAfrica)).toBe(false)
    // ...and the region they are actually in still matches.
    const africa = routed({ geo_scope: 'region', geo_region: 'Africa', role_families: cultivation })
    expect(matchesOperatorProfile(africa, southernAfrica)).toBe(true)
  })

  it('uses the complete checked ISO mapping for Singapore', () => {
    const singapore: OperatorProfile = { countryIso2: ['SG'], roleFamilies: cultivation }
    const asia = routed({ geo_scope: 'region', geo_region: 'Asia', role_families: cultivation })
    const europe = routed({ geo_scope: 'region', geo_region: 'Europe', role_families: cultivation })
    expect(matchesOperatorProfile(asia, singapore)).toBe(true)
    expect(matchesOperatorProfile(europe, singapore)).toBe(false)
  })

  it('does not widen LATAM to all of the Americas', () => {
    const usa: OperatorProfile = { countryIso2: ['US'], roleFamilies: cultivation }
    const colombia: OperatorProfile = { countryIso2: ['CO'], roleFamilies: cultivation }
    const signal = routed({ geo_scope: 'region', geo_region: 'Americas', country: 'LATAM', role_families: cultivation })
    expect(matchesOperatorProfile(signal, usa)).toBe(false)
    expect(matchesOperatorProfile(signal, colombia)).toBe(true)
  })

  it('matches Caribbean as a subregion rather than all Americas', () => {
    const barbados: OperatorProfile = { countryIso2: ['BB'], roleFamilies: cultivation }
    const usa: OperatorProfile = { countryIso2: ['US'], roleFamilies: cultivation }
    const signal = routed({ geo_scope: 'region', geo_region: 'Americas', country: 'Caribbean', role_families: cultivation })
    expect(matchesOperatorProfile(signal, barbados)).toBe(true)
    expect(matchesOperatorProfile(signal, usa)).toBe(false)
  })

  it('matches European Union membership independently of UN macro-region', () => {
    const cyprus: OperatorProfile = { countryIso2: ['CY'], roleFamilies: cultivation }
    const uk: OperatorProfile = { countryIso2: ['GB'], roleFamilies: cultivation }
    const signal = routed({ geo_scope: 'region', geo_region: 'Europe', country: 'European Union', role_families: cultivation })
    expect(matchesOperatorProfile(signal, cyprus)).toBe(true)
    expect(matchesOperatorProfile(signal, uk)).toBe(false)
  })

  it('does not widen Middle East to all of Asia or North Africa', () => {
    const egypt: OperatorProfile = { countryIso2: ['EG'], roleFamilies: cultivation }
    const uae: OperatorProfile = { countryIso2: ['AE'], roleFamilies: cultivation }
    const singapore: OperatorProfile = { countryIso2: ['SG'], roleFamilies: cultivation }
    const morocco: OperatorProfile = { countryIso2: ['MA'], roleFamilies: cultivation }
    const signal = routed({ geo_scope: 'region', geo_region: 'Asia', country: 'Middle East', role_families: cultivation })
    expect(matchesOperatorProfile(signal, egypt)).toBe(true)
    expect(matchesOperatorProfile(signal, uae)).toBe(true)
    expect(matchesOperatorProfile(signal, singapore)).toBe(false)
    expect(matchesOperatorProfile(signal, morocco)).toBe(false)
  })

  it('matches Pacific to Oceania without widening globally', () => {
    const australia: OperatorProfile = { countryIso2: ['AU'], roleFamilies: cultivation }
    const japan: OperatorProfile = { countryIso2: ['JP'], roleFamilies: cultivation }
    const signal = routed({ geo_scope: 'region', geo_region: 'Oceania', country: 'Pacific', role_families: cultivation })
    expect(matchesOperatorProfile(signal, australia)).toBe(true)
    expect(matchesOperatorProfile(signal, japan)).toBe(false)
  })

  it.each([
    ['Africa', 'LS', 'DE'],
    ['Americas', 'US', 'DE'],
    ['Asia', 'SG', 'DE'],
    ['Europe', 'DE', 'LS'],
    ['Oceania', 'AU', 'DE'],
  ])('matches the UN macro-region %s exactly', (region, included, excluded) => {
    const signal = routed({ geo_scope: 'region', geo_region: region, role_families: cultivation })
    expect(matchesOperatorProfile(signal, { countryIso2: [included], roleFamilies: cultivation })).toBe(true)
    expect(matchesOperatorProfile(signal, { countryIso2: [excluded], roleFamilies: cultivation })).toBe(false)
  })

  it('fails closed for an unknown retained bloc label', () => {
    const signal = routed({ geo_scope: 'region', geo_region: 'Americas', country: 'Unknown bloc', role_families: cultivation })
    expect(matchesOperatorProfile(signal, { countryIso2: ['US'], roleFamilies: cultivation })).toBe(false)
  })

  it('delivers global signals to everyone', () => {
    // A treaty-level change belongs to no country; it must not be filtered out
    // for precisely that reason.
    const signal = routed({ geo_scope: 'global', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
  })

  it('does not exclude on geography it cannot establish', () => {
    const signal = routed({ geo_scope: 'unknown', role_families: cultivation })
    expect(matchesOperatorProfile(signal, lesothoCultivator)).toBe(true)
    // ...but role family still narrows it.
    expect(
      matchesOperatorProfile(routed({ geo_scope: 'unknown', role_families: ['pharmacy_dispensing'] }), lesothoCultivator),
    ).toBe(false)
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

  it('explains regional and global reach without claiming a country', () => {
    expect(
      explainMatch(routed({ geo_scope: 'region', geo_region: 'Europe', role_families: ['cultivation_production'] }), lesothoCultivator),
    // Deliberately not "where you operate": a region can match via an export
    // destination, or via the fail-open path for an unmapped country, neither of
    // which establishes that the operator operates there.
    ).toBe('Affects Europe, a region or bloc you cover (cultivation & production)')
    expect(
      explainMatch(routed({ geo_scope: 'global', role_families: ['cultivation_production'] }), lesothoCultivator),
    ).toBe('Global change affecting all markets (cultivation & production)')
  })
})
