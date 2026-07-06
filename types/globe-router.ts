export type RoleId =
  | 'doctor_prescriber'
  | 'pharmacist'
  | 'budtender'
  | 'cultivator_producer'
  | 'geneticist_breeder'
  | 'processor_extractor'
  | 'lab_qa'
  | 'importer'
  | 'exporter'
  | 'distributor_wholesaler'
  | 'clinic_healthcare_operator'
  | 'retail_operator'
  | 'regulatory_compliance'
  | 'legal_advisory'
  | 'investor_operator'
  | 'government_regulator'
  | 'patient_caregiver_education'
  | 'gmp_quality'
  | 'logistics_customs'
  | 'not_sure'

export type IntentId =
  | 'understand_import_rules'
  | 'find_qualified_supply'
  | 'screen_counterparties'
  | 'view_market_signals'
  | 'request_introduction'
  | 'find_target_markets'
  | 'screen_import_pathways'
  | 'prepare_export_positioning'
  | 'understand_medical_rules'
  | 'treatment_channel_basics'
  | 'country_specific_guidance'
  | 'pharmacy_channel_rules'
  | 'product_dispensing_constraints'
  | 'country_specific_education'
  | 'product_basics'
  | 'local_retail_rules'
  | 'training_or_education'
  | 'testing_requirements'
  | 'quality_documentation'
  | 'licensing_market_access'
  | 'buyer_or_export_route'
  | 'documentation_burden'
  | 'genetics_market_access'
  | 'licensing_partner_pathway'
  | 'country_specific_constraints'
  | 'regulatory_framework'
  | 'track_signals'
  | 'diligence_support'
  | 'opportunity_signals'
  | 'compare_markets'
  | 'market_intelligence'
  | 'medical_pharmacy_education'
  | 'import_export_help'
  | 'routing_review'

export type GlobeLayerId =
  | 'country_select'
  | 'market_openness'
  | 'opportunity_heat'
  | 'import_potential'
  | 'export_potential'
  | 'regulatory_signals'
  | 'documentation_burden'

export type GlobeRouterStep = 'country' | 'market_overview' | 'role' | 'intent' | 'routing' | 'fallback'

export type GlobeRouterMode = 'single_market' | 'multi_market' | 'not_sure'

export type GlobeRouteStatus = 'idle' | 'resolving' | 'resolved' | 'missing' | 'error'

export type DestinationType =
  | 'medical_education'
  | 'regulatory_education'
  | 'signals'
  | 'marketplace_services'
  | 'request_intro'
  | 'seller_listing'
  | 'wanted_request'
  | 'routing_review'

export interface RoleProfile {
  id: RoleId
  label: string
  shortLabel: string
  description: string
  aliases: string[]
}

export interface CountryOption {
  iso2: string
  iso3?: string
  name: string
  region: string
  subregion?: string
  aliases?: string[]
  dashboardStatus?: DashboardPanelState
}

export interface CountryRoleProfile {
  countryIso2: string
  countryName: string
  marketModel: 'medical' | 'adult_use' | 'mixed' | 'export' | 'restricted' | 'unknown'
  primaryRoleIds: RoleId[]
  secondaryRoleIds: RoleId[]
  searchableRoleIds: RoleId[]
  disabledRoleIds?: RoleId[]
  notes?: string
}

export interface IntentProfile {
  id: IntentId
  label: string
  description: string
  destinationType: DestinationType
}

export interface RoleIntentProfile {
  roleId: RoleId
  defaultIntentIds: IntentId[]
  countryOverrides?: Record<string, IntentId[]>
}

export interface GlobeRouterState {
  step: GlobeRouterStep
  mode: GlobeRouterMode
  focusedCountryIso2?: string
  selectedCountryIso2?: string
  selectedCountryIso2s: string[]
  selectedRoleId?: RoleId
  roleSearchQuery: string
  selectedIntentId?: IntentId
  activeLayerId?: GlobeLayerId
  routeStatus: GlobeRouteStatus
  resolvedHref?: string
  requestedPath?: string
  previousHref?: string
  inlineNotice?: string
}

export type GlobeRouterAction =
  | { type: 'COUNTRY_FOCUS'; countryIso2?: string }
  | { type: 'COUNTRY_SELECT'; countryIso2: string }
  | { type: 'COUNTRY_SEARCH_SELECT'; countryIso2: string }
  | { type: 'COUNTRY_CLEAR' }
  | { type: 'MULTI_MARKET_ENABLE' }
  | { type: 'MULTI_MARKET_ADD'; countryIso2: string }
  | { type: 'MULTI_MARKET_REMOVE'; countryIso2: string }
  | { type: 'MULTI_MARKET_CONFIRM' }
  | { type: 'NOT_SURE_COUNTRY' }
  | { type: 'MARKET_ENTER'; roleId?: RoleId }
  | { type: 'ROLE_SELECT'; roleId: RoleId }
  | { type: 'ROLE_SEARCH_QUERY'; query: string }
  | { type: 'ROLE_SEARCH_SELECT'; roleId: RoleId }
  | { type: 'NOT_SURE_ROLE' }
  | { type: 'INTENT_SELECT'; intentId: IntentId }
  | { type: 'CONTINUE' }
  | { type: 'ROUTE_RESOLVED'; href: string }
  | { type: 'ROUTE_MISSING'; href: string; requestedPath?: string }
  | { type: 'BACK' }
  | { type: 'ESCAPE' }
  | { type: 'RESET' }

export interface GlobeRouteInput {
  countryIso2?: string
  countryIso2s?: string[]
  roleId?: RoleId
  intentId?: IntentId
  mode: GlobeRouterMode
  source: 'globe_router'
  layerId?: GlobeLayerId
}

export interface GlobeRouteResult {
  status: 'resolved' | 'fallback'
  href: string
  destinationType: DestinationType
  requestedPath?: string
  reason?: string
}

export type RouteAvailability = 'available' | 'provisional' | 'missing'

export type DashboardPanelState =
  | 'live'
  | 'partial'
  | 'static-orientation'
  | 'fallback-backed'
  | 'request-only'
  | 'review-required'
  | 'unavailable'

export interface GlobeRouteManifestEntry {
  path: string
  availability: RouteAvailability
  fallbackPath: '/intake'
  confirmedAvailable?: boolean
}

export interface GlobePlateSpot {
  iso2: string
  x: number
  y: number
  scale?: number
}
