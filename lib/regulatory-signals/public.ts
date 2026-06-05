import 'server-only'
import type { PublicRegulatorySignal, RegulatorySignalType } from './types'

// ── Map public.signals.cat → RegulatorySignalType ─────────────────────────────
const CAT_TO_TYPE: Record<string, RegulatorySignalType> = {
  GAZETTE:        'regulatory_change',
  PARLIAMENTARY:  'policy_announcement',
  PRESS_RELEASE:  'regulatory_change',
  LICENSING:      'licensing_market_access',
  SOURCE_ENGINE:  'regulatory_change',
  MDB_PROJECT:    'regulatory_change',
  regulatory:     'regulatory_change',
  market:         'licensing_market_access',
  financial:      'regulatory_change',
  intelligence:   'regulatory_change',
  supply:         'import_export_pathway',
}

// Map public.signals row → PublicRegulatorySignal
// Actual signals table schema: id, date, cat, pri, score, headline, summary,
//   source, url, verification, tier, lang, company, country, in_network,
//   lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
//   reviewed, action, created_at
function mapSignalRow(r: Record<string, unknown>): PublicRegulatorySignal | null {
  const headline = typeof r.headline === 'string' ? r.headline.trim() : null
  if (!headline) return null

  const id = typeof r.id === 'string' ? r.id : String(r.id ?? '')
  const score  = typeof r.score === 'number' ? r.score : 0
  const impact = typeof r.commercial_impact === 'string' ? r.commercial_impact.toLowerCase() : 'low'
  const cat    = typeof r.cat === 'string' ? r.cat : 'SOURCE_ENGINE'
  const dateStr = typeof r.date === 'string' ? r.date.slice(0, 10)
                : typeof r.created_at === 'string' ? r.created_at.slice(0, 10)
                : new Date().toISOString().slice(0, 10)

  const confidence: PublicRegulatorySignal['confidence'] =
    score >= 80 ? 'high' : score >= 55 ? 'medium' : 'low'

  const impactLevel: PublicRegulatorySignal['impact_level'] =
    impact === 'critical' ? 'critical'
    : impact === 'high'   ? 'high'
    : impact === 'medium' ? 'moderate'
    : impact === 'moderate' ? 'moderate'
    : 'low'

  return {
    id,
    slug: id,
    headline,
    signal_type: CAT_TO_TYPE[cat] ?? 'regulatory_change',
    confidence,
    impact_level: impactLevel,
    country_code: null,
    country_name: typeof r.country === 'string' ? r.country : null,
    region: null,
    jurisdiction: null,
    regulator_name: typeof r.source === 'string' ? r.source : null,
    signal_date: dateStr,
    source_tier: 'tier_2_professional',
    source_type: 'industry_intelligence',
    canonical_source_url: typeof r.url === 'string' ? r.url : null,
    public_summary: typeof r.summary === 'string' ? r.summary : null,
    public_implication: null,
    published_at: dateStr,
    last_reviewed_at: dateStr,
  }
}

// ── Anon-key query against public.signals ─────────────────────────────────────
// Uses NEXT_PUBLIC_ vars so this works on public-facing pages without
// requiring SUPABASE_SERVICE_ROLE_KEY or HARBOURVIEW_ADMIN_REVIEW_ENABLED
async function fetchReviewedSignals(): Promise<PublicRegulatorySignal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const params = new URLSearchParams({
      select: 'id,date,cat,headline,summary,score,country,commercial_impact,source,url,tier,created_at',
      reviewed: 'eq.true',
      order:    'date.desc',
      limit:    '50',
    })
    const res = await fetch(`${url}/rest/v1/signals?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const rows: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(rows)) return []
    return rows.map(mapSignalRow).filter((s): s is PublicRegulatorySignal => s !== null)
  } catch {
    return []
  }
}

// ── Fallback fixtures ─────────────────────────────────────────────────────────
const FALLBACK_PUBLIC_SIGNALS: PublicRegulatorySignal[] = [
  {
    id: 'fallback-de-001', slug: 'germany-import-pathway-review',
    headline: 'Germany import pathway review activity continues under controlled GMP expectations.',
    signal_type: 'import_export_pathway', confidence: 'medium', impact_level: 'moderate',
    country_code: 'DE', country_name: 'Germany', region: 'Europe', jurisdiction: 'Federal',
    regulator_name: 'BfArM', signal_date: '2026-05-01', source_tier: 'tier_1_official',
    source_type: 'health_authority', canonical_source_url: 'https://www.bfarm.de',
    public_summary: 'Public-safe review of import pathway conditions and quality expectations relevant to regulated medical supply access.',
    public_implication: 'Commercial participants should maintain validated quality and route-review discipline before engagement.',
    published_at: '2026-05-01', last_reviewed_at: '2026-05-02',
  },
  {
    id: 'fallback-au-001', slug: 'australia-patient-access-review',
    headline: 'Australia patient-access pathway review highlights continued prescription oversight.',
    signal_type: 'prescription_patient_access', confidence: 'medium', impact_level: 'moderate',
    country_code: 'AU', country_name: 'Australia', region: 'Oceania', jurisdiction: 'Federal',
    regulator_name: 'TGA', signal_date: '2026-04-28', source_tier: 'tier_1_official',
    source_type: 'health_authority', canonical_source_url: 'https://www.tga.gov.au',
    public_summary: 'Reviewed public summary focused on prescription access frameworks and compliance-sensitive market participation.',
    public_implication: 'Operators should confirm jurisdiction-specific access controls and prescribing requirements.',
    published_at: '2026-04-29', last_reviewed_at: '2026-04-30',
  },
  {
    id: 'fallback-pl-001', slug: 'poland-market-access-monitoring',
    headline: 'Poland market-access monitoring remains under publication-controlled review.',
    signal_type: 'licensing_market_access', confidence: 'low', impact_level: 'moderate',
    country_code: 'PL', country_name: 'Poland', region: 'Europe', jurisdiction: 'National',
    regulator_name: 'Health Ministry', signal_date: '2026-04-20', source_tier: 'tier_2_professional',
    source_type: 'professional_body', canonical_source_url: 'https://www.gov.pl',
    public_summary: 'Controlled publication summary regarding reviewed licensing and commercial pathway considerations.',
    public_implication: 'Participants should avoid assuming route certainty based on preliminary market visibility.',
    published_at: '2026-04-22', last_reviewed_at: '2026-04-23',
  },
]

export type PublicRegulatorySignalFeed = {
  signals: PublicRegulatorySignal[]
  source: 'live-approved' | 'fallback-fixture'
  publicLabel: string
  reviewBoundary: string
}

export async function getPublicRegulatorySignalFeed(): Promise<PublicRegulatorySignalFeed> {
  const published = await fetchReviewedSignals()

  if (published.length) {
    return {
      signals: published,
      source: 'live-approved',
      publicLabel: 'Published public-safe signals',
      reviewBoundary: 'Signals sourced from reviewed entries in the public signals table. Private captures, analyst notes and internal review material remain excluded.',
    }
  }

  return {
    signals: FALLBACK_PUBLIC_SIGNALS,
    source: 'fallback-fixture',
    publicLabel: 'Fallback signal orientation',
    reviewBoundary: 'No reviewed signals are currently available. These entries are fallback orientation only and should not be treated as live intelligence or current route clearance.',
  }
}

export async function getPublicRegulatorySignals(): Promise<PublicRegulatorySignal[]> {
  const feed = await getPublicRegulatorySignalFeed()
  return feed.signals
}

export async function getPublicRegulatorySignalBySlug(slug: string): Promise<PublicRegulatorySignal | null> {
  const signals = await getPublicRegulatorySignals()
  return signals.find(s => s.slug === slug) ?? null
}

export async function getPublicRegulatorySignalsByCountry(country: string): Promise<PublicRegulatorySignal[]> {
  const normalized = country.toLowerCase()
  const signals = await getPublicRegulatorySignals()
  return signals.filter(s =>
    [s.country_code, s.country_name]
      .filter(Boolean)
      .some(v => v!.toLowerCase().replace(/\s+/g, '-') === normalized)
  )
}

export async function getPublicRegulatorySignalsByType(type: string): Promise<PublicRegulatorySignal[]> {
  const signals = await getPublicRegulatorySignals()
  return signals.filter(s => s.signal_type === type as RegulatorySignalType)
}

export async function getPublicRegulatorySignalCountries() {
  const signals = await getPublicRegulatorySignals()
  const countries = new Map<string, { countryCode: string | null; countryName: string; region: string | null; count: number; latestSignalDate: string }>()

  for (const s of signals) {
    if (!s.country_name) continue
    const key = s.country_name.toLowerCase()
    const existing = countries.get(key)
    if (!existing) {
      countries.set(key, { countryCode: s.country_code, countryName: s.country_name, region: s.region, count: 1, latestSignalDate: s.signal_date })
    } else {
      existing.count += 1
      if (s.signal_date > existing.latestSignalDate) existing.latestSignalDate = s.signal_date
    }
  }

  return Array.from(countries.values()).sort((a, b) => a.countryName.localeCompare(b.countryName))
}

export async function getPublicRegulatorySignalTypes() {
  const signals = await getPublicRegulatorySignals()
  const types = new Map<string, { type: RegulatorySignalType; count: number; latestSignalDate: string }>()

  for (const s of signals) {
    const existing = types.get(s.signal_type)
    if (!existing) {
      types.set(s.signal_type, { type: s.signal_type, count: 1, latestSignalDate: s.signal_date })
    } else {
      existing.count += 1
      if (s.signal_date > existing.latestSignalDate) existing.latestSignalDate = s.signal_date
    }
  }

  return Array.from(types.values()).sort((a, b) => a.type.localeCompare(b.type))
}
