/**
 * lib/globe/supabaseGlobeData.ts
 *
 * Public Market Access colour prefers the evidence-backed published tier.
 * Where that publication layer is not yet populated, the existing reviewed
 * regulatory_tier is used as a bounded legacy coverage fallback. The fallback
 * is exposed as provenance and is never treated as new evidence.
 */
import { createClient } from '@/lib/supabase/client'
import { naturalEarthCountriesPayload } from '@/data/globe/natural-earth-countries'
import type { RegulatoryTier } from './globe-materials'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GlobeCountryMarker = {
  iso2: string
  name: string
  lat: number
  lng: number
  opportunityScore: number | null
  signalsStatus: string | null
  marketAccessStatus: string | null
  /** Evidence-backed published tier. null = unresolved/stale -> neutral. */
  regulatoryTier: RegulatoryTier | null
  regulatoryTierEvidenceKey: string | null
  regulatoryTierVerifiedAt: string | null
  regulatoryTierExpiresAt: string | null
  regulatoryTierProvenance: 'verified' | 'legacy' | null
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
  regulatory_tier?: string | null
  regulatory_tier_needs_review?: boolean | null
  regulatory_tier_last_derived_at?: string | null
  verified_regulatory_tier?: string | null
  regulatory_tier_evidence_key?: string | null
  regulatory_tier_verified_at?: string | null
  regulatory_tier_expires_at?: string | null
}

/** Fail closed unless tier + evidence + verification + unexpired freshness all agree. */
export function resolvePublishedRegulatoryTier(
  row: PublishedTierRow,
  nowMs: number = Date.now(),
): RegulatoryTier | null {
  const tier = row.verified_regulatory_tier as RegulatoryTier | null | undefined
  if (!tier || !row.regulatory_tier_evidence_key || !row.regulatory_tier_verified_at || !row.regulatory_tier_expires_at) {
    return null
  }
  const verifiedMs = Date.parse(row.regulatory_tier_verified_at)
  const expiresMs = Date.parse(row.regulatory_tier_expires_at)
  if (!Number.isFinite(verifiedMs) || !Number.isFinite(expiresMs)) return null
  if (verifiedMs > nowMs || expiresMs <= nowMs) return null
  return tier
}

export function resolveGlobeRegulatoryTier(
  row: PublishedTierRow,
  nowMs: number = Date.now(),
): { tier: RegulatoryTier | null; provenance: 'verified' | 'legacy' | null } {
  const verified = resolvePublishedRegulatoryTier(row, nowMs)
  if (verified) return { tier: verified, provenance: 'verified' }

  const legacy = row.regulatory_tier as RegulatoryTier | null | undefined
  const derivedAt = row.regulatory_tier_last_derived_at
    ? Date.parse(row.regulatory_tier_last_derived_at)
    : NaN
  const legacyEligible =
    !!legacy &&
    row.regulatory_tier_needs_review !== true &&
    Number.isFinite(derivedAt) &&
    derivedAt <= nowMs &&
    derivedAt >= nowMs - 31 * 24 * 60 * 60 * 1000
  return legacyEligible
    ? { tier: legacy, provenance: 'legacy' }
    : { tier: null, provenance: null }
}

export async function getGlobeCountryMarkers(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeCountryMarker[]> {
  const { data: countryRows, error: countriesError } = await supabase
    .from('countries')
    .select(
      'iso_alpha2, country_name, lat, lng, opportunity_score, signals_status, market_access_status, regulatory_tier, regulatory_tier_needs_review, regulatory_tier_last_derived_at, verified_regulatory_tier, regulatory_tier_evidence_key, regulatory_tier_verified_at, regulatory_tier_expires_at'
    )

  if (countriesError) {
    throw new Error(`getGlobeCountryMarkers: countries query failed: ${countriesError.message}`)
  }

  const nowMs = Date.now()
  const centroidByIso2 = new Map(
    naturalEarthCountriesPayload.countries.map((country) => [
      country.iso2,
      country.centroid,
    ]),
  )

  // The database remains authoritative for stored coordinates. If a country
  // record has no coordinates, use the checked-in Natural Earth centroid so the
  // 291-jurisdiction globe/heat surface does not silently drop that jurisdiction.
  // This is geometry positioning, not regulatory inference.
  return (countryRows ?? []).map((c) => {
    const centroid = centroidByIso2.get(c.iso_alpha2)
    const lat = Number.isFinite(c.lat) ? c.lat : centroid?.[1] ?? null
    const lng = Number.isFinite(c.lng) ? c.lng : centroid?.[0] ?? null
    return {
    iso2: c.iso_alpha2,
    name: c.country_name,
    lat,
    lng,
    opportunityScore: c.opportunity_score,
    signalsStatus: c.signals_status,
    marketAccessStatus: c.market_access_status,
    ...(() => {
      const resolved = resolveGlobeRegulatoryTier(c, nowMs)
      return { regulatoryTier: resolved.tier, regulatoryTierProvenance: resolved.provenance }
    })(),
    regulatoryTierEvidenceKey: c.regulatory_tier_evidence_key ?? null,
    regulatoryTierVerifiedAt: c.regulatory_tier_verified_at ?? null,
    regulatoryTierExpiresAt: c.regulatory_tier_expires_at ?? null,
    }
  }).filter((marker): marker is GlobeCountryMarker =>
    Number.isFinite(marker.lat) && Number.isFinite(marker.lng)
  )
}

export async function getGlobeLiveData(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeLiveData> {
  // These datasets are independent. Run them concurrently so the globe's
  // server-side cache fill is bounded by the slower query instead of their sum.
  const [countriesResult, signalsResult] = await Promise.all([
    getGlobeCountryMarkers(supabase),
    supabase
      .from('signals')
      .select('id, headline, score, cat, country, country_iso2, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const { data: signalRows, error: signalsError } = signalsResult
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
  return { countries: countriesResult, signalsByIso2, unmappedSignalCountries }
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
  const nextSignals = [signal, ...existing.filter((s) => s.id !== signal.id)].slice(0, 50)

  return {
    ...prev,
    signalsByIso2: {
      ...prev.signalsByIso2,
      [iso2]: nextSignals,
    },
  }
}
