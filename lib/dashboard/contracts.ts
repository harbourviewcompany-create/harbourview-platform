export type DashboardPanelState =
  | 'live'
  | 'partial'
  | 'static-orientation'
  | 'fallback-backed'
  | 'request-only'
  | 'review-required'
  | 'unavailable'

export type DashboardStatusBadge = {
  label: string
  state: DashboardPanelState
}

export type DashboardSourceStatus = {
  sourceLabel: string
  state: DashboardPanelState
  lastUpdated: string
}

export type DashboardRouteAction = {
  label: string
  href: string
  section?: DashboardSection
}

export type DashboardSection = 'overview' | 'market' | 'education' | 'compliance' | 'signals' | 'opportunities' | 'intelligence' | 'connections'

export type BasePanel = {
  state: DashboardPanelState
  summary: string
  actions: DashboardRouteAction[]
}

export type MarketDashboardPanel = BasePanel
export type EducationDashboardPanel = BasePanel
export type ComplianceDashboardPanel = BasePanel
export type SignalsDashboardPanel = BasePanel
export type OpportunitiesDashboardPanel = BasePanel
export type IntelligenceDashboardPanel = BasePanel
export type ConnectionsDashboardPanel = BasePanel

export type CountryDashboardSummary = {
  slug: string
  iso2: string
  iso3: string
  displayName: string
  aliases: string[]
  region: string
  subregion: string
  globeFeatureId: string
  dashboardPath: string
  defaultDashboardSection: DashboardSection
  routeAvailability: DashboardPanelState
  dashboardStatus: DashboardPanelState
  lastUpdated: string
  publicSummary: string
  panels: Record<Exclude<DashboardSection, 'overview'>, BasePanel>
}

export type GlobeRoutingEventPayload = {
  slug: string
  displayName: string
  iso2: string
  sourceEventType: 'hover' | 'focus' | 'select' | 'overlay-open' | 'dashboard-intent' | 'dashboard-enter' | 'search-select'
  routeTarget: string
  timestamp: string
  dashboardAvailability: DashboardPanelState
  selectedDashboardSection?: DashboardSection
}
