/**
 * Typed route-aware contract for Command Centre jurisdiction routes.
 * Every visible data field on /country/[country] and sub-routes must
 * be backed by this contract or render an explicit pending/unavailable state.
 * No raw DB enum values may appear in the public UI.
 */

import { canadaProvinceBySlug } from '@/data/globe/canada-province-profiles'
import { usStateBySlug } from '@/data/globe/us-state-profiles'

// ── Slug → ISO2 mapping ────────────────────────────────────────────────────────

const SLUG_TO_ISO2: Record<string, string> = {
  'canada': 'CA', 'united-states': 'US', 'germany': 'DE', 'australia': 'AU',
  'france': 'FR', 'italy': 'IT', 'netherlands': 'NL', 'portugal': 'PT',
  'poland': 'PL', 'united-kingdom': 'GB', 'spain': 'ES', 'brazil': 'BR',
  'israel': 'IL', 'czechia': 'CZ', 'czech-republic': 'CZ', 'denmark': 'DK',
  'switzerland': 'CH', 'new-zealand': 'NZ', 'colombia': 'CO', 'thailand': 'TH',
  'malta': 'MT', 'luxembourg': 'LU', 'south-africa': 'ZA', 'uruguay': 'UY',
  'mexico': 'MX', 'japan': 'JP', 'thailand': 'TH',
}

const SLUG_ALIASES: Record<string, string> = {
  'uk': 'united-kingdom', 'us': 'united-states', 'usa': 'united-states',
  'great-britain': 'united-kingdom', 'turkey': 'turkiye',
  'united-states-of-america': 'united-states',
}

/** Map URL role slugs to canonical RoleId values. */
const ROLE_SLUG_TO_ID: Record<string, string> = {
  'doctor': 'doctor_prescriber', 'prescriber': 'doctor_prescriber',
  'pharmacist': 'pharmacist', 'budtender': 'budtender',
  'cultivator': 'cultivator_producer', 'producer': 'cultivator_producer',
  'processor': 'processor_extractor', 'extractor': 'processor_extractor',
  'lab': 'lab_qa', 'importer': 'importer', 'buyer': 'importer',
  'exporter': 'exporter', 'supplier': 'exporter',
  'distributor': 'distributor_wholesaler',
  'compliance': 'regulatory_compliance', 'regulator': 'government_regulator',
  'investor': 'investor_operator', 'legal': 'legal_advisory',
  'patient': 'patient_caregiver_education', 'gmp': 'gmp_quality',
  'logistics': 'logistics_customs',
}

const ROLE_ID_TO_LABEL: Record<string, string> = {
  'doctor_prescriber': 'Doctor / Prescriber', 'pharmacist': 'Pharmacist',
  'budtender': 'Budtender', 'cultivator_producer': 'Cultivator / Producer',
  'processor_extractor': 'Processor / Extractor', 'lab_qa': 'Lab / QA',
  'importer': 'Importer', 'exporter': 'Exporter',
  'distributor_wholesaler': 'Distributor / Wholesaler',
  'regulatory_compliance': 'Regulatory / Compliance',
  'government_regulator': 'Government Regulator',
  'investor_operator': 'Investor / Operator', 'legal_advisory': 'Legal / Advisory',
  'patient_caregiver_education': 'Patient / Caregiver', 'gmp_quality': 'GMP / Quality',
  'logistics_customs': 'Logistics / Customs',
  'clinic_healthcare_operator': 'Clinic / Healthcare Operator',
  'retail_operator': 'Retail Operator', 'geneticist_breeder': 'Geneticist / Breeder',
  'not_sure': 'General',
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type CCRouteType =
  | 'country'
  | 'state'
  | 'province'
  | 'country_role'
  | 'state_role'
  | 'province_role'

/**
 * Review state for all data fields.
 * Never use raw DB enum values (e.g. needs_review) in UI.
 */
export type CCReviewState = 'reviewed' | 'pending' | 'unavailable'

export interface CCRouteSegments {
  countrySlug: string
  stateSlug?: string
  roleSlug?: string
}

export interface CCResolvedRoute {
  type: CCRouteType
  countrySlug: string
  countryIso2: string
  countryName: string
  stateSlug?: string
  stateIso2?: string
  stateName?: string
  roleSlug?: string
  roleId?: string
  roleName?: string
  canonicalHref: string
  parentCountryHref?: string
}

export interface CCBriefingContract {
  programStatus: string | null
  programStatusReviewState: CCReviewState
  patientAccess: string | null
  physicianAccess: string | null
  marketDynamics: string | null
  regulatoryOutlook: string | null
  publicSummary: string | null
}

export interface CCEvidenceContract {
  dataSourceSummary: string | null
  verificationSummary: string | null
  updateCadence: string | null
  coverageSummary: string | null
  lastReviewedDate: string | null
  reviewState: CCReviewState
}

export interface CCConfidenceContract {
  overall: number | null
  reviewState: CCReviewState
  categories: Array<{
    label: string
    pct: number | null
    reviewState: CCReviewState
  }>
}

export interface CCWatchRegion {
  name: string
  href: string | null
  statusLabel: string
  isActive: boolean
  isAvailable: boolean
}

export interface CCWatchRegionsContract {
  reviewState: CCReviewState
  isDefaultSuggested: boolean
  regions: CCWatchRegion[]
}

export interface CCChangeNote {
  market: string
  title: string
  timeAgo: string
  direction: 'up' | 'down' | 'neutral'
  sourceRef: string | null
  reviewState: CCReviewState
}

export interface CCChangeNotesContract {
  reviewState: CCReviewState
  notes: CCChangeNote[]
}

export interface CCCtasContract {
  fullProfileHref: string | null
  fullProfileAvailable: boolean
  confidenceMethodologyHref: string | null
  confidenceMethodologyAvailable: boolean
  allJurisdictionsHref: string
  changeActivityHref: string | null
  changeActivityAvailable: boolean
}

export interface JurisdictionRouteContract {
  route: CCResolvedRoute
  briefing: CCBriefingContract
  evidence: CCEvidenceContract
  confidence: CCConfidenceContract
  watchRegions: CCWatchRegionsContract
  changeNotes: CCChangeNotesContract
  ctas: CCCtasContract
}

// ── Resolution helpers ─────────────────────────────────────────────────────────

function slugToDisplayName(slug: string): string {
  return slug.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function resolveCountrySlug(slug: string): { iso2: string; name: string } | null {
  const normalised = SLUG_ALIASES[slug] ?? slug
  const iso2 = SLUG_TO_ISO2[normalised]
  if (!iso2) return null
  return { iso2, name: slugToDisplayName(normalised) }
}

function resolveStateSlug(
  countryIso2: string,
  stateSlug: string,
): { iso2: string; name: string } | null {
  if (countryIso2 === 'US') {
    const s = usStateBySlug[stateSlug]
    if (s) return { iso2: s.iso2, name: s.name }
  }
  if (countryIso2 === 'CA') {
    const p = canadaProvinceBySlug[stateSlug]
    if (p) return { iso2: p.iso2, name: p.name }
  }
  return null
}

function resolveRoleSlug(slug: string): { roleId: string; roleName: string } | null {
  const roleId = ROLE_SLUG_TO_ID[slug]
  if (!roleId) return null
  return { roleId, roleName: ROLE_ID_TO_LABEL[roleId] ?? roleId }
}

const CONFIDENCE_CATEGORIES = [
  'Regulatory', 'Market Data', 'Access Pathway', 'Local Intel', 'Education Content',
]

function pendingConfidence(): CCConfidenceContract {
  return {
    overall: null,
    reviewState: 'pending',
    categories: CONFIDENCE_CATEGORIES.map(label => ({
      label, pct: null, reviewState: 'pending' as CCReviewState,
    })),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Resolve URL segments into a typed route context.
 * Returns null if the country segment cannot be resolved.
 */
export function resolveJurisdictionRoute(segments: CCRouteSegments): CCResolvedRoute | null {
  const country = resolveCountrySlug(segments.countrySlug)
  if (!country) return null

  const state = segments.stateSlug
    ? resolveStateSlug(country.iso2, segments.stateSlug)
    : null

  const role = segments.roleSlug ? resolveRoleSlug(segments.roleSlug) : null

  let type: CCRouteType = 'country'
  if (state && role) type = 'state_role'
  else if (state) type = country.iso2 === 'CA' ? 'province' : 'state'
  else if (role) type = 'country_role'

  const canonicalHref = segments.stateSlug
    ? `/country/${segments.countrySlug}/state/${segments.stateSlug}${segments.roleSlug ? `/role/${segments.roleSlug}` : ''}`
    : `/country/${segments.countrySlug}${segments.roleSlug ? `/role/${segments.roleSlug}` : ''}`

  return {
    type,
    countrySlug: segments.countrySlug,
    countryIso2: country.iso2,
    countryName: country.name,
    stateSlug: state ? segments.stateSlug : undefined,
    stateIso2: state?.iso2,
    stateName: state?.name,
    roleSlug: role ? segments.roleSlug : undefined,
    roleId: role?.roleId,
    roleName: role?.roleName,
    canonicalHref,
    parentCountryHref: state ? `/country/${segments.countrySlug}` : undefined,
  }
}

/**
 * Build the full typed route contract.
 * All fields are backed by the contract or render pending/unavailable.
 * Raw DB enum values (e.g. needs_review) never appear in this contract.
 */
export function buildJurisdictionContract(
  route: CCResolvedRoute,
  enrichment?: { publicSummary?: string | null; programStatus?: string | null },
): JurisdictionRouteContract {
  return {
    route,
    briefing: {
      publicSummary: enrichment?.publicSummary ?? null,
      programStatus: enrichment?.programStatus ?? null,
      programStatusReviewState: enrichment?.programStatus ? 'reviewed' : 'pending',
      patientAccess: null,
      physicianAccess: null,
      marketDynamics: null,
      regulatoryOutlook: null,
    },
    evidence: {
      dataSourceSummary: null,
      verificationSummary: null,
      updateCadence: null,
      coverageSummary: null,
      lastReviewedDate: null,
      reviewState: 'pending',
    },
    confidence: pendingConfidence(),
    watchRegions: {
      reviewState: 'pending',
      isDefaultSuggested: false,
      regions: [{
        name: route.stateName ?? route.countryName,
        href: `/country/${route.countrySlug}`,
        statusLabel: 'Current market',
        isActive: true,
        isAvailable: true,
      }],
    },
    changeNotes: { reviewState: 'pending', notes: [] },
    ctas: {
      fullProfileHref: null,
      fullProfileAvailable: false,
      confidenceMethodologyHref: '/source-methodology',
      confidenceMethodologyAvailable: true,
      allJurisdictionsHref: '/dashboard',
      changeActivityHref: null,
      changeActivityAvailable: false,
    },
  }
}
