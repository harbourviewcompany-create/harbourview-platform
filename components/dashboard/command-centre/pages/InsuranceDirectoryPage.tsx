'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { INSURANCE_PROVIDERS, INSURANCE_LINE_LABELS } from '../../data/insuranceProviders'

export const InsuranceDirectoryPage = React.memo(function InsuranceDirectoryPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = INSURANCE_PROVIDERS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((p: any) => String(p.name ?? '').toLowerCase().includes(qq))
  }, [q])

  return (
    <div className="cc-insurance">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Insurance Directory</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search insurers…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-ins-list">
        {list.slice(0, 40).map((p: any, i: number) => (
          <div key={p.id ?? i} className="cc-ins-row">
            <div className="cc-ins-name">{p.name}</div>
            <div className="cc-ins-meta">
              {(INSURANCE_LINE_LABELS as any)?.[p.line] ?? p.line ?? ''} · {p.country ?? p.regions ?? ''}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No insurance providers.</div>}
      </div>
    </div>
  )
})
