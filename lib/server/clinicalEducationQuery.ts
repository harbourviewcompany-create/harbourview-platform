import 'server-only'
import type {
  ClinicalEducationModule,
  ClinicalEducationCountryReadiness,
} from '@/lib/fixtures/clinical-education'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Raw DB row shapes (snake_case, as returned by PostgREST).
type ModuleRow = {
  id: string
  slug: string
  title: string
  route: string
  audience: string[] | null
  module_status: string
  risk_level: string
  public_summary: string
  education_themes: string[] | null
  safe_language: string[] | null
  restricted_language: string[] | null
  research_status: string | null
  professional_review_required: boolean
  source_basis: string | null
  reviewer_role_required: string[] | null
  audience_boundary: string | null
  last_reviewed: string | null
  next_review_due: string | null
  public_use_approved: boolean
  medical_advice_boundary: string | null
  country_relevance: string[] | null
  format_relevance: string[] | null
  disclaimer_type: string
  cta_label: string | null
  cta_href: string | null
}

type ReadinessRow = {
  country: string
  region: string | null
  professional_education_readiness: string | null
  known_training_gap: string | null
  official_guidance_status: string | null
  formats_requiring_education: string[] | null
  pharmacist_relevance: string | null
  clinician_relevance: string | null
  research_status: string | null
  professional_reviewer_needed: boolean
  brief_availability: string | null
}

const MODULE_SELECT =
  'id,slug,title,route,audience,module_status,risk_level,public_summary,education_themes,safe_language,restricted_language,research_status,professional_review_required,source_basis,reviewer_role_required,audience_boundary,last_reviewed,next_review_due,public_use_approved,medical_advice_boundary,country_relevance,format_relevance,disclaimer_type,cta_label,cta_href'

const READINESS_SELECT =
  'country,region,professional_education_readiness,known_training_gap,official_guidance_status,formats_requiring_education,pharmacist_relevance,clinician_relevance,research_status,professional_reviewer_needed,brief_availability'

function mapModule(r: ModuleRow): ClinicalEducationModule {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    route: r.route,
    audience: r.audience ?? [],
    moduleStatus: r.module_status,
    riskLevel: r.risk_level,
    publicSummary: r.public_summary,
    educationThemes: r.education_themes ?? [],
    safeLanguage: r.safe_language ?? [],
    restrictedLanguage: r.restricted_language ?? [],
    researchStatus: r.research_status ?? '',
    professionalReviewRequired: r.professional_review_required,
    sourceBasis: r.source_basis ?? 'professional-orientation',
    reviewerRoleRequired: r.reviewer_role_required ?? [],
    audienceBoundary: r.audience_boundary ?? 'professional-only',
    lastReviewed: r.last_reviewed ?? '',
    nextReviewDue: r.next_review_due ?? '',
    publicUseApproved: r.public_use_approved,
    medicalAdviceBoundary: r.medical_advice_boundary ?? '',
    countryRelevance: r.country_relevance ?? [],
    formatRelevance: r.format_relevance ?? [],
    disclaimerType: r.disclaimer_type,
    ctaLabel: r.cta_label ?? '',
    ctaHref: r.cta_href ?? '',
  } as ClinicalEducationModule
}

function mapReadiness(r: ReadinessRow): ClinicalEducationCountryReadiness {
  return {
    country: r.country,
    region: r.region ?? '',
    professionalEducationReadiness: r.professional_education_readiness ?? '',
    knownTrainingGap: r.known_training_gap ?? '',
    officialGuidanceStatus: r.official_guidance_status ?? '',
    formatsRequiringEducation: r.formats_requiring_education ?? [],
    pharmacistRelevance: r.pharmacist_relevance ?? '',
    clinicianRelevance: r.clinician_relevance ?? '',
    researchStatus: r.research_status ?? '',
    professionalReviewerNeeded: r.professional_reviewer_needed,
    briefAvailability: r.brief_availability ?? '',
  }
}

export async function getClinicalEducationModules(): Promise<ClinicalEducationModule[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({ select: MODULE_SELECT, order: 'sort_order.asc' })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_education_modules?${params}`, {
      next: { revalidate: 3600 },
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return []
    const rows: ModuleRow[] = await res.json()
    return rows.map(mapModule)
  } catch {
    return []
  }
}

export async function getClinicalEducationModuleBySlug(
  slug: string,
): Promise<ClinicalEducationModule | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    const params = new URLSearchParams({ select: MODULE_SELECT, slug: `eq.${slug}`, limit: '1' })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_education_modules?${params}`, {
      next: { revalidate: 3600 },
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    const rows: ModuleRow[] = await res.json()
    return rows[0] ? mapModule(rows[0]) : null
  } catch {
    return null
  }
}

export async function getClinicalEducationCountryReadiness(): Promise<
  ClinicalEducationCountryReadiness[]
> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const params = new URLSearchParams({ select: READINESS_SELECT, order: 'sort_order.asc' })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_education_country_readiness?${params}`, {
      next: { revalidate: 3600 },
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return []
    const rows: ReadinessRow[] = await res.json()
    return rows.map(mapReadiness)
  } catch {
    return []
  }
}
