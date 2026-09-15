/**
 * lib/globe/supabaseGlobeData.ts
 *
 * Market Access display tiers are evidence-backed only. Jurisdictions remain
 * geometrically rendered when evidence is unavailable, but unresolved regions
 * are intentionally neutral rather than being assigned a legacy tier.
 */
import { createClient } from '@/lib/supabase/client'
import type { RegulatoryTier } from './globe-materials'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GlobeTierSource = 'verified' | 'unresolved'

export type GlobeCountryMarker = {
  iso2: string
  name: string
  lat: number | null
  lng: number | null
  opportunityScore: number | null
  signalsStatus: string | null
  marketAccessStatus: string | null
  /** Display tier. Only currently valid evidence may produce a tier. */
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
  /** Evidence-backed tiers for both national and rendered subnational geometries. */
  regulatoryTiersByIso2: Record<string, RegulatoryTier | null>
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

/** Resolve only evidence-backed data for the public globe. */
export function resolveGlobeDisplayTier(
  row: PublishedTierRow,
  nowMs: number = Date.now(),
): { tier: RegulatoryTier | null; source: GlobeTierSource } {
  const verified = resolvePublishedRegulatoryTier(row, nowMs)
  if (verified) return { tier: verified, source: 'verified' }
  return { tier: null, source: 'unresolved' }
}

type EvidenceTierRow = {
  jurisdiction_iso2: string | null
  tier: string | null
  evidence_key: string | null
  verified_at: string | null
  expires_at: string | null
  active: boolean | null
}

function buildEvidenceTierMap(rows: readonly EvidenceTierRow[], nowMs: number): Record<string, RegulatoryTier | null> {
  const map: Record<string, RegulatoryTier | null> = {}
  for (const row of rows) {
    if (!row.jurisdiction_iso2 || !row.active) continue
    const tier = asRegulatoryTier(row.tier)
    const verifiedMs = row.verified_at ? Date.parse(row.verified_at) : NaN
    const expiresMs = row.expires_at ? Date.parse(row.expires_at) : NaN
    if (!tier || !row.evidence_key || !Number.isFinite(verifiedMs) || !Number.isFinite(expiresMs)) continue
    if (verifiedMs > nowMs || expiresMs <= nowMs) continue
    if (map[row.jurisdiction_iso2] === undefined) map[row.jurisdiction_iso2] = tier
  }
  return map
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
  const nowMs = Date.now()

  const { data: evidenceRows, error: evidenceError } = await supabase
    .from('regulatory_market_access_evidence')
    .select('jurisdiction_iso2, tier, evidence_key, verified_at, expires_at, active')
    .eq('active', true)
    .order('verified_at', { ascending: false })

  if (evidenceError) {
    throw new Error(`getGlobeLiveData: regulatory evidence query failed: ${evidenceError.message}`)
  }

  const regulatoryTiersByIso2 = buildEvidenceTierMap((evidenceRows ?? []) as EvidenceTierRow[], nowMs)
  for (const country of countries) {
    if (country.regulatoryTier) regulatoryTiersByIso2[country.iso2] = country.regulatoryTier
  }

  const { data: signalRows, error: signalsError } = await supabase
    .from('signals')
    .select('id, headline, score, cat, country, country_iso2, created_at')
    .gte('created_at', new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString())
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
  return { countries, regulatoryTiersByIso2, signalsByIso2, unmappedSignalCountries }
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
