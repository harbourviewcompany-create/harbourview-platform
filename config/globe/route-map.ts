import type { DestinationType, GlobeRouteManifestEntry } from '@/types/globe-router'

export const globeRouteManifest: GlobeRouteManifestEntry[] = [
  { path: '/dashboard', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/medical', availability: 'provisional', fallbackPath: '/intake', confirmedAvailable: false },
  { path: '/education/regulatory', availability: 'provisional', fallbackPath: '/intake', confirmedAvailable: false },
  { path: '/signals', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/services', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intake', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/sell', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/wanted', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
]

export const globeRouteManifestMap = Object.fromEntries(
  globeRouteManifest.map((entry) => [entry.path, entry]),
) as Record<string, GlobeRouteManifestEntry>

export const destinationBasePathMap: Record<DestinationType, string> = {
  medical_education: '/education/medical',
  regulatory_education: '/education/regulatory',
  signals: '/signals',
  marketplace_services: '/dashboard',
  request_intro: '/dashboard',
  seller_listing: '/dashboard',
  wanted_request: '/dashboard',
  routing_review: '/dashboard',
}
