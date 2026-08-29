import 'server-only'

import type { CommandPage, DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { fetchDashboardSignals, fetchDailyDigest, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import {
  getRepresentativeMarketplaceMedia,
  MARKETPLACE_MEDIA_COPY,
  marketplaceMediaKey,
  toRenderableMarketplaceMediaSrc,
  type DashboardMarketplaceProjection,
  type MarketplaceProjectionMedia,
} from '@/lib/dashboard/marketplaceMediaProjection'
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
import {
  getPublicMarketplaceImagesForItems,
  pickMarketplaceCardImage,
} from '@/lib/marketplace/images/public-query'
import type { PublicMarketplaceImageDTO } from '@/lib/marketplace/images/dto'
import { getListingsBySections, type PublicListing } from '@/lib/server/listingsQuery'

const VIEW_SECTIONS: Record<MarketView, string[]> = {
  cannabis: ['cannabis_inventory', 'export_ready', 'export', 'import_demand', 'genetics', 'flower', 'extract', 'biomass'],
  equipment: ['cultivation_equipment', 'processing_equipment', 'processing', 'used_surplus', 'equipment'],
  consumables: ['consumables', 'packaging'],
  'new-products': ['new_products', 'new-products'],
  services: ['services', 'professional_services', 'logistics', 'lab_testing', 'labs_testing'],
  opportunities: ['distressed_businesses', 'distressed_inventory', 'business_opportunities', 'qualified_access', 'wanted_requests'],
  wanted: ['wanted_requests', 'wanted'],
}

const ROWS_PER_VIEW = 8

/** Map taxonomy category keys → MarketView for Tier A live candidates. */
const TIER_A_CATEGORY_TO_VIEW: Record<string, MarketView> = {
  consumables: 'consumables',
  packaging: 'consumables',
  cultivation_equipment: 'equipment',
  processing_equipment: 'equipment',
  used_surplus: 'equipment',
  new_products: 'new-products',
  services: 'services',
  professional_services: 'services',
  lab_testing: 'services',
  logistics: 'services',
}

type LiveCandidateRow = {
  id: string
  title_public_draft: string | null
  description_public_draft: string | null
  marketplace_category: string | null
  country: string | null
  price_raw: string | null
  status: string | null
  created_at: string | null
}

function candidateToPublicListing(c: LiveCandidateRow): PublicListing {
  const category = (c.marketplace_category || 'consumables').replace(/-/g, '_')
  const title = safeText(c.title_public_draft, 'Marketplace listing')
  const description = safeText(c.description_public_draft, title)
  return {
    id: c.id,
    slug: null,
    title,
    description,
    category,
    subcategory: null,
    marketplace_section: category,
    product_type: null,
    region: c.country || 'global',
    condition: null,
    location_country: c.country,
    location_region: null,
    price_amount: null,
    price_currency: 'USD',
    price_display: c.price_raw?.trim() || 'Request quote',
    seller_type: 'self_serve',
    is_featured: false,
    high_level_specs: { auto_published: true },
    created_at: c.created_at || new Date().toISOString(),
    average_rating: null,
    review_count: null,
  }
}

async function loadTierAApprovedCandidates(limit = 24): Promise<LiveCandidateRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const categories = Object.keys(TIER_A_CATEGORY_TO_VIEW)
  const params = new URLSearchParams({
    select: 'id,title_public_draft,description_public_draft,marketplace_category,country,price_raw,status,created_at',
    status: 'eq.approved_draft',
    order: 'created_at.desc',
    limit: String(limit),
  })
  // PostgREST in filter for categories
  params.set('marketplace_category', `in.(${categories.join(',')})`)

  try {
    const res = await fetch(`${url}/rest/v1/marketplace_candidates?${params.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return (await res.json()) as LiveCandidateRow[]
  } catch {
    return []
  }
}

/** Raised so Supabase public image rows can complete under cold start. */
export const MARKETPLACE_MEDIA_TIMEOUT_MS = 8_000

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

function formatListingPrice(listing: PublicListing): string {
  if (listing.price_display?.trim()) return listing.price_display.trim()
  if (listing.price_amount != null && Number.isFinite(Number(listing.price_amount))) {
    const currency = listing.price_currency || 'USD'
    return `${currency} ${Number(listing.price_amount)}`
  }
  const specs = (listing.high_level_specs || {}) as Record<string, unknown>
  if (typeof specs.price_display === 'string' && specs.price_display.trim()) return specs.price_display.trim()
  return ''
}

function baseDashboardRow(listing: PublicListing): MarketRow {
  const categoryLabel = formatTitle(listing.subcategory ?? listing.product_type ?? listing.category)
  const regionLabel = listing.location_region ?? listing.location_country ?? listing.region
  const sellerType = listing.seller_type ?? ''
  const isVerified = sellerType === 'verified_seller' || sellerType === 'licensed_operator'
  const isSelfServe = sellerType === 'self_serve'
  const autoPublished = Boolean((listing.high_level_specs as Record<string, unknown> | null)?.auto_published)
  const rawScore = typeof (listing.high_level_specs as Record<string, unknown>)?.score === 'number'
    ? (listing.high_level_specs as Record<string, unknown>).score as number
    : 0
  const confidence = rawScore > 0 ? String(rawScore) : isVerified ? '78' : '62'
  const averageRating = Number(listing.average_rating) || 0
  const reviewCount = Number(listing.review_count) || 0
  const priceDisplay = formatListingPrice(listing)
  const statusLabel = isVerified
    ? 'Verified'
    : autoPublished || isSelfServe
      ? 'Open'
      : 'Pending Review'
  const channelLabel = isVerified
    ? 'Licensed Direct'
    : priceDisplay || (autoPublished || isSelfServe ? 'Contact seller' : 'Mediated')

  return [
    listing.title,
    safeText(listing.description, `${categoryLabel} listing${regionLabel ? ` — ${regionLabel}` : ''}.`),
    listing.location_country ?? listing.region ?? '',
    categoryLabel,
    statusLabel,
    channelLabel,
    confidence,
    listing.id,
    // Slot 8: prefer price for market cards; fall back to rating when present
    priceDisplay || (averageRating > 0 && reviewCount > 0 ? averageRating.toFixed(1) : ''),
    reviewCount > 0 ? String(reviewCount) : '',
  ]
}

function firstRenderableMarketplaceMediaSrc(selected: PublicMarketplaceImageDTO): string | null {
  for (const candidate of [
    selected.thumbnailUrl,
    selected.publicUrl,
    selected.heroUrl,
    selected.galleryUrl,
  ]) {
    const src = toRenderableMarketplaceMediaSrc(candidate)
    if (src) return src
  }
  return null
}

export function resolveListingMedia(
  view: MarketView,
  images: PublicMarketplaceImageDTO[] | undefined,
  listing?: { id?: string; title?: string; category?: string; marketplaceSection?: string } | null,
): MarketplaceProjectionMedia {
  const isWantedCrossListedAsOpportunity =
    view === 'opportunities'
    && (listing?.marketplaceSection === 'wanted_requests' || listing?.marketplaceSection === 'wanted')
  const fallback = isWantedCrossListedAsOpportunity
    ? getRepresentativeMarketplaceMedia(view)
    : getRepresentativeMarketplaceMedia(
      view,
      listing?.id,
      listing?.title,
      listing?.category,
    )
  const renderable = (images ?? []).filter(image => firstRenderableMarketplaceMediaSrc(image) !== null)
  const selected = pickMarketplaceCardImage(renderable)
  if (!selected) return fallback

  const src = firstRenderableMarketplaceMediaSrc(selected)
  if (!src) return fallback

  const kind: MarketplaceProjectionMedia['kind'] = selected.isIllustrative || selected.imageClass === 'HARBOURVIEW_ILLUSTRATIVE'
    ? 'representative'
    : selected.imageClass === 'REAL_ITEM_EVIDENCE'
      ? 'actual'
      : 'catalogue'
  const badgeLabel = kind === 'actual'
    ? null
    : kind === 'catalogue'
      ? selected.sourceDisplayLabel || MARKETPLACE_MEDIA_COPY.catalogueBadge
      : selected.sourceDisplayLabel || MARKETPLACE_MEDIA_COPY.representativeBadge

  return {
    src,
    altText: selected.altText || fallback.altText,
    kind,
    badgeLabel,
    caption: selected.caption,
    fallbackSrc: fallback.src,
    fallbackAltText: fallback.altText,
    fallbackCaption: fallback.fallbackCaption,
  }
}

async function loadMarketplaceMedia(itemIds: string[]): Promise<{ imagesByItem: Record<string, PublicMarketplaceImageDTO[]>; degraded: boolean }> {
  if (itemIds.length === 0) return { imagesByItem: {}, degraded: false }

  const controller = new AbortController()
  return new Promise(resolve => {
    let settled = false
    const finish = (imagesByItem: Record<string, PublicMarketplaceImageDTO[]>, degraded: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ imagesByItem, degraded })
    }
    const timer = setTimeout(() => {
      controller.abort()
      finish({}, true)
    }, MARKETPLACE_MEDIA_TIMEOUT_MS)

    getPublicMarketplaceImagesForItems(itemIds, controller.signal).then(
      images => finish(images, false),
      () => {
        controller.abort()
        finish({}, true)
      },
    )
  })
}

export async function getDashboardMarketplaceProjection(
  countryIso2?: string | null,
): Promise<DashboardMarketplaceProjection> {
  const views = Object.entries(VIEW_SECTIONS) as [MarketView, string[]][]

  const [listingsByViewRaw, tierACandidates] = await Promise.all([
    Promise.all(
      views.map(async ([view, sections]) => {
        const listings = await getListingsBySections(sections, countryIso2, ROWS_PER_VIEW)
        return [view, listings] as const
      }),
    ),
    loadTierAApprovedCandidates(ROWS_PER_VIEW * 3),
  ])

  // Merge Tier A approved_draft candidates into the matching MarketView (dedupe by id).
  const listingsByView = listingsByViewRaw.map(([view, listings]) => {
    const extras = tierACandidates
      .filter(c => TIER_A_CATEGORY_TO_VIEW[(c.marketplace_category || '').replace(/-/g, '_')] === view)
      .map(candidateToPublicListing)
      .filter(extra => !listings.some(l => l.id === extra.id))
    return [view, [...extras, ...listings].slice(0, ROWS_PER_VIEW)] as const
  })

  const itemIds = Array.from(new Set(listingsByView.flatMap(([, listings]) => listings.map(listing => listing.id))))
  const { imagesByItem, degraded } = await loadMarketplaceMedia(itemIds)

  const rows: Partial<DashboardMarketplaceRows> = {}
  const mediaById: DashboardMarketplaceProjection['mediaById'] = {}

  for (const [view, listings] of listingsByView) {
    if (listings.length === 0) continue
    rows[view] = listings.map(baseDashboardRow)
    for (const listing of listings) {
      mediaById[marketplaceMediaKey(view, listing.id)] = resolveListingMedia(view, imagesByItem[listing.id], {
        id: listing.id,
        title: listing.title,
        category: listing.subcategory ?? listing.product_type ?? listing.category,
        marketplaceSection: listing.marketplace_section,
      })
    }
  }

  return { rows, mediaById, mediaStatus: degraded ? 'degraded' : 'live' }
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
      load: () => getDashboardMarketplaceProjection(countryIso2),
      fallback: { rows: {}, mediaById: {}, mediaStatus: 'degraded' as const },
      isEmpty: projection => Object.keys(projection.rows).length === 0,
      // Listing rows are the verified source of truth. Approved-media enrichment
      // is optional and already falls back to controlled representative media,
      // so its timeout/failure must not degrade the whole Command Centre session.
      classify: projection => Object.keys(projection.rows).length === 0 ? 'empty' : 'live',
      sourceLabel: 'Public marketplace rows and approved media projection',
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
