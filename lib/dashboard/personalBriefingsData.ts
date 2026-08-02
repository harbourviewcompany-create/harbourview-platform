import 'server-only'

import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import {
  generatePersonalBriefing,
  getSynthBriefingsForMarkets,
} from '@/lib/intelligence/personalBriefing'

const ISO2_RE = /^[A-Z]{2}$/

function extractIso2Hints(
  rules: Array<{ keywords: string[] }>,
  items: Array<{ jurisdiction: string | null }>,
): string[] {
  const found = new Set<string>()
  for (const item of items) {
    const jurisdiction = item.jurisdiction?.trim().toUpperCase()
    if (jurisdiction && ISO2_RE.test(jurisdiction)) found.add(jurisdiction)
  }
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      const normalized = keyword.trim().toUpperCase()
      if (ISO2_RE.test(normalized)) found.add(normalized)
    }
  }
  return Array.from(found).slice(0, 6)
}

export async function loadPersonalBriefingsData(userId: string) {
  const watchlist = await getWatchlistData(userId)
  const activeRules = watchlist.rules.filter(rule => rule.is_active)
  const iso2List = extractIso2Hints(activeRules, watchlist.items)
  const keywordPool = activeRules.flatMap(rule => rule.keywords).slice(0, 12)
  const ruleTypes = Array.from(new Set(activeRules.map(rule => rule.rule_type)))

  const [staticBriefings, synthBriefings, personal] = await Promise.all([
    Promise.all(
      iso2List.map(async iso2 => ({
        iso2,
        briefing: await getJurisdictionBriefing(iso2),
      })),
    ).then(rows => rows.filter(row => row.briefing)),
    getSynthBriefingsForMarkets(iso2List),
    generatePersonalBriefing({ keywords: keywordPool, iso2List, ruleTypes }),
  ])

  return {
    personal,
    activeRules,
    keywordPool,
    synthBriefings,
    staticBriefings,
  }
}

export type PersonalBriefingsData = Awaited<ReturnType<typeof loadPersonalBriefingsData>>
