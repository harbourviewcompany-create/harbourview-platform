'use client'
import React, { useMemo, useState } from 'react'
import type { CountryIntelProfile, WatchlistData, SourceCoverageRow } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { derivePolicyArea, deriveImpact, buildMunicipalData, buildAuthorities, CustomSelect } from '../sharedHelpers'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const RW_TABS = [
  { id: 'recent', label: 'Recent Changes' },
  { id: 'pending', label: 'Pending Reform' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'enforcement', label: 'Enforcement' },
  { id: 'comparable', label: 'Comparable' },
  { id: 'international', label: 'International' },
]

export const RegulatoryWatchPage = React.memo(function RegulatoryWatchPage({
  country, region, role, signals, watchlistData, countryIntel, sourceCoverage, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  watchlistData?: WatchlistData
  countryIntel?: CountryIntelProfile | null
  sourceCoverage?: SourceCoverageRow[]
  onPageChange?: (page: CommandPage) => void
}) {
  const [tab, setTab] = useState('recent')
  const recent = useMemo(() => signals.slice(0, 12), [signals])
  const authorities = useMemo(() => buildAuthorities(country), [country])
  const municipal = useMemo(() => buildMunicipalData(country, region), [country, region])

  return (
    <div className="cc-regulatory">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Regulatory Watch</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <div className="cc-rw-tabs">
        {RW_TABS.map(t => (
          <button key={t.id} type="button" className={tab === t.id ? 'cc-tab-on' : 'cc-tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="cc-rw-body">
        <div className="cc-rw-feed">
          {recent.map(s => (
            <div key={s.id} className="cc-rw-item">
              <div className="cc-rw-title">{s.title}</div>
              <div className="cc-rw-meta">{derivePolicyArea(s.title)} · {deriveImpact(s.confidence)} · {s.timeAgo}</div>
            </div>
          ))}
          {recent.length === 0 && <div className="cc-muted">No regulatory signals.</div>}
        </div>
        <aside className="cc-rw-side">
          <div className="cc-right-section">
            <div className="cc-right-head">AUTHORITIES</div>
            <div>{authorities.top.name}</div>
            <ul>{authorities.keyList.map((a, i) => <li key={i}>{a.name}</li>)}</ul>
          </div>
          <div className="cc-right-section">
            <div className="cc-right-head">MUNICIPAL</div>
            <ul>{municipal.map((m, i) => <li key={i}>{m.name} — {m.note}</li>)}</ul>
          </div>
        </aside>
      </div>
    </div>
  )
})
