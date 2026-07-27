import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, fetchDailyDigest, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import { getPipelineCounts, getWantedListings, getLiveEduTiles, getCountryIntelProfile, getOrgPathwayProgress, getPublicPathwayTemplate, getWatchlistData, getEvidenceData, getRecentEduModules, getLocalIntel, getSourceCoverage, getRegistryCoverageSummary, getJurisdictionPlaybook, getEducationTracks, getMarketMetrics, getTradeFlows, getProfessionals, getCannabisOperators, getUserMarketplaceSubmissions, getCountryEducationOverlays } from '@/lib/dashboard/dashboardLiveData'
import { getPublicCultivarPassports, getPublicServiceProviders, getPublicCollaborationProjects } from '@/lib/genetics/queries'
import { getCountryPathwayMatrix } from '@/lib/intelligence/regulatoryPathways'
import { checkFeatureAccess } from '@/lib/billing/entitlements'
import { getOperatorLicenceMatrix } from '@/lib/intelligence/operatorIntelligence'
import DashboardResponsiveShell from '@/components/dashboard/DashboardResponsiveShell'
import type { CommandPage, DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { getListingsBySections } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import type { RoleId } from '@/types/globe-router'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'

const ROLE_ALIASES: Record<string, RoleId> = {
  buyer: 'importer',
  importer: 'importer',
  importer_buyer: 'importer',
  supplier: 'exporter',
  exporter: 'exporter',
  seller: 'exporter',
  producer: 'cultivator_producer',
  cultivator: 'cultivator_producer',
  processor: 'processor_extractor',
  extractor: 'processor_extractor',
  doctor: 'doctor_prescriber',
  prescriber: 'doctor_prescriber',
  pharmacist: 'pharmacist',
  compliance: 'regulatory_compliance',
  regulator: 'government_regulator',
}

// Sections grouped by dashboard MarketView tab
const VIEW_SECTIONS: Record<MarketView, string[]> = {
  cannabis:        ['cannabis_inventory', 'export_ready', 'export', 'import_demand', 'genetics', 'flower', 'extract', 'biomass'],
  equipment:       ['cultivation_equipment', 'processing_equipment', 'used_surplus', 'equipment'],
  consumables:     ['consumables', 'packaging'],
  'new-products':  ['new_products', 'new-products'],
  services:        ['services', 'professional_services', 'logistics', 'lab_testing', 'labs_testing'],
  opportunities:   ['distressed_businesses', 'distressed_inventory', 'business_opportunities', 'qualified_access', 'wanted_requests'],
  wanted:          ['wanted_requests', 'wanted'],
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeCountryParam(raw: string | null): string | null {
  if (!raw) return null
  const first = raw.split(',')[0]?.trim().toUpperCase()
  if (!first) return null
  // Subnational: US-GA → US, CA-ON → CA
  const subMatch = first.match(/^([A-Z]{2})-[A-Z0-9]{2,3}$/)
  if (subMatch) return subMatch[1]
  // Standard ISO2
  return first.match(/^[A-Z]{2}$/)?.[0] ?? null
}

function normalizeRoleParam(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const resolved = ROLE_ALIASES[key] ?? (key as RoleId)
  return ROLE_PROFILES[resolved] ? resolved : null
}

// Every redirected standalone route lands on one of these — keep in sync with
// the CommandPage union and CommandCentre's NAV_ITEMS_FLAT.
const VALID_COMMAND_PAGES: readonly CommandPage[] = [
  'briefing', 'digest', 'access-pathway', 'marketplace', 'evidence', 'education',
  'regulatory', 'local-intel', 'signals', 'watchlist', 'settings',
  'genetics', 'compliance', 'countries',
]

function normalizePageParam(raw: string | null): CommandPage | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  return (VALID_COMMAND_PAGES as readonly string[]).includes(key) ? (key as CommandPage) : null
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

function getListingSpecType(listing: PublicListing): MarketRow[0] {
  const s = listing.marketplace_section
  if (s === 'equipment' || s === 'used_surplus' || s === 'cultivation_equipment' || s === 'processing_equipment') return 'equip'
  if (s === 'services' || s === 'professional_services' || s === 'logistics' || s === 'lab_testing') return 'service'
  return 'supply'
}

function getListingTags(listing: PublicListing): string {
  const specs = Object.entries(listing.high_level_specs)
    .slice(0, 3)
    .map(([key]) => key)
  return [listing.category, listing.subcategory, listing.product_type, listing.location_country, ...specs]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, 5)
    .map(v => v.replace(/\s+/g, '-').toLowerCase())
    .join('|')
}

function getTrustBar(listing: PublicListing): string {
  const st = listing.seller_type ?? ''
  const ver   = st === 'verified_seller'   ? 'VER:ok'   : st === 'licensed_operator' ? 'VER:ok'   : 'VER:warn'
  const proof = st === 'verified_seller'   ? 'PROOF:ok' : st === 'licensed_operator' ? 'PROOF:warn': 'PROOF:warn'
  const specs = listing.high_level_specs ?? {}
  const reg   = specs.regulatory_ready    ? 'REG:ok'   : 'REG:warn'
  const rawScore = typeof specs.score === 'number' ? specs.score : 0
  const score = rawScore > 0 ? `${rawScore}:${rawScore >= 80 ? 'ok' : 'warn'}` : null
  const parts = [ver, proof, reg, score, 'PUBLIC'].filter(Boolean)
  return parts.join('|')
}

function mapListingToDashboardRow(listing: PublicListing): MarketRow {
  const categoryLabel = formatTitle(listing.subcategory ?? listing.product_type ?? listing.category)
  const regionLabel = listing.location_region ?? listing.location_country ?? listing.region
  const st = listing.seller_type ?? ''
  const isVerified = st === 'verified_seller' || st === 'licensed_operator'
  const rawScore = typeof (listing.high_level_specs as Record<string, unknown>)?.score === 'number'
    ? (listing.high_level_specs as Record<string, unknown>).score as number
    : 0
  const confidence = rawScore > 0 ? String(rawScore) : isVerified ? '78' : '62'

  const averageRating = Number(listing.average_rating) || 0
  const reviewCount = Number(listing.review_count) || 0

  return [
    listing.title,
    safeText(listing.description, `${categoryLabel} listing${regionLabel ? ' — ' + regionLabel : ''}.`),
    listing.location_country ?? listing.region ?? '',
    categoryLabel,
    isVerified ? 'Verified' : 'Pending Review',
    isVerified ? 'Licensed Direct' : 'Mediated',
    confidence,
    listing.id,
    // Numeric columns arrive as strings from some Postgres/PostgREST paths
    // (confirmed for average_rating) — store pre-formatted, empty when unrated.
    averageRating > 0 && reviewCount > 0 ? averageRating.toFixed(1) : '',
    reviewCount > 0 ? String(reviewCount) : '',
  ]
}

async function getDashboardMarketplaceRows(
  countryIso2?: string | null,
): Promise<Partial<DashboardMarketplaceRows>> {
  // Fetch all sections in a single query and bucket by MarketView client-side.
  // Previously this was 7 parallel requests (one per view tab); one request is
  // cheaper and avoids 7× connection overhead on every page render.
  const allSections = Array.from(new Set(Object.values(VIEW_SECTIONS).flat()))
  const listings = await getListingsBySections(allSections, countryIso2, 56)

  // Build a section → view lookup for O(1) bucketing
  const sectionToView = new Map<string, MarketView>()
  for (const [view, sections] of Object.entries(VIEW_SECTIONS) as [MarketView, string[]][]) {
    for (const s of sections) sectionToView.set(s, view)
  }

  const buckets: Partial<DashboardMarketplaceRows> = {}
  for (const listing of listings) {
    const view = sectionToView.get(listing.marketplace_section) ?? 'cannabis'
    if (!buckets[view]) buckets[view] = []
    // Cap each tab at 8 rows (same as before)
    if (buckets[view]!.length < 8) {
      buckets[view]!.push(mapListingToDashboardRow(listing))
    }
  }
  return buckets
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const urlCountry = normalizeCountryParam(firstParam(params.country) ?? firstParam(params.countries))
  const urlRole    = normalizeRoleParam(firstParam(params.role))
  const urlPage     = normalizePageParam(firstParam(params.page))

  let userId:           string | null = null
  let userEmail:        string | null = null
  let userAppMetadata:  Record<string, unknown> | undefined
  let storedCountryIso2: string | null = null
  let storedRoleId: string | null = null
  let hasOrg: boolean = true // default true so unauthenticated/unknown state never shows the banner

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      userEmail = user.email ?? null
      userAppMetadata = user.app_metadata
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id')
        .eq('user_id', user.id)
        .single()
      storedCountryIso2 = normalizeCountryParam(prefs?.country_iso2 ?? null)
      storedRoleId = normalizeRoleParam(prefs?.role_id ?? null)

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      hasOrg = !!membership
    }
  } catch {
    // No auth or prefs table not yet migrated.
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId      = urlRole    ?? storedRoleId

  function settledOr<T>(result: PromiseSettledResult<T>, fallback: T, label: string): T {
    if (result.status === 'fulfilled') return result.value
    console.error(`[dashboard] ${label} failed:`, result.reason)
    return fallback
  }

  const [
    signalsResult, dailyDigestResult, wantedCountResult, marketplaceRowsResult,
    pipelineResult, wantedListingsResult, countryIntelResult, liveEduTilesResult,
    pathwayDataResult, , watchlistDataResult, evidenceDataResult,
    recentEduModulesResult, localIntelResult, sourceCoverageResult, registryCoverageSummaryResult, jurisdictionPlaybookResult,
    educationTracksResult, marketMetricsResult, tradeFlowsResult, professionalsResult,
    cannabisOperatorsResult, cultivarPassportsResult, serviceProvidersResult, collaborationProjectsResult,
    mySubmissionsResult, countryEducationOverlaysResult, pathwayMatrixResult,
  ] = await Promise.allSettled([
    fetchDashboardSignals(30),
    urlPage === 'digest' ? fetchDailyDigest(20, ALL_COUNTRIES.find(c => c.iso2 === countryIso2)?.displayName) : Promise.resolve({ signals: [], window: 'recent' as const }),
    getWantedRequestsCount(),
    getDashboardMarketplaceRows(countryIso2),
    getPipelineCounts(),
    getWantedListings(countryIso2),
    getCountryIntelProfile(countryIso2),
    getLiveEduTiles(roleId, 6),
    getOrgPathwayProgress(userId, countryIso2, roleId),
    getPublicPathwayTemplate(countryIso2, roleId),
    getWatchlistData(userId),
    getEvidenceData(userId, countryIso2),
    getRecentEduModules(3),
    getLocalIntel(countryIso2),
    getSourceCoverage(countryIso2),
    getRegistryCoverageSummary(countryIso2),
    getJurisdictionPlaybook(countryIso2),
    getEducationTracks(),
    getMarketMetrics(countryIso2),
    getTradeFlows(countryIso2),
    getProfessionals(countryIso2),
    getCannabisOperators(countryIso2),
    getPublicCultivarPassports(),
    getPublicServiceProviders(),
    getPublicCollaborationProjects(),
    getUserMarketplaceSubmissions(userId),
    getCountryEducationOverlays(countryIso2, roleId),
    getCountryPathwayMatrix(countryIso2),
  ])

  const signals               = settledOr(signalsResult, [], 'fetchDashboardSignals')
  const dailyDigest            = settledOr(dailyDigestResult, { signals: [], window: 'recent' }, 'fetchDailyDigest')
  const wantedCount            = settledOr(wantedCountResult, 0, 'getWantedRequestsCount')
  const marketplaceRows        = settledOr(marketplaceRowsResult, {}, 'getDashboardMarketplaceRows')
  const pipeline               = settledOr(pipelineResult, undefined, 'getPipelineCounts')
  const wantedListings         = settledOr(wantedListingsResult, [], 'getWantedListings')
  const countryIntel           = settledOr(countryIntelResult, null, 'getCountryIntelProfile')
  const liveEduTiles           = settledOr(liveEduTilesResult, [], 'getLiveEduTiles')
  const pathwayData            = settledOr(pathwayDataResult, undefined, 'getOrgPathwayProgress')
  const watchlistData          = settledOr(watchlistDataResult, undefined, 'getWatchlistData')
  const watchlistAccess        = checkFeatureAccess({ app_metadata: userAppMetadata }, 'watchlist')
  const evidenceData           = settledOr(evidenceDataResult, undefined, 'getEvidenceData')
  const recentEduModules       = settledOr(recentEduModulesResult, [], 'getRecentEduModules')
  const localIntel             = settledOr(localIntelResult, null, 'getLocalIntel')
  const sourceCoverage         = settledOr(sourceCoverageResult, undefined, 'getSourceCoverage')
  const registryCoverageSummary = settledOr(registryCoverageSummaryResult, undefined, 'getRegistryCoverageSummary')
  const jurisdictionPlaybook   = settledOr(jurisdictionPlaybookResult, null, 'getJurisdictionPlaybook')
  const educationTracks        = settledOr(educationTracksResult, [], 'getEducationTracks')
  const marketMetrics          = settledOr(marketMetricsResult, undefined, 'getMarketMetrics')
  const tradeFlows             = settledOr(tradeFlowsResult, undefined, 'getTradeFlows')
  const professionals          = settledOr(professionalsResult, undefined, 'getProfessionals')
  const cannabisOperators      = settledOr(cannabisOperatorsResult, undefined, 'getCannabisOperators')
  const operatorLicenceMatrix  = await getOperatorLicenceMatrix((cannabisOperators ?? []).map(op => op.id))
    .catch(() => ({ entitled: false as const }))
  const cultivarPassports      = settledOr(cultivarPassportsResult, [], 'getPublicCultivarPassports')
  const serviceProviders       = settledOr(serviceProvidersResult, [], 'getPublicServiceProviders')
  const collaborationProjects  = settledOr(collaborationProjectsResult, [], 'getPublicCollaborationProjects')
  const mySubmissions          = settledOr(mySubmissionsResult, [], 'getUserMarketplaceSubmissions')
  const countryEducationOverlays = settledOr(countryEducationOverlaysResult, [], 'getCountryEducationOverlays')
  const pathwayMatrix          = settledOr(pathwayMatrixResult, undefined, 'getCountryPathwayMatrix')

  const staticEduCategories = getEduCategoriesForRole(roleId ?? undefined)
  const eduCategories = liveEduTiles.length > 0 ? liveEduTiles : staticEduCategories

  return (
    <DashboardResponsiveShell
      key={`${countryIso2 ?? 'none'}-${roleId ?? 'none'}-${urlPage ?? 'none'}`}
      hasOrg={hasOrg}
      signals={signals}
      digestSignals={dailyDigest.signals}
      digestWindow={dailyDigest.window}
      eduCategories={eduCategories}
      liveTiles={liveEduTiles.length > 0 ? liveEduTiles : undefined}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      initialPage={urlPage}
      wantedCount={wantedCount}
      marketplaceRows={marketplaceRows}
      pipeline={pipeline}
      wantedListings={wantedListings}
      countryIntel={countryIntel ?? undefined}
      localIntel={localIntel ?? undefined}
      pathwayData={pathwayData}
      watchlistData={watchlistData}
      watchlistAccess={watchlistAccess}
      evidenceData={evidenceData}
      recentEduModules={recentEduModules}
      sourceCoverage={sourceCoverage}
      registryCoverageSummary={registryCoverageSummary ?? undefined}
      jurisdictionPlaybook={jurisdictionPlaybook ?? undefined}
      pathwayMatrix={pathwayMatrix}
      educationTracks={educationTracks}
      marketMetrics={marketMetrics}
      tradeFlows={tradeFlows}
      professionals={professionals}
      cannabisOperators={cannabisOperators}
      operatorLicenceMatrix={operatorLicenceMatrix}
      userEmail={userEmail}
      cultivarPassports={cultivarPassports}
      serviceProviders={serviceProviders}
      collaborationProjects={collaborationProjects}
      mySubmissions={mySubmissions}
      countryEducationOverlays={countryEducationOverlays}
    />
  )
}

