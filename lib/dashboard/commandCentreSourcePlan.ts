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
  briefing: ['signals', 'countryIntel', 'orgPathway', 'publicPathway', 'marketMetrics', 'tradeFlows', 'sourceCoverage', 'registryCoverageSummary'],
  digest: ['signals', 'dailyDigest', 'countryIntel'],
  'access-pathway': ['countryIntel', 'orgPathway', 'publicPathway', 'jurisdictionPlaybook', 'pathwayMatrix', 'sourceCoverage'],
  marketplace: ['wantedCount', 'marketplaceRows', 'pipeline', 'wantedListings', 'countryIntel', 'publicPathway', 'cannabisOperators', 'operatorLicenceMatrix', 'mySubmissions'],
  evidence: ['evidenceData', 'sourceCoverage', 'registryCoverageSummary', 'professionals', 'publicPathway'],
  education: ['signals', 'liveEduTiles', 'recentEduModules', 'educationTracks', 'countryEducationOverlays', 'publicPathway'],
  regulatory: ['signals', 'watchlistData', 'countryIntel', 'sourceCoverage', 'jurisdictionPlaybook', 'pathwayMatrix'],
  'local-intel': ['signals', 'countryIntel', 'localIntel', 'sourceCoverage'],
  signals: ['signals', 'watchlistData', 'countryIntel'],
  watchlist: ['watchlistData', 'signals', 'countryIntel'],
  settings: [],
  genetics: ['cultivarPassports', 'serviceProviders', 'collaborationProjects', 'countryIntel'],
  clinical: ['countryIntel', 'publicPathway', 'professionals', 'countryEducationOverlays'],
  compliance: ['countryIntel', 'jurisdictionPlaybook', 'pathwayMatrix', 'publicPathway', 'sourceCoverage'],
  countries: ['signals', 'countryIntel', 'sourceCoverage', 'marketMetrics'],
  assistant: ['signals', 'countryIntel', 'marketMetrics', 'publicPathway'],
  documents: ['evidenceData', 'sourceCoverage', 'registryCoverageSummary'],
  events: ['signals', 'countryIntel'],
  experts: ['professionals', 'serviceProviders', 'cannabisOperators', 'countryIntel'],
  banking: ['marketMetrics', 'tradeFlows', 'countryIntel', 'publicPathway'],
  prices: ['marketMetrics', 'tradeFlows', 'countryIntel'],
  logistics: ['tradeFlows', 'cannabisOperators', 'countryIntel', 'publicPathway'],
  jobs: [],
  notifications: ['watchlistData', 'pipeline', 'signals'],
  kyb: ['evidenceData', 'professionals', 'cannabisOperators', 'operatorLicenceMatrix'],
  insurance: ['marketMetrics', 'countryIntel'],
  licences: ['cannabisOperators', 'operatorLicenceMatrix', 'countryIntel', 'jurisdictionPlaybook', 'pathwayMatrix'],
  'trade-calc': ['tradeFlows', 'marketMetrics', 'countryIntel', 'publicPathway'],
  organization: ['orgPathway', 'publicPathway', 'mySubmissions', 'pipeline'],
  talent: [],
} as const satisfies Record<CommandPage, readonly DashboardCommandSourceKey[]>

export function getRequiredCommandCentreSourceKeys(page: CommandPage | null): ReadonlySet<DashboardCommandSourceKey> {
  return new Set(PAGE_SOURCE_REQUIREMENTS[page ?? 'briefing'])
}

export function isCommandCentreSourceRequired(page: CommandPage | null, key: DashboardCommandSourceKey): boolean {
  return getRequiredCommandCentreSourceKeys(page).has(key)
}

export { PAGE_SOURCE_REQUIREMENTS }
