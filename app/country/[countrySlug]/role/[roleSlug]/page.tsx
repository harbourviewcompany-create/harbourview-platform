import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CommandCentre from '@/components/dashboard/CommandCentre'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
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
  const baseEduCategories = roleId ? ROLE_EDU[roleId] ?? DEFAULT_EDU : DEFAULT_EDU
  const eduCategories = dashboard.evidence.confidence === 'evidence_gap'
    ? [buildEvidenceGapModule(dashboard.evidence.message), ...baseEduCategories]
    : baseEduCategories

  return (
    <CommandCentre
      key={`${countryIso2}-${roleId ?? dashboard.role.slug}`}
      signals={[]}
      eduCategories={eduCategories}
      initialCountryIso2={countryIso2}
      initialRoleId={roleId}
      wantedCount={0}
      marketplaceRows={{}}
      pipeline={{ wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }}
      wantedListings={[]}
      countryIntel={{
        country_code: countryIso2,
        country_name: dashboard.country.countryName,
        public_summary: dashboard.country.evidenceVerified
          ? `${dashboard.country.countryName} ${dashboard.role.label} dashboard context is available.`
          : dashboard.evidence.message ?? 'This country-role pathway requires Harbourview evidence review.',
        commercial_pathway_summary: dashboard.role.priority,
        review_status: dashboard.admin.reviewState,
      }}
    />
  )
}
