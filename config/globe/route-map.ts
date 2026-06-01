import type { DestinationType, GlobeRouteManifestEntry } from '@/types/globe-router'

export const globeRouteManifest: GlobeRouteManifestEntry[] = [
  // Core platform destinations — always available
  { path: '/dashboard',                         availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/signals',                           availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intake',                            availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },

  // Marketplace destinations
  { path: '/marketplace/sell',                  availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/wanted',                availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/services',              availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/import-demand',         availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/marketplace/export-ready',          availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },

  // Education destinations
  { path: '/education',                         availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/export-import-readiness', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/gmp',                     availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/gacp',                    availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/gdp',                     availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/pharmaceutical-medical-cannabis', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/pharmacy',                availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/compliance-readiness',    availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/testing',                 availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/quality-compliance',      availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/importer-distributor',    availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/cultivation-production',  availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/procurement',             availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/pharmacovigilance',       availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/education/policy',                  availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },

  // Intelligence destinations
  { path: '/intelligence',                      availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intelligence/country-briefs',       availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intelligence/regulatory-pathways', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intelligence/licensing-pathways',  availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/intelligence/counterparty-intelligence', availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },

  // Compliance destinations
  { path: '/compliance',                        availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/compliance/request-support',        availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },

  // Contact / intro destinations
  { path: '/contact',                           availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
  { path: '/reviewed-connections',              availability: 'available', fallbackPath: '/intake', confirmedAvailable: true },
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
  // the route resolver when a country is selected; falls back to current public
  // education spine routes when no country section is available.
  medical_education:    '/education/pharmaceutical-medical-cannabis',
  regulatory_education: '/education/compliance-readiness',

  // Market signals
  signals:              '/signals',

  // Marketplace destinations
  marketplace_services: '/marketplace/services',
  seller_listing:       '/marketplace/sell',
  wanted_request:       '/marketplace/wanted',

  // Intro / review destinations
  request_intro:        '/contact',
  routing_review:       '/intake',
}
