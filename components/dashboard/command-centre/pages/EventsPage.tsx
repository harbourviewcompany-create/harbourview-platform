'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { INDUSTRY_EVENTS, EVENT_TYPE_LABELS } from '../../data/industryEvents'

export const EventsPage = React.memo(function EventsPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = INDUSTRY_EVENTS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((e: any) =>
      String(e.name ?? e.title ?? '').toLowerCase().includes(qq) ||
      String(e.city ?? e.country ?? '').toLowerCase().includes(qq)
    )
  }, [q])

  return (
    <div className="cc-events">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Events</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search events…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-event-list">
        {list.slice(0, 40).map((e: any, i: number) => (
          <div key={e.id ?? i} className="cc-event-row">
            <div className="cc-event-title">{e.name ?? e.title}</div>
            <div className="cc-event-meta">
              {(EVENT_TYPE_LABELS as any)?.[e.type] ?? e.type ?? ''} · {e.city ?? ''} {e.country ?? ''} · {e.start_date ?? e.date ?? ''}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No industry events.</div>}
      </div>
    </div>
  )
})
