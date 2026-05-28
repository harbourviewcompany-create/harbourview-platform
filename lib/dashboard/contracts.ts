export type DashboardPanelState =
  | 'live'
  | 'partial'
  | 'static-orientation'
  | 'fallback-backed'
  | 'request-only'
  | 'review-required'
  | 'unavailable'

export type DashboardSection =
  | 'overview'
  | 'market'
  | 'education'
  | 'compliance'
  | 'signals'
  | 'opportunities'
  | 'intelligence'
  | 'connections'

export type DashboardStatusBadge = {
  label: string
  state: DashboardPanelState
  tone: 'green' | 'blue' | 'gold' | 'amber' | 'red' | 'slate'
}

export type DashboardSourceStatus = {
  label: string
  state: DashboardPanelState
  lastUpdatedLabel: string
}

export type DashboardRouteAction = {
  label: string
  href: string
  section?: DashboardSection
  intent: 'primary' | 'secondary' | 'review' | 'globe' | 'switch-country'
}

export type DashboardPanel = {
  state: DashboardPanelState
  title: string
  summary: string
  statusLabel: string
  emptyState: string
  actions: DashboardRouteAction[]
  sourceStatus: DashboardSourceStatus
}

export type MarketDashboardPanel = DashboardPanel
export type EducationDashboardPanel = DashboardPanel
export type ComplianceDashboardPanel = DashboardPanel
export type SignalsDashboardPanel = DashboardPanel
export type OpportunitiesDashboardPanel = DashboardPanel
export type IntelligenceDashboardPanel = DashboardPanel
export type ConnectionsDashboardPanel = DashboardPanel

export type DashboardRouteAvailability = Record<DashboardSection, boolean>

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
  defaultDashboardSection: Exclude<DashboardSection, 'overview'>
  routeAvailability: DashboardRouteAvailability
  dashboardStatus: DashboardPanelState
  lastUpdated: string
  publicSummary: string
  statusBadge: DashboardStatusBadge
  panels: {
    market: MarketDashboardPanel
    education: EducationDashboardPanel
    compliance: ComplianceDashboardPanel
    signals: SignalsDashboardPanel
    opportunities: OpportunitiesDashboardPanel
    intelligence: IntelligenceDashboardPanel
    connections: ConnectionsDashboardPanel
  }
  fixtureLevel: 'rich-fixture' | 'dashboard-safe-default'
}

export type PublicDashboardPanelDto = Pick<DashboardPanel, 'state' | 'title' | 'summary' | 'statusLabel' | 'emptyState'> & {
  routeHref: string
  requestReviewHref: string
}

export type PublicCountryDashboardDto = {
  countryName: string
  slug: string
  iso2: string
  iso3: string
  region: string
  subregion: string
  publicSummary: string
  dashboardStatusLabel: string
  dashboardStatus: DashboardPanelState
  routeAvailability: DashboardRouteAvailability
  lastUpdatedLabel: string
  panels: Record<Exclude<DashboardSection, 'overview'>, PublicDashboardPanelDto>
  actions: DashboardRouteAction[]
}

export type GlobeRoutingEventType =
  | 'hover'
  | 'focus'
  | 'select'
  | 'overlay-open'
  | 'dashboard-intent'
  | 'dashboard-enter'
  | 'search-select'

export type GlobeRoutingEventPayload = {
  slug: string
  displayName: string
  iso2: string
  sourceEventType: GlobeRoutingEventType
  routeTarget: string
  timestamp: string
  dashboardAvailability: DashboardPanelState
  selectedDashboardSection?: DashboardSection
}

export type GlobeRoutingEventHandlers = {
  onCountryHover?: (payload: GlobeRoutingEventPayload) => void
  onCountryFocus?: (payload: GlobeRoutingEventPayload) => void
  onCountrySelect?: (payload: GlobeRoutingEventPayload) => void
  onCountryOverlayOpen?: (payload: GlobeRoutingEventPayload) => void
  onDashboardIntent?: (payload: GlobeRoutingEventPayload) => void
  onDashboardEnter?: (payload: GlobeRoutingEventPayload) => void
  onCountrySearchSelect?: (payload: GlobeRoutingEventPayload) => void
}
