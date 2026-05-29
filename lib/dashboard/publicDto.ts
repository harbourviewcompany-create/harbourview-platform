import type { CountryDashboardPublicDto, CountryDashboardSummary } from './contracts'
import type { CountryDashboardRecord } from './commercialDashboard'
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


export function serializeCommercialCountryDashboardPublicDto(record: CountryDashboardRecord): CountryDashboardRecord {
  return {
    slug: record.slug,
    iso2: record.iso2,
    iso3: record.iso3,
    displayName: record.displayName,
    publicSummary: record.publicSummary,
    selectedLayer: record.selectedLayer,
    selectedLayerMetric: record.selectedLayerMetric,
    quickFacts: record.quickFacts,
    marketplace: record.marketplace,
    tradeAccess: record.tradeAccess,
    education: record.education,
    readiness: record.readiness,
    movement: record.movement,
    coverage: record.coverage,
    heatmapMetrics: record.heatmapMetrics,
    comparisonMetrics: record.comparisonMetrics,
    reviewActions: record.reviewActions,
    roleViews: record.roleViews,
  }
}
