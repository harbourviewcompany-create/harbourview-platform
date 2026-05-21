import { describe, expect, it } from 'vitest'
import { getCountryRoleProfile, getMultiMarketRoleIds } from '@/config/globe/country-role-profiles'
import { getIntentIdsForRole } from '@/config/globe/intent-profiles'
import { tokenMatchesSearch } from '@/lib/globe/search-normalization'
import { resolveGlobeRoute } from '@/lib/globe/route-resolver'
import { globeRouterReducer, initialGlobeRouterState } from '@/components/globe/useGlobeRouterState'

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

  it('falls missing or provisional destinations back to intake without losing requested path', () => {
    const result = resolveGlobeRoute({
      countryIso2: 'DE',
      countryIso2s: ['DE'],
      roleId: 'doctor_prescriber',
      intentId: 'understand_medical_rules',
      mode: 'single_market',
      source: 'globe_router',
    })

    expect(result.status).toBe('fallback')
    expect(result.href).toContain('/intake?')
    expect(result.href).toContain('requestedPath=%2Feducation%2Fmedical')
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

  it('supports keyboard-only completion through resolved routing flow', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'CA' })
    const afterRole = globeRouterReducer(afterCountry, { type: 'ROLE_SELECT', roleId: 'cultivator_producer' })
    const afterIntent = globeRouterReducer(afterRole, { type: 'INTENT_SELECT', intentId: 'view_market_signals' })
    const afterContinue = globeRouterReducer(afterIntent, { type: 'CONTINUE' })
    const afterResolved = globeRouterReducer(afterContinue, { type: 'ROUTE_RESOLVED', href: '/signals?country=CA' })

    expect(afterCountry.step).toBe('role')
    expect(afterRole.step).toBe('intent')
    expect(afterIntent.selectedIntentId).toBe('view_market_signals')
    expect(afterContinue.step).toBe('routing')
    expect(afterContinue.routeStatus).toBe('resolving')
    expect(afterResolved.step).toBe('routing')
    expect(afterResolved.resolvedHref).toBe('/signals?country=CA')
  })

  it('supports keyboard-only completion through fallback routing flow', () => {
    const afterCountry = globeRouterReducer(initialGlobeRouterState, { type: 'COUNTRY_SELECT', countryIso2: 'DE' })
    const afterRole = globeRouterReducer(afterCountry, { type: 'ROLE_SELECT', roleId: 'doctor_prescriber' })
    const afterIntent = globeRouterReducer(afterRole, { type: 'INTENT_SELECT', intentId: 'understand_medical_rules' })
    const afterContinue = globeRouterReducer(afterIntent, { type: 'CONTINUE' })
    const afterMissing = globeRouterReducer(afterContinue, { type: 'ROUTE_MISSING', href: '/intake?country=DE', requestedPath: '/education/medical' })

    expect(afterContinue.step).toBe('routing')
    expect(afterMissing.step).toBe('fallback')
    expect(afterMissing.routeStatus).toBe('missing')
    expect(afterMissing.resolvedHref).toContain('/intake?country=DE')
  })
})
