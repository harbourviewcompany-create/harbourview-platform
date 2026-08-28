'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { JOB_LISTINGS, JOB_TYPE_LABELS, JOB_SECTOR_LABELS } from '../../data/jobsBoard'

export const JobsBoardPage = React.memo(function JobsBoardPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = JOB_LISTINGS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((j: any) =>
      String(j.title ?? '').toLowerCase().includes(qq) ||
      String(j.company ?? '').toLowerCase().includes(qq)
    )
  }, [q])

  return (
    <div className="cc-jobs">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Jobs Board</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search jobs…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-job-list">
        {list.slice(0, 40).map((j: any, i: number) => (
          <div key={j.id ?? i} className="cc-job-row">
            <div className="cc-job-title">{j.title}</div>
            <div className="cc-job-meta">
              {j.company ?? ''} · {(JOB_TYPE_LABELS as any)?.[j.type] ?? j.type ?? ''} · {(JOB_SECTOR_LABELS as any)?.[j.sector] ?? j.sector ?? ''} · {j.location ?? ''}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No job listings.</div>}
      </div>
    </div>
  )
})
