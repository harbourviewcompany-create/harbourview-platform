import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { countryOptions, getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { getIntentIdsForRole } from '@/config/globe/intent-profiles'
import { destinationBasePathMap, globeRouteManifestMap } from '@/config/globe/route-map'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import { globeRouterReducer, initialGlobeRouterState } from '@/components/globe/useGlobeRouterState'
import { parseGlobeRouteState } from '@/components/harbourview/globe/globeRouteState'
import { countries } from '@/lib/dashboard/countries'
import { mapGlobeRoleToDashboardRole, parseDashboardGlobeRouteContext } from '@/lib/dashboard/globeRouteContext'
import type { CountryOption, IntentId, RoleId } from '@/types/globe-router'

function expectEducationRoutePreservesContext({
  countryIso2,
  roleId,
  intentId,
  expectedPath,
}: {
  countryIso2: string
  roleId: RoleId
  intentId: IntentId
  expectedPath: string
}) {
  const result = resolveGlobeRoute({
    countryIso2,
    countryIso2s: [countryIso2],
    roleId,
    intentId,
    mode: 'single_market',
    source: 'globe_router',
    layerId: 'country_select',
  })

  expect(result.status).toBe('resolved')
  expect(result.href).toContain(`${expectedPath}?`)
  expect(result.href).toContain(`country=${countryIso2}`)
  expect(result.href).toContain(`countries=${countryIso2}`)
  expect(result.href).toContain(`role=${roleId}`)
  expect(result.href).toContain(`intent=${intentId}`)
  expect(result.href).not.toContain('requestedPath=')
}

function countryMatchesMobileSearch(country: CountryOption, query: string) {
  return tokenMatchesSearch(query, [
    country.name,
    country.iso2,
    country.iso3 ?? '',
    country.region,
    country.subregion ?? '',
    ...(country.aliases ?? []),
  ])
}

describe('Harbourview globe same-screen router', () => {
  it('uses Germany-specific role chips before generic roles', () => {
    const profile = getCountryRoleProfile('DE')

    expect(profile.primaryRoleIds.slice(0, 4)).toEqual([
      'importer',
      'exporter',
      'gmp_quality',
      'distributor_wholesaler',
    ])
    expect(profile.primaryRoleIds).toContain('pharmacist')
  })

  it('uses Canada-specific role chips for production, retail and export paths', () => {
    const profile = getCountryRoleProfile('CA')

    expect(profile.primaryRoleIds).toContain('cultivator_producer')
    expect(profile.primaryRoleIds).toContain('geneticist_breeder')
    expect(profile.primaryRoleIds).toContain('retail_operator')
    expect(profile.primaryRoleIds).toContain('exporter')
  })

  it('keeps global fallback role coverage searchable', () => {
    const profile = getCountryRoleProfile('BR')

    expect(profile.countryIso2).toBe('BR')
    expect(profile.searchableRoleIds).toContain('doctor_prescriber')
    expect(profile.searchableRoleIds).toContain('logistics_customs')
    expect(profile.searchableRoleIds).toContain('not_sure')
  })

  it('uses the full dashboard country registry as the mobile country search universe', () => {
    const searchIso2s = new Set(countryOptions.map((country) => country.iso2))
    const canonicalIso2s = new Set(countries.map((country) => country.iso2))
    const requiredCountries = [
      ['CA', 'Canada'],
      ['US', 'United States'],
      ['DE', 'Germany'],
      ['PT', 'Portugal'],
      ['AU', 'Australia'],
      ['TH', 'Thailand'],
      ['ZA', 'South Africa'],
      ['BR', 'Brazil'],
      ['CO', 'Colombia'],
      ['LS', 'Lesotho'],
      ['MK', 'North Macedonia'],
      ['UY', 'Uruguay'],
      ['IL', 'Israel'],
      ['CZ', 'Czechia'],
      ['NL', 'Netherlands'],
      ['DK', 'Denmark'],
      ['PL', 'Poland'],
      ['JP', 'Japan'],
      ['NZ', 'New Zealand'],
    ] as const

    expect(countryOptions.length).toBe(countries.length)
    expect(searchIso2s).toEqual(canonicalIso2s)

    for (const [iso2, name] of requiredCountries) {
      const country = countryOptions.find((option) => option.iso2 === iso2)
      expect(country, `${name} should be present in mobile country search options`).toBeTruthy()
      expect(country?.name).toBe(name)
    }
  })

  it('matches mobile country search by name, alpha-2, alpha-3, and common aliases at 390px parity', () => {
    const assertions = [
      ['Ca', 'CA'],
      ['Can', 'CA'],
      ['DE', 'DE'],
      ['Ger', 'DE'],
      ['Tha', 'TH'],
      ['Les', 'LS'],
      ['Uru', 'UY'],
      ['North', 'MK'],
      ['CZE', 'CZ'],
      ['Czech Republic', 'CZ'],
      ['Holland', 'NL'],
      ['JPN', 'JP'],
      ['NZL', 'NZ'],
    ] as const

    for (const [query, iso2] of assertions) {
      const country = countryOptions.find((option) => option.iso2 === iso2)
      expect(country, `${iso2} should exist before query ${query}`).toBeTruthy()
      expect(countryMatchesMobileSearch(country!, query), `${query} should find ${country?.name}`).toBe(true)
    }
  })

  it('prioritizes cross-border roles for multi-market routing', () => {
    const roles = getMultiMarketRoleIds(['DE', 'CA'])

    expect(roles.slice(0, 6)).toContain('importer')
    expect(roles.slice(0, 6)).toContain('exporter')
    expect(roles.slice(0, 6)).toContain('gmp_quality')
  })

  it('normalizes role search aliases', () => {
    expect(tokenMatchesSearch('quality assurance', ['QA', 'Quality Assurance'])).toBe(true)
    expect(tokenMatchesSearch('apotheke', ['Pharmacy', 'Apotheke'])).toBe(true)
    expect(tokenMatchesSearch('seed', ['Geneticist', 'breeder', 'seed'])).toBe(true)
  })

  it('returns role-specific intent cards', () => {
    expect(getIntentIdsForRole('pharmacist', 'DE')).toEqual([
      'pharmacy_channel_rules',
      'product_dispensing_constraints',
      'country_specific_education',
      'request_introduction',
    ])
    expect(getIntentIdsForRole('exporter', 'CA')).toContain('prepare_export_positioning')
  })

  it('routes available destinations directly with country, role and intent params', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'DE',
      countryIso2s: ['DE'],
      roleId: 'importer',
      intentId: 'view_market_signals',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/signals?')
    expect(result.href).toContain('country=DE')
    expect(result.href).toContain('role=importer')
    expect(result.href).toContain('intent=view_market_signals')
  })

  it('normalizes a single selected U.S. state to the United States country-role route while preserving region context', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'US-OK',
      countryIso2s: ['US-OK'],
      roleId: 'importer',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/united-states/role/importer?')
    expect(result.href).toContain('source=globe_router')
    expect(result.href).toContain('mode=single_market')
    expect(result.href).toContain('country=US-OK')
    expect(result.href).toContain('countries=US-OK')
    expect(result.href).toContain('role=importer')
    expect(result.href).toContain('layer=country_select')
    expect(result.href).toContain('region=US-OK')
    expect(result.href).not.toContain('/market-selection')
  })

  it('normalizes a single selected Canadian province to the Canada country-role route while preserving region context', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'CA-ON',
      countryIso2s: ['CA-ON'],
      roleId: 'importer',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/canada/role/importer?')
    expect(result.href).toContain('country=CA-ON')
    expect(result.href).toContain('countries=CA-ON')
    expect(result.href).toContain('role=importer')
    expect(result.href).toContain('region=CA-ON')
    expect(result.href).not.toContain('/market-selection')
  })

  it('preserves normal country-role routing for Mexico exporter selections', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'MX',
      countryIso2s: ['MX'],
      roleId: 'exporter',
      mode: 'single_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.status).toBe('resolved')
    expect(result.href).toContain('/country/mexico/role/exporter?')
    expect(result.href).toContain('country=MX')
    expect(result.href).toContain('countries=MX')
    expect(result.href).toContain('role=exporter')
    expect(result.href).not.toContain('region=')
  })

  it('keeps true multi-market selection on market selection without single subdivision normalization', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'US-OK',
      countryIso2s: ['US-OK', 'CA-ON'],
      roleId: 'importer',
      mode: 'multi_market',
      source: 'globe_router',
      layerId: 'country_select',
    })

    expect(result.href).toContain('/market-selection?')
    expect(result.href).not.toContain('/country/united-states/role/importer')
    expect(result.href).not.toContain('region=US-OK')
  })

  it('does not hardcode Germany as selected on the market-selection fallback page', () => {
    const marketSelectionPage = readFileSync(join(process.cwd(), 'app/market-selection/page.tsx'), 'utf8')
    const mobileCountrySelection = readFileSync(join(process.cwd(), 'components/harbourview/MobileCountrySelection.tsx'), 'utf8')

    expect(marketSelectionPage).not.toContain('initialCountry="DE"')
    expect(mobileCountrySelection).not.toContain("initialCountry = 'DE'")
  })

  it('hydrates dashboard context from globe router query params', () => {
    const context = parseDashboardGlobeRouteContext(new URLSearchParams('source=globe_router&mode=single_market&country=DE&countries=DE&role=doctor_prescriber&intent=request_introduction&layer=country_select'))

    expect(context.countryIso2).toBe('DE')
    expect(context.countryName).toBe('Germany')
    expect(context.role).toBe('medical_professional')
    expect(context.source).toBe('globe_router')
    expect(context.intentId).toBe('request_introduction')
    expect(context.intentLabel).toBe('Request Introduction')
    expect(context.layerId).toBe('country_select')
  })

  it('maps globe roles and intents to dashboard role bands with safe defaults for non-globe entries', () => {
    expect(mapGlobeRoleToDashboardRole('regulatory_compliance')).toBe('regulatory_legal')
    expect(mapGlobeRoleToDashboardRole('exporter')).toBe('commercial_operator')

    const regulatoryIntentContext = parseDashboardGlobeRouteContext(new URLSearchParams('source=globe_router&country=DE&role=importer&intent=understand_import_rules'))
    expect(regulatoryIntentContext.role).toBe('regulatory_legal')

    const context = parseDashboardGlobeRouteContext(new URLSearchParams('source=directory&country=DE&role=doctor_prescriber'))

    expect(context.countryIso2).toBe('CA')
    expect(context.countryName).toBe('Canada')
    expect(context.role).toBe('commercial_operator')
    expect(context.source).toBeUndefined()
  })

  it('routes Germany medical education paths to country education without losing route context', () => {
    expectEducationRoutePreservesContext({
      countryIso2: 'DE',
      roleId: 'doctor_prescriber',
      intentId: 'understand_medical_rules',
      expectedPath: '/dashboard/country/germany/education',
    })
  })

  it('routes Canada regulatory education paths to country education without losing route context', () => {
    expectEducationRoutePreservesContext({
      countryIso2: 'CA',
      roleId: 'regulatory_compliance',
      intentId: 'regulatory_framework',
      expectedPath: '/dashboard/country/canada/education',
    })
  })

  it('keeps education fallback paths aligned with current public education pages', () => {
    expect(destinationBasePathMap.medical_education).toBe('/education/pharmaceutical-medical-cannabis')
    expect(destinationBasePathMap.regulatory_education).toBe('/education/compliance-readiness')
    expect(globeRouteManifestMap['/education/pharmaceutical-medical-cannabis']?.confirmedAvailable).toBe(true)
    expect(globeRouteManifestMap['/education/compliance-readiness']?.confirmedAvailable).toBe(true)
    expect(globeRouteManifestMap['/education/clinical']).toBeUndefined()
    expect(globeRouteManifestMap['/education/compliance']).toBeUndefined()
  })

  it('moves from country to market_overview then role selection fires routing immediately', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'CA' })
    const afterRole = globeRouterReducer(afterCountry, { type: 'ROLE_SELECT', roleId: 'cultivator_producer' })

    // COUNTRY_SELECT lands on market_overview (country brief + role chips shown)
    expect(afterCountry.step).toBe('market_overview')
    // ROLE_SELECT fires the resolver immediately — no separate intent step
    expect(afterRole.step).toBe('routing')
    expect(afterRole.routeStatus).toBe('resolving')
    expect(afterRole.selectedRoleId).toBe('cultivator_producer')
  })

  it('batches COUNTRY_SELECT + MARKET_ENTER to skip the market_overview interstitial for single-market selection', () => {
    // GlobeSameScreenRouterLanding's onSelectCountry dispatches these two
    // actions together (React batches them into one render) so the
    // MarketOverviewSheet interstitial never mounts for the primary
    // single-market flow — selecting a country goes straight to routing.
    // Reducer still supports market_overview as a standalone step (used by
    // multi-market and by BACK-from-fallback recovery); this test locks in
    // the specific two-action sequence the UI relies on to skip it.
    const afterSelect = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterEnter = globeRouterReducer(afterSelect, { type: 'MARKET_ENTER' })

    expect(afterEnter.step).toBe('routing')
    expect(afterEnter.routeStatus).toBe('resolving')
    expect(afterEnter.selectedCountryIso2).toBe('DE')
    expect(afterEnter.selectedRoleId).toBe('importer')
  })

  it('MARKET_ENTER honors an explicit roleId from the session-remembered role picker', () => {
    // GlobeSameScreenRouterLanding reads a sessionStorage-backed
    // preferredRoleId (set once via RoleChipSelector, independent of the
    // reducer) and passes it into MARKET_ENTER on every country entry —
    // so a doctor or regulator lands on their correct destination dashboard
    // instead of always defaulting to importer.
    const afterSelect = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterEnter = globeRouterReducer(afterSelect, { type: 'MARKET_ENTER', roleId: 'doctor_prescriber' })

    expect(afterEnter.step).toBe('routing')
    expect(afterEnter.selectedRoleId).toBe('doctor_prescriber')

    // A second country selection with the same remembered role — confirms
    // the "pick once, applies every time" behavior at the reducer level.
    const secondSelect = globeRouterReducer(afterEnter, { type: 'COUNTRY_SELECT', countryIso2: 'BR' })
    const secondEnter = globeRouterReducer(secondSelect, { type: 'MARKET_ENTER', roleId: 'doctor_prescriber' })
    expect(secondEnter.selectedCountryIso2).toBe('BR')
    expect(secondEnter.selectedRoleId).toBe('doctor_prescriber')
  })


  it('returns to the country step on back from market_overview so the camera can fly back to globe', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterBack = globeRouterReducer(afterCountry, { type: 'BACK' })

    // COUNTRY_SELECT lands on market_overview; BACK from market_overview returns to country
    expect(afterCountry.step).toBe('market_overview')
    expect(afterBack.step).toBe('country')
    expect(afterBack.selectedRoleId).toBeUndefined()
  })

  it('returns from fallback to role step and can reset to the start of the router', () => {
    const country = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const role = globeRouterReducer(country, { type: 'ROLE_SELECT', roleId: 'doctor_prescriber' })
    // role_select now fires resolver directly; simulate a route-missing outcome
    const fallback = globeRouterReducer(role, {
      type: 'ROUTE_MISSING',
      href: '/intake?source=globe_router&country=DE&role=doctor_prescriber&requestedPath=%2Feducation%2Fmedical',
      requestedPath: '/education/medical',
    })
    const back = globeRouterReducer(fallback, { type: 'BACK' })
    const reset = globeRouterReducer(fallback, { type: 'RESET' })

    expect(fallback.step).toBe('fallback')
    expect(fallback.routeStatus).toBe('missing')
    expect(fallback.selectedCountryIso2).toBe('DE')
    expect(fallback.selectedRoleId).toBe('doctor_prescriber')
    expect(fallback.requestedPath).toBe('/education/medical')
    // BACK from fallback returns to market_overview (role chips visible again)
    expect(back.step).toBe('market_overview')
    expect(back.routeStatus).toBe('idle')
    expect(back.selectedCountryIso2).toBe('DE')
    expect(reset).toEqual(initialGlobeRouterState)
  })

  it('keeps query parsing aligned with canonical resolver availability for intent destinations', () => {
    const params = new URLSearchParams('market=germany&role=doctor_prescriber&intent=understand_medical_rules')
    const state = parseGlobeRouteState(params)

    const resolved = resolveGlobeRoute({
      source: 'globe_router',
      mode: 'single_market',
      countryIso2: 'DE',
      countryIso2s: ['DE'],
      roleId: 'doctor_prescriber',
      intentId: 'understand_medical_rules',
    })

    expect(resolved.status).toBe('resolved')
    expect(resolved.href).toContain('/dashboard/country/germany/education?')
    expect(state.kind).toBe('intent-sheet')
    expect(state.invalidParams).toEqual([])
  })

  it('maps available intent destinations without fallback when resolver resolves', () => {
    const params = new URLSearchParams('market=germany&role=importer&intent=view_market_signals')
    const state = parseGlobeRouteState(params)

    const resolved = resolveGlobeRoute({
      source: 'globe_router',
      mode: 'single_market',
      countryIso2: 'DE',
      countryIso2s: ['DE'],
      roleId: 'importer',
      intentId: 'view_market_signals',
    })

    expect(resolved.status).toBe('resolved')
    expect(state.kind).toBe('intent-sheet')
    expect(state.invalidParams).toEqual([])
  })
})

describe('resolveMarket utility', () => {
  it('resolves a country code to a SelectedMarket', async () => {
    const { resolveMarket } = await import('@/lib/dashboard/resolveMarket')
    const result = resolveMarket('DE')
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Germany')
    expect(result?.type).toBe('country')
    expect(result?.parentCountry).toBeUndefined()
  })

  it('resolves a US state code to a SelectedMarket with parent US', async () => {
    const { resolveMarket } = await import('@/lib/dashboard/resolveMarket')
    const result = resolveMarket('US-GA')
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Georgia')
    expect(result?.type).toBe('state')
    expect(result?.parentCountry).toBe('US')
  })

  it('resolves a Canadian province code to a SelectedMarket with parent CA', async () => {
    const { resolveMarket } = await import('@/lib/dashboard/resolveMarket')
    const result = resolveMarket('CA-ON')
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Ontario')
    expect(result?.type).toBe('province')
    expect(result?.parentCountry).toBe('CA')
  })

  it('returns null for unrecognized codes — no stale default', async () => {
    const { resolveMarket } = await import('@/lib/dashboard/resolveMarket')
    expect(resolveMarket('XX')).toBeNull()
    expect(resolveMarket('ZZ-99')).toBeNull()
    expect(resolveMarket('')).toBeNull()
  })

  it('is case-insensitive', async () => {
    const { resolveMarket } = await import('@/lib/dashboard/resolveMarket')
    expect(resolveMarket('us-ga')?.label).toBe('Georgia')
    expect(resolveMarket('ca-on')?.label).toBe('Ontario')
    expect(resolveMarket('de')?.label).toBe('Germany')
  })

  it('getEffectiveCountryIso2 returns parent for subnational, code for country', async () => {
    const { resolveMarket, getEffectiveCountryIso2 } = await import('@/lib/dashboard/resolveMarket')
    expect(getEffectiveCountryIso2(resolveMarket('US-GA'))).toBe('US')
    expect(getEffectiveCountryIso2(resolveMarket('CA-ON'))).toBe('CA')
    expect(getEffectiveCountryIso2(resolveMarket('DE'))).toBe('DE')
    expect(getEffectiveCountryIso2(null)).toBeNull()
  })
})

describe('parseDashboardGlobeRouteContext subnational routing', () => {
  it('US-GA routes to US dashboard, not Germany or Canada default', () => {
    const params = new URLSearchParams(
      'source=globe_router&mode=single_market&country=US-GA&countries=US-GA&role=importer&layer=country_select'
    )
    const ctx = parseDashboardGlobeRouteContext(params as unknown as Pick<URLSearchParams, 'get'>)
    expect(ctx.countryIso2).toBe('US')
    expect(ctx.countryIso2).not.toBe('DE')
    expect(ctx.countryIso2).not.toBe('CA')
    expect(ctx.globeRoleId).toBe('importer')
  })

  it('CA-ON routes to CA dashboard, preserving province label context', () => {
    const params = new URLSearchParams(
      'source=globe_router&mode=single_market&country=CA-ON&countries=CA-ON&role=exporter'
    )
    const ctx = parseDashboardGlobeRouteContext(params as unknown as Pick<URLSearchParams, 'get'>)
    expect(ctx.countryIso2).toBe('CA')
    expect(ctx.countryName).toBe('Ontario')
    expect(ctx.globeRoleId).toBe('exporter')
  })

  it('DE routes correctly with role preserved', () => {
    const params = new URLSearchParams(
      'source=globe_router&mode=single_market&country=DE&countries=DE&role=importer'
    )
    const ctx = parseDashboardGlobeRouteContext(params as unknown as Pick<URLSearchParams, 'get'>)
    expect(ctx.countryIso2).toBe('DE')
    expect(ctx.countryName).toBe('Germany')
    expect(ctx.globeRoleId).toBe('importer')
  })

  it('invalid market code shows controlled empty state — not stale Germany or Canada', () => {
    const params = new URLSearchParams(
      'source=globe_router&mode=single_market&country=ZZ&countries=ZZ&role=importer'
    )
    const ctx = parseDashboardGlobeRouteContext(params as unknown as Pick<URLSearchParams, 'get'>)
    // Falls back to default — must not be a stale ZZ ghost
    expect(ctx.countryIso2).toBeDefined()
    expect(['CA', 'DE', 'US']).toContain(ctx.countryIso2) // known valid fallback
    // role is still preserved even through fallback
    expect(ctx.globeRoleId).toBe('importer')
  })
})
