import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchDashboardSignals, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import CommandCentre from '@/components/dashboard/CommandCentre'
import type { DashboardMarketplaceRows, MarketRow } from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { getPublicListingsByCategory, getPublicListingsBySection } from '@/lib/server/listingsQuery'
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
  if (listing.marketplace_section === 'equipment' || listing.marketplace_section === 'used_surplus') return 'equip'
  if (listing.marketplace_section === 'services') return 'service'
  return 'supply'
}

function getListingTags(listing: PublicListing): string {
  const specs = Object.entries(listing.high_level_specs)
    .slice(0, 3)
    .map(([key]) => key)

  return [listing.category, listing.subcategory, listing.product_type, listing.location_country, ...specs]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, 5)
    .map(value => value.replace(/\s+/g, '-').toLowerCase())
    .join('|')
}

function mapListingToDashboardRow(listing: PublicListing): MarketRow {
  const typeLabel = formatTitle(listing.subcategory ?? listing.product_type ?? listing.category)
  const regionLabel = listing.location_region ?? listing.location_country ?? listing.region
  const statusLabel = listing.price_display ?? listing.condition ?? (listing.is_featured ? 'Featured' : 'Listed')
  const tags = getListingTags(listing) || listing.category

  return [
    getListingSpecType(listing),
    typeLabel,
    listing.title,
    safeText(listing.description, `${typeLabel} listing for ${regionLabel}.`),
    tags,
    'VER:ok|PROOF:warn|REG:warn|PUBLIC',
    'Open listing',
    statusLabel,
  ]
}

async function getDashboardMarketplaceRows(): Promise<Partial<DashboardMarketplaceRows>> {
  const [
    cannabis,
    equipment,
    consumables,
    newProducts,
    services,
    opportunities,
  ] = await Promise.all([
    getPublicListingsByCategory('cannabis_inventory'),
    getPublicListingsBySection('used_surplus'),
    getPublicListingsByCategory('consumables'),
    getPublicListingsByCategory('new_products'),
    getPublicListingsByCategory('services'),
    getPublicListingsByCategory('business_opportunities'),
  ])

  return {
    cannabis: cannabis.map(mapListingToDashboardRow),
    equipment: equipment.map(mapListingToDashboardRow),
    consumables: consumables.map(mapListingToDashboardRow),
    'new-products': newProducts.map(mapListingToDashboardRow),
    services: services.map(mapListingToDashboardRow),
    opportunities: opportunities.map(mapListingToDashboardRow),
  }
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
