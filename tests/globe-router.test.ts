import { describe, expect, it } from 'vitest'
import { countryOptions, getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { getIntentIdsForRole } from '@/config/globe/intent-profiles'
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
      ['MT', 'Malta'],
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

  it('hydrates dashboard context from globe router query params', () => {
    const context = parseDashboardGlobeRouteContext(new URLSearchParams('source=globe_router&mode=single_market&country=DE&countries=DE&role=doctor_prescriber&intent=request_introduction&layer=country_select'))

    expect(context.countryIso2).toBe('DE')
    expect(context.countryName).toBe('Germany')
    expect(context.role).toBe('medical_professional')
    expect(context.source).toBe('globe_router')
    expect(context.intentId).toBe('request_introduction')
    expect(context.layerId).toBe('country_select')
  })

  it('maps globe roles to dashboard role bands and keeps safe defaults for non-globe entries', () => {
    expect(mapGlobeRoleToDashboardRole('regulatory_compliance')).toBe('regulatory_legal')
    expect(mapGlobeRoleToDashboardRole('exporter')).toBe('commercial_operator')

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

  it('moves from country to role directly to routing without an intent step', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'CA' })
    const afterRole = globeRouterReducer(afterCountry, { type: 'ROLE_SELECT', roleId: 'cultivator_producer' })

    expect(afterCountry.step).toBe('role')
    // Intent step removed — role selection fires the resolver immediately
    expect(afterRole.step).toBe('routing')
    expect(afterRole.routeStatus).toBe('resolving')
    expect(afterRole.selectedRoleId).toBe('cultivator_producer')
  })

  it('returns to the country step on back from role so the camera can fly back to globe', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterBack = globeRouterReducer(afterCountry, { type: 'BACK' })

    expect(afterCountry.step).toBe('role')
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
    // BACK from fallback returns to role selection (intent step removed)
    expect(back.step).toBe('role')
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
