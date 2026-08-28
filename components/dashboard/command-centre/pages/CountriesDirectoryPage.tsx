'use client'
import React, { useMemo, useState } from 'react'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { CommandPage } from '../types'

export const CountriesDirectoryPage = React.memo(function CountriesDirectoryPage({
  country, onCountrySelect, onPageChange,
}: {
  country: { iso2: string; label: string }
  region?: string
  role?: string
  onCountrySelect?: (iso2: string) => void
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const all = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))
    if (!q.trim()) return all
    const qq = q.toLowerCase()
    return all.filter(c => c.label.toLowerCase().includes(qq) || c.iso2.toLowerCase().includes(qq))
  }, [q])

  return (
    <div className="cc-countries">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Countries Directory</h1>
        <p className="cc-page-sub">Active: {flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search countries…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-country-list">
        {list.slice(0, 80).map(c => (
          <button
            key={c.iso2}
            type="button"
            className={`cc-country-row${c.iso2 === country.iso2 ? ' active' : ''}`}
            onClick={() => {
              onCountrySelect?.(c.iso2)
              onPageChange?.('briefing')
            }}
          >
            <span>{flagEmoji(c.iso2)}</span>
            <span>{c.label}</span>
            <span className="cc-muted">{c.iso2}</span>
          </button>
        ))}
      </div>
    </div>
  )
})
