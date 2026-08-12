import 'server-only'
import { getPublicRegulatorySignalFeed } from '@/lib/regulatory-signals/public'

export type WatchRuleInput = {
  id: string
  rule_type?: string
  keywords: string[]
  is_active: boolean
}

/** Session-independent match of active keyword rules against the public reviewed feed. */
export type CorpusWatchHit = {
  signalId: string
  title: string
  market: string
  matchedKeywords: string[]
  ruleIds: string[]
  signalDate: string
  confidence: string | null
  source: 'corpus'
  /** Higher = more relevant (keyword depth, confidence, jurisdiction focus). */
  score: number
  contextual: boolean
}

export type CorpusWatchResult = {
  hits: CorpusWatchHit[]
  scannedAt: string
  activeRuleCount: number
  feedSize: number
  feedFreshness: string
  feedAgeHours: number | null
  /** True when rules are active but zero hits in the scanned window. */
  silent: boolean
}

export type JurisdictionRegistryStatus = {
  /** Rows in public.jurisdictions when readable; 0 if unknown/unavailable. */
  count: number
  /** True when identity registry is populated (Decision Intel Stage 0 prerequisite). */
  ready: boolean
  /** Identity-only claim — no regulated-market completeness implied. */
  claimBoundary: 'verified_identity_only' | 'unavailable'
}

function haystack(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' ').toLowerCase()
}

/** Prefer whole-word match for short needles; substring for multi-word phrases. */
function keywordMatches(text: string, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return false
  if (needle.includes(' ') || needle.length >= 5) return text.includes(needle)
  // Short tokens (e.g. "GMP") — avoid matching inside unrelated words where possible
  try {
    return new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9])`, 'i').test(text)
  } catch {
    return text.includes(needle)
  }
}

function confidenceScore(conf: string | null | undefined): number {
  const c = (conf ?? '').toLowerCase()
  if (c === 'high') return 30
  if (c === 'medium') return 18
  if (c === 'low') return 8
  return 10
}

function recencyScore(signalDate: string): number {
  try {
    const ageDays = (Date.now() - new Date(signalDate).getTime()) / 86_400_000
    if (ageDays < 2) return 20
    if (ageDays < 7) return 12
    if (ageDays < 30) return 6
    return 2
  } catch {
    return 0
  }
}

function marketMatchesCountry(market: string, countryLabel?: string | null): boolean {
  if (!countryLabel) return false
  const a = market.trim().toLowerCase()
  const b = countryLabel.trim().toLowerCase()
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

/**
 * Match active org watch rules against the public reviewed signal corpus.
 * Optional countryLabel prioritises jurisdiction-relevant hits without dropping others.
 */
export async function getCorpusWatchHits(
  rules: WatchRuleInput[],
  options: { limit?: number; countryLabel?: string | null } = {},
): Promise<CorpusWatchResult> {
  const limit = options.limit ?? 24
  const countryLabel = options.countryLabel ?? null
  const scannedAt = new Date().toISOString()
  const active = rules.filter(r => r.is_active && Array.isArray(r.keywords) && r.keywords.length > 0)

  const empty = (feedSize = 0, freshness = 'unknown', ageHours: number | null = null): CorpusWatchResult => ({
    hits: [],
    scannedAt,
    activeRuleCount: active.length,
    feedSize,
    feedFreshness: freshness,
    feedAgeHours: ageHours,
    silent: active.length > 0,
  })

  if (active.length === 0) {
    return { ...empty(), silent: false }
  }

  try {
    const feed = await getPublicRegulatorySignalFeed()
    const signals = feed.signals
    if (!signals.length) return empty(0, feed.freshness, feed.ageHours)

    const scored: CorpusWatchHit[] = []

    for (const signal of signals) {
      const text = haystack([
        signal.headline,
        signal.public_summary,
        signal.public_implication,
        signal.country_name,
        signal.regulator_name,
        signal.jurisdiction,
      ])
      if (!text) continue

      const matchedKeywords: string[] = []
      const ruleIds: string[] = []

      for (const rule of active) {
        const matched = rule.keywords.filter(kw => keywordMatches(text, String(kw)))
        if (matched.length > 0) {
          ruleIds.push(rule.id)
          for (const m of matched) {
            if (!matchedKeywords.includes(m)) matchedKeywords.push(m)
          }
        }
      }

      if (matchedKeywords.length === 0) continue

      const market = signal.country_name || signal.country_code || 'Global'
      const contextual = marketMatchesCountry(market, countryLabel)
      const score =
        matchedKeywords.length * 15 +
        confidenceScore(signal.confidence) +
        recencyScore(signal.signal_date) +
        (contextual ? 40 : 0)

      scored.push({
        signalId: signal.id,
        title: signal.headline,
        market,
        matchedKeywords,
        ruleIds,
        signalDate: signal.signal_date,
        confidence: signal.confidence ?? null,
        source: 'corpus',
        score,
        contextual,
      })
    }

    scored.sort((a, b) => b.score - a.score || b.signalDate.localeCompare(a.signalDate))
    const hits = scored.slice(0, limit)

    return {
      hits,
      scannedAt,
      activeRuleCount: active.length,
      feedSize: signals.length,
      feedFreshness: feed.freshness,
      feedAgeHours: feed.ageHours,
      silent: hits.length === 0,
    }
  } catch {
    return empty()
  }
}

/**
 * Read-only readiness of the canonical jurisdiction identity registry.
 * Decision Intel Stage 0 depends on non-empty public.jurisdictions.
 */
export async function getJurisdictionRegistryStatus(): Promise<JurisdictionRegistryStatus> {
  const unavailable: JurisdictionRegistryStatus = {
    count: 0,
    ready: false,
    claimBoundary: 'unavailable',
  }
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('jurisdictions')
      .select('jurisdiction_id', { count: 'exact', head: true })
    if (error || typeof count !== 'number') return unavailable
    return {
      count,
      ready: count > 0,
      claimBoundary: count > 0 ? 'verified_identity_only' : 'unavailable',
    }
  } catch {
    return unavailable
  }
}
