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

export type CountryDashboardRole =
  | 'buyer'
  | 'seller_supplier'
  | 'importer'
  | 'exporter'
  | 'distributor'
  | 'doctor'
  | 'pharmacist'
  | 'investor'
  | 'equipment_vendor'
  | 'service_provider'
  | 'general_research'

export type CountryMarketplaceCategory =
  | 'Consumables'
  | 'Cannabis products / import-export opportunities'
  | 'Distressed equipment'
  | 'New equipment'
  | 'Used equipment'
  | 'Packaging'
  | 'Testing/lab services'
  | 'Cultivation inputs'
  | 'Processing equipment'
  | 'Pharmacy/clinic-related products'
  | 'Professional services'

export type CountryHeatmapLayer =
  | 'marketplace_activity'
  | 'buyer_demand'
  | 'seller_supply'
  | 'equipment_availability'
  | 'distressed_asset_activity'
  | 'import_export_fit'
  | 'clinical_education_demand'
  | 'pharmacy_readiness'
  | 'trade_access'
  | 'regulatory_status'
  | 'source_coverage'

export type CountryListingSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  locationLabel: string
  availabilityLabel: string
  ctaLabel: string
  href: string
}

export type CountryWantedRequestSummary = {
  id: string
  title: string
  category: CountryMarketplaceCategory
  demandLabel: string
  readinessLabel: string
  href: string
}

export type CountryMarketplaceProfile = {
  activityScore: number
  summary: string
  categories: CountryMarketplaceCategory[]
  listings: CountryListingSummary[]
  wantedRequests: CountryWantedRequestSummary[]
  reviewedCounterpartyLabel: string
  quoteFlowLabel: string
}

export type CountryTradeAccessProfile = {
  score: number
  summary: string
  allowedActions: string[]
  routeFit: string[]
  barriers: string[]
  corridors: string[]
}

export type CountryProfessionalEducationModule = {
  id: string
  title: string
  audience: 'Doctor' | 'Pharmacist' | 'Professional'
  summary: string
  href: string
}

export type CountryEducationProfile = {
  demandScore: number
  summary: string
  audiences: string[]
  modules: CountryProfessionalEducationModule[]
}

export type CountryReadinessProfile = {
  score: number
  summary: string
  gates: string[]
  blockers: string[]
  documentRequirements: string[]
}

export type CountryMovementProfile = {
  score: number
  summary: string
  signals: string[]
  sourceConfidenceLabel: string
}

export type CountryHeatmapMetric = {
  countrySlug: string
  countryName: string
  iso2: string
  layer: CountryHeatmapLayer
  score: number
  badge: string
  tooltip: string
}

export type CountryReviewAction = {
  label: string
  href: string
  intent: 'quote' | 'listing' | 'wanted' | 'match' | 'trade-review' | 'document-review' | 'counterparty-review' | 'education-access' | 'country-brief'
}

export type CountryQuickFacts = {
  legalStatusLabel: string
  commercialModelLabel: string
  roleFitLabel: string
  reviewBoundaryLabel: string
}

export type CountryCoverageProfile = {
  score: number
  label: string
  publicSourcesLabel: string
  reviewStatusLabel: string
}

export type CountryRoleView = {
  role: CountryDashboardRole
  label: string
  summary: string
  primaryCards: Array<{ title: string; body: string; ctaLabel: string; href: string; pillar: 'Marketplace' | 'Trade Access' | 'Education' | 'Readiness' | 'Movement' }>
  emphasizedPillars: Array<'Marketplace' | 'Trade Access' | 'Education' | 'Readiness' | 'Movement'>
}

export type CountryDashboardRecord = {
  countrySlug: string
  marketplace: CountryMarketplaceProfile
  tradeAccess: CountryTradeAccessProfile
  education: CountryEducationProfile
  readiness: CountryReadinessProfile
  movement: CountryMovementProfile
  coverage: CountryCoverageProfile
  quickFacts: CountryQuickFacts
  heatmapMetrics: CountryHeatmapMetric[]
  actions: CountryReviewAction[]
  roleViews: Record<CountryDashboardRole, CountryRoleView>
}
