import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import {
  generatePersonalBriefing,
  getSynthBriefingsForMarkets,
} from '@/lib/intelligence/personalBriefing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ISO2_RE = /^[A-Z]{2}$/

function extractIso2Hints(
  rules: { keywords: string[] }[],
  items: { jurisdiction: string | null }[],
): string[] {
  const found = new Set<string>()
  for (const item of items) {
    const j = item.jurisdiction?.trim().toUpperCase()
    if (j && ISO2_RE.test(j)) found.add(j)
  }
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      const t = kw.trim().toUpperCase()
      if (ISO2_RE.test(t)) found.add(t)
    }
  }
  return Array.from(found).slice(0, 6)
}

// Extracted from the former app/dashboard/my-briefings/page.tsx (server
// component). Same logic, exposed as JSON so Command Centre's Briefing
// section can fetch it lazily — the personal LLM synthesis call here is too
// slow/costly to run on every dashboard load for a tab most visits won't open.
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const watchlist = await getWatchlistData(user.id)
  const activeRules = watchlist.rules.filter((r) => r.is_active)
  const iso2List = extractIso2Hints(activeRules, watchlist.items)
  const keywordPool = activeRules.flatMap((r) => r.keywords).slice(0, 12)
  const ruleTypes = Array.from(new Set(activeRules.map((r) => r.rule_type)))

  const [staticBriefings, synthBriefings, personal] = await Promise.all([
    Promise.all(
      iso2List.map(async (iso2) => {
        const briefing = await getJurisdictionBriefing(iso2)
        return { iso2, briefing }
      }),
    ).then((rows) => rows.filter((b) => b.briefing)),
    getSynthBriefingsForMarkets(iso2List),
    generatePersonalBriefing({ keywords: keywordPool, iso2List, ruleTypes }),
  ])

  return NextResponse.json({
    activeRules,
    keywordPool,
    staticBriefings,
    synthBriefings,
    personal,
  })
}
