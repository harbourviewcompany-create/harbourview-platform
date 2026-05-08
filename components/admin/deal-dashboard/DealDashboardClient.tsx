'use client'

import { useMemo, useState } from 'react'
import { groupDealsByStatus, isStalledDeal, type DealDashboardRecord, type DealDashboardEvent } from '@/lib/introduction-routing/dealDashboard'

type Props = {
  records: DealDashboardRecord[]
  events: DealDashboardEvent[]
}

const actions = [
  { label: 'Engaged', value: 'mark_engaged' },
  { label: 'Negotiating', value: 'mark_negotiating' },
  { label: 'Won', value: 'mark_won' },
  { label: 'Lost', value: 'mark_lost' },
]

export function DealDashboardClient({ records: initialRecords, events }: Props) {
  const [records, setRecords] = useState(initialRecords)
  const [market, setMarket] = useState('')
  const [drop, setDrop] = useState('')
  const [minScore, setMinScore] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const markets = Array.from(new Set(records.map((r) => r.target_market).filter(Boolean)))
  const drops = Array.from(new Set(records.map((r) => r.drop_id).filter(Boolean)))

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (market && record.target_market !== market) return false
      if (drop && record.drop_id !== drop) return false
      if (minScore && record.score < Number(minScore)) return false
      return true
    })
  }, [records, market, drop, minScore])

  const grouped = groupDealsByStatus(filteredRecords)
  const activeDeals = records.filter((r) => ['introduced', 'engaged', 'negotiating'].includes(r.deal_status)).length
  const stalledDeals = records.filter((r) => isStalledDeal(r)).length
  const closedDeals = records.filter((r) => ['closed_won', 'closed_lost'].includes(r.deal_status)).length
  const primeDeals = records.filter((r) => r.score >= 85).length

  async function updateDeal(recordId: string, action: string) {
    setUpdatingId(recordId)
    try {
      const res = await fetch('/api/genetics-routing/dealflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, action }),
      })
      const json = await res.json()
      if (json.success && json.dealStatus) {
        setRecords((prev) => prev.map((record) => record.id === recordId ? { ...record, deal_status: json.dealStatus, last_deal_event_at: new Date().toISOString() } : record))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Active deals" value={activeDeals} />
        <Metric label="Prime score" value={primeDeals} />
        <Metric label="Stalled" value={stalledDeals} tone="danger" />
        <Metric label="Closed" value={closedDeals} />
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-wide text-gray-400">Market</span>
          <select className="mt-1 w-full rounded border bg-transparent p-2" value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="">All markets</option>
            {markets.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-wide text-gray-400">Drop</span>
          <select className="mt-1 w-full rounded border bg-transparent p-2" value={drop} onChange={(e) => setDrop(e.target.value)}>
            <option value="">All drops</option>
            {drops.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-wide text-gray-400">Minimum score</span>
          <select className="mt-1 w-full rounded border bg-transparent p-2" value={minScore} onChange={(e) => setMinScore(e.target.value)}>
            <option value="">Any score</option>
            <option value="70">70+</option>
            <option value="85">85+</option>
          </select>
        </label>
      </div>

      {grouped.map((group) => (
        <section key={group.status} className="space-y-3">
          <h2 className="text-lg font-semibold capitalize">{group.status.replaceAll('_', ' ')} ({group.records.length})</h2>
          <div className="grid gap-4">
            {group.records.map((record) => {
              const stalled = isStalledDeal(record)
              const prime = record.score >= 85
              return (
                <article key={record.id} className={`rounded-xl border p-4 ${stalled ? 'border-red-500/60 bg-red-950/10' : prime ? 'border-[#C6A55A]/70 bg-[#C6A55A]/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold">{record.requester_company}</div>
                      <div className="text-xs text-gray-400">{record.target_market || 'No market'} · {record.drop_id}</div>
                      <div className="mt-2 text-sm text-gray-300">{record.intent}</div>
                    </div>
                    <div className="text-sm font-semibold">Score {record.score}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {prime ? <span className="rounded-full border border-[#C6A55A]/60 px-2 py-1 text-[#C6A55A]">Prime</span> : null}
                    {stalled ? <span className="rounded-full border border-red-500/60 px-2 py-1 text-red-300">Stalled</span> : null}
                    <span className="rounded-full border border-white/20 px-2 py-1">{record.score_band}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <button key={action.value} disabled={updatingId === record.id} onClick={() => updateDeal(record.id, action.value)} className="rounded border border-white/20 px-3 py-1 text-xs hover:border-[#C6A55A]">
                        {updatingId === record.id ? 'Updating...' : action.label}
                      </button>
                    ))}
                  </div>

                  <details className="mt-4 text-xs text-gray-300">
                    <summary className="cursor-pointer text-[#C6A55A]">Event history</summary>
                    <div className="mt-2 space-y-1">
                      {events.filter((event) => event.routing_record_id === record.id).map((event) => (
                        <div key={event.id}>{event.event_type}: {event.event_summary}</div>
                      ))}
                    </div>
                  </details>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'danger' ? 'border-red-500/40 bg-red-950/10' : 'border-white/10 bg-white/5'}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  )
}
