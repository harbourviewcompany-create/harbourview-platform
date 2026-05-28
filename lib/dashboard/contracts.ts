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

export type DashboardSectionSlug = Exclude<DashboardSection, 'overview'>

export type RouteAvailability = Record<DashboardSectionSlug, boolean>

export type DashboardRouteAction = {
  label: string
  href: string
  section?: DashboardSection
  intent: 'primary-dashboard' | 'section' | 'review-request' | 'globe-return' | 'country-switch'
}

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

export type DashboardPanelCopy = {
  state: DashboardPanelState
  label: string
  summary: string
  emptyState: string
  ctaLabel: string
}

export type DashboardPanelBase = {
  state: DashboardPanelState
  publicSummary: string
  stateCopy: DashboardPanelCopy
  actions: DashboardRouteAction[]
}

export type MarketDashboardPanel = DashboardPanelBase & { marketPosture: string }
export type EducationDashboardPanel = DashboardPanelBase & { educationStatus: string }
export type ComplianceDashboardPanel = DashboardPanelBase & { complianceStatus: string }
export type SignalsDashboardPanel = DashboardPanelBase & { signalAvailability: string }
export type OpportunitiesDashboardPanel = DashboardPanelBase & { opportunityStatus: string }
export type IntelligenceDashboardPanel = DashboardPanelBase & { intelligenceStatus: string }
export type ConnectionsDashboardPanel = DashboardPanelBase & { connectionStatus: string }

export type CountryDashboardPanels = {
  market: MarketDashboardPanel
  education: EducationDashboardPanel
  compliance: ComplianceDashboardPanel
  signals: SignalsDashboardPanel
  opportunities: OpportunitiesDashboardPanel
  intelligence: IntelligenceDashboardPanel
  connections: ConnectionsDashboardPanel
}

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
  defaultDashboardSection: DashboardSectionSlug
  routeAvailability: RouteAvailability
  dashboardStatus: DashboardPanelState
  lastUpdated: string
  publicSummary: string
  panels: CountryDashboardPanels
}

export type CountryDashboardPublicDto = Pick<
  CountryDashboardSummary,
  | 'slug'
  | 'iso2'
  | 'iso3'
  | 'displayName'
  | 'region'
  | 'subregion'
  | 'dashboardPath'
  | 'defaultDashboardSection'
  | 'routeAvailability'
  | 'dashboardStatus'
  | 'publicSummary'
> & {
  lastUpdatedLabel: string
  statusBadge: DashboardStatusBadge
  panels: Record<DashboardSectionSlug, Pick<DashboardPanelBase, 'state' | 'publicSummary' | 'stateCopy' | 'actions'>>
}

export type GlobeRouteSourceEventType =
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
  sourceEventType: GlobeRouteSourceEventType
  routeTarget: string
  timestamp: string
  dashboardAvailability: DashboardPanelState
  selectedDashboardSection?: DashboardSectionSlug
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
