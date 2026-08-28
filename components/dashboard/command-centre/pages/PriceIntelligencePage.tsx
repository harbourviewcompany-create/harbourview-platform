'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { PRICE_BENCHMARKS, PRODUCT_TYPE_LABELS } from '../../data/priceIntelligence'

export const PriceIntelligencePage = React.memo(function PriceIntelligencePage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = PRICE_BENCHMARKS ?? []
    if (!q) return all
    const qq = q.toLowerCase()
    return all.filter((p: any) =>
      String(p.product ?? p.name ?? '').toLowerCase().includes(qq) ||
      String(p.market ?? p.country ?? '').toLowerCase().includes(qq)
    )
  }, [q])

  return (
    <div className="cc-price">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Price Intelligence</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <input className="cc-search" placeholder="Search benchmarks…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-price-list">
        {list.slice(0, 40).map((p: any, i: number) => (
          <div key={p.id ?? i} className="cc-price-row">
            <div className="cc-price-title">{p.product ?? p.name ?? 'Benchmark'}</div>
            <div className="cc-price-meta">
              {(PRODUCT_TYPE_LABELS as any)?.[p.product_type] ?? p.product_type ?? ''} · {p.market ?? p.country ?? ''} · {p.price_low != null ? `${p.price_low}–${p.price_high}` : p.price ?? ''} {p.currency ?? ''}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="cc-muted">No price benchmarks.</div>}
      </div>
    </div>
  )
})
