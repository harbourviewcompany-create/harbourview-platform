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
  const fallback: PipelineCounts = { wanted: 0, matched: 0, proof_review: 0, inquiry: 0, deal_room: 0 }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marketplace_inquiries')
      .select('review_status')
    if (error || !data) return fallback
    return data.reduce((acc, row) => {
      if (row.review_status === 'received')  acc.inquiry++
      if (row.review_status === 'reviewing') acc.proof_review++
      if (row.review_status === 'matched')   acc.matched++
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

export async function getWantedListings(): Promise<WantedListing[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, summary, location_country, location_region, created_at')
      .eq('marketplace_section', 'wanted')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12)
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
      .select('slug, title, audience, sensitivity, track_id')
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
  country_code: string
  country_name: string
  public_summary: string | null
  commercial_pathway_summary: string | null
  review_status: string
}

export async function getCountryIntelProfile(iso2: string | null): Promise<CountryIntelProfile | null> {
  if (!iso2) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .schema('intelligence')
      .from('country_intelligence_profiles')
      .select('country_code, country_name, public_summary, commercial_pathway_summary, review_status')
      .eq('country_code', iso2.toUpperCase())
      .eq('public_safe', true)
      .eq('publish_to_public', true)
      .single()
    if (error || !data) return null
    return data
  } catch { return null }
}

// ── 5. Supplier / counterparty profiles ───────────────────────────────────────
export type ReviewedCounterparty = {
  id: string
  counterparty_name: string
  counterparty_type: string
  preferred_markets: string[]
  relationship_strength_score: number
  reliability_score: number
  successful_introductions_count: number
}

export async function getReviewedCounterparties(limit = 6): Promise<ReviewedCounterparty[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('relationship_intelligence_profiles')
      .select('id, counterparty_name, counterparty_type, preferred_markets, relationship_strength_score, reliability_score, successful_introductions_count')
      .gte('relationship_strength_score', 40)
      .order('relationship_strength_score', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data
  } catch { return [] }
}
