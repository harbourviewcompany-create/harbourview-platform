'use client'
import React, { useMemo, useState } from 'react'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const NotificationCentrePage = React.memo(function NotificationCentrePage({
  country, region, role, signals, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  onPageChange?: (page: CommandPage) => void
}) {
  const [filter, setFilter] = useState<'all' | 'high'>('all')
  const list = useMemo(() => {
    let s = signals
    if (filter === 'high') s = s.filter(x => x.confidence >= 75)
    return s.slice(0, 30)
  }, [signals, filter])

  return (
    <div className="cc-notifications">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Notification Centre</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <div className="cc-notif-tabs">
        <button type="button" className={filter === 'all' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setFilter('all')}>All</button>
        <button type="button" className={filter === 'high' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setFilter('high')}>High confidence</button>
      </div>
      <div className="cc-notif-list">
        {list.map(s => (
          <button key={s.id} type="button" className="cc-notif-row" onClick={() => onPageChange?.('signals')}>
            <div className="cc-notif-title">{s.title}</div>
            <div className="cc-notif-meta">{s.market} · {s.timeAgo} · conf {s.confidence}</div>
          </button>
        ))}
        {list.length === 0 && <div className="cc-muted">No notifications.</div>}
      </div>
    </div>
  )
})
