import type { CommandPage } from '@/components/dashboard/CommandCentre'

export type DashboardCommandSourceKey =
  | 'signals'
  | 'dailyDigest'
  | 'wantedCount'
  | 'marketplaceRows'
  | 'pipeline'
  | 'wantedListings'
  | 'countryIntel'
  | 'liveEduTiles'
  | 'orgPathway'
  | 'publicPathway'
  | 'watchlistData'
  | 'evidenceData'
  | 'recentEduModules'
  | 'localIntel'
  | 'sourceCoverage'
  | 'registryCoverageSummary'
  | 'jurisdictionPlaybook'
  | 'educationTracks'
  | 'marketMetrics'
  | 'tradeFlows'
  | 'professionals'
  | 'cannabisOperators'
  | 'operatorLicenceMatrix'
  | 'cultivarPassports'
  | 'serviceProviders'
  | 'collaborationProjects'
  | 'mySubmissions'
  | 'countryEducationOverlays'
  | 'pathwayMatrix'

const PAGE_SOURCE_REQUIREMENTS = {
  // `briefing` is also the fallback for a null page -- `normalizeCommandPage`
  // returns null for a bare `/dashboard`, and `getRequiredCommandCentreSourceKeys`
  // resolves that here. So this list is what a visitor gets before any `?page=`
  // exists, which makes it load-bearing for more than the Briefing surface.
  //
  // `marketplaceRows` and `wantedCount` are in it because BOTH shells switch to
  // the Market surface from client state and render it with the props the server
  // already sent: desktop `handlePageChange` calls `setActivePage(page)` and
  // mobile `navigateToSection` sets `pendingSection`, each rendering Market
  // immediately while `router.replace` is still in flight. With these keys
  // absent the source is disabled, `marketplaceRows` resolves to its empty
  // `{ rows: {} }` fallback, and every Market tab renders "No reviewed records
  // in this category yet" -- with no error anywhere, because an honest empty is
  // not a failure. `getListingsBySections` cannot otherwise return nothing: it
  // falls back to an unfiltered query and then to ORIENTATION_SUPPLY_CATALOG,
  // which covers all seven MarketViews. An empty Market therefore always meant
  // the source never ran.
  // Command overview / default dashboard — load the full operator stack so
  // DomainDepthStrip and priority actions are not starved (pipeline, watchlist,
  // evidence were previously omitted and produced ~40% live coverage).
  briefing: [
    'signals',
    'dailyDigest',
    'countryIntel',
    'orgPathway',
    'publicPathway',
    'marketMetrics',
    'tradeFlows',
    'sourceCoverage',
    'registryCoverageSummary',
    'marketplaceRows',
    'wantedCount',
    'wantedListings',
    'pipeline',
    'watchlistData',
    'evidenceData',
  ],
  digest: [
    'signals',
    'dailyDigest',
    'countryIntel',
    'pipeline',
    'watchlistData',
    'marketplaceRows',
    'marketMetrics',
    'sourceCoverage',
  ],
  'access-pathway': [
    'countryIntel',
    'orgPathway',
    'publicPathway',
    'jurisdictionPlaybook',
    'pathwayMatrix',
    'sourceCoverage',
    'signals',
    'evidenceData',
  ],
  marketplace: [
    'wantedCount',
    'marketplaceRows',
    'pipeline',
    'wantedListings',
    'countryIntel',
    'publicPathway',
    'cannabisOperators',
    'operatorLicenceMatrix',
    'mySubmissions',
    'signals',
    'watchlistData',
    'evidenceData',
  ],
  compare: [
    'marketMetrics',
    'tradeFlows',
    'countryIntel',
    'publicPathway',
    'signals',
    'sourceCoverage',
    'marketplaceRows',
  ],
  evidence: [
    'evidenceData',
    'sourceCoverage',
    'registryCoverageSummary',
    'professionals',
    'publicPathway',
    'signals',
    'watchlistData',
  ],
  education: [
    'signals',
    'liveEduTiles',
    'recentEduModules',
    'educationTracks',
    'countryEducationOverlays',
    'publicPathway',
    'countryIntel',
  ],
  regulatory: [
    'signals',
    'watchlistData',
    'countryIntel',
    'sourceCoverage',
    'jurisdictionPlaybook',
    'pathwayMatrix',
    'evidenceData',
    'publicPathway',
  ],
  'local-intel': [
    'signals',
    'countryIntel',
    'localIntel',
    'sourceCoverage',
    'watchlistData',
    'marketMetrics',
  ],
  signals: [
    'signals',
    'watchlistData',
    'countryIntel',
    'dailyDigest',
    'sourceCoverage',
    'pipeline',
  ],
  watchlist: [
    'watchlistData',
    'signals',
    'countryIntel',
    'pipeline',
    'sourceCoverage',
  ],
  settings: [],
  genetics: [
    'cultivarPassports',
    'serviceProviders',
    'collaborationProjects',
    'countryIntel',
    'signals',
    'sourceCoverage',
    'marketplaceRows',
  ],
  clinical: [
    'countryIntel',
    'publicPathway',
    'professionals',
    'countryEducationOverlays',
    'evidenceData',
    'signals',
    'sourceCoverage',
  ],
  compliance: [
    'countryIntel',
    'jurisdictionPlaybook',
    'pathwayMatrix',
    'publicPathway',
    'sourceCoverage',
    'signals',
    'watchlistData',
    'evidenceData',
  ],
  countries: [
    'signals',
    'countryIntel',
    'sourceCoverage',
    'marketMetrics',
    'tradeFlows',
    'publicPathway',
  ],
  assistant: [
    'signals',
    'countryIntel',
    'marketMetrics',
    'publicPathway',
    'marketplaceRows',
    'watchlistData',
  ],
  documents: [
    'evidenceData',
    'sourceCoverage',
    'registryCoverageSummary',
    'publicPathway',
  ],
  events: ['signals', 'countryIntel', 'watchlistData', 'marketMetrics'],
  experts: [
    'professionals',
    'serviceProviders',
    'cannabisOperators',
    'countryIntel',
    'signals',
  ],
  banking: [
    'marketMetrics',
    'tradeFlows',
    'countryIntel',
    'publicPathway',
    'cannabisOperators',
  ],
  prices: [
    'marketMetrics',
    'tradeFlows',
    'countryIntel',
    'signals',
    'sourceCoverage',
  ],
  logistics: [
    'tradeFlows',
    'cannabisOperators',
    'countryIntel',
    'publicPathway',
    'marketplaceRows',
  ],
  jobs: ['professionals', 'serviceProviders', 'cannabisOperators', 'countryIntel'],
  notifications: ['watchlistData', 'pipeline', 'signals', 'evidenceData'],
  kyb: [
    'evidenceData',
    'professionals',
    'cannabisOperators',
    'operatorLicenceMatrix',
    'pipeline',
  ],
  insurance: ['marketMetrics', 'countryIntel', 'publicPathway', 'cannabisOperators'],
  licences: [
    'cannabisOperators',
    'operatorLicenceMatrix',
    'countryIntel',
    'jurisdictionPlaybook',
    'pathwayMatrix',
    'sourceCoverage',
  ],
  'trade-calc': ['tradeFlows', 'marketMetrics', 'countryIntel', 'publicPathway'],
  organization: ['orgPathway', 'publicPathway', 'mySubmissions', 'pipeline', 'evidenceData', 'cannabisOperators'],
  talent: ['professionals', 'serviceProviders', 'cannabisOperators', 'countryIntel', 'signals'],
} as const satisfies Record<CommandPage, readonly DashboardCommandSourceKey[]>

export function getRequiredCommandCentreSourceKeys(page: CommandPage | null): ReadonlySet<DashboardCommandSourceKey> {
  return new Set(PAGE_SOURCE_REQUIREMENTS[page ?? 'briefing'])
}

export function isCommandCentreSourceRequired(page: CommandPage | null, key: DashboardCommandSourceKey): boolean {
  return getRequiredCommandCentreSourceKeys(page).has(key)
}

export { PAGE_SOURCE_REQUIREMENTS }
