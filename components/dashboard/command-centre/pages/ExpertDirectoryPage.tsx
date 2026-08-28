'use client'
import React, { useMemo, useState } from 'react'
import type { HvProfessional } from '@/lib/dashboard/dashboardLiveData'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const ExpertDirectoryPage = React.memo(function ExpertDirectoryPage({
  country, region, role, professionals = [], onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  professionals?: HvProfessional[]
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    if (!q) return professionals
    const qq = q.toLowerCase()
    return professionals.filter(p =>
      String((p as any).name ?? '').toLowerCase().includes(qq) ||
      String((p as any).specialty ?? (p as any).role ?? '').toLowerCase().includes(qq)
    )
  }, [professionals, q])

  return (
    <div className="cc-experts">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Expert Directory</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <input className="cc-search" placeholder="Search experts…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-expert-list">
        {list.slice(0, 40).map((p, i) => (
          <div key={(p as any).id ?? i} className="cc-expert-row">
            <div className="cc-expert-name">{(p as any).name ?? 'Expert'}</div>
            <div className="cc-expert-meta">{(p as any).specialty ?? (p as any).role ?? ''} · {(p as any).country ?? country.iso2}</div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No experts loaded.</div>}
      </div>
    </div>
  )
})
