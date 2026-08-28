'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { BANKING_PROVIDERS, PROVIDER_TYPE_LABELS } from '../../data/bankingProviders'

export const BankingDirectoryPage = React.memo(function BankingDirectoryPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = BANKING_PROVIDERS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((p: any) =>
      String(p.name ?? '').toLowerCase().includes(qq) ||
      String(p.country ?? '').toLowerCase().includes(qq)
    )
  }, [q])

  return (
    <div className="cc-banking">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Banking Directory</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <input className="cc-search" placeholder="Search providers…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-bank-list">
        {list.slice(0, 40).map((p: any, i: number) => (
          <div key={p.id ?? i} className="cc-bank-row">
            <div className="cc-bank-name">{p.name}</div>
            <div className="cc-bank-meta">
              {(PROVIDER_TYPE_LABELS as any)?.[p.type] ?? p.type ?? ''} · {p.country ?? ''} · {p.stance ?? ''}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No banking providers.</div>}
      </div>
    </div>
  )
})
