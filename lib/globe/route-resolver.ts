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

// Resolve intelligence destinations to the country intelligence section when a country
// is known and the section route exists.
function resolveCountrySectionPath(
  destinationType: DestinationType,
  section: 'market' | 'signals' | 'opportunities' | 'intelligence' | 'connections',
  input: GlobeRouteInput,
): string | null {
  if (!input.countryIso2) return null
  if (input.mode === 'multi_market') return null

  const country = getCountryByIso2(input.countryIso2)
  if (!country) return null

  const sectionAvailable = country.routeAvailability[section as keyof typeof country.routeAvailability]
  if (!sectionAvailable) return null

  return `/dashboard/country/${country.slug}/${section}`
}

export function resolveGlobeRoute(input: GlobeRouteInput): GlobeRouteResult {
  const intent = input.intentId ? intentProfileMap[input.intentId] : undefined
  const destinationType: IntentProfile['destinationType'] = intent?.destinationType ?? 'routing_review'

  // 1. Country-specific education — dynamic route, always available when slug resolves.
  const countryEducationPath = resolveCountryEducationPath(destinationType, input)
  if (countryEducationPath) {
    return {
      status: 'resolved',
      href: appendGlobeQuery(countryEducationPath, input),
      destinationType,
    }
  }

  // 2. Country-specific signals section.
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

  // 3. Country-specific opportunities section for marketplace intents.
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

  // 4. Standard manifest-backed resolution.
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

