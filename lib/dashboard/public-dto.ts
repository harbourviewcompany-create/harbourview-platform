import { CountryRegistryRecord, dashboardSections } from './country-registry'

export interface PublicDashboardCountryDto {
  publicCountryName: string
  publicStatusLabel: string
  publicSummary: string
  routeAvailability: CountryRegistryRecord['routeAvailability']
  panelStatus: CountryRegistryRecord['dashboardStatus']
  lastUpdatedLabel: string
  requestCta: string
  sections: Record<string, string>
}

export function serializePublicDashboardDto(country: CountryRegistryRecord): PublicDashboardCountryDto {
  return {
    publicCountryName: country.displayName,
    publicStatusLabel: country.dashboardStatus,
    publicSummary: country.publicSummary,
    routeAvailability: country.routeAvailability,
    panelStatus: country.dashboardStatus,
    lastUpdatedLabel: country.lastUpdated,
    requestCta: 'Request Confidential Review',
    sections: Object.fromEntries(dashboardSections.map((s) => [s, country.dashboardStatus])),
  }
}
