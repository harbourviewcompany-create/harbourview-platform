import 'server-only'

import { createHash } from 'node:crypto'
import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import {
  generatePersonalBriefing,
  getSynthBriefingsForMarkets,
} from '@/lib/intelligence/personalBriefing'

const ISO2_RE = /^[A-Z]{2}$/
const PERSONAL_BRIEFING_CACHE_TTL_MS = 5 * 60 * 1000
const PERSONAL_BRIEFING_CACHE_MAX_ENTRIES = 250

type PersonalBriefingInput = Parameters<typeof generatePersonalBriefing>[0]
type PersonalBriefingResult = Awaited<ReturnType<typeof generatePersonalBriefing>>
type PersonalBriefingCacheEntry = {
  expiresAt: number
  promise: Promise<PersonalBriefingResult>
}

const personalBriefingCache = new Map<string, PersonalBriefingCacheEntry>()

function personalBriefingFingerprint(input: PersonalBriefingInput): string {
  const canonical = JSON.stringify({
    keywords: [...input.keywords].map(value => value.trim().toLowerCase()).sort(),
    iso2List: [...input.iso2List].map(value => value.trim().toUpperCase()).sort(),
    ruleTypes: [...input.ruleTypes].map(value => value.trim().toLowerCase()).sort(),
  })
  return createHash('sha256').update(canonical).digest('hex')
}

function prunePersonalBriefingCache(now: number) {
  for (const [key, entry] of personalBriefingCache) {
    if (entry.expiresAt <= now) personalBriefingCache.delete(key)
  }
  while (personalBriefingCache.size >= PERSONAL_BRIEFING_CACHE_MAX_ENTRIES) {
    const oldestKey = personalBriefingCache.keys().next().value as string | undefined
    if (!oldestKey) break
    personalBriefingCache.delete(oldestKey)
  }
}

function getCachedPersonalBriefing(userId: string, input: PersonalBriefingInput) {
  const now = Date.now()
  const cacheKey = `${userId}:${personalBriefingFingerprint(input)}`
  const cached = personalBriefingCache.get(cacheKey)
  if (cached && cached.expiresAt > now) return cached.promise

  prunePersonalBriefingCache(now)
  const promise = generatePersonalBriefing(input).catch(error => {
    personalBriefingCache.delete(cacheKey)
    throw error
  })
  personalBriefingCache.set(cacheKey, {
    expiresAt: now + PERSONAL_BRIEFING_CACHE_TTL_MS,
    promise,
  })
  return promise
}

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
  const personalInput = { keywords: keywordPool, iso2List, ruleTypes }

  const [staticBriefings, synthBriefings, personal] = await Promise.all([
    Promise.all(
      iso2List.map(async iso2 => ({
        iso2,
        briefing: await getJurisdictionBriefing(iso2),
      })),
    ).then(rows => rows.filter(row => row.briefing)),
    getSynthBriefingsForMarkets(iso2List),
    getCachedPersonalBriefing(userId, personalInput),
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
