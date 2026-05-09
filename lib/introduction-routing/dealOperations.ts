export function calculateUrgency(args: {
  score: number
  stalled: boolean
  dealStatus: string
}) {
  let urgency = Math.min(args.score, 100)

  if (args.stalled) urgency += 15
  if (args.dealStatus === 'negotiating') urgency += 10
  if (args.dealStatus === 'engaged') urgency += 5

  return Math.min(urgency, 100)
}

export function sortDeals(records: any[], mode: 'urgency' | 'score' | 'inactivity') {
  if (mode === 'score') {
    return [...records].sort((a, b) => b.score - a.score)
  }

  if (mode === 'inactivity') {
    return [...records].sort((a, b) => {
      const aTime = a.last_deal_event_at ? new Date(a.last_deal_event_at).getTime() : 0
      const bTime = b.last_deal_event_at ? new Date(b.last_deal_event_at).getTime() : 0
      return aTime - bTime
    })
  }

  return [...records].sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))
}

export function shouldEscalateStaleDeal(record: any, now = Date.now()) {
  if (!record.last_deal_event_at) return false

  const age = now - new Date(record.last_deal_event_at).getTime()
  const tenDays = 10 * 24 * 60 * 60 * 1000

  return age > tenDays && ['introduced', 'engaged', 'negotiating'].includes(record.deal_status)
}
