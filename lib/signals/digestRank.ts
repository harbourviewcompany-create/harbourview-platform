/**
 * Elite digest ranking — pure functions, unit-testable.
 *
 * Mirrors the SQL ranking in
 * `supabase/migrations/20260730230000_elite_digest_from_pipeline_b.sql`
 * so the dashboard fallback path and any future TS-side composer share one
 * definition of "what belongs in a world-class daily brief".
 *
 * Design goals vs typical industry digests:
 *   - Quality-gated (classifier confidence, not keyword density)
 *   - Content-type aware (story/research/market primary; high-impact regulatory secondary)
 *   - Corroboration-aware (multi-source clusters rank higher)
 *   - Geographically diversified (cap per country so US does not dominate)
 *   - Prefer representatives (dedup already done upstream)
 */

import {
  resolveConfidence,
  resolveContentType,
  resolveImpact,
  isSurfaceable,
  type SignalQualityRow,
  type SignalContentType,
} from '@/lib/signals/quality'

export type DigestCandidate = SignalQualityRow & {
  id: string
  date?: string | null
  created_at?: string | null
  country?: string | null
  corroboration_count?: number
}

export type RankedDigestItem = {
  id: string
  rankScore: number
  confidence: number | null
  contentType: SignalContentType | null
  impact: ReturnType<typeof resolveImpact>
  market: string
  corroborationCount: number
}

const CONTENT_TYPE_BOOST: Record<string, number> = {
  story: 15,
  market: 12,
  research: 10,
  regulatory: 5,
  noise: 0,
}

const IMPACT_BOOST: Record<string, number> = {
  critical: 30,
  high: 25,
  moderate: 10,
  medium: 10,
  low: 0,
}

/** True when this row is eligible for the commercial daily digest. */
export function isDigestEligible(row: DigestCandidate): boolean {
  if (!isSurfaceable(row)) return false
  if (row.is_representative === false) return false

  const ct = resolveContentType(row)
  if (ct === 'story' || ct === 'research' || ct === 'market') return true

  // High-impact regulatory still belongs in a commercial brief.
  if (ct === 'regulatory' || ct === null) {
    const impact = resolveImpact(row)
    const conf = resolveConfidence(row)
    return (impact === 'high' || impact === 'critical') && (conf === null || conf >= 70)
  }
  return false
}

/** Single-item rank score (higher = more digest-worthy). */
export function digestRankScore(row: DigestCandidate): number {
  const conf = resolveConfidence(row) ?? 0
  const ct = resolveContentType(row)
  const impact = resolveImpact(row)
  const corr = Math.max(1, row.corroboration_count ?? 1)

  return (
    conf +
    (IMPACT_BOOST[impact ?? ''] ?? 0) +
    (CONTENT_TYPE_BOOST[ct ?? ''] ?? 0) +
    Math.min(20, (corr - 1) * 4)
  )
}

/**
 * Rank and diversify candidates for a digest edition.
 * @param maxPerCountry default 3 — prevents major-market domination
 * @param limit default 24 — LLM input batch size
 */
export function rankDigestCandidates(
  rows: DigestCandidate[],
  opts: { maxPerCountry?: number; limit?: number } = {},
): RankedDigestItem[] {
  const maxPerCountry = opts.maxPerCountry ?? 3
  const limit = opts.limit ?? 24

  const eligible = rows.filter(isDigestEligible)
  const scored = eligible
    .map((row) => {
      const market = (typeof row.country === 'string' && row.country.trim()) || 'Global'
      return {
        id: row.id,
        rankScore: digestRankScore(row),
        confidence: resolveConfidence(row),
        contentType: resolveContentType(row),
        impact: resolveImpact(row),
        market,
        corroborationCount: Math.max(1, row.corroboration_count ?? 1),
      } satisfies RankedDigestItem
    })
    .sort((a, b) => b.rankScore - a.rankScore)

  const perCountry = new Map<string, number>()
  const diversified: RankedDigestItem[] = []
  for (const item of scored) {
    const key = item.market.toLowerCase()
    const n = perCountry.get(key) ?? 0
    if (n >= maxPerCountry) continue
    perCountry.set(key, n + 1)
    diversified.push(item)
    if (diversified.length >= limit) break
  }
  return diversified
}
