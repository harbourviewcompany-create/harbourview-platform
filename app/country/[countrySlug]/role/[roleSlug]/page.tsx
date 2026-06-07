import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchDashboardSignals, getEduCategoriesForRole, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import { getCountryIntelProfile, getLiveEduTiles, getPipelineCounts, getWantedListings } from '@/lib/dashboard/dashboardLiveData'
import CommandCentre from '@/components/dashboard/CommandCentre'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { getListingsBySections } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import { getSafeCountryRoleRedirect, resolveCountryRoleDashboard } from '@/lib/roles/country-role-resolver'
import type { RoleId } from '@/types/globe-router'

export const dynamic = 'force-dynamic'

const COUNTRY_ROLE_TO_DASHBOARD_ROLE: Partial<Record<string, RoleId>> = {
  exporter: 'exporter',
  licensed_exporter: 'exporter',
  eu_gmp_exporter: 'exporter',
  importer: 'importer',
  licensed_importer: 'importer',
  distributor: 'distributor_wholesaler',
  wholesaler: 'distributor_wholesaler',
  customs_broker: 'logistics_customs',
  logistics_provider: 'logistics_customs',
  freight_provider: 'logistics_customs',
  licensed_cultivator: 'cultivator_producer',
  licensed_producer: 'cultivator_producer',
  greenhouse_producer: 'cultivator_producer',
  indoor_producer: 'cultivator_producer',
  outdoor_producer: 'cultivator_producer',
  micro_producer: 'cultivator_producer',
  craft_producer: 'cultivator_producer',
  geneticist: 'geneticist_breeder',
  breeder: 'geneticist_breeder',
  seed_company: 'geneticist_breeder',
  tissue_culture_provider: 'geneticist_breeder',
  processor: 'processor_extractor',
  extractor: 'processor_extractor',
  manufacturer: 'processor_extractor',
  quality_manager: 'gmp_quality',
  cannabis_lab: 'lab_qa',
  analytical_lab: 'lab_qa',
  doctor: 'doctor_prescriber',
  specialist_physician: 'doctor_prescriber',
  family_physician: 'doctor_prescriber',
  pharmacist: 'pharmacist',
  cannabis_clinic_operator: 'clinic_healthcare_operator',
  clinic_director: 'clinic_healthcare_operator',
  patient_educator: 'patient_caregiver_education',
  retail_buyer: 'retail_operator',
  licensed_buyer: 'importer',
  procurement_buyer: 'importer',
  pharmacy_buyer: 'pharmacist',
  compliance_officer: 'regulatory_compliance',
  cannabis_lawyer: 'legal_advisory',
  regulatory_lawyer: 'legal_advisory',
  regulator: 'government_regulator',
  policy_analyst: 'government_regulator',
  investor: 'investor_operator',
  strategic_acquirer: 'investor_operator',
}

const VIEW_SECTIONS: Record<MarketView, string[]> = {
  cannabis: ['cannabis_inventory', 'export_ready', 'import_demand', 'genetics', 'flower', 'extract', 'biomass'],
  equipment: ['cultivation_equipment', 'processing_equipment', 'used_surplus', 'equipment'],
  consumables: ['consumables', 'packaging'],
  'new-products': ['new_products', 'new-products'],
  services: ['services', 'professional_services', 'logistics', 'lab_testing'],
  opportunities: ['distressed_businesses', 'distressed_inventory', 'business_opportunities', 'qualified_access', 'wanted_requests'],
  wanted: ['wanted_requests', 'wanted'],
}

export async function generateMetadata({ params }: { params: Promise<{ countrySlug: string; roleSlug: string }> }): Promise<Metadata> {
  const { countrySlug, roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug)
  if (!dashboard) return { title: 'Country-role dashboard | Harbourview' }
  return { title: `${dashboard.country.countryName} ${dashboard.role.label} Dashboard | Harbourview` }
}

function resolveDashboardRoleId(roleSlug: string): RoleId | null {
  const mapped = COUNTRY_ROLE_TO_DASHBOARD_ROLE[roleSlug]
  if (mapped && ROLE_PROFILES[mapped]) return mapped
  return ROLE_PROFILES[roleSlug as RoleId] ? (roleSlug as RoleId) : null
}

function safeText(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback
}

function formatTitle(input: string): string {
  return input
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function getListingSpecType(listing: PublicListing): MarketRow[0] {
  const section = listing.marketplace_section
  if (section === 'equipment' || section === 'used_surplus' || section === 'cultivation_equipment' || section === 'processing_equipment') return 'equip'
  if (section === 'services' || section === 'professional_services' || section === 'logistics' || section === 'lab_testing') return 'service'
  return 'supply'
}

function getListingTags(listing: PublicListing): string {
  const specs = Object.entries(listing.high_level_specs)
    .slice(0, 3)
    .map(([key]) => key)
  return [listing.category, listing.subcategory, listing.product_type, listing.location_country, ...specs]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, 5)
    .map((value) => value.replace(/\s+/g, '-').toLowerCase())
    .join('|')
}

function getTrustBar(listing: PublicListing): string {
  const sellerType = listing.seller_type ?? ''
  const verified = sellerType === 'verified_seller' || sellerType === 'licensed_operator' ? 'VER:ok' : 'VER:warn'
  const proof = sellerType === 'verified_seller' ? 'PROOF:ok' : 'PROOF:warn'
  const specs = listing.high_level_specs ?? {}
  const regulatory = specs.regulatory_ready ? 'REG:ok' : 'REG:warn'
  const rawScore = typeof specs.score === 'number' ? specs.score : 0
  const score = rawScore > 0 ? `${rawScore}:${rawScore >= 80 ? 'ok' : 'warn'}` : null
  return [verified, proof, regulatory, score, 'PUBLIC'].filter(Boolean).join('|')
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
    safeText(listing.description, `${typeLabel} listing — ${regionLabel}.`),
    tags,
    getTrustBar(listing),
    'Open listing',
    statusLabel,
  ]
}

async function getDashboardMarketplaceRows(countryIso2?: string | null): Promise<Partial<DashboardMarketplaceRows>> {
  const views = Object.keys(VIEW_SECTIONS) as MarketView[]
  const results = await Promise.all(
    views.map((view) => getListingsBySections(VIEW_SECTIONS[view], countryIso2, 8)),
  )
  return Object.fromEntries(
    views.map((view, index) => [view, results[index].map(mapListingToDashboardRow)]),
  ) as Partial<DashboardMarketplaceRows>
}

function buildEvidenceGapModule(message?: string) {
  return {
    icon: '⚠️',
    title: 'Evidence gap review',
    desc: message ?? 'Harbourview has not fully verified this country-role pathway yet. Use review-gated workflows before treating this market-role path as verified.',
  }
}

export default async function CountryRoleCommandCenterPage({ params }: { params: Promise<{ countrySlug: string; roleSlug: string }> }) {
  const { countrySlug, roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug, 'public_guest')
  if (!dashboard) {
    const safeHref = getSafeCountryRoleRedirect(countrySlug, roleSlug)
    if (safeHref !== `/country/${countrySlug}/role/${roleSlug}`) redirect(safeHref)
    notFound()
  }

  const countryIso2 = dashboard.country.countryIso2
  const roleId = resolveDashboardRoleId(dashboard.role.slug)

  const [signals, wantedCount, marketplaceRows, pipeline, wantedListings, countryIntel, liveEduTiles] = await Promise.all([
    fetchDashboardSignals(8),
    getWantedRequestsCount(),
    getDashboardMarketplaceRows(countryIso2),
    getPipelineCounts(),
    getWantedListings(),
    getCountryIntelProfile(countryIso2),
    getLiveEduTiles(roleId, 6),
  ])

  const staticEduCategories = getEduCategoriesForRole(roleId ?? undefined)
  const baseEduCategories = liveEduTiles.length > 0 ? liveEduTiles : staticEduCategories
  const eduCategories = dashboard.evidence.confidence === 'evidence_gap'
    ? [buildEvidenceGapModule(dashboard.evidence.message), ...baseEduCategories]
    : baseEduCategories

  return (
    <CommandCentre
      key={`${countryIso2}-${roleId ?? dashboard.role.slug}`}
      signals={signals}
      eduCategories={eduCategories}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      wantedCount={wantedCount}
      marketplaceRows={marketplaceRows}
      pipeline={pipeline}
      wantedListings={wantedListings}
      countryIntel={countryIntel ?? undefined}
    />
  )
}
