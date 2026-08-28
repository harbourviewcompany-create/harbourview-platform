'use client'
import React, { useMemo, useState } from 'react'
import type { CountryIntelProfile, LocalIntelData } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { buildMunicipalData, buildAuthorities, fmtStatus } from '../sharedHelpers'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const LocalIntelPage = React.memo(function LocalIntelPage({
  country, region, role, signals, countryIntel, localIntel, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  countryIntel?: CountryIntelProfile | null
  localIntel?: LocalIntelData | null
  onPageChange?: (page: CommandPage) => void
}) {
  const municipalities = useMemo(() => buildMunicipalData(country, region), [country, region])
  const authorities = useMemo(() => buildAuthorities(country), [country])

  const constraints = useMemo(() => {
    if (countryIntel) {
      const items: { icon: string; label: string; text: string }[] = []
      if (countryIntel.medical_status) items.push({ icon: '◎', label: 'Medical Programme', text: `Status: ${fmtStatus(countryIntel.medical_status)}.` })
      if (countryIntel.market_access_status) items.push({ icon: '⊞', label: 'Market Access', text: `Classification: ${fmtStatus(countryIntel.market_access_status)}.` })
      if (countryIntel.import_status) items.push({ icon: '↓', label: 'Import', text: `Pathway: ${fmtStatus(countryIntel.import_status)}.` })
      if (countryIntel.export_status) items.push({ icon: '↑', label: 'Export', text: `Pathway: ${fmtStatus(countryIntel.export_status)}.` })
      if (items.length) return items
    }
    return [
      { icon: '⊞', label: 'Zoning & Land Use', text: 'Local zoning approval may be required.' },
      { icon: '◉', label: 'Facility Siting', text: 'Buffer zones and municipal permits apply.' },
    ]
  }, [countryIntel])

  const notes = useMemo(() => {
    const n: string[] = []
    if (countryIntel?.regulatory_summary) n.push(countryIntel.regulatory_summary)
    if (localIntel && (localIntel as any).notes) n.push(...((localIntel as any).notes ?? []).slice(0, 4))
    return n
  }, [countryIntel, localIntel])

  return (
    <div className="cc-local-intel">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Local Intelligence</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</p>
      </div>

      <div className="cc-li-grid">
        <section className="cc-li-card">
          <div className="cc-card-head">CONSTRAINTS</div>
          <ul>
            {constraints.map((c, i) => (
              <li key={i}><span>{c.icon}</span> <strong>{c.label}</strong> — {c.text}</li>
            ))}
          </ul>
        </section>

        <section className="cc-li-card">
          <div className="cc-card-head">AUTHORITIES</div>
          <div className="cc-auth-top">{authorities.top.name}</div>
          <div className="cc-auth-role">{authorities.top.role}</div>
          <ul>
            {authorities.keyList.map((a, i) => (
              <li key={i}><strong>{a.name}</strong> — {a.role}</li>
            ))}
          </ul>
        </section>

        <section className="cc-li-card">
          <div className="cc-card-head">MUNICIPAL</div>
          <ul>
            {municipalities.map((m, i) => (
              <li key={i}><span className={`cc-muni-${m.status}`}>{m.name}</span> — {m.note}</li>
            ))}
          </ul>
        </section>

        {notes.length > 0 && (
          <section className="cc-li-card">
            <div className="cc-card-head">NOTES</div>
            {notes.map((n, i) => <p key={i} className="cc-right-prose">{n}</p>)}
          </section>
        )}

        <section className="cc-li-card">
          <div className="cc-card-head">RELATED SIGNALS</div>
          <div className="cc-signal-list">
            {signals.slice(0, 6).map(s => (
              <button key={s.id} type="button" className="cc-signal-item" onClick={() => onPageChange?.('signals')}>
                <span className="cc-signal-title">{s.title}</span>
                <span className="cc-signal-meta">{s.market} · {s.timeAgo}</span>
              </button>
            ))}
            {signals.length === 0 && <div className="cc-muted">No signals</div>}
          </div>
        </section>
      </div>
    </div>
  )
})
