/**
 * Marketplace funnel metrics for Command Briefing / ops surfaces.
 * Built from inquiry review_status buckets (see inquiryWorkflow REVIEW_STATUSES).
 */

export type FunnelBucket = {
  key: string
  label: string
  count: number
}

export type MarketplaceFunnelMetrics = {
  buckets: FunnelBucket[]
  /** Inquiries in received+reviewing */
  openInquiry: number
  /** Contacted (proof / first response) */
  contacted: number
  /** Qualified (matched) */
  qualified: number
  /** Terminal not_fit */
  notFit: number
  /** Closed */
  closed: number
  /** Total inquiries seen in these buckets */
  total: number
  /**
   * Contact rate: contacted+qualified+not_fit+closed / (open+those)
   * Null when no volume.
   */
  contactRate: number | null
  /**
   * Qualification rate among contacted pipeline: qualified / (qualified+not_fit+closed)
   * Null when denominator is 0.
   */
  qualificationRate: number | null
  /** Rough conversion proxy: qualified / total */
  conversionRate: number | null
  /** Qualified — best current proxy for commercial wins (no explicit won status yet) */
  wonProxy: number
  /** not_fit — explicit commercial loss/reject path */
  lostProxy: number
  /** lost / (won+lost) when either outcome exists */
  lossRate: number | null
  computedAt: string
}

export function buildMarketplaceFunnelMetrics(input: {
  receivedReviewing: number
  contacted: number
  qualified: number
  notFit?: number
  closed: number
  wanted?: number
  listings?: number
  /** Explicit commercial_outcome counts when column is live */
  won?: number
  lost?: number
  withdrawn?: number
}): MarketplaceFunnelMetrics {
  const openInquiry = Math.max(0, input.receivedReviewing)
  const contacted = Math.max(0, input.contacted)
  const qualified = Math.max(0, input.qualified)
  const notFit = Math.max(0, input.notFit ?? 0)
  const closed = Math.max(0, input.closed)
  const progressed = contacted + qualified + notFit + closed
  const total = openInquiry + progressed

  const contactRate = total > 0 ? progressed / total : null
  const terminal = qualified + notFit + closed
  const qualificationRate = terminal > 0 ? qualified / terminal : null
  const conversionRate = total > 0 ? qualified / total : null

  const buckets: FunnelBucket[] = [
    { key: 'listings', label: 'Listings', count: Math.max(0, input.listings ?? 0) },
    { key: 'wanted', label: 'Wanted', count: Math.max(0, input.wanted ?? 0) },
    { key: 'inquiry', label: 'Open inquiry', count: openInquiry },
    { key: 'contacted', label: 'Contacted', count: contacted },
    { key: 'qualified', label: 'Qualified', count: qualified },
    { key: 'closed', label: 'Closed', count: closed },
  ]

  const wonProxy = input.won != null ? Math.max(0, input.won) : qualified
  const lostProxy = input.lost != null ? Math.max(0, input.lost) : notFit
  const outcomeDenom = wonProxy + lostProxy
  const lossRate = outcomeDenom > 0 ? lostProxy / outcomeDenom : null

  return {
    buckets,
    openInquiry,
    contacted,
    qualified,
    notFit,
    closed,
    total,
    contactRate,
    qualificationRate,
    conversionRate,
    wonProxy,
    lostProxy,
    lossRate,
    computedAt: new Date().toISOString(),
  }
}

export function formatRate(rate: number | null): string {
  if (rate == null) return '—'
  return `${Math.round(rate * 100)}%`
}
