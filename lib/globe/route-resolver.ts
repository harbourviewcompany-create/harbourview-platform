import { intentProfileMap } from '@/config/globe/intent-profiles'
import { destinationBasePathMap } from '@/config/globe/route-map'
import { getRouteFallback, routeExists } from '@/lib/globe/route-exists'
import type { DestinationType, GlobeRouteInput, GlobeRouteResult, IntentProfile, RoleId } from '@/types/globe-router'

// Maps globe role IDs to destination types when no intent is selected.
// The destination type remains analytics/context only for globe-originated
// traffic because /dashboard is the single primary user control center.
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

function mapRoleToDestinationType(roleId?: RoleId): DestinationType {
  if (!roleId || roleId === 'not_sure') return 'routing_review'
  if (medicalRoleIds.has(roleId)) return 'medical_education'
  if (regulatoryRoleIds.has(roleId)) return 'regulatory_education'
  return 'marketplace_services'
}

function appendGlobeQuery(basePath: string, input: GlobeRouteInput, requestedPath?: string) {
  const params = new URLSearchParams()

  params.set('source', input.source)
  params.set('mode', input.mode)

  if (input.countryIso2) params.set('country', input.countryIso2)
  if (input.countryIso2s?.length) params.set('countries', input.countryIso2s.join(','))
  if (input.roleId) params.set('role', input.roleId)
  if (input.intentId) params.set('intent', input.intentId)
  if (input.layerId) params.set('layer', input.layerId)
  if (requestedPath) params.set('requestedPath', requestedPath)

  return `${basePath}?${params.toString()}`
}

export function resolveGlobeRoute(input: GlobeRouteInput): GlobeRouteResult {
  const intent = input.intentId ? intentProfileMap[input.intentId] : undefined
  const destinationType: IntentProfile['destinationType'] = intent?.destinationType ?? mapRoleToDestinationType(input.roleId)

  if (input.source === 'globe_router') {
    return {
      status: 'resolved',
      href: appendGlobeQuery('/dashboard', input),
      destinationType,
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
