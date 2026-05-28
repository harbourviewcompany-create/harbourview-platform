import type { DestinationType, GlobeRouteManifestEntry } from '@/types/globe-router'

export const globeRouteManifest: GlobeRouteManifestEntry[] = [
  { path: '/dashboard', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/signals',   availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intake',    availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/sell',   availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/wanted', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/services', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
]

export const globeRouteManifestMap = Object.fromEntries(
  globeRouteManifest.map((entry) => [entry.path, entry]),
) as Record<string, GlobeRouteManifestEntry>

// Country-specific dashboard section paths are dynamic routes — always treated
// as available when a country iso2 is present. The resolver builds them directly
// rather than checking the manifest.
export const COUNTRY_DASHBOARD_SECTION_ALWAYS_AVAILABLE = true

export const destinationBasePathMap: Record<DestinationType, string> = {
  // Education destinations: resolved to /dashboard/country/[slug]/education by
  // the route resolver when a country is selected; falls back to /dashboard otherwise.
  medical_education:    '/dashboard',
  regulatory_education: '/dashboard',
  signals:              '/signals',
  marketplace_services: '/dashboard',
  request_intro:        '/dashboard',
  seller_listing:       '/dashboard',
  wanted_request:       '/dashboard',
  routing_review:       '/dashboard',
}
