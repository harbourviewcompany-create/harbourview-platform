import 'server-only'
import type { PublicRegulatorySignal, RegulatorySignalType, RegulatoryContentType } from './types'
import {
  SIGNAL_QUALITY_SELECT,
  QUALITY_LABEL_NOT_IN,
  buildCorroborationIndex,
  corroborationCount,
  displayHeadline,
  displaySummary,
  feedAgeHours,
  freshnessBand,
  isSurfaceable,
  isTranslated,
  originalLanguage,
  originalLanguageLabel,
  resolveConfidence,
  resolveConfidenceBand,
  resolveContentType,
  resolveCountry,
  resolveImpact,
  type SignalQualityRow,
} from '@/lib/signals/quality'

// ── Map public.signals.cat → RegulatorySignalType ─────────────────────────────
const CAT_TO_TYPE: Record<string, RegulatorySignalType> = {
  GAZETTE:        'regulatory_guidance',
  PARLIAMENTARY:  'policy_consultation',
  PRESS_RELEASE:  'regulatory_guidance',
  LICENSING:      'licensing_market_access',
  SOURCE_ENGINE:  'regulatory_guidance',
  MDB_PROJECT:    'regulatory_guidance',
  regulatory:     'regulatory_guidance',
  market:         'licensing_market_access',
  financial:      'regulatory_guidance',
  intelligence:   'regulatory_guidance',
  supply:         'import_export_pathway',
}

// Map public.signals row → PublicRegulatorySignal
// Actual signals table schema: id, date, cat, pri, score, headline, summary,
//   source, url, verification, tier, lang, company, country, in_network,
//   lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
//   reviewed, action, created_at
// `signals.score` is DELIBERATELY NOT READ HERE. It is the legacy keyword-density
// scorer, known inverted (spec §2.5), and deriving the user-visible confidence and
// impact badges from it rendered 84% of validated signals as "low confidence".
// All quality judgment now comes from `lib/signals/quality.ts`, which reads the
// Pipeline B classifier columns.
function mapSignalRow(
  r: Record<string, unknown>,
  corroboration: Map<string, number>,
): PublicRegulatorySignal | null {
  const row = r as SignalQualityRow

  // Classifier verdicts of spam/boilerplate/nav/duplicate never reach a surface.
  if (!isSurfaceable(row)) return null

  // Prefer the machine-translated title so non-English coverage is legible.
  const headline = displayHeadline(row)
  if (!headline) return null

  const id = typeof r.id === 'string' ? r.id : String(r.id ?? '')
  const cat = typeof r.cat === 'string' ? r.cat : 'SOURCE_ENGINE'
  const dateStr = typeof r.date === 'string' ? r.date.slice(0, 10)
                : typeof r.created_at === 'string' ? r.created_at.slice(0, 10)
                : new Date().toISOString().slice(0, 10)

  const band = resolveConfidenceBand(row)
  const confidence: PublicRegulatorySignal['confidence'] = band ?? 'low'
  const impactLevel: PublicRegulatorySignal['impact_level'] = resolveImpact(row) ?? 'moderate'

  const tierStr = typeof r.tier === 'string' ? r.tier.toLowerCase() : ''
  const sourceTier: PublicRegulatorySignal['source_tier'] =
    tierStr.includes('1') ? 'tier_1_official'
    : tierStr.includes('2') ? 'tier_2_professional'
    : 'tier_3_secondary'

  // Resolve free-text country into canonical identity so the feed can actually be
  // filtered and grouped geographically (previously hard-coded null).
  const country = resolveCountry(r.country)
  const contentType = resolveContentType(row)

  return {
    id,
    slug: id,
    headline,
    signal_type: CAT_TO_TYPE[cat] ?? 'regulatory_guidance',
    confidence,
    impact_level: impactLevel,
    country_code: country?.code ?? null,
    country_name: country?.name ?? (typeof r.country === 'string' ? r.country : null),
    region: country?.region ?? null,
    jurisdiction: '',
    regulator_name: typeof r.source === 'string' ? r.source : '',
    signal_date: dateStr,
    source_tier: sourceTier,
    source_type: 'specialist_publication' as const,
    canonical_source_url: typeof r.url === 'string' ? r.url : null,
    public_summary: displaySummary(row) ?? 'No summary available.',
    public_implication: typeof r.commercial_impact === 'string' && r.commercial_impact
      ? r.commercial_impact
      : 'Review this signal for commercial relevance to your jurisdiction.',
    published_at: dateStr,
    last_reviewed_at: dateStr,

    content_type: contentType === 'noise' ? null : (contentType as RegulatoryContentType | null),
    confidence_score: resolveConfidence(row),
    corroboration_count: corroborationCount(row, corroboration),
    original_language: originalLanguage(row),
    original_language_label: originalLanguageLabel(row),
    translated: isTranslated(row),
    country_slug: country?.slug ?? null,
  }
}


// ── Map regulatory_signals.public_signals row → PublicRegulatorySignal ────────
// public_signals view columns: id, slug, headline, signal_type, confidence,
//   impact_level, country_code, country_name, region, jurisdiction,
//   regulator_name, signal_date, source_tier, source_type, canonical_source_url,
//   public_summary, public_implication, published_at, last_reviewed_at
function mapApprovedRow(r: Record<string, unknown>): PublicRegulatorySignal | null {
  const headline = typeof r.headline === 'string' ? r.headline.trim() : null
  if (!headline) return null

  const rawConf = typeof r.confidence === 'string' ? r.confidence.toLowerCase() : ''
  const confidence: PublicRegulatorySignal['confidence'] =
    rawConf === 'high' ? 'high' : rawConf === 'medium' ? 'medium' : 'low'

  const rawImpact = typeof r.impact_level === 'string' ? r.impact_level.toLowerCase() : ''
  const impact_level: PublicRegulatorySignal['impact_level'] =
    rawImpact === 'critical' ? 'critical'
    : rawImpact === 'high'   ? 'high'
    : rawImpact === 'moderate' || rawImpact === 'medium' ? 'moderate'
    : 'low'

  return {
    id:                   typeof r.id === 'string'                    ? r.id                    : String(r.id ?? ''),
    slug:                 typeof r.slug === 'string'                  ? r.slug                  : String(r.id ?? ''),
    headline,
    signal_type:          (r.signal_type as PublicRegulatorySignal['signal_type']) ?? 'regulatory_guidance',
    confidence,
    impact_level,
    country_code:         typeof r.country_code === 'string'          ? r.country_code          : null,
    country_name:         typeof r.country_name === 'string'          ? r.country_name          : null,
    region:               typeof r.region === 'string'                ? r.region                : null,
    jurisdiction:         typeof r.jurisdiction === 'string'          ? r.jurisdiction          : '',
    regulator_name:       typeof r.regulator_name === 'string'        ? r.regulator_name        : '',
    signal_date:          typeof r.signal_date === 'string'           ? r.signal_date.slice(0,10) : new Date().toISOString().slice(0,10),
    source_tier:          (r.source_tier  as PublicRegulatorySignal['source_tier'])  ?? 'tier_2_professional',
    source_type:          (r.source_type  as PublicRegulatorySignal['source_type'])  ?? 'specialist_publication',
    canonical_source_url: typeof r.canonical_source_url === 'string' ? r.canonical_source_url  : null,
    public_summary:       typeof r.public_summary === 'string'        ? r.public_summary        : 'No summary available.',
    public_implication:   typeof r.public_implication === 'string'    ? r.public_implication    : 'Review for commercial relevance.',
    published_at:         typeof r.published_at === 'string'          ? r.published_at.slice(0,10) : new Date().toISOString().slice(0,10),
    last_reviewed_at:     typeof r.last_reviewed_at === 'string'      ? r.last_reviewed_at.slice(0,10) : new Date().toISOString().slice(0,10),

    // The editorial `public_signals` view is human-curated and predates the
    // Pipeline B classifier, so it carries none of the quality-brain columns.
    // These stay null//default rather than being inferred — an editorially
    // published signal is already `confidence`-rated by its reviewer above.
    content_type:            'regulatory',
    confidence_score:        null,
    corroboration_count:     1,
    original_language:       null,
    original_language_label: null,
    translated:              false,
    country_slug:            resolveCountry(r.country_name)?.slug ?? null,
  }
}

// ── Priority 1: regulatory_signals.public_signals (reviewed, public-safe) ─────
// Uses Accept-Profile header so the anon key queries the regulatory_signals schema.
// Returns 0 rows until editorial pipeline publishes content — falls through gracefully.
async function fetchApprovedSignals(): Promise<PublicRegulatorySignal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const params = new URLSearchParams({
      select: 'id,slug,headline,signal_type,confidence,impact_level,country_code,country_name,region,jurisdiction,regulator_name,signal_date,source_tier,source_type,canonical_source_url,public_summary,public_implication,published_at,last_reviewed_at',
      order:  'published_at.desc',
      limit:  '300',
    })
    const res = await fetch(`${url}/rest/v1/public_signals?${params}`, {
      headers: {
        apikey:            key,
        Authorization:     `Bearer ${key}`,
        Accept:            'application/json',
        'Accept-Profile':  'regulatory_signals',
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const rows: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(rows)) return []
    return rows.map(mapApprovedRow).filter((s): s is PublicRegulatorySignal => s !== null)
  } catch {
    return []
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
      // `score` is intentionally absent: nothing downstream may read it.
      select: `id,date,cat,headline,summary,country,commercial_impact,source,url,tier,created_at,reviewed,${SIGNAL_QUALITY_SELECT}`,
      reviewed: 'eq.true',
      order:    'date.desc',
      limit:    '300',
    })
    // Drop classifier-rejected rows server-side. A pre-gate promotion batch left
    // spam/boilerplate rows flagged reviewed=true in the live feed; this removes
    // them for every consumer without mutating rows a human may own.
    params.append('quality_label', `not.in.${QUALITY_LABEL_NOT_IN}`)

    const res = await fetch(`${url}/rest/v1/signals?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const rows: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(rows)) return []

    // Corroboration is counted across the whole fetched window, so it must be
    // built before mapping any individual row.
    const corroboration = buildCorroborationIndex(rows as Array<SignalQualityRow & { id?: unknown }>)
    return rows
      .map(r => mapSignalRow(r, corroboration))
      .filter((s): s is PublicRegulatorySignal => s !== null)
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
    content_type: 'regulatory', confidence_score: null, corroboration_count: 1,
    original_language: null, original_language_label: null, translated: false, country_slug: 'germany',
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
    content_type: 'regulatory', confidence_score: null, corroboration_count: 1,
    original_language: null, original_language_label: null, translated: false, country_slug: 'australia',
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
    content_type: 'regulatory', confidence_score: null, corroboration_count: 1,
    original_language: null, original_language_label: null, translated: false, country_slug: 'poland',
  },
]

function freshnessOf(signals: PublicRegulatorySignal[]): {
  ageHours: number | null
  freshness: PublicRegulatorySignalFeed['freshness']
} {
  const ageHours = feedAgeHours(signals.map(s => s.signal_date))
  return { ageHours, freshness: freshnessBand(ageHours) }
}

export type PublicRegulatorySignalFeed = {
  signals: PublicRegulatorySignal[]
  source: 'live-approved' | 'fallback-fixture'
  publicLabel: string
  reviewBoundary: string
  /**
   * Hours since the newest signal in the feed, or null if unknown.
   *
   * Surfaced so a stale feed is never *silently* stale. The Intel feed went nine
   * days without a new promotion while every monitor reported green, and a reader
   * had no way to tell -- see
   * `docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md` section 1.2.
   */
  ageHours: number | null
  freshness: 'live' | 'recent' | 'stale' | 'unknown'
}

export async function getPublicRegulatorySignalFeed(): Promise<PublicRegulatorySignalFeed> {
  // Priority 1: regulatory_signals.public_signals — editorially reviewed, public-safe
  // (0 rows until editorial pipeline publishes; falls through silently)
  const approved = await fetchApprovedSignals()
  if (approved.length) {
    return {
      signals: approved,
      source: 'live-approved',
      publicLabel: 'Editorially reviewed public-safe signals',
      reviewBoundary: 'Signals sourced from the reviewed regulatory signals pipeline. Private captures, analyst notes and internal review material remain excluded.',
      ...freshnessOf(approved),
    }
  }

  // Priority 2: public.signals (reviewed=true) — automated intake, human-flagged
  const published = await fetchReviewedSignals()
  if (published.length) {
    return {
      signals: published,
      source: 'live-approved',
      publicLabel: 'Published public-safe signals',
      reviewBoundary: 'Signals sourced from reviewed entries in the public signals table. Private captures, analyst notes and internal review material remain excluded.',
      ...freshnessOf(published),
    }
  }

  return {
    signals: FALLBACK_PUBLIC_SIGNALS,
    source: 'fallback-fixture',
    publicLabel: 'Fallback signal orientation',
    reviewBoundary: 'No reviewed signals are currently available. These entries are fallback orientation only and should not be treated as live intelligence or current route clearance.',
    ageHours: null,
    freshness: 'unknown',
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
