import { globeRouteManifestMap } from '@/config/globe/route-map'

export function routeExists(path: string) {
  const entry = globeRouteManifestMap[path]

  return Boolean(entry?.confirmedAvailable && entry.availability === 'available')
}

export function getRouteFallback(path: string) {
  return globeRouteManifestMap[path]?.fallbackPath ?? '/intake'
}
