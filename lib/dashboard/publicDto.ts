import type { CountryDashboardPublicDto, CountryDashboardSummary } from './contracts'
import { getDashboardStatusBadge } from './statusBadges'

export function serializeCountryDashboardPublicDto(country: CountryDashboardSummary): CountryDashboardPublicDto {
  return {
    slug: country.slug,
    iso2: country.iso2,
    iso3: country.iso3,
    displayName: country.displayName,
    region: country.region,
    subregion: country.subregion,
    dashboardPath: country.dashboardPath,
    defaultDashboardSection: country.defaultDashboardSection,
    routeAvailability: country.routeAvailability,
    dashboardStatus: country.dashboardStatus,
    publicSummary: country.publicSummary,
    lastUpdatedLabel: `Updated ${country.lastUpdated}`,
    statusBadge: getDashboardStatusBadge(country.dashboardStatus),
    panels: {
      market: country.panels.market,
      education: country.panels.education,
      compliance: country.panels.compliance,
      signals: country.panels.signals,
      opportunities: country.panels.opportunities,
      intelligence: country.panels.intelligence,
      connections: country.panels.connections,
    },
  }
}

