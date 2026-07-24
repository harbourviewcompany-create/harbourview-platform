import { NextResponse } from 'next/server'
import { getGlobeLiveDataCached, GLOBE_REVALIDATE_SECONDS } from '@/lib/globe/globeDataServer'
import type { GlobeLiveData } from '@/lib/globe/supabaseGlobeData'

// Cached at the route-segment level too; must be a static literal for Next.
export const revalidate = 300

const EMPTY: GlobeLiveData = {
  countries: [],
  signalsByIso2: {},
  unmappedSignalCountries: {},
}

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
      { ...data, degraded: false },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${GLOBE_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
        },
      },
    )
  } catch (err) {
    console.error('[api/globe] degraded — serving empty payload:', err)
    return NextResponse.json(
      { ...EMPTY, degraded: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
