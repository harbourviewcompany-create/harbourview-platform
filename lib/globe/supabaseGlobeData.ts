/**
 * lib/globe/supabaseGlobeData.ts
 *
 * Real schema, verified live against the database on 2026-07-21:
 * - `countries` has lat/lng + iso_alpha2 — this is the actual marker source
 *   (there is no `suppliers` table with geo fields; do not reintroduce one).
 * - `signals.country` is free text, but as of migration
 *   `20260716195743_signals_country_iso_resolution`, `signals.country_iso2`
 *   is resolved server-side by the `trg_signals_resolve_geo` trigger on every
 *   insert/update (direct match, `country_name_aliases`, or a regional/global
 *   bucket via `signal_geo_labels`) — read it directly, do not re-resolve
 *   client-side.
 * - `market_metrics` has country_iso2 (real column) for market-size/opportunity
 *   overlays if needed later.
 * - There is no `realtime_metrics` table. If telemetry is wanted, that's a
 *   separate migration + decision, not assumed here.
 */
import { createClient } from '@/lib/supabase/client'
import type { RegulatoryTier } from './globe-materials'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GlobeCountryMarker = {
  iso2: string
  name: string
  lat: number
  lng: number
  opportunityScore: number | null
  signalsStatus: string | null
  /**
   * Legacy, unsourced. Retained because other code reads it. Do NOT use it to
   * colour the globe: it grades the UK (lawful Schedule 2 medical market) the
   * same as Saudi Arabia (prohibited, death penalty), and `import_status` /
   * `export_status` claim the US actively imports and exports. Use
   * `regulatoryTier` instead.
   */
  marketAccessStatus: string | null
  /** Live tier from countries.regulatory_tier. null = unresolved → renders neutral. */
  regulatoryTier: RegulatoryTier | null
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

/**
 * Fetch only current jurisdiction marker/tier rows.
 *
 * The heatmap uses this lightweight query on initial browser load so it never
 * depends on a stale cached /api/globe snapshot for regulatory colour. Realtime
 * country events then keep the same collection current while the page is open.
 */
export async function getGlobeCountryMarkers(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeCountryMarker[]> {
  const { data: countryRows, error: countriesError } = await supabase
    .from('countries')
    .select(
      'iso_alpha2, country_name, lat, lng, opportunity_score, signals_status, market_access_status, regulatory_tier'
    )
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (countriesError) {
    throw new Error(`getGlobeCountryMarkers: countries query failed: ${countriesError.message}`)
  }

  return (countryRows ?? []).map((c) => ({
    iso2: c.iso_alpha2,
    name: c.country_name,
    lat: c.lat,
    lng: c.lng,
    opportunityScore: c.opportunity_score,
    signalsStatus: c.signals_status,
    marketAccessStatus: c.market_access_status,
    regulatoryTier: (c.regulatory_tier as RegulatoryTier | null) ?? null,
  }))
}

/**
 * Fetch the complete globe payload. Accepts an injected Supabase client so the
 * same query can run under the browser client or a server-side anon client.
 * The server route caches this complete payload for signal/read-load efficiency;
 * GlobeProvider separately reconciles the countries array from the fresh helper
 * above before publishing the initial heatmap state.
 */
export async function getGlobeLiveData(
  supabase: SupabaseClient = createClient() as unknown as SupabaseClient,
): Promise<GlobeLiveData> {
  const countries = await getGlobeCountryMarkers(supabase)

  const { data: signalRows, error: signalsError } = await supabase
    .from('signals')
    .select('id, headline, score, cat, country, country_iso2, created_at')
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

/**
 * Merges one realtime INSERT/UPDATE `signals` row into live data. Pulled out of
 * GlobeProvider so the merge logic (iso2 bucketing, unmapped tracking, per-country
 * cap) is unit-testable without rendering the provider.
 *
 * Called for both INSERT and UPDATE (GlobeProvider only skips DELETE), so a row
 * already present — e.g. an editorial curation edit setting `reviewed`/
 * `editorial_title` — must replace its old entry, not duplicate it.
 */
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
    // Known imprecision: an UPDATE to a signal that was already unmapped (id
    // already counted) still increments this bucket, since the counter alone
    // can't tell INSERT from UPDATE. Not fixed here — unmappedSignalCountries
    // is a diagnostic surfaced nowhere in the UI yet; revisit if that changes.
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
