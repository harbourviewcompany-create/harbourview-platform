import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import CommandCentre from '@/components/dashboard/CommandCentre'
import type { MarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import type { RoleId } from '@/types/globe-router'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'


const DASHBOARD_MARKETPLACE_CATEGORIES: Record<MarketView, string> = {
  cannabis: 'cannabis_inventory',
  equipment: 'used_surplus',
  consumables: 'consumables',
  'new-products': 'new_products',
  services: 'services',
  opportunities: 'business_opportunities',
}

const MARKETPLACE_VIEWS = Object.keys(DASHBOARD_MARKETPLACE_CATEGORIES) as MarketView[]

const SPEC_TYPE_BY_VIEW: Record<MarketView, MarketRow[0]> = {
  cannabis: 'supply',
  equipment: 'equip',
  consumables: 'supply',
  'new-products': 'supply',
  services: 'service',
  opportunities: 'supply',
}

const ACTION_LABEL_BY_VIEW: Record<MarketView, string> = {
  cannabis: 'Request proof',
  equipment: 'Request inspection',
  consumables: 'Request quote',
  'new-products': 'Request specs',
  services: 'Book intro',
  opportunities: 'Open inquiry',
}

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function readStringSpec(specs: Record<string, unknown>, key: string): string | null {
  const value = specs[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function mapListingToMarketRow(listing: PublicListing, view: MarketView): MarketRow {
  const specs = listing.high_level_specs && typeof listing.high_level_specs === 'object' ? listing.high_level_specs : {}
  const typeLabel = listing.product_type ?? listing.subcategory ?? titleCase(listing.category)
  const tags = [listing.product_type, listing.subcategory, listing.condition, listing.location_country ?? listing.region]
    .filter((tag): tag is string => Boolean(tag?.trim()))
    .slice(0, 4)
    .map(tag => tag.replace(/[_-]+/g, ' '))
    .join('|')
  const trustScore = typeof specs.trust_score === 'number' ? specs.trust_score : listing.is_featured ? 82 : 68
  const trustString = `VER:${listing.is_featured ? 'ok' : 'warn'}|PROOF:warn|REG:warn|${trustScore}:${trustScore >= 80 ? 'ok' : 'warn'}|PUBLIC`
  const actionLabel = readStringSpec(specs, 'cta_label') ?? ACTION_LABEL_BY_VIEW[view]
  const statusLabel = listing.price_display ?? listing.condition ?? (listing.is_featured ? 'Featured' : titleCase(listing.seller_type))

  return [
    SPEC_TYPE_BY_VIEW[view],
    typeLabel,
    listing.title,
    listing.description,
    tags || titleCase(listing.category),
    trustString,
    actionLabel,
    statusLabel,
  ]
}

async function getDashboardMarketplaceRows(): Promise<MarketplaceRows> {
  const entries = await Promise.all(
    MARKETPLACE_VIEWS.map(async (view) => {
      try {
        const listings = await getPublicListingsByCategory(DASHBOARD_MARKETPLACE_CATEGORIES[view])
        return [view, listings.map(listing => mapListingToMarketRow(listing, view))] as const
      } catch {
        return [view, [] as MarketRow[]] as const
      }
    }),
  )

  return Object.fromEntries(entries) as MarketplaceRows
}

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

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeCountryParam(raw: string | null): string | null {
  if (!raw) return null
  const first = raw.split(',')[0]?.trim().toUpperCase()
  if (!first) return null

  // Globe routes sometimes pass regional IDs such as CA-QC; the dashboard state is ISO2.
  const iso2 = first.match(/^[A-Z]{2}/)?.[0] ?? null
  return iso2 && iso2.length === 2 ? iso2 : null
}

function normalizeRoleParam(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const resolved = ROLE_ALIASES[key] ?? (key as RoleId)
  return ROLE_PROFILES[resolved] ? resolved : null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  // Globe router URL params override stored preferences. Support both country and countries.
  const urlCountry = normalizeCountryParam(firstParam(params.country) ?? firstParam(params.countries))
  const urlRole = normalizeRoleParam(firstParam(params.role))

  const [signals, wantedCount, marketplaceRows] = await Promise.all([
    fetchDashboardSignals(8),
    getWantedRequestsCount(),
    getDashboardMarketplaceRows(),
  ])

  let storedCountryIso2: string | null = null
  let storedRoleId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id')
        .eq('user_id', user.id)
        .single()

      storedCountryIso2 = normalizeCountryParam(prefs?.country_iso2 ?? null)
      storedRoleId = normalizeRoleParam(prefs?.role_id ?? null)
    }
  } catch {
    // No auth or prefs table not yet migrated — show URL context or picker defaults.
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId

  const eduCategories = getEduCategoriesForRole(roleId ?? undefined)

  return (
    <CommandCentre
      signals={signals}
      eduCategories={eduCategories}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      wantedCount={wantedCount}
      marketplaceRows={marketplaceRows}
    />
  )
}
