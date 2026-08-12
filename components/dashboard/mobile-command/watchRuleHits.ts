/**
 * Session-scoped watch-rule matching for Mobile Command Intel.
 * Does not query the full corpus — only signals already loaded into the session.
 */

export type WatchRuleLike = {
  id: string
  rule_type?: string
  keywords: string[]
  is_active: boolean
}

export type SignalLike = {
  id?: string
  title?: string
  market?: string
  type?: string
  commercialImpact?: string
  timeAgo?: string
  confidence?: number
  analysis?: {
    what_changed?: string
    recommended_action?: string
  }
}

export type WatchRuleHit = {
  signalId: string
  title: string
  market: string
  matchedKeywords: string[]
  ruleIds: string[]
  confidence: number | null
  timeAgo: string
}

function haystack(signal: SignalLike): string {
  return [
    signal.title,
    signal.market,
    signal.type,
    signal.commercialImpact,
    signal.analysis?.what_changed,
    signal.analysis?.recommended_action,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * Match active keyword rules against session-loaded signals.
 * Keyword match is case-insensitive substring on title + impact + analysis text.
 */
export function matchWatchRuleHits(
  signals: SignalLike[],
  rules: WatchRuleLike[],
  limit = 12,
): WatchRuleHit[] {
  const active = rules.filter(r => r.is_active && Array.isArray(r.keywords) && r.keywords.length > 0)
  if (active.length === 0 || signals.length === 0) return []

  const hits: WatchRuleHit[] = []

  for (const signal of signals) {
    const text = haystack(signal)
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
      signalId: signal.id || `${signal.title}-${signal.market}`,
      title: signal.title || 'Untitled signal',
      market: signal.market || 'Global',
      matchedKeywords,
      ruleIds,
      confidence: typeof signal.confidence === 'number' ? signal.confidence : null,
      timeAgo: signal.timeAgo || '',
    })
  }

  return hits.slice(0, limit)
}
