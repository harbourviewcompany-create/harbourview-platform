/**
 * opportunity_score is stored on a 0–100 scale in public.countries.
 * Historically several display sites treated it as a 0–10 scale (e.g. "45/10"),
 * producing nonsensical labels and, in LocalIntelPage, broken derived math
 * (score - 1, score - 2, and an SVG stroke-dasharray computed as score/10).
 * This is the single source of truth going forward — do not inline "/10" or
 * "/100" elsewhere; use these helpers instead.
 */

export function formatOpportunityScore(score: number | null | undefined): string {
  if (score == null) return '—'
  return `${Math.round(score)}/100`
}

/** 0–1 fraction, for progress rings / bars / stroke-dasharray math. */
export function opportunityScoreFraction(score: number | null | undefined): number {
  if (score == null) return 0
  return Math.max(0, Math.min(100, score)) / 100
}

/** 0–10 scale, only for contexts that explicitly need a coarser band (e.g. tone thresholds). */
export function opportunityScoreOutOfTen(score: number | null | undefined): number {
  return Math.round(opportunityScoreFraction(score) * 10)
}

export type OpportunityTone = 'ok' | 'warn' | 'neutral'

/** ok >= 60, warn 30-59, neutral < 30 — mirrors the previous >= 6/>=4 out-of-10 bands. */
export function opportunityScoreTone(score: number | null | undefined): OpportunityTone {
  if (score == null) return 'neutral'
  if (score >= 60) return 'ok'
  if (score >= 30) return 'warn'
  return 'neutral'
}
