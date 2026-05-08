export type DealDashboardRecord = {
  id: string
  profile_slug: string
  drop_id: string
  requester_company: string
  requester_country?: string
  requester_email: string
  intent: string
  target_market?: string
  score: number
  score_band: string
  status: string
  deal_status: string
  last_deal_event_at?: string
  next_action?: string
}

export type DealDashboardEvent = {
  id: string
  routing_record_id: string
  event_type: string
  event_summary: string
  actor?: string
  created_at: string
}

export const DEAL_STATUS_ORDER = [
  'not_started',
  'introduced',
  'engaged',
  'negotiating',
  'closed_won',
  'closed_lost',
  'archived',
]

export function groupDealsByStatus(records: DealDashboardRecord[]) {
  return DEAL_STATUS_ORDER.map((status) => ({
    status,
    records: records.filter((record) => (record.deal_status || 'not_started') === status),
  }))
}

export function isStalledDeal(record: DealDashboardRecord, now = Date.now()) {
  if (!record.last_deal_event_at) return record.deal_status === 'introduced' || record.deal_status === 'engaged'
  const ageMs = now - new Date(record.last_deal_event_at).getTime()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return ageMs > sevenDaysMs && ['introduced', 'engaged', 'negotiating'].includes(record.deal_status)
}

export function filterDealRecords(records: DealDashboardRecord[], filters: { market?: string; drop?: string; minScore?: number }) {
  return records.filter((record) => {
    if (filters.market && record.target_market !== filters.market) return false
    if (filters.drop && record.drop_id !== filters.drop) return false
    if (filters.minScore !== undefined && record.score < filters.minScore) return false
    return true
  })
}
