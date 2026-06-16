import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardResponsiveShell from '@/components/dashboard/DashboardResponsiveShell'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { getSafeCountryRoleRedirect, resolveCountryRoleDashboard } from '@/lib/roles/country-role-resolver'
import type { RoleId } from '@/types/globe-router'
import { fetchDashboardSignals, getWantedRequestsCount } from '@/lib/dashboard/dashboardServerData'
import { getPipelineCounts, getWantedListings, getCountryStatusFromDB, getLiveEduTiles, getPublicPathwayTemplate, getRecentEduModules, getWatchlistData, getEvidenceData, getSourceCoverage } from '@/lib/dashboard/dashboardLiveData'
import { getListingsBySections } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'

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

const ROLE_EDU: Partial<Record<RoleId, { icon: string; title: string; desc: string }[]>> = {
  exporter: [
    { icon: '✈️', title: 'Export Regulations', desc: 'Export licences and pathway requirements' },
    { icon: '📜', title: 'Documentation', desc: 'COA, GMP and permit requirements' },
    { icon: '🗺️', title: 'Market Access', desc: 'Target-market framework review' },
    { icon: '📦', title: 'Logistics & Customs', desc: 'Shipping and GDP requirements' },
  ],
  importer: [
    { icon: '📦', title: 'Import Frameworks', desc: 'Import licences and pathway requirements' },
    { icon: '⚖️', title: 'Compliance & Reg.', desc: 'Regulatory framework' },
    { icon: '🗺️', title: 'Country Rules', desc: 'Market access by jurisdiction' },
    { icon: '🤝', title: 'Trade & Access', desc: 'Partner and counterparty guidance' },
  ],
  doctor_prescriber: [
    { icon: '🩺', title: 'Prescribing Pathways', desc: 'Clinical protocols and authorisation' },
    { icon: '⚖️', title: 'Country Rules', desc: 'Jurisdiction-specific law' },
    { icon: '📖', title: 'Clinical Evidence', desc: 'Research and trial summaries' },
    { icon: '🔬', title: 'Pharmacology', desc: 'Cannabinoid mechanisms and safety' },
  ],
  pharmacist: [
    { icon: '💊', title: 'Dispensing Controls', desc: 'Dispensing and interaction safety' },
    { icon: '⚖️', title: 'Compliance & Reg.', desc: 'Pharmacy regulatory framework' },
    { icon: '🗺️', title: 'Country Rules', desc: 'Regional legal requirements' },
    { icon: '📜', title: 'Documentation', desc: 'Supplier packet and COA review' },
  ],
}

const DEFAULT_EDU = [
  { icon: '⚖️', title: 'Compliance & Reg.', desc: 'Stay audit-ready' },
  { icon: '🗺️', title: 'Country Rules', desc: 'Regional legal framework' },
  { icon: '🏛️', title: 'GMP Standards', desc: 'Manufacturing compliance' },
  { icon: '📦', title: 'Trade & Access', desc: 'Import/export frameworks' },
]

const VIEW_SECTION_MAP: Record<string, MarketView> = {
  cannabis_inventory: 'cannabis', export_ready: 'cannabis', export: 'cannabis',
  import_demand: 'cannabis', genetics: 'cannabis', flower: 'cannabis',
  extract: 'cannabis', biomass: 'cannabis',
  cultivation_equipment: 'equipment', processing_equipment: 'equipment',
  used_surplus: 'equipment', equipment: 'equipment',
  consumables: 'consumables', packaging: 'consumables',
  new_products: 'new-products', 'new-products': 'new-products',
  services: 'services', professional_services: 'services',
  logistics: 'services', lab_testing: 'services', labs_testing: 'services',
  distressed_businesses: 'opportunities', distressed_inventory: 'opportunities',
  business_opportunities: 'opportunities', qualified_access: 'opportunities',
  wanted_requests: 'wanted', wanted: 'wanted',
}

function mapListingToRow(l: PublicListing): [MarketView, MarketRow] {
  const view = VIEW_SECTION_MAP[l.marketplace_section] ?? 'cannabis'
  const st = l.seller_type ?? ''
  const verified = st === 'verified_seller' || st === 'licensed_operator'
  const regulatoryReady = Boolean((l.high_level_specs as Record<string, unknown>)?.regulatory_ready)

  const verification = verified ? 'Verified' : 'Pending Review'
  const accessRoute  = verified ? 'Direct' : 'Mediated'

  // Confidence score for the donut: base score lifted by verification signals.
  let confidence = 55
  if (verified)        confidence += 25
  if (regulatoryReady) confidence += 12
  if (l.is_featured)   confidence += 5
  confidence = Math.min(96, confidence)

  const category = [l.category, l.subcategory].filter((v): v is string => typeof v === 'string' && v.length > 0).join(' · ')

  return [view, [
    l.title,
    l.description || `${l.category} listing`,
    l.location_country || '',
    category || l.category,
    verification,
    accessRoute,
    String(confidence),
    l.id,
  ]]
}

async function getCountryRoleMarketplaceRows(
  countryIso2: string | null,
): Promise<Partial<DashboardMarketplaceRows>> {
  const allSections = Object.keys(VIEW_SECTION_MAP)
  const listings = await getListingsBySections(allSections, countryIso2, 56)
  const buckets: Partial<DashboardMarketplaceRows> = {}
  for (const l of listings) {
    const [view, row] = mapListingToRow(l)
    if (!buckets[view]) buckets[view] = []
    if (buckets[view]!.length < 8) buckets[view]!.push(row)
  }
  return buckets
}

type Props = { params: Promise<{ country: string; role: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, role: roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug)
  if (!dashboard) return { title: 'Country-role dashboard | Harbourview' }
  return { title: `${dashboard.country.countryName} ${dashboard.role.label} Dashboard | Harbourview` }
}

function resolveDashboardRoleId(roleSlug: string): RoleId | null {
  const mapped = COUNTRY_ROLE_TO_DASHBOARD_ROLE[roleSlug]
  if (mapped && ROLE_PROFILES[mapped]) return mapped
  return ROLE_PROFILES[roleSlug as RoleId] ? (roleSlug as RoleId) : null
}

function buildEvidenceGapModule(message?: string) {
  return {
    icon: '⚠️',
    title: 'Evidence gap review',
    desc: message ?? 'Harbourview has not fully verified this country-role pathway yet. Use review-gated workflows before treating this market-role path as verified.',
  }
}

export default async function CountryRoleCommandCenterPage({ params }: Props) {
  const { country: countrySlug, role: roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug, 'public_guest')
  if (!dashboard) {
    const safeHref = getSafeCountryRoleRedirect(countrySlug, roleSlug)
    if (safeHref !== `/country/${countrySlug}/role/${roleSlug}`) redirect(safeHref)
    notFound()
  }

  const countryIso2 = dashboard.country.countryIso2
  const roleId = resolveDashboardRoleId(dashboard.role.slug)
  const baseEduCategories = roleId ? ROLE_EDU[roleId] ?? DEFAULT_EDU : DEFAULT_EDU
  const eduCategories = dashboard.evidence.confidence === 'evidence_gap'
    ? [buildEvidenceGapModule(dashboard.evidence.message), ...baseEduCategories]
    : baseEduCategories

  const countryName = dashboard.country.countryName

  // Resolve authenticated userId (null for unauthenticated visitors)
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) userId = user.id
  } catch { /* unauthenticated */ }

  // Split into two tiers:
  // Tier 1 — critical path (needed for initial paint)
  const [countryStatus, pathwayData] = await Promise.all([
    getCountryStatusFromDB(countryIso2),
    getPublicPathwayTemplate(countryIso2, roleId),
  ])

  // Tier 2 — deferred (streamed in after shell renders)
  const [signals, pipeline, wantedListings, wantedCount, marketplaceRows, liveTiles, recentEduModules, watchlistData, evidenceData, sourceCoverage] = await Promise.all([
    fetchDashboardSignals(40, countryName),
    getPipelineCounts(),
    getWantedListings(countryIso2),
    getWantedRequestsCount(),
    getCountryRoleMarketplaceRows(countryIso2),
    getLiveEduTiles(roleId),
    getRecentEduModules(),
    getWatchlistData(userId),
    getEvidenceData(userId, countryIso2),
    getSourceCoverage(countryIso2),
  ])

  return (
    <DashboardResponsiveShell
      key={`${countryIso2}-${roleId ?? dashboard.role.slug}`}
      signals={signals}
      eduCategories={eduCategories}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      wantedCount={wantedCount}
      marketplaceRows={marketplaceRows}
      pipeline={pipeline}
      watchlistData={watchlistData}
      evidenceData={evidenceData}
      sourceCoverage={sourceCoverage}
      wantedListings={wantedListings}
      liveTiles={liveTiles}
      pathwayData={pathwayData}
      recentEduModules={recentEduModules}
      countryIntel={{
        country_code:          countryIso2,
        country_name:          countryStatus?.country_name ?? dashboard.country.countryName,
        region:                countryStatus?.region ?? null,
        market_access_status:  countryStatus?.market_access_status ?? null,
        medical_status:        countryStatus?.medical_status ?? null,
        adult_use_status:      countryStatus?.adult_use_status ?? null,
        import_status:         countryStatus?.import_status ?? null,
        export_status:         countryStatus?.export_status ?? null,
        opportunity_score:     countryStatus?.opportunity_score ?? null,
        trade_roles:           countryStatus?.trade_roles ?? null,
        opportunity_categories: countryStatus?.opportunity_categories ?? null,
        regulator_label:       countryStatus?.regulator_label ?? null,
        data_completeness:     countryStatus?.data_completeness ?? null,
        public_summary:        countryStatus?.public_summary
          ?? (dashboard.country.evidenceVerified
            ? `${dashboard.country.countryName} ${dashboard.role.label} dashboard context is available.`
            : dashboard.evidence.message
            ?? 'This country-role pathway requires Harbourview evidence review.'),
        commercial_pathway_summary: dashboard.role.priority,
        review_status:         dashboard.admin.reviewState,
      }}
    />
  )
}

