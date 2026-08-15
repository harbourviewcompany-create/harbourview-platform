import { intentProfileMap } from '@/config/globe/intent-profiles'
import { destinationBasePathMap } from '@/config/globe/route-map'
import { getRouteFallback, routeExists } from '@/lib/globe/route-exists'
import { getCountryByIso2 } from '@/lib/dashboard/countries'
import { getCountryRoleHref } from '@/lib/roles/country-role-resolver'
import type { DestinationType, GlobeRouteInput, GlobeRouteResult, IntentProfile, RoleId } from '@/types/globe-router'

const medicalRoleIds = new Set<RoleId>([
  'doctor_prescriber',
  'pharmacist',
  'clinic_healthcare_operator',
  'patient_caregiver_education',
])

const regulatoryRoleIds = new Set<RoleId>([
  'regulatory_compliance',
  'legal_advisory',
  'government_regulator',
  'gmp_quality',
  'lab_qa',
  'logistics_customs',
])

const globeRoleToCountryRoleSlug: Partial<Record<RoleId, string>> = {
  doctor_prescriber: 'doctor',
  pharmacist: 'pharmacist',
  budtender: 'retail_buyer',
  cultivator_producer: 'licensed_cultivator',
  geneticist_breeder: 'geneticist',
  processor_extractor: 'processor',
  lab_qa: 'cannabis_lab',
  importer: 'importer',
  exporter: 'exporter',
  distributor_wholesaler: 'distributor',
  clinic_healthcare_operator: 'cannabis_clinic_operator',
  retail_operator: 'retail_buyer',
  regulatory_compliance: 'compliance_officer',
  legal_advisory: 'cannabis_lawyer',
  investor_operator: 'investor',
  government_regulator: 'regulator',
  patient_caregiver_education: 'patient_educator',
  gmp_quality: 'quality_manager',
  logistics_customs: 'customs_broker',
}

const subdivisionParentIso2: Partial<Record<string, string>> = {
  US: 'US',
  CA: 'CA',
}

function getSubdivisionParentIso2(value?: string): string | null {
  if (!value) return null
  const normalized = value.toUpperCase()
  const match = /^([A-Z]{2})-[A-Z0-9]{2,3}$/.exec(normalized)
  if (!match) return null
  return subdivisionParentIso2[match[1]] ?? null
}

function getRegionCode(input: GlobeRouteInput): string | undefined {
  if (input.mode === 'multi_market') return undefined
  return getSubdivisionParentIso2(input.countryIso2) ? input.countryIso2?.toUpperCase() : undefined
}

function mapRoleToDestinationType(roleId?: RoleId): DestinationType {
  if (!roleId || roleId === 'not_sure') return 'routing_review'
  if (medicalRoleIds.has(roleId)) return 'medical_education'
  if (regulatoryRoleIds.has(roleId)) return 'regulatory_education'
  return 'marketplace_services'
}

function appendGlobeQuery(basePath: string, input: GlobeRouteInput, requestedPath?: string) {
  const params = new URLSearchParams()
  const regionCode = getRegionCode(input)

  params.set('source', input.source)
  params.set('mode', input.mode)

  if (input.countryIso2) params.set('country', input.countryIso2)
  if (input.countryIso2s?.length) params.set('countries', input.countryIso2s.join(','))
  if (input.roleId && input.roleId !== 'not_sure') params.set('role', input.roleId)
  if (regionCode) params.set('region', regionCode)
  if (input.intentId) params.set('intent', input.intentId)
  if (input.layerId) params.set('layer', input.layerId)
  if (requestedPath) params.set('requestedPath', requestedPath)

  return `${basePath}?${params.toString()}`
}

function resolveCountryEducationPath(
  destinationType: DestinationType,
  input: GlobeRouteInput,
): string | null {
  const isEducation = destinationType === 'medical_education' || destinationType === 'regulatory_education'
  if (!isEducation || !input.countryIso2) return null

  const normalizedCountryIso2 = getSubdivisionParentIso2(input.countryIso2) ?? input.countryIso2
  const country = getCountryByIso2(normalizedCountryIso2)
  if (!country) return null
  return `/dashboard/country/${country.slug}/education`
}

function resolveCountrySectionPath(
  destinationType: DestinationType,
  section: 'market' | 'signals' | 'opportunities' | 'intelligence' | 'connections',
  input: GlobeRouteInput,
): string | null {
  if (!input.countryIso2 || input.mode === 'multi_market') return null
  const normalizedCountryIso2 = getSubdivisionParentIso2(input.countryIso2) ?? input.countryIso2
  const country = getCountryByIso2(normalizedCountryIso2)
  if (!country) return null

  const sectionAvailable = country.routeAvailability[section as keyof typeof country.routeAvailability]
  if (!sectionAvailable) return null
  return `/dashboard/country/${country.slug}/${section}`
}

export function resolveGlobeRoute(input: GlobeRouteInput): GlobeRouteResult {
  const intent = input.intentId ? intentProfileMap[input.intentId] : undefined
  const destinationType: IntentProfile['destinationType'] = intent?.destinationType ?? mapRoleToDestinationType(input.roleId)

  if (input.mode === 'multi_market') {
    return {
      status: 'resolved',
      href: appendGlobeQuery('/market-selection', input),
      destinationType,
    }
  }

  // Single-market entry is no longer blocked on professional role selection.
  // Explicit roles retain the canonical country-role route. Missing role goes
  // straight to Command; signed-in users restore their saved role there and
  // everyone else operates under the nullable All roles context.
  if (!input.intentId && input.countryIso2) {
    const normalizedCountryIso2 = getSubdivisionParentIso2(input.countryIso2) ?? input.countryIso2
    const country = getCountryByIso2(normalizedCountryIso2)
    const roleSlug = input.roleId ? globeRoleToCountryRoleSlug[input.roleId] : undefined
    if (country && roleSlug) {
      return {
        status: 'resolved',
        href: appendGlobeQuery(getCountryRoleHref(country.slug, roleSlug), input),
        destinationType,
      }
    }

    return {
      status: 'resolved',
      href: appendGlobeQuery('/dashboard', input),
      destinationType,
    }
  }

  const countryEducationPath = resolveCountryEducationPath(destinationType, input)
  if (countryEducationPath) {
    return {
      status: 'resolved',
      href: appendGlobeQuery(countryEducationPath, input),
      destinationType,
    }
  }

  if (destinationType === 'signals') {
    const countrySignalsPath = resolveCountrySectionPath(destinationType, 'signals', input)
    if (countrySignalsPath) {
      return {
        status: 'resolved',
        href: appendGlobeQuery(countrySignalsPath, input),
        destinationType,
      }
    }
  }

  if (destinationType === 'marketplace_services') {
    const countryOppsPath = resolveCountrySectionPath(destinationType, 'opportunities', input)
    if (countryOppsPath) {
      return {
        status: 'resolved',
        href: appendGlobeQuery(countryOppsPath, input),
        destinationType,
      }
    }
  }

  const requestedPath = destinationBasePathMap[destinationType]

  if (!routeExists(requestedPath)) {
    const fallbackPath = getRouteFallback(requestedPath)
    return {
      status: 'fallback',
      href: appendGlobeQuery(fallbackPath, input, requestedPath),
      destinationType,
      requestedPath,
      reason: 'route_missing_or_provisional',
    }
  }

  return {
    status: 'resolved',
    href: appendGlobeQuery(requestedPath, input),
    destinationType,
  }
}

export function useRouteResolver() {
  return resolveGlobeRoute
}
