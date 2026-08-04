import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, fetchDailyDigest, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import { getPipelineCounts, getWantedListings, getLiveEduTiles, getCountryIntelProfile, getOrgPathwayProgress, getPublicPathwayTemplate, getWatchlistData, getEvidenceData, getRecentEduModules, getLocalIntel, getSourceCoverage, getRegistryCoverageSummary, getJurisdictionPlaybook, getEducationTracks, getMarketMetrics, getTradeFlows, getProfessionals, getCannabisOperators, getUserMarketplaceSubmissions, getCountryEducationOverlays } from '@/lib/dashboard/dashboardLiveData'
import { mergePathwayData, deriveRequirementStatusesFromIntel } from '@/lib/dashboard/pathwayReadiness'
import { getPublicCultivarPassports, getPublicServiceProviders, getPublicCollaborationProjects } from '@/lib/genetics/queries'
import { getCountryPathwayMatrix } from '@/lib/intelligence/regulatoryPathways'
import { checkFeatureAccess } from '@/lib/billing/entitlements'
import { getOperatorLicenceMatrix } from '@/lib/intelligence/operatorIntelligence'
import DashboardResponsiveShell from '@/components/dashboard/DashboardResponsiveShell'
import CommandCentreDataBoundary from '@/components/dashboard/CommandCentreDataBoundary'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { getListingsBySections } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import type { RoleId } from '@/types/globe-router'
import { normalizeCommandPage } from '@/lib/platform/commandCentreRegistry'
import { loadCommandCentreData } from '@/lib/dashboard/loadCommandCentreData'

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
  const subMatch = first.match(/^([A-Z]{2})-[A-Z0-9]{2,3}$/)
  if (subMatch) return subMatch[1]
  return first.match(/^[A-Z]{2}$/)?.[0] ?? null
}

function normalizeRoleParam(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const resolved = ROLE_ALIASES[key] ?? (key as RoleId)
  return ROLE_PROFILES[resolved] ? resolved : null
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
    averageRating > 0 && reviewCount > 0 ? averageRating.toFixed(1) : '',
    reviewCount > 0 ? String(reviewCount) : '',
  ]
}

async function getDashboardMarketplaceRows(
  countryIso2?: string | null,
): Promise<Partial<DashboardMarketplaceRows>> {
  const allSections = Array.from(new Set(Object.values(VIEW_SECTIONS).flat()))
  const listings = await getListingsBySections(allSections, countryIso2, 56)
  const sectionToView = new Map<string, MarketView>()

  for (const [view, sections] of Object.entries(VIEW_SECTIONS) as [MarketView, string[]][]) {
    for (const section of sections) sectionToView.set(section, view)
  }

  const buckets: Partial<DashboardMarketplaceRows> = {}
  for (const listing of listings) {
    const view = sectionToView.get(listing.marketplace_section) ?? 'cannabis'
    if (!buckets[view]) buckets[view] = []
    if (buckets[view]!.length < 8) buckets[view]!.push(mapListingToDashboardRow(listing))
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
  const urlRole = normalizeRoleParam(firstParam(params.role))
  const urlPage = normalizeCommandPage(firstParam(params.page))

  let userId: string | null = null
  let userEmail: string | null = null
  let userAppMetadata: Record<string, unknown> | undefined
  let storedCountryIso2: string | null = null
  let storedRoleId: string | null = null
  let hasOrg = true

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
  } catch (error) {
    console.error('[command-centre-auth-context]', {
      code: error instanceof Error ? error.name : 'AUTH_CONTEXT_FAILED',
    })
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId

  const commandData = await loadCommandCentreData(
    {
      countryIso2,
      roleId,
      page: urlPage,
      userId,
      userEmail,
      hasOrganization: hasOrg,
    },
    {
      signals: {
        load: () => fetchDashboardSignals(30),
        fallback: [],
        sourceLabel: 'Harbourview intelligence signals',
        access: 'public',
        staleAfterMs: 7 * 24 * 60 * 60 * 1000,
      },
      dailyDigest: {
        load: () => urlPage === 'digest'
          ? fetchDailyDigest(20, ALL_COUNTRIES.find(country => country.iso2 === countryIso2)?.displayName)
          : Promise.resolve({ signals: [], window: 'recent' as const }),
        fallback: { signals: [], window: 'recent' as const },
        sourceLabel: 'Harbourview daily digest',
      },
      wantedCount: {
        load: () => getWantedRequestsCount(),
        fallback: 0,
        sourceLabel: 'Public wanted demand count',
        access: 'public',
      },
      marketplaceRows: {
        load: () => getDashboardMarketplaceRows(countryIso2),
        fallback: {},
        sourceLabel: 'Public marketplace projection',
        access: 'public',
      },
      pipeline: {
        load: () => getPipelineCounts(),
        fallback: undefined,
        sourceLabel: 'Authenticated marketplace pipeline',
      },
      wantedListings: {
        load: () => getWantedListings(countryIso2),
        fallback: [],
        sourceLabel: 'Public wanted listings',
        access: 'public',
      },
      countryIntel: {
        load: () => getCountryIntelProfile(countryIso2),
        fallback: null,
        sourceLabel: 'Country intelligence profile',
        access: 'public',
      },
      liveEduTiles: {
        load: () => getLiveEduTiles(roleId, 6),
        fallback: [],
        sourceLabel: 'Role education modules',
        access: 'public',
      },
      orgPathway: {
        load: () => getOrgPathwayProgress(userId, countryIso2, roleId),
        fallback: undefined,
        sourceLabel: 'Organization pathway progress',
      },
      publicPathway: {
        load: () => getPublicPathwayTemplate(countryIso2, roleId),
        fallback: undefined,
        sourceLabel: 'Public pathway template',
        access: 'public',
      },
      watchlistData: {
        load: () => getWatchlistData(userId),
        fallback: undefined,
        sourceLabel: 'Authenticated watchlist',
      },
      evidenceData: {
        load: () => getEvidenceData(userId, countryIso2),
        fallback: undefined,
        sourceLabel: 'Authorized evidence summary',
      },
      recentEduModules: {
        load: () => getRecentEduModules(3),
        fallback: [],
        sourceLabel: 'Recent education modules',
        access: 'public',
      },
      localIntel: {
        load: () => getLocalIntel(countryIso2),
        fallback: null,
        sourceLabel: 'Local intelligence',
        access: 'public',
      },
      sourceCoverage: {
        load: () => getSourceCoverage(countryIso2),
        fallback: undefined,
        sourceLabel: 'Public source coverage',
        access: 'public',
      },
      registryCoverageSummary: {
        load: () => getRegistryCoverageSummary(countryIso2),
        fallback: undefined,
        sourceLabel: 'Registry coverage summary',
        access: 'public',
      },
      jurisdictionPlaybook: {
        load: () => getJurisdictionPlaybook(countryIso2),
        fallback: null,
        sourceLabel: 'Jurisdiction playbook',
        access: 'public',
      },
      educationTracks: {
        load: () => getEducationTracks(),
        fallback: [],
        sourceLabel: 'Education tracks',
        access: 'public',
      },
      marketMetrics: {
        load: () => getMarketMetrics(countryIso2),
        fallback: undefined,
        sourceLabel: 'Market metrics',
        access: 'public',
      },
      tradeFlows: {
        load: () => getTradeFlows(countryIso2),
        fallback: undefined,
        sourceLabel: 'Trade flow intelligence',
        access: 'public',
      },
      professionals: {
        load: () => getProfessionals(countryIso2),
        fallback: undefined,
        sourceLabel: 'Public professional projection',
        access: 'public',
      },
      cannabisOperators: {
        load: () => getCannabisOperators(countryIso2),
        fallback: undefined,
        sourceLabel: 'Public operator projection',
        access: 'public',
      },
      cultivarPassports: {
        load: () => getPublicCultivarPassports(),
        fallback: [],
        sourceLabel: 'Public cultivar passports',
        access: 'public',
      },
      serviceProviders: {
        load: () => getPublicServiceProviders(),
        fallback: [],
        sourceLabel: 'Public service providers',
        access: 'public',
      },
      collaborationProjects: {
        load: () => getPublicCollaborationProjects(),
        fallback: [],
        sourceLabel: 'Public collaboration projects',
        access: 'public',
      },
      mySubmissions: {
        load: () => getUserMarketplaceSubmissions(userId),
        fallback: [],
        sourceLabel: 'Authenticated marketplace submissions',
      },
      countryEducationOverlays: {
        load: () => getCountryEducationOverlays(countryIso2, roleId),
        fallback: [],
        sourceLabel: 'Country education overlays',
        access: 'public',
      },
      pathwayMatrix: {
        load: () => getCountryPathwayMatrix(countryIso2),
        fallback: undefined,
        sourceLabel: 'Regulatory pathway matrix',
        access: 'public',
      },
    },
  )

  const {
    signals,
    dailyDigest,
    wantedCount,
    marketplaceRows,
    pipeline,
    wantedListings,
    countryIntel,
    liveEduTiles,
    orgPathway,
    publicPathway,
    watchlistData,
    evidenceData,
    recentEduModules,
    localIntel,
    sourceCoverage,
    registryCoverageSummary,
    jurisdictionPlaybook,
    educationTracks,
    marketMetrics,
    tradeFlows,
    professionals,
    cannabisOperators,
    cultivarPassports,
    serviceProviders,
    collaborationProjects,
    mySubmissions,
    countryEducationOverlays,
    pathwayMatrix,
  } = commandData.data

  const watchlistAccess = checkFeatureAccess({ app_metadata: userAppMetadata }, 'watchlist')
  const operatorLicenceMatrix = await getOperatorLicenceMatrix((cannabisOperators ?? []).map(operator => operator.id))
    .catch(error => {
      console.error('[command-centre-source]', {
        source: 'operatorLicenceMatrix',
        code: error instanceof Error ? error.name : 'OPERATOR_LICENCE_MATRIX_FAILED',
        countryIso2,
        roleId,
        page: urlPage,
      })
      return { entitled: false as const }
    })

  const pathwayData = deriveRequirementStatusesFromIntel(
    mergePathwayData(orgPathway, publicPathway),
    countryIntel,
  )

  const staticEduCategories = getEduCategoriesForRole(roleId ?? undefined)
  const eduCategories = liveEduTiles.length > 0 ? liveEduTiles : staticEduCategories

  return (
    <CommandCentreDataBoundary
      state={commandData.state}
      sources={commandData.sources}
      loadedAt={commandData.loadedAt}
    >
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
    </CommandCentreDataBoundary>
  )
}
