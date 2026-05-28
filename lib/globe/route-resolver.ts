import { intentProfileMap } from '@/config/globe/intent-profiles'
import { destinationBasePathMap } from '@/config/globe/route-map'
import { getRouteFallback, routeExists } from '@/lib/globe/route-exists'
import { getCountryByIso2 } from '@/lib/dashboard/countries'
import type { DestinationType, GlobeRouteInput, GlobeRouteResult, IntentProfile } from '@/types/globe-router'

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

// Resolve education-type destinations to the country dashboard education section.
// Returns null when no country is available (multi-market / not-sure flows).
function resolveCountryEducationPath(
  destinationType: DestinationType,
  input: GlobeRouteInput,
): string | null {
  const isEducation =
    destinationType === 'medical_education' || destinationType === 'regulatory_education'

  if (!isEducation) return null
  if (!input.countryIso2) return null

  const country = getCountryByIso2(input.countryIso2)
  if (!country) return null

  return `/dashboard/country/${country.slug}/education`
}

export function resolveGlobeRoute(input: GlobeRouteInput): GlobeRouteResult {
  const intent = input.intentId ? intentProfileMap[input.intentId] : undefined
  const destinationType: IntentProfile['destinationType'] = intent?.destinationType ?? 'routing_review'

  // Country-specific education path — dynamic route, always available when slug resolves.
  const countryEducationPath = resolveCountryEducationPath(destinationType, input)
  if (countryEducationPath) {
    return {
      status: 'resolved',
      href: appendGlobeQuery(countryEducationPath, input),
      destinationType,
    }
  }

  // Standard manifest-backed resolution.
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
