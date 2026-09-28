import { NextResponse } from 'next/server'
import { getGlobeLiveDataCached, GLOBE_REVALIDATE_SECONDS } from '@/lib/globe/globeDataServer'
import { getStaticGlobeCountryMarkers } from '@/lib/globe/supabaseGlobeData'

// ISR revalidate made Next prerender this route during `next build`.
// The live query exceeds the 60s static generation budget and fails production.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cached globe payload for the client GlobeProvider. Replaces a per-visitor
 * browser PostgREST query with a single server-side query cached for 5 minutes.
 * On hard failure it serves checked-in country geometry with degraded=true so
 * market routing remains usable while live database enrichment recovers.
 */
export async function GET() {
  try {
    const data = await getGlobeLiveDataCached()
    return NextResponse.json(
      {
        ...data,
        degraded: (data.degradedSources?.length ?? 0) > 0,
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
    console.error('[api/globe] live data failure:', err)
    const countries = getStaticGlobeCountryMarkers()
    return NextResponse.json(
      {
        countries,
        signalsByIso2: {},
        unmappedSignalCountries: {},
        degradedSources: ['countries', 'signals'],
        degraded: true,
        error: 'globe_live_data_degraded',
        diagnostics: {
          countryCount: countries.length,
          mappedSignalCountryCount: 0,
          regulatoryTierCount: 0,
          coordinateCount: countries.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
        },
      },
    )
  }
}
