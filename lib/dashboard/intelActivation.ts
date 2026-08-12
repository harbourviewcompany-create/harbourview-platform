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

/**
 * Match active org watch rules against the public reviewed signal corpus
 * (up to the feed window — not limited to the Command Centre session slice).
 */
export async function getCorpusWatchHits(
  rules: WatchRuleInput[],
  limit = 24,
): Promise<CorpusWatchHit[]> {
  const active = rules.filter(r => r.is_active && Array.isArray(r.keywords) && r.keywords.length > 0)
  if (active.length === 0) return []

  try {
    const feed = await getPublicRegulatorySignalFeed()
    const signals = feed.signals
    if (!signals.length) return []

    const hits: CorpusWatchHit[] = []

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
        const matched = rule.keywords.filter(kw => {
          const needle = String(kw).trim().toLowerCase()
          return needle.length > 0 && text.includes(needle)
        })
        if (matched.length > 0) {
          ruleIds.push(rule.id)
          for (const m of matched) {
            if (!matchedKeywords.includes(m)) matchedKeywords.push(m)
          }
        }
      }

      if (matchedKeywords.length === 0) continue

      hits.push({
        signalId: signal.id,
        title: signal.headline,
        market: signal.country_name || signal.country_code || 'Global',
        matchedKeywords,
        ruleIds,
        signalDate: signal.signal_date,
        confidence: signal.confidence ?? null,
        source: 'corpus',
      })

      if (hits.length >= limit) break
    }

    return hits
  } catch {
    return []
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
