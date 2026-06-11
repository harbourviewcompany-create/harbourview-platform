import 'server-only'
import type { PublicRegulatorySignal, RegulatorySignalType } from './types'

function mapPublishedRegulatorySignalRow(r: Record<string, unknown>): PublicRegulatorySignal | null {
  const headline = typeof r.headline === 'string' ? r.headline.trim() : null
  const publicSummary = typeof r.public_summary === 'string' ? r.public_summary.trim() : null
  const publicImplication = typeof r.public_implication === 'string' ? r.public_implication.trim() : null

  if (!headline || !publicSummary || !publicImplication) return null

  const confidence: PublicRegulatorySignal['confidence'] =
    r.confidence === 'official_confirmed' || r.confidence === 'high' || r.confidence === 'medium' || r.confidence === 'low'
      ? r.confidence
      : 'medium'

  const impactLevel: PublicRegulatorySignal['impact_level'] =
    r.impact_level === 'critical' || r.impact_level === 'high' || r.impact_level === 'moderate' || r.impact_level === 'low'
      ? r.impact_level
      : 'moderate'

  const sourceTier: PublicRegulatorySignal['source_tier'] =
    r.source_tier === 'tier_1_official' || r.source_tier === 'tier_2_professional' || r.source_tier === 'tier_3_secondary'
      ? r.source_tier
      : 'tier_1_official'

  return {
    id: typeof r.id === 'string' ? r.id : String(r.id ?? ''),
    slug: typeof r.slug === 'string' ? r.slug : String(r.id ?? ''),
    headline,
    signal_type: (typeof r.signal_type === 'string' ? r.signal_type : 'regulatory_change') as RegulatorySignalType,
    confidence,
    impact_level: impactLevel,
    country_code: typeof r.country_code === 'string' ? r.country_code : null,
    country_name: typeof r.country_name === 'string' ? r.country_name : null,
    region: typeof r.region === 'string' ? r.region : null,
    jurisdiction: typeof r.jurisdiction === 'string' ? r.jurisdiction : null,
    regulator_name: typeof r.regulator_name === 'string' ? r.regulator_name : null,
    signal_date: typeof r.signal_date === 'string' ? r.signal_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    source_tier: sourceTier,
    source_type: typeof r.source_type === 'string' ? (r.source_type as PublicRegulatorySignal['source_type']) : 'regulator',
    canonical_source_url: typeof r.canonical_source_url === 'string' ? r.canonical_source_url : null,
    public_summary: publicSummary,
    public_implication: publicImplication,
    published_at: typeof r.published_at === 'string' ? r.published_at : null,
    last_reviewed_at: typeof r.last_reviewed_at === 'string' ? r.last_reviewed_at : null,
  }
}

async function fetchPublishedRegulatorySignals(): Promise<PublicRegulatorySignal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const params = new URLSearchParams({
      select: 'id,slug,headline,signal_type,confidence,impact_level,country_code,country_name,region,jurisdiction,regulator_name,signal_date,source_tier,source_type,canonical_source_url,public_summary,public_implication,published_at,last_reviewed_at',
      order: 'signal_date.desc',
      limit: '50',
    })

    const res = await fetch(`${url}/rest/v1/regulatory_signals.public_signals?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (!res.ok) return []
    const rows: Record<string, unknown>[] = await res.json()
    if (!Array.isArray(rows)) return []
    return rows.map(mapPublishedRegulatorySignalRow).filter((signal): signal is PublicRegulatorySignal => signal !== null)
  } catch {
    return []
  }
}

export type PublicRegulatorySignalFeed = {
  signals: PublicRegulatorySignal[]
  source: 'live-approved'
  publicLabel: string
  reviewBoundary: string
}

export async function getPublicRegulatorySignalFeed(): Promise<PublicRegulatorySignalFeed> {
  const published = await fetchPublishedRegulatorySignals()

  return {
    signals: published,
    source: 'live-approved',
    publicLabel: published.length ? 'Published public-safe regulatory signals' : 'No reviewed regulatory signal available',
    reviewBoundary: published.length
      ? 'Signals are sourced only from regulatory_signals.public_signals. Private captures, raw text, storage paths, watcher errors, analyst notes and internal review material are excluded.'
      : 'No approved public-safe regulatory signal is currently available. Fresh source checks may still be running, failing, or awaiting admin review.',
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
