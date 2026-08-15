import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import { getCorpusWatchHits, getJurisdictionRegistryStatus } from '@/lib/dashboard/intelActivation'

export const dynamic = 'force-dynamic'

/** Authenticated org keyword rules × public reviewed corpus + jurisdiction readiness. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const countryLabel = request.nextUrl.searchParams.get('country')
    const [watchlist, registry] = await Promise.all([
      getWatchlistData(user.id),
      getJurisdictionRegistryStatus(),
    ])
    const result = await getCorpusWatchHits(watchlist.rules, { limit: 24, countryLabel })

    return NextResponse.json({
      corpusHits: result.hits,
      scannedAt: result.scannedAt,
      activeRuleCount: result.activeRuleCount,
      feedSize: result.feedSize,
      feedFreshness: result.feedFreshness,
      feedAgeHours: result.feedAgeHours,
      silent: result.silent,
      jurisdictionRegistry: registry,
      countryFilter: countryLabel,
      scope: 'public_reviewed_corpus',
      note: result.silent
        ? 'Active rules found no matches in the current public reviewed feed window. Silence is not a guarantee the full historical archive is quiet.'
        : 'Corpus window is the public reviewed feed, not private staging or full historical archive.',
    })
  } catch (err) {
    console.error('[watch-hits]', err)
    return NextResponse.json({ error: 'Failed to load watch hits' }, { status: 500 })
  }
}
