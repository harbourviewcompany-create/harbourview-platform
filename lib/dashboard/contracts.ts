import type { DashboardPanelState, CountryDashboardRecord, DashboardSection } from './countryRegistry'

export interface DashboardStatusBadge { label: string; state: DashboardPanelState }
export interface DashboardSourceStatus { label: string; state: DashboardPanelState }
export interface DashboardRouteAction { label: string; href: string; section?: DashboardSection }
export interface CountryDashboardSummary { country: CountryDashboardRecord; status: DashboardStatusBadge; actions: DashboardRouteAction[] }

export interface MarketDashboardPanel { state: DashboardPanelState; summary: string }
export interface EducationDashboardPanel { state: DashboardPanelState; summary: string }
export interface ComplianceDashboardPanel { state: DashboardPanelState; summary: string }
export interface SignalsDashboardPanel { state: DashboardPanelState; summary: string }
export interface OpportunitiesDashboardPanel { state: DashboardPanelState; summary: string }
export interface IntelligenceDashboardPanel { state: DashboardPanelState; summary: string }
export interface ConnectionsDashboardPanel { state: DashboardPanelState; summary: string }

export interface PublicDashboardDTO {
  displayName: string
  publicSummary: string
  routeAvailability: CountryDashboardRecord['routeAvailability']
  dashboardStatus: DashboardPanelState
  lastUpdated: string
}

export const toPublicDashboardDTO = (country: CountryDashboardRecord): PublicDashboardDTO => ({
  displayName: country.displayName,
  publicSummary: country.publicSummary,
  routeAvailability: country.routeAvailability,
  dashboardStatus: country.dashboardStatus,
  lastUpdated: country.lastUpdated,
})
