import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import { getCorpusWatchHits, getJurisdictionRegistryStatus } from '@/lib/dashboard/intelActivation'

export const dynamic = 'force-dynamic'

/**
 * Authenticated: org keyword rules × public reviewed corpus (+ jurisdiction readiness).
 * Beyond the session-sliced Mobile Command feed.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [watchlist, registry] = await Promise.all([
      getWatchlistData(user.id),
      getJurisdictionRegistryStatus(),
    ])

    const corpusHits = await getCorpusWatchHits(watchlist.rules, 24)

    return NextResponse.json({
      corpusHits,
      activeRuleCount: watchlist.rules.filter(r => r.is_active).length,
      jurisdictionRegistry: registry,
      scope: 'public_reviewed_corpus',
      note: 'Corpus window is the public reviewed feed, not private staging or full historical archive.',
    })
  } catch (err) {
    console.error('[watch-hits]', err)
    return NextResponse.json({ error: 'Failed to load watch hits' }, { status: 500 })
  }
}
