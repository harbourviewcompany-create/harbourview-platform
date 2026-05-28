import { describe, expect, it } from 'vitest'
import { getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { getIntentIdsForRole } from '@/config/globe/intent-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import { globeRouterReducer, initialGlobeRouterState } from '@/components/globe/useGlobeRouterState'
import { parseGlobeRouteState } from '@/components/harbourview/globe/globeRouteState'
import { parseDashboardInitialStateFromGlobeParams } from '@/lib/dashboard/globeRouteContext'
import type { IntentId, RoleId } from '@/types/globe-router'

function expectFallbackRoutePreservesContext({
  countryIso2,
  roleId,
  intentId,
  requestedPath,
}: {
  countryIso2: string
  roleId: RoleId
  intentId: IntentId
  requestedPath: string
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

  expect(result.status).toBe('fallback')
  expect(result.href).toContain('/intake?')
  expect(result.href).toContain(`country=${countryIso2}`)
  expect(result.href).toContain(`countries=${countryIso2}`)
  expect(result.href).toContain(`role=${roleId}`)
  expect(result.href).toContain(`intent=${intentId}`)
  expect(result.href).toContain(`requestedPath=${encodeURIComponent(requestedPath)}`)
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


  it('hydrates dashboard defaults from globe route query context', () => {
    const state = parseDashboardInitialStateFromGlobeParams(new URLSearchParams('source=globe_router&mode=single_market&country=DE&role=doctor_prescriber&intent=request_introduction'))

    expect(state).toEqual({
      countryIso2: 'DE',
      countryName: 'Germany',
      role: 'medical_professional',
    })
  })

  it('uses first multi-market country and regulatory dashboard role from globe context', () => {
    const state = parseDashboardInitialStateFromGlobeParams(new URLSearchParams('source=globe_router&mode=multi_market&countries=PT,DE&role=legal_advisory&intent=routing_review'))

    expect(state).toEqual({
      countryIso2: 'PT',
      countryName: 'Portugal',
      role: 'regulatory_legal',
    })
  })

  it('keeps dashboard defaults for non-globe traffic', () => {
    const state = parseDashboardInitialStateFromGlobeParams(new URLSearchParams('country=DE&role=doctor_prescriber'))

    expect(state).toEqual({
      countryIso2: 'CA',
      countryName: 'Canada',
      role: 'commercial_operator',
    })
  })

  it('falls Germany medical education paths back to intake without losing route context', () => {
    expectFallbackRoutePreservesContext({
      countryIso2: 'DE',
      roleId: 'doctor_prescriber',
      intentId: 'understand_medical_rules',
      requestedPath: '/education/medical',
    })
  })

  it('falls Canada regulatory education paths back to intake without losing route context', () => {
    expectFallbackRoutePreservesContext({
      countryIso2: 'CA',
      roleId: 'regulatory_compliance',
      intentId: 'regulatory_framework',
      requestedPath: '/education/regulatory',
    })
  })

  it('moves from country to role to intent without a separate recommendation screen', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'CA' })
    const afterRole = globeRouterReducer(afterCountry, { type: 'ROLE_SELECT', roleId: 'cultivator_producer' })
    const afterIntent = globeRouterReducer(afterRole, { type: 'INTENT_SELECT', intentId: 'buyer_or_export_route' })

    expect(afterCountry.step).toBe('role')
    expect(afterRole.step).toBe('intent')
    expect(afterIntent.step).toBe('intent')
    expect(afterIntent.selectedIntentId).toBe('buyer_or_export_route')
  })

  it('returns to the country step on back from role so the camera can fly back to globe', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterBack = globeRouterReducer(afterCountry, { type: 'BACK' })

    expect(afterCountry.step).toBe('role')
    expect(afterBack.step).toBe('country')
    expect(afterBack.selectedRoleId).toBeUndefined()
  })

  it('returns from fallback to intent and can reset to the start of the router', () => {
    const country = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const role = globeRouterReducer(country, { type: 'ROLE_SELECT', roleId: 'doctor_prescriber' })
    const intent = globeRouterReducer(role, { type: 'INTENT_SELECT', intentId: 'understand_medical_rules' })
    const routing = globeRouterReducer(intent, { type: 'CONTINUE' })
    const fallback = globeRouterReducer(routing, {
      type: 'ROUTE_MISSING',
      href: '/intake?source=globe_router&country=DE&role=doctor_prescriber&intent=understand_medical_rules&requestedPath=%2Feducation%2Fmedical',
      requestedPath: '/education/medical',
    })
    const back = globeRouterReducer(fallback, { type: 'BACK' })
    const reset = globeRouterReducer(fallback, { type: 'RESET' })

    expect(fallback.step).toBe('fallback')
    expect(fallback.routeStatus).toBe('missing')
    expect(fallback.selectedCountryIso2).toBe('DE')
    expect(fallback.selectedRoleId).toBe('doctor_prescriber')
    expect(fallback.selectedIntentId).toBe('understand_medical_rules')
    expect(fallback.requestedPath).toBe('/education/medical')
    expect(back.step).toBe('intent')
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

    expect(resolved.status).toBe('fallback')
    expect(state.kind).toBe('fallback')
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
