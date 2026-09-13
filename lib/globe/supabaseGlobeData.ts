/**
 * lib/globe/supabaseGlobeData.ts
 *
 * Market Access display tiers prefer the evidence-backed verified tier. Where
 * verified publication is not yet available, the existing five-tier legacy
 * classifier is exposed as a provisional display tier so the global choropleth
 * does not silently disappear. Provisional rows are explicitly marked and
 * must not be treated as verified regulatory evidence.
 */
import { createClient } from '@/lib/supabase/client'
import type { RegulatoryTier } from './globe-materials'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GlobeTierSource = 'verified' | 'provisional_legacy' | 'unresolved'

export type GlobeCountryMarker = {
  iso2: string
  name: string
  lat: number | null
  lng: number | null
  opportunityScore: number | null
  signalsStatus: string | null
  marketAccessStatus: string | null
  /** Display tier. Verified evidence wins; legacy is provisional only. */
  regulatoryTier: RegulatoryTier | null
  regulatoryTierSource: GlobeTierSource
  regulatoryTierEvidenceKey: string | null
  regulatoryTierVerifiedAt: string | null
  regulatoryTierExpiresAt: string | null
}

export type GlobeSignal = {
  id: string
  headline: string
  score: number | null
  cat: string | null
  createdAt: string
  countryIso2: string | null
}

export type GlobeLiveData = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
  unmappedSignalCountries: Record<string, number>
}

export type PublishedTierRow = {
  verified_regulatory_tier?: string | null
  regulatory_tier?: string | null
  regulatory_tier_evidence_key?: string | null
  regulatory_tier_verified_at?: string | null
  regulatory_tier_expires_at?: string | null
}

const REGULATORY_TIERS: readonly RegulatoryTier[] = [
  'legal_commercial_access',
  'medical_limited_trade',
  'domestic_only',
  'cbd_hemp_only',
  'prohibited',
]

function asRegulatoryTier(value: string | null | undefined): RegulatoryTier | null {
  return value && REGULATORY_TIERS.includes(value as RegulatoryTier)
    ? (value as RegulatoryTier)
    : null
}

/** Strict publication boundary. This remains fail-closed for verified evidence. */
export function resolvePublishedRegulatoryTier(
  row: PublishedTierRow,
  nowMs: number = Date.now(),
): RegulatoryTier | null {
  const tier = asRegulatoryTier(row.verified_regulatory_tier)
  if (!tier || !row.regulatory_tier_evidence_key || !row.regulatory_tier_verified_at || !row.regulatory_tier_expires_at) {
    return null
  }
  const verifiedMs = Date.parse(row.regulatory_tier_verified_at)
  const expiresMs = Date.parse(row.regulatory_tier_expires_at)
  if (!Number.isFinite(verifiedMs) || !Number.isFinite(expiresMs)) return null
  if (verifiedMs > nowMs || expiresMs <= nowMs) return null
  return tier
}

/**
 * Resolve the tier used by the public globe visual layer.
 *
 * The verified publication contract remains authoritative whenever available.
 * A non-null legacy tier is used only as a provisional visual fallback so a
 * jurisdiction remains represented on the global map. Callers receive the
 * source explicitly and can distinguish provisional from verified data.
 */
export function resolveGlobeDisplayTier(
  row: PublishedTierRow,
  nowMs: number = Date.now(),
): { tier: RegulatoryTier | null; source: GlobeTierSource } {
  const verified = resolvePublishedRegulatoryTier(row, nowMs)
  if (verified) return { tier: verified, source: 'verified' }

  const provisional = asRegulatoryTier(row.regulatory_tier)
  if (provisional) return { tier: provisional, source: 'provisional_legacy' }

  return { tier: null, source: 'unresolved' }
}

export async function getGlobeCountryMarkers(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeCountryMarker[]> {
  const { data: countryRows, error: countriesError } = await supabase
    .from('countries')
    .select(
      'iso_alpha2, country_name, lat, lng, opportunity_score, signals_status, market_access_status, regulatory_tier, verified_regulatory_tier, regulatory_tier_evidence_key, regulatory_tier_verified_at, regulatory_tier_expires_at'
    )
    .not('iso_alpha2', 'is', null)

  if (countriesError) {
    throw new Error(`getGlobeCountryMarkers: countries query failed: ${countriesError.message}`)
  }

  const nowMs = Date.now()
  return (countryRows ?? []).map((c) => {
    const display = resolveGlobeDisplayTier(c, nowMs)
    return {
      iso2: c.iso_alpha2,
      name: c.country_name,
      lat: c.lat ?? null,
      lng: c.lng ?? null,
      opportunityScore: c.opportunity_score,
      signalsStatus: c.signals_status,
      marketAccessStatus: c.market_access_status,
      regulatoryTier: display.tier,
      regulatoryTierSource: display.source,
      regulatoryTierEvidenceKey: c.regulatory_tier_evidence_key ?? null,
      regulatoryTierVerifiedAt: c.regulatory_tier_verified_at ?? null,
      regulatoryTierExpiresAt: c.regulatory_tier_expires_at ?? null,
    }
  })
}

export async function getGlobeLiveData(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeLiveData> {
  const countries = await getGlobeCountryMarkers(supabase)

  const { data: signalRows, error: signalsError } = await supabase
    .from('signals')
    .select('id, headline, score, cat, country, country_iso2, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  if (signalsError) {
    throw new Error(`getGlobeLiveData: signals query failed: ${signalsError.message}`)
  }

  const signalsByIso2: Record<string, GlobeSignal[]> = {}
  const unmappedSignalCountries: Record<string, number> = {}

  for (const row of signalRows ?? []) {
    const iso2 = row.country_iso2
    const signal: GlobeSignal = {
      id: row.id,
      headline: row.headline,
      score: row.score,
      cat: row.cat,
      createdAt: row.created_at,
      countryIso2: iso2,
    }
    if (iso2) {
      if (!signalsByIso2[iso2]) signalsByIso2[iso2] = []
      signalsByIso2[iso2].push(signal)
    } else {
      const key = row.country ?? '(null)'
      unmappedSignalCountries[key] = (unmappedSignalCountries[key] ?? 0) + 1
    }
  }
  return { countries, signalsByIso2, unmappedSignalCountries }
}

export type SignalRealtimeRow = {
  id: string
  headline: string
  score: number | null
  cat: string | null
  country: string | null
  country_iso2: string | null
  created_at: string
}

export function mergeSignalRealtimeRow(prev: GlobeLiveData, row: SignalRealtimeRow): GlobeLiveData {
  const iso2 = row.country_iso2
  const signal: GlobeSignal = {
    id: row.id,
    headline: row.headline,
    score: row.score,
    cat: row.cat,
    createdAt: row.created_at,
    countryIso2: iso2,
  }
  if (!iso2) {
    const key = row.country ?? '(null)'
    return {
      ...prev,
      unmappedSignalCountries: {
        ...prev.unmappedSignalCountries,
        [key]: (prev.unmappedSignalCountries[key] ?? 0) + 1,
      },
    }
  }
  const existing = prev.signalsByIso2[iso2] ?? []
  return {
    ...prev,
    signalsByIso2: {
      ...prev.signalsByIso2,
      [iso2]: [signal, ...existing.filter((s) => s.id !== signal.id)].slice(0, 50),
    },
  }
}
