/**
 * Elite digest ranking — pure functions, unit-testable.
 *
 * Mirrors the SQL ranking in elite_digest_from_pipeline_b migration
 * and accepts optional operator feedback scores so the product improves
 * continuously from real use.
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
  /** Soft score from signal_feedback_score() — may be negative. */
  feedback_score?: number
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

export function isDigestEligible(row: DigestCandidate): boolean {
  if (!isSurfaceable(row)) return false
  if (row.is_representative === false) return false

  const ct = resolveContentType(row)
  if (ct === 'story' || ct === 'research' || ct === 'market') return true

  if (ct === 'regulatory' || ct === null) {
    const impact = resolveImpact(row)
    const conf = resolveConfidence(row)
    return (impact === 'high' || impact === 'critical') && (conf === null || conf >= 70)
  }
  return false
}

export function digestRankScore(row: DigestCandidate): number {
  const conf = resolveConfidence(row) ?? 0
  const ct = resolveContentType(row)
  const impact = resolveImpact(row)
  const corr = Math.max(1, row.corroboration_count ?? 1)
  const feedback = typeof row.feedback_score === 'number' ? row.feedback_score : 0

  return (
    conf +
    (IMPACT_BOOST[impact ?? ''] ?? 0) +
    (CONTENT_TYPE_BOOST[ct ?? ''] ?? 0) +
    Math.min(20, (corr - 1) * 4) +
    // Clamp feedback influence so a few votes cannot dominate the classifier.
    Math.max(-25, Math.min(25, feedback))
  )
}

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
