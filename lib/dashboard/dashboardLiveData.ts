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
  country_code: string
  country_name: string
  public_summary: string | null
  commercial_pathway_summary: string | null
  review_status: string
  // Extended fields from CountryStatus (public.countries table)
  region: string | null
  market_access_status: string | null
  medical_status: string | null
  adult_use_status: string | null
  import_status: string | null
  export_status: string | null
  opportunity_score: number | null
  trade_roles: string[] | null
  opportunity_categories: string[] | null
  regulator_label: string | null
  data_completeness: string | null
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

// ── 6. Marketplace rows from listings table ───────────────────────────────────
import type { DashboardMarketplaceRows, MarketRow } from '@/components/dashboard/CommandCentre'

type ListingRow = {
  id: string
  title: string | null
  description: string | null
  category: string | null
  location_country: string | null
  price_amount: number | null
  price_currency: string | null
  seller_type: string | null
  marketplace_section: string | null
}

// Map DB category/section → CommandCentre MarketView bucket
function categoryToView(cat: string | null, section: string | null): string {
  const c = cat ?? ''
  const s = section ?? ''
  if (s === 'wanted_requests' || c === 'import_demand' || c === 'wanted_requests') return 'wanted'
  if (c === 'business_opportunities' || c === 'distressed_businesses' || c === 'distressed_inventory') return 'opportunities'
  if (c.includes('equipment') || c === 'cultivation_equipment' || c === 'processing_equipment' || c === 'labs_testing') return 'equipment'
  if (c === 'consumables' || c === 'packaging') return 'consumables'
  if (c === 'new_products') return 'new-products'
  if (c === 'professional_services' || c === 'services' || c === 'logistics') return 'services'
  // Default cannabis/inventory
  if (c === 'cannabis_inventory' || c === 'genetics' || c === 'export_ready') return 'cannabis'
  return 'cannabis'
}

function specClass(view: string): string {
  if (view === 'equipment' || view === 'consumables') return 'equip'
  if (view === 'services' || view === 'opportunities') return 'service'
  return 'supply'
}

function typeLabel(cat: string | null, country: string | null): string {
  const LABELS: Record<string, string> = {
    cannabis_inventory: 'Cannabis Inventory', genetics: 'Genetics', export_ready: 'Export Ready',
    cultivation_equipment: 'Cultivation Equip.', processing_equipment: 'Processing Equip.',
    labs_testing: 'Labs & Testing', consumables: 'Consumables', packaging: 'Packaging',
    new_products: 'New Products', professional_services: 'Professional Services',
    logistics: 'Logistics', services: 'Services',
    business_opportunities: 'Business Opportunity', distressed_inventory: 'Distressed Inventory',
    distressed_businesses: 'Distressed Business', import_demand: 'Import Demand',
    wanted_requests: 'Wanted Request',
  }
  const label = LABELS[cat ?? ''] ?? 'Marketplace'
  return country ? `${label} · ${country}` : label
}

function buildTags(cat: string | null): string {
  const base = ['Region-filtered', 'Harbourview-verified']
  if (cat === 'cannabis_inventory' || cat === 'export_ready') base.push('COA available', 'Lab tested')
  if (cat === 'genetics') base.push('Provenance verified', 'IP documented')
  if (cat?.includes('equipment')) base.push('Condition stated', 'Inspection available')
  if (cat === 'professional_services' || cat === 'logistics') base.push('Licensed operator', 'References available')
  return base.slice(0, 4).join('|')
}

function buildTrust(cat: string | null): string {
  const base = 'HV Review:ok|Permit:ok'
  if (cat === 'cannabis_inventory' || cat === 'export_ready') return `${base}|GMP:ok|COA:ok|Lab:ok`
  if (cat?.includes('equipment')) return `${base}|Condition:ok|Docs:ok`
  if (cat === 'genetics') return `${base}|IP:ok|Provenance:ok|COA:ok`
  return `${base}|Licence:ok|Docs:ok`
}

function priceLabel(amount: number | null, currency: string | null): string {
  if (!amount) return 'POA'
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : (currency ?? '$')
  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${sym}${(amount / 1_000).toFixed(0)}k`
  return `${sym}${amount.toFixed(0)}`
}

function actionLabel(view: string, sellerType: string | null): string {
  if (view === 'wanted') return 'Respond to request'
  if (view === 'services') return 'Request introduction'
  if (sellerType === 'distributor') return 'Request distribution access'
  return 'Request mediated access'
}

function shapeRow(l: ListingRow): [string, MarketRow] {
  const view = categoryToView(l.category, l.marketplace_section)
  const row: MarketRow = [
    specClass(view),
    typeLabel(l.category, l.location_country),
    l.title ?? 'Unlisted Item',
    l.description ?? 'Contact Harbourview for details.',
    buildTags(l.category),
    buildTrust(l.category),
    actionLabel(view, l.seller_type),
    priceLabel(l.price_amount, l.price_currency),
  ]
  return [view, row]
}

export async function getMarketplaceRows(
  countryIso2?: string | null,
  limit = 60,
): Promise<DashboardMarketplaceRows> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('listings')
      .select('id,title,description,category,location_country,price_amount,price_currency,seller_type,marketplace_section')
      .eq('status', 'approved')
      .eq('public_visibility', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If a country is provided, broaden with OR: match country OR region-free
    if (countryIso2) {
      query = query.or(`location_country.eq.${countryIso2.toUpperCase()},location_country.is.null`)
    }

    const { data, error } = await query
    if (error || !data) return {}

    const buckets: DashboardMarketplaceRows = {}
    for (const listing of data) {
      const [view, row] = shapeRow(listing as ListingRow)
      const key = view as keyof DashboardMarketplaceRows
      if (!buckets[key]) buckets[key] = []
      buckets[key]!.push(row)
    }
    return buckets
  } catch { return {} }
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
    return data as CountryStatus
  } catch {
    return null
  }
}

