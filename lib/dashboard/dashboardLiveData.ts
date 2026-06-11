import 'server-only'
import { createClient } from '@/lib/supabase/server'

// ── 1. Pipeline counts from marketplace_inquiries ─────────────────────────────
export type PipelineCounts = {
  wanted: number
  matched: number
  proof_review: number
  inquiry: number
  deal_room: number
}

export async function getPipelineCounts(): Promise<PipelineCounts> {
  // Returns platform-wide aggregate counts (not scoped to the current user).
  // This function is intentionally admin-style: all authenticated operators can
  // see how many inquiries are in each stage. Access is gated by the /dashboard
  // auth middleware. If per-user scoping is ever needed, add .eq('submitter_id', userId).
  const fallback: PipelineCounts = { wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marketplace_inquiries')
      .select('review_status')
    if (error || !data) return fallback
    return data.reduce((acc, row) => {
      if (row.review_status === 'received' || row.review_status === 'reviewing') acc.inquiry++
      if (row.review_status === 'contacted') acc.proof_review++
      if (row.review_status === 'qualified') acc.matched++
      if (row.review_status === 'closed')    acc.deal_room++
      return acc
    }, { ...fallback })
  } catch { return fallback }
}

// ── 2. Wanted listings (full rows) ────────────────────────────────────────────
export type WantedListing = {
  id: string
  title: string
  summary: string | null
  location_country: string | null
  location_region: string | null
  created_at: string
}

export async function getWantedListings(countryIso2?: string | null): Promise<WantedListing[]> {
  try {
    const supabase = await createClient()

    // Try country-filtered first; fall back to all if empty
    const buildQuery = (country?: string | null) => {
      let q = supabase
        .from('listings')
        .select('id, title, summary, location_country, location_region, created_at')
        .eq('marketplace_section', 'wanted_requests')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12)
      if (country) q = q.eq('location_country', country.toUpperCase())
      return q
    }

    if (countryIso2) {
      const { data: countryData, error: countryErr } = await buildQuery(countryIso2)
      if (!countryErr && countryData && countryData.length > 0) return countryData
    }

    // Global fallback
    const { data, error } = await buildQuery()
    if (error || !data) return []
    return data
  } catch { return [] }
}

// ── 3. Education tiles from DB ────────────────────────────────────────────────
export type LiveEduTile = {
  icon: string
  title: string
  desc: string
  slug: string
}

const AUDIENCE_ICON: Record<string, string> = {
  doctor_prescriber: '🩺', pharmacist: '💊', lab_qa: '🧪',
  gmp_quality: '📋', cultivator_producer: '🌿', importer: '📦',
  exporter: '✈️', investor_operator: '📈', regulatory_compliance: '⚖️',
  patient_caregiver_education: '🩺', general: '📖',
}

export async function getLiveEduTiles(roleId?: string | null, limit = 6): Promise<LiveEduTile[]> {
  try {
    const supabase = await createClient()
    // Try modules first — they have audience[] and publication_state
    const query = supabase
      .from('education_modules')
      .select('slug, title, description, audience, sensitivity, track_id')
      .eq('publication_state', 'published')
      .limit(limit * 3) // fetch extra to filter by role
    const { data: modules, error } = await query
    if (error || !modules || modules.length === 0) return []

    // Score by role match
    const scored = modules.map(m => {
      const audience: string[] = m.audience ?? []
      const roleMatch = roleId && audience.includes(roleId) ? 2
        : audience.includes('general') ? 1 : 0
      return { ...m, roleMatch }
    })
    .sort((a, b) => b.roleMatch - a.roleMatch)
    .slice(0, limit)

    return scored.map(m => ({
      icon: (roleId && AUDIENCE_ICON[roleId]) ?? '📖',
      title: m.title,
      desc: m.sensitivity === 'controlled' ? 'Controlled topic — professional access' : `Education module`,
      slug: m.slug,
    }))
  } catch { return [] }
}

// ── 4. Country intelligence profile ──────────────────────────────────────────
export type CountryIntelProfile = {
  // Core fields — always present
  country_code: string
  country_name: string
  public_summary: string | null
  commercial_pathway_summary: string | null
  review_status: string
  regulatory_tier?: string | null
  // Extended country status fields — present when fetched from public.countries
  region?: string | null
  market_access_status?: string | null
  medical_status?: string | null
  adult_use_status?: string | null
  import_status?: string | null
  export_status?: string | null
  opportunity_score?: number | null
  trade_roles?: string[] | null
  opportunity_categories?: string[] | null
  regulator_label?: string | null
  data_completeness?: string | null
}

export async function getCountryIntelProfile(iso2: string | null): Promise<CountryIntelProfile | null> {
  if (!iso2) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('country_intel')
      .select('country_code, country_name, public_summary, commercial_pathway_summary, review_status, regulatory_tier')
      .eq('country_code', iso2.toUpperCase())
      .eq('review_status', 'active')
      .single()
    if (error || !data) return null
    return data
  } catch { return null }
}

// ── getCountryStatusFromDB ────────────────────────────────────────────────────
// Fetches real country status from the countries table (191 countries seeded
// June 2026) for the countryIntel prop in CommandCentre.

export interface CountryStatus {
  country_name: string
  iso_alpha2: string
  region: string | null
  subregion: string | null
  market_access_status: string | null
  medical_status: string | null
  adult_use_status: string | null
  import_status: string | null
  export_status: string | null
  signals_status: string | null
  opportunity_score: number | null
  data_completeness: string | null
  public_summary: string | null
  trade_roles: string[] | null
  opportunity_categories: string[] | null
  regulator_label: string | null
  last_updated_label: string | null
}

export async function getCountryStatusFromDB(
  iso2: string | null | undefined,
): Promise<CountryStatus | null> {
  if (!iso2) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('countries')
      .select(
        'country_name, iso_alpha2, region, subregion, ' +
        'market_access_status, medical_status, adult_use_status, ' +
        'import_status, export_status, signals_status, ' +
        'opportunity_score, data_completeness, public_summary, ' +
        'trade_roles, opportunity_categories, regulator_label, last_updated_label',
      )
      .eq('iso_alpha2', iso2.toUpperCase())
      .single()

    if (error || !data) return null
    return data as unknown as CountryStatus
  } catch {
    return null
  }
}
