'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { LOGISTICS_PROVIDERS, LOGISTICS_TYPE_LABELS } from '../../data/logisticsProviders'

export const LogisticsDirectoryPage = React.memo(function LogisticsDirectoryPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = LOGISTICS_PROVIDERS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((p: any) => String(p.name ?? '').toLowerCase().includes(qq))
  }, [q])

  return (
    <div className="cc-logistics">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Logistics Directory</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search logistics…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-log-list">
        {list.slice(0, 40).map((p: any, i: number) => (
          <div key={p.id ?? i} className="cc-log-row">
            <div className="cc-log-name">{p.name}</div>
            <div className="cc-log-meta">{(LOGISTICS_TYPE_LABELS as any)?.[p.type] ?? p.type ?? ''} · {p.regions ?? p.country ?? ''}</div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No logistics providers.</div>}
      </div>
    </div>
  )
})
