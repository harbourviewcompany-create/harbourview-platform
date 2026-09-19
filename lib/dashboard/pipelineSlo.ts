/**
 * Product SLOs for intelligence freshness (operator-facing).
 * Align thresholds with hv_intelligence_outcome_check when possible.
 */

export type PipelineSloStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

export const PIPELINE_SLO = {
  /** Feed promotion age — green */
  feedHealthyMaxHours: 6,
  /** Feed promotion age — amber until this, then critical */
  feedWarningMaxHours: 24,
  /** Digest age — green */
  digestHealthyMaxDays: 1,
  /** Digest age — amber until this */
  digestWarningMaxDays: 3,
} as const

export function evaluateFeedSlo(feedAgeHours: number | null | undefined): PipelineSloStatus {
  if (feedAgeHours == null || !Number.isFinite(feedAgeHours)) return 'unknown'
  if (feedAgeHours <= PIPELINE_SLO.feedHealthyMaxHours) return 'healthy'
  if (feedAgeHours <= PIPELINE_SLO.feedWarningMaxHours) return 'warning'
  return 'critical'
}

export function evaluateDigestSlo(digestAgeDays: number | null | undefined): PipelineSloStatus {
  if (digestAgeDays == null || !Number.isFinite(digestAgeDays)) return 'unknown'
  if (digestAgeDays <= PIPELINE_SLO.digestHealthyMaxDays) return 'healthy'
  if (digestAgeDays <= PIPELINE_SLO.digestWarningMaxDays) return 'warning'
  return 'critical'
}

/** Worst-of feed + digest (+ API status if provided). */
export function combinePipelineStatus(
  apiStatus: PipelineSloStatus | string | null | undefined,
  feedAgeHours: number | null | undefined,
  digestAgeDays: number | null | undefined,
): PipelineSloStatus {
  const rank = (s: PipelineSloStatus) =>
    s === 'critical' ? 3 : s === 'warning' ? 2 : s === 'healthy' ? 1 : 0
  const candidates: PipelineSloStatus[] = [
    evaluateFeedSlo(feedAgeHours),
    evaluateDigestSlo(digestAgeDays),
  ]
  if (apiStatus === 'healthy' || apiStatus === 'warning' || apiStatus === 'critical' || apiStatus === 'unknown') {
    candidates.push(apiStatus)
  }
  return candidates.reduce((worst, s) => (rank(s) > rank(worst) ? s : worst), 'unknown' as PipelineSloStatus)
}

export function pipelineSloMessage(status: PipelineSloStatus, feedAgeHours: number | null): string {
  if (status === 'healthy') return 'Intelligence feed within SLO'
  if (status === 'warning') {
    return feedAgeHours != null
      ? `Feed aging (${Math.round(feedAgeHours)}h) — verify promotion cron`
      : 'Intelligence feed elevated — verify promotion cron'
  }
  if (status === 'critical') {
    return feedAgeHours != null
      ? `Feed stale (${Math.round(feedAgeHours)}h) — treat intel as degraded`
      : 'Intelligence feed critical — treat intel as degraded'
  }
  return 'Pipeline health unknown'
}
