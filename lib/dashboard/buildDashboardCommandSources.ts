import 'server-only'

import type { CommandPage, DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { fetchDashboardSignals, fetchDailyDigest, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import {
  getCannabisOperators,
  getCountryEducationOverlays,
  getCountryIntelProfile,
  getEducationTracks,
  getEvidenceData,
  getJurisdictionPlaybook,
  getLiveEduTiles,
  getLocalIntel,
  getMarketMetrics,
  getOrgPathwayProgress,
  getPipelineCounts,
  getProfessionals,
  getPublicPathwayTemplate,
  getRecentEduModules,
  getRegistryCoverageSummary,
  getSourceCoverage,
  getTradeFlows,
  getUserMarketplaceSubmissions,
  getWantedListings,
  getWatchlistData,
} from '@/lib/dashboard/dashboardLiveData'
import type { CommandCentreLoadContext, CommandCentreSourceMap } from '@/lib/dashboard/commandCentreDataTypes'
import { getRequiredCommandCentreSourceKeys, type DashboardCommandSourceKey } from '@/lib/dashboard/commandCentreSourcePlan'
import { getPublicCollaborationProjects, getPublicCultivarPassports, getPublicServiceProviders } from '@/lib/genetics/queries'
import { getOperatorLicenceMatrix } from '@/lib/intelligence/operatorIntelligence'
import { getCountryPathwayMatrix } from '@/lib/intelligence/regulatoryPathways'
import { getListingsBySections, type PublicListing } from '@/lib/server/listingsQuery'

const VIEW_SECTIONS: Record<MarketView, string[]> = {
  cannabis: ['cannabis_inventory', 'export_ready', 'export', 'import_demand', 'genetics', 'flower', 'extract', 'biomass'],
  equipment: ['cultivation_equipment', 'processing_equipment', 'used_surplus', 'equipment'],
  consumables: ['consumables', 'packaging'],
  'new-products': ['new_products', 'new-products'],
  services: ['services', 'professional_services', 'logistics', 'lab_testing', 'labs_testing'],
  opportunities: ['distressed_businesses', 'distressed_inventory', 'business_opportunities', 'qualified_access', 'wanted_requests'],
  wanted: ['wanted_requests', 'wanted'],
}

function safeText(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback
}

function formatTitle(input: string): string {
  return input
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapListingToDashboardRow(listing: PublicListing): MarketRow {
  const categoryLabel = formatTitle(listing.subcategory ?? listing.product_type ?? listing.category)
  const regionLabel = listing.location_region ?? listing.location_country ?? listing.region
  const sellerType = listing.seller_type ?? ''
  const isVerified = sellerType === 'verified_seller' || sellerType === 'licensed_operator'
  const rawScore = typeof (listing.high_level_specs as Record<string, unknown>)?.score === 'number'
    ? (listing.high_level_specs as Record<string, unknown>).score as number
    : 0
  const confidence = rawScore > 0 ? String(rawScore) : isVerified ? '78' : '62'
  const averageRating = Number(listing.average_rating) || 0
  const reviewCount = Number(listing.review_count) || 0

  return [
    listing.title,
    safeText(listing.description, `${categoryLabel} listing${regionLabel ? ` — ${regionLabel}` : ''}.`),
    listing.location_country ?? listing.region ?? '',
    categoryLabel,
    isVerified ? 'Verified' : 'Pending Review',
    isVerified ? 'Licensed Direct' : 'Mediated',
    confidence,
    listing.id,
    averageRating > 0 && reviewCount > 0 ? averageRating.toFixed(1) : '',
    reviewCount > 0 ? String(reviewCount) : '',
  ]
}

async function getDashboardMarketplaceRows(countryIso2?: string | null): Promise<Partial<DashboardMarketplaceRows>> {
  const allSections = Array.from(new Set(Object.values(VIEW_SECTIONS).flat()))
  const listings = await getListingsBySections(allSections, countryIso2, 56)
  const buckets: Partial<DashboardMarketplaceRows> = {}

  for (const listing of listings) {
    const matchingViews = (Object.entries(VIEW_SECTIONS) as [MarketView, string[]][])
      .filter(([, sections]) => sections.includes(listing.marketplace_section))
      .map(([view]) => view)
    const views: MarketView[] = matchingViews.length > 0 ? matchingViews : ['cannabis']

    for (const view of views) {
      if (!buckets[view]) buckets[view] = []
      if (buckets[view]!.length < 8) buckets[view]!.push(mapListingToDashboardRow(listing))
    }
  }

  return buckets
}

type DashboardCommandSourceContext = CommandCentreLoadContext & Readonly<{
  page: CommandPage | null
}>

export function buildDashboardCommandSources(context: DashboardCommandSourceContext) {
  const { countryIso2, roleId, userId, page } = context
  const required = getRequiredCommandCentreSourceKeys(page)
  const enabled = (key: DashboardCommandSourceKey) => required.has(key)
  let cannabisOperatorsRequest: ReturnType<typeof getCannabisOperators> | null = null
  const loadCannabisOperators = () => {
    cannabisOperatorsRequest ??= getCannabisOperators(countryIso2)
    return cannabisOperatorsRequest
  }

  return {
    signals: {
      enabled: enabled('signals'),
      load: () => fetchDashboardSignals(30),
      fallback: [],
      sourceLabel: 'Harbourview intelligence signals',
      access: 'public',
      staleAfterMs: 7 * 24 * 60 * 60 * 1000,
    },
    dailyDigest: {
      enabled: enabled('dailyDigest'),
      load: () => fetchDailyDigest(20, ALL_COUNTRIES.find(country => country.iso2 === countryIso2)?.displayName),
      fallback: { signals: [], window: 'recent' as const },
      sourceLabel: 'Harbourview daily digest',
    },
    wantedCount: {
      enabled: enabled('wantedCount'),
      load: () => getWantedRequestsCount(),
      fallback: 0,
      sourceLabel: 'Public wanted demand count',
      access: 'public',
    },
    marketplaceRows: {
      enabled: enabled('marketplaceRows'),
      load: () => getDashboardMarketplaceRows(countryIso2),
      fallback: {},
      sourceLabel: 'Public marketplace projection',
      access: 'public',
    },
    pipeline: {
      enabled: enabled('pipeline'),
      load: () => getPipelineCounts(),
      fallback: undefined,
      sourceLabel: 'Authenticated marketplace pipeline',
    },
    wantedListings: {
      enabled: enabled('wantedListings'),
      load: () => getWantedListings(countryIso2),
      fallback: [],
      sourceLabel: 'Public wanted listings',
      access: 'public',
    },
    countryIntel: {
      enabled: enabled('countryIntel'),
      load: () => getCountryIntelProfile(countryIso2),
      fallback: null,
      sourceLabel: 'Country intelligence profile',
      access: 'public',
    },
    liveEduTiles: {
      enabled: enabled('liveEduTiles'),
      load: () => getLiveEduTiles(roleId, 6),
      fallback: [],
      sourceLabel: 'Role education modules',
      access: 'public',
    },
    orgPathway: {
      enabled: enabled('orgPathway'),
      load: () => getOrgPathwayProgress(userId, countryIso2, roleId),
      fallback: undefined,
      sourceLabel: 'Organization pathway progress',
    },
    publicPathway: {
      enabled: enabled('publicPathway'),
      load: () => getPublicPathwayTemplate(countryIso2, roleId),
      fallback: undefined,
      sourceLabel: 'Public pathway template',
      access: 'public',
    },
    watchlistData: {
      enabled: enabled('watchlistData'),
      load: () => getWatchlistData(userId),
      fallback: undefined,
      sourceLabel: 'Authenticated watchlist',
    },
    evidenceData: {
      enabled: enabled('evidenceData'),
      load: () => getEvidenceData(userId, countryIso2),
      fallback: undefined,
      sourceLabel: 'Authorized evidence summary',
    },
    recentEduModules: {
      enabled: enabled('recentEduModules'),
      load: () => getRecentEduModules(3),
      fallback: [],
      sourceLabel: 'Recent education modules',
      access: 'public',
    },
    localIntel: {
      enabled: enabled('localIntel'),
      load: () => getLocalIntel(countryIso2),
      fallback: null,
      sourceLabel: 'Local intelligence',
      access: 'public',
    },
    sourceCoverage: {
      enabled: enabled('sourceCoverage'),
      load: () => getSourceCoverage(countryIso2),
      fallback: undefined,
      sourceLabel: 'Public source coverage',
      access: 'public',
    },
    registryCoverageSummary: {
      enabled: enabled('registryCoverageSummary'),
      load: () => getRegistryCoverageSummary(countryIso2),
      fallback: undefined,
      sourceLabel: 'Registry coverage summary',
      access: 'public',
    },
    jurisdictionPlaybook: {
      enabled: enabled('jurisdictionPlaybook'),
      load: () => getJurisdictionPlaybook(countryIso2),
      fallback: null,
      sourceLabel: 'Jurisdiction playbook',
      access: 'public',
    },
    educationTracks: {
      enabled: enabled('educationTracks'),
      load: () => getEducationTracks(),
      fallback: [],
      sourceLabel: 'Education tracks',
      access: 'public',
    },
    marketMetrics: {
      enabled: enabled('marketMetrics'),
      load: () => getMarketMetrics(countryIso2),
      fallback: undefined,
      sourceLabel: 'Market metrics',
      access: 'public',
    },
    tradeFlows: {
      enabled: enabled('tradeFlows'),
      load: () => getTradeFlows(countryIso2),
      fallback: undefined,
      sourceLabel: 'Trade flow intelligence',
      access: 'public',
    },
    professionals: {
      enabled: enabled('professionals'),
      load: () => getProfessionals(countryIso2),
      fallback: undefined,
      sourceLabel: 'Public professional projection',
      access: 'public',
    },
    cannabisOperators: {
      enabled: enabled('cannabisOperators') || enabled('operatorLicenceMatrix'),
      load: loadCannabisOperators,
      fallback: undefined,
      sourceLabel: 'Public operator projection',
      access: 'public',
    },
    operatorLicenceMatrix: {
      enabled: enabled('operatorLicenceMatrix'),
      load: async () => getOperatorLicenceMatrix((await loadCannabisOperators()).map(operator => operator.id)),
      fallback: { entitled: false as const },
      timeoutMs: 12_000,
      sourceLabel: 'Authorized operator licence matrix',
      access: 'operator',
    },
    cultivarPassports: {
      enabled: enabled('cultivarPassports'),
      load: () => getPublicCultivarPassports(),
      fallback: [],
      sourceLabel: 'Public cultivar passports',
      access: 'public',
    },
    serviceProviders: {
      enabled: enabled('serviceProviders'),
      load: () => getPublicServiceProviders(),
      fallback: [],
      sourceLabel: 'Public service providers',
      access: 'public',
    },
    collaborationProjects: {
      enabled: enabled('collaborationProjects'),
      load: () => getPublicCollaborationProjects(),
      fallback: [],
      sourceLabel: 'Public collaboration projects',
      access: 'public',
    },
    mySubmissions: {
      enabled: enabled('mySubmissions'),
      load: () => getUserMarketplaceSubmissions(userId),
      fallback: [],
      sourceLabel: 'Authenticated marketplace submissions',
    },
    countryEducationOverlays: {
      enabled: enabled('countryEducationOverlays'),
      load: () => getCountryEducationOverlays(countryIso2, roleId),
      fallback: [],
      sourceLabel: 'Country education overlays',
      access: 'public',
    },
    pathwayMatrix: {
      enabled: enabled('pathwayMatrix'),
      load: () => getCountryPathwayMatrix(countryIso2),
      fallback: undefined,
      sourceLabel: 'Regulatory pathway matrix',
      access: 'public',
    },
  } satisfies CommandCentreSourceMap
}
