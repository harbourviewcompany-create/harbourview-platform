export type DealIntelligenceRecord = {
  id: string
  requester_company?: string
  target_market?: string
  drop_id?: string
  deal_status?: string
  assigned_operator?: string
  score?: number
  stale_escalated?: boolean
  last_deal_event_at?: string
}

export type DealIntelligenceEvent = {
  id: string
  routing_record_id: string
  event_type: string
  event_summary: string
  actor?: string
  created_at: string
}

export function countBy(records: DealIntelligenceRecord[], key: keyof DealIntelligenceRecord) {
  return records.reduce<Record<string, number>>((acc, record) => {
    const value = String(record[key] || 'Unassigned')
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

export function conversionByMarket(records: DealIntelligenceRecord[]) {
  const markets = countBy(records, 'target_market')
  const won = records.filter((record) => record.deal_status === 'closed_won')
  const wonByMarket = countBy(won, 'target_market')

  return Object.entries(markets).map(([market, total]) => ({
    market,
    total,
    closedWon: wonByMarket[market] || 0,
    conversionRate: total ? Math.round(((wonByMarket[market] || 0) / total) * 100) : 0,
  }))
}

export function conversionByDrop(records: DealIntelligenceRecord[]) {
  const drops = countBy(records, 'drop_id')
  const won = records.filter((record) => record.deal_status === 'closed_won')
  const wonByDrop = countBy(won, 'drop_id')

  return Object.entries(drops).map(([drop, total]) => ({
    drop,
    total,
    closedWon: wonByDrop[drop] || 0,
    conversionRate: total ? Math.round(((wonByDrop[drop] || 0) / total) * 100) : 0,
  }))
}

export function stageSummary(records: DealIntelligenceRecord[]) {
  return Object.entries(countBy(records, 'deal_status')).map(([stage, total]) => ({ stage, total }))
}

export function operatorPerformance(records: DealIntelligenceRecord[]) {
  const operators = countBy(records, 'assigned_operator')
  return Object.entries(operators).map(([operator, total]) => {
    const owned = records.filter((record) => String(record.assigned_operator || 'Unassigned') === operator)
    const won = owned.filter((record) => record.deal_status === 'closed_won').length
    const stalled = owned.filter((record) => record.stale_escalated).length
    const avgScore = owned.length ? Math.round(owned.reduce((sum, record) => sum + (record.score || 0), 0) / owned.length) : 0
    return { operator, total, won, stalled, avgScore }
  })
}

export function stalledHeatmap(records: DealIntelligenceRecord[]) {
  return records
    .filter((record) => record.stale_escalated)
    .map((record) => ({
      id: record.id,
      company: record.requester_company,
      market: record.target_market,
      drop: record.drop_id,
      stage: record.deal_status,
      score: record.score || 0,
    }))
}

export function topOpportunities(records: DealIntelligenceRecord[]) {
  return [...records]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    .map((record) => ({
      id: record.id,
      company: record.requester_company,
      market: record.target_market,
      drop: record.drop_id,
      score: record.score || 0,
      stage: record.deal_status || 'not_started',
    }))
}

export function recentActivity(events: DealIntelligenceEvent[]) {
  return [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
}
