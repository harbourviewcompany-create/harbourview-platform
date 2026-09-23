import { NextResponse } from 'next/server'
import { getGlobeLiveDataCached, GLOBE_REVALIDATE_SECONDS } from '@/lib/globe/globeDataServer'
import type { GlobeLiveData } from '@/lib/globe/supabaseGlobeData'

// Cached at the route-segment level too; must be a static literal for Next.
export const revalidate = 300


/**
 * Cached globe payload for the client GlobeProvider. Replaces a per-visitor
 * browser PostgREST query with a single server-side query cached for 5 minutes
 * — lowers load on the (Micro) database and keeps the heat map rendering from
 * cache during a transient DB blip. On hard failure it returns an empty payload
 * with `degraded: true` and HTTP 200, so the globe renders the sphere with no
 * markers rather than dead-ending on an error.
 */
export async function GET() {
  try {
    const data = await getGlobeLiveDataCached()
    return NextResponse.json(
      {
        ...data,
        degraded: false,
        diagnostics: {
          countryCount: data.countries.length,
          mappedSignalCountryCount: Object.keys(data.signalsByIso2).length,
          regulatoryTierCount: data.countries.filter((c) => c.regulatoryTier !== null).length,
          coordinateCount: data.countries.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)).length,
        },
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${GLOBE_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
        },
      },
    )
  } catch (err) {
    // Do not turn an upstream schema/database failure into a false HTTP 200.
    // The provider has bounded retry logic; a 5xx makes the failure observable
    // and prevents an empty globe payload from being cached as healthy data.
    console.error('[api/globe] live data failure:', err)
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
