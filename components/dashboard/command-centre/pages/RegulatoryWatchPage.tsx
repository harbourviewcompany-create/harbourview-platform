'use client'
import React, { useMemo, useState } from 'react'
import type { CountryIntelProfile, WatchlistData, SourceCoverageRow } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { deriveSignalGroup, derivePolicyArea, deriveImpact, buildMunicipalData, buildAuthorities, CustomSelect, fmtStatus } from '../sharedHelpers'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const RW_TABS = [
  { id: 'recent', label: 'Recent Changes' },
  { id: 'pending', label: 'Pending Reform' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'enforcement', label: 'Enforcement / Restrictions' },
  { id: 'comparable', label: 'Comparable Jurisdictions' },
  { id: 'international', label: 'International Movement' },
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
  const [filterImpact, setFilterImpact] = useState('all')
  const authorities = useMemo(() => buildAuthorities(country), [country])
  const municipal = useMemo(() => buildMunicipalData(country, region), [country, region])

  const filtered = useMemo(() => {
    let list = signals
    if (filterImpact !== 'all') list = list.filter(s => deriveImpact(s.confidence) === filterImpact)
    if (tab === 'enforcement') list = list.filter(s => /enforc|restrict|ban|suspend|penalty/i.test(s.title))
    else if (tab === 'pending') list = list.filter(s => /pending|proposed|draft|consultation|reform/i.test(s.title))
    else if (tab === 'international') list = list.filter(s => /export|import|international|eu|who|incb/i.test(s.title))
    return list
  }, [signals, tab, filterImpact])

  return (
    <div className="cc-regulatory">
      <div className="cc-rw-main">
        <div className="cc-page-header">
          <h1 className="cc-page-title">Regulatory Watch</h1>
          <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</p>
        </div>
        <div className="cc-rw-tabs">
          {RW_TABS.map(t => (
            <button key={t.id} type="button" className={tab === t.id ? 'cc-tab-on' : 'cc-tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="cc-rw-toolbar">
          <CustomSelect
            value={filterImpact}
            onChange={setFilterImpact}
            options={[
              { value: 'all', label: 'All impact' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
        </div>
        <div className="cc-rw-feed">
          {filtered.slice(0, 24).map(s => (
            <div key={s.id} className="cc-rw-item">
              <div className="cc-rw-title">{s.title}</div>
              <div className="cc-rw-meta">
                {derivePolicyArea(s.title)} · {deriveImpact(s.confidence)} · {deriveSignalGroup(s.title)} · {s.timeAgo}
              </div>
              {s.summary && <div className="cc-rw-summary">{s.summary}</div>}
            </div>
          ))}
          {filtered.length === 0 && <div className="cc-muted">No signals for this tab/filter.</div>}
        </div>
        {countryIntel && countryIntel.country_code === country.iso2 && (
          <section className="cc-rw-intel">
            <div className="cc-card-head">COUNTRY INTEL</div>
            <div className="cc-status-grid">
              <div><span className="cc-label">Medical</span> {fmtStatus(countryIntel.medical_status)}</div>
              <div><span className="cc-label">Access</span> {fmtStatus(countryIntel.market_access_status)}</div>
              <div><span className="cc-label">Import</span> {fmtStatus(countryIntel.import_status)}</div>
              <div><span className="cc-label">Export</span> {fmtStatus(countryIntel.export_status)}</div>
            </div>
            {countryIntel.regulatory_summary && <p className="cc-right-prose">{countryIntel.regulatory_summary}</p>}
          </section>
        )}
        {sourceCoverage && sourceCoverage.length > 0 && (
          <section className="cc-rw-coverage">
            <div className="cc-card-head">SOURCE COVERAGE</div>
            <ul>
              {sourceCoverage.slice(0, 8).map((r, i) => (
                <li key={i}>{(r as any).source_name ?? (r as any).name ?? (r as any).source} — {(r as any).coverage ?? (r as any).status ?? 'active'}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <aside className="cc-rw-side">
        <div className="cc-right-section">
          <div className="cc-right-head">AUTHORITIES</div>
          <div className="cc-auth-top">{authorities.top.name}</div>
          <div className="cc-auth-role">{authorities.top.role}</div>
          <ul className="cc-auth-list">
            {authorities.keyList.map((a, i) => (
              <li key={i}><strong>{a.name}</strong> — {a.role}</li>
            ))}
          </ul>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">MUNICIPAL</div>
          <ul>
            {municipal.map((m, i) => (
              <li key={i}><span className={`cc-muni-${m.status}`}>{m.name}</span> — {m.note}</li>
            ))}
          </ul>
        </div>
        {watchlistData && (
          <div className="cc-right-section">
            <div className="cc-right-head">WATCHLIST</div>
            <p className="cc-right-prose">Track regulatory topics across priority markets.</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('watchlist')}>Open Watchlist →</button>
          </div>
        )}
        <div className="cc-right-section">
          <div className="cc-right-head">EVENTS</div>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('events')}>View Events Calendar →</button>
        </div>
      </aside>
    </div>
  )
})
