import { NextResponse } from 'next/server'
import { getGlobeLiveDataCached, GLOBE_REVALIDATE_SECONDS } from '@/lib/globe/globeDataServer'
import { globeCacheControl, reportGlobeDegraded, reportGlobeHardFailure } from '@/lib/globe/degradedReporting'

// ISR revalidate made Next prerender this route during `next build`.
// The live query exceeds the 60s static generation budget and fails production.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cached globe payload for the client GlobeProvider. Replaces a per-visitor
 * browser PostgREST query with a single server-side query cached for 5 minutes.
 * Live-data failures normally degrade to neutral checked-in geography. Only an
 * unexpected server failure returns 503, so country routing remains available
 * during Supabase/PostgREST incidents.
 */
export async function GET() {
  try {
    const data = await getGlobeLiveDataCached()
    const degraded = data.signalsUnavailable === true || data.countriesUnavailable === true
    if (degraded) {
      reportGlobeDegraded({
        countriesUnavailable: data.countriesUnavailable === true,
        signalsUnavailable: data.signalsUnavailable === true,
      })
    }
    return NextResponse.json(
      {
        ...data,
        degraded,
        diagnostics: {
          countrySource: data.countriesUnavailable === true ? 'static' : 'live',
          signalsSource: data.signalsUnavailable === true ? 'unavailable' : 'live',
          countryCount: data.countries.length,
          mappedSignalCountryCount: Object.keys(data.signalsByIso2).length,
          regulatoryTierCount: data.countries.filter((c) => c.regulatoryTier !== null).length,
          coordinateCount: data.countries.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)).length,
        },
      },
      {
        headers: {
          'Cache-Control': globeCacheControl(degraded, GLOBE_REVALIDATE_SECONDS),
        },
      },
    )
  } catch (err) {
    console.error('[api/globe] live data failure:', err)
    reportGlobeHardFailure(err)
    return NextResponse.json(
      {
        countries: [],
        signalsByIso2: {},
        unmappedSignalCountries: {},
        degraded: true,
        error: 'globe_live_data_unavailable',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '3',
        },
      },
    )
  }
}
