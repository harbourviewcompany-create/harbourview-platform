/**
 * lib/globe/supabaseGlobeData.ts
 *
 * Real schema, verified live against the database on 2026-07-05:
 * - `countries` has lat/lng + iso_alpha2 — this is the actual marker source
 *   (there is no `suppliers` table with geo fields; do not reintroduce one).
 * - `signals` has no country_iso2 or intensity column, and `country` is free
 *   text — resolved via countryAlias.ts, with unmapped values surfaced
 *   explicitly rather than dropped.
 * - `market_metrics` has country_iso2 (real column) for market-size/opportunity
 *   overlays if needed later.
 * - There is no `realtime_metrics` table. If telemetry is wanted, that's a
 *   separate migration + decision, not assumed here.
 */
import { createClient } from '@/lib/supabase/server'
import { resolveCountryToIso2 } from './countryAlias'

export type GlobeCountryMarker = {
  iso2: string
  name: string
  lat: number
  lng: number
  opportunityScore: number | null
  signalsStatus: string | null
  marketAccessStatus: string | null
}

export type GlobeSignal = {
  id: string
  headline: string
  score: number | null
  cat: string | null
  createdAt: string
  countryIso2: string | null // null = regional/unmapped, see unmappedSignalCountries
}

export type GlobeLiveData = {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
  /** Signals whose `country` value didn't resolve to a plottable ISO2 —
   *  surfaced so this doesn't fail silently. Includes regional buckets
   *  ("Global", "Europe", etc.) and genuinely unmapped country strings. */
  unmappedSignalCountries: Record<string, number>
}

export async function getGlobeLiveData(): Promise<GlobeLiveData> {
  const supabase = await createClient()

  const { data: countryRows, error: countriesError } = await supabase
    .from('countries')
    .select(
      'iso_alpha2, country_name, lat, lng, opportunity_score, signals_status, market_access_status'
    )
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (countriesError) {
    // Fail loud — do not return an empty globe silently.
    throw new Error(`getGlobeLiveData: countries query failed: ${countriesError.message}`)
  }

  const countries: GlobeCountryMarker[] = (countryRows ?? []).map((c) => ({
    iso2: c.iso_alpha2,
    name: c.country_name,
    lat: c.lat,
    lng: c.lng,
    opportunityScore: c.opportunity_score,
    signalsStatus: c.signals_status,
    marketAccessStatus: c.market_access_status,
  }))

  const iso2ByName = new Map(
    countries.map((c) => [c.name.toLowerCase(), c.iso2])
  )

  const { data: signalRows, error: signalsError } = await supabase
    .from('signals')
    .select('id, headline, score, cat, country, created_at')
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (signalsError) {
    throw new Error(`getGlobeLiveData: signals query failed: ${signalsError.message}`)
  }

  const signalsByIso2: Record<string, GlobeSignal[]> = {}
  const unmappedSignalCountries: Record<string, number> = {}

  for (const row of signalRows ?? []) {
    const iso2 = resolveCountryToIso2(row.country, iso2ByName)
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
