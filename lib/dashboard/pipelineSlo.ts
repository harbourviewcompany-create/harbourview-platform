/**
 * Product SLOs for intelligence freshness (operator-facing).
 * Align thresholds with hv_intelligence_outcome_check when possible.
 */

export type PipelineSloStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

/** Content-derived band for SignalStrip and other strip surfaces. */
export type ContentFeedBand = 'live' | 'recent' | 'stale' | 'unknown'

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

/** Parse DashboardSignal.timeAgo-style labels into hours (best effort). */
export function hoursFromTimeAgoLabel(timeAgo: string): number | null {
  const t = timeAgo.trim()
  if (!t) return null
  if (/^just now$/i.test(t)) return 0
  if (/^recently$/i.test(t)) return PIPELINE_SLO.feedWarningMaxHours
  const h = /^(\d+)\s*h(?:ours?)?\s*ago$/i.exec(t)
  if (h) return Number(h[1])
  const d = /^(\d+)\s*d(?:ays?)?\s*ago$/i.exec(t)
  if (d) return Number(d[1]) * 24
  const w = /^(\d+)\s*w(?:eeks?)?\s*ago$/i.exec(t)
  if (w) return Number(w[1]) * 24 * 7
  return null
}

/**
 * Map absolute feed age hours onto the strip band used in Command Centre.
 * Uses the same thresholds as evaluateFeedSlo so UI language matches ops SLO.
 */
export function contentBandFromAgeHours(ageHours: number | null | undefined): ContentFeedBand {
  const status = evaluateFeedSlo(ageHours)
  if (status === 'healthy') return 'live'
  if (status === 'warning') return 'recent'
  if (status === 'critical') return 'stale'
  return 'unknown'
}

/** Newest-signal band for a list of timeAgo labels. */
export function inferContentFeedBand(timeAgoLabels: readonly string[]): ContentFeedBand {
  if (timeAgoLabels.length === 0) return 'unknown'
  let newest = Number.POSITIVE_INFINITY
  let any = false
  for (const label of timeAgoLabels) {
    const hours = hoursFromTimeAgoLabel(label)
    if (hours === null) continue
    any = true
    if (hours < newest) newest = hours
  }
  if (!any) return 'unknown'
  return contentBandFromAgeHours(newest)
}

export function contentFeedBandMessage(band: ContentFeedBand): string | null {
  if (band === 'stale') {
    return `Newest strip signal is older than ${PIPELINE_SLO.feedWarningMaxHours}h (product SLO). Ops monitors promotion silence; search the corpus for the latest match.`
  }
  if (band === 'recent') {
    return `Feed aging past the ${PIPELINE_SLO.feedHealthyMaxHours}h healthy window — still usable, verify promotion cadence.`
  }
  return null
}
