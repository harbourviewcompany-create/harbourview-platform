'use client'
import React, { useMemo } from 'react'
import type { CommandPage } from '../types'
import { COMPLIANCE_ROLE_FOCUS, fmtStatus } from '../sharedHelpers'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const CompliancePage = React.memo(function CompliancePage({
  country, region, role, signals, countryIntel, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  countryIntel?: CountryIntelProfile | null
  onPageChange?: (page: CommandPage) => void
}) {
  const focus = COMPLIANCE_ROLE_FOCUS[role] ?? COMPLIANCE_ROLE_FOCUS['Compliance'] ?? { icon: '◫', items: [] as string[] }
  const complianceSignals = useMemo(
    () => signals.filter(s => /complian|gmp|gacp|licence|license|audit|capa|sop|qa/i.test(s.title)).slice(0, 12),
    [signals],
  )

  return (
    <div className="cc-compliance">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Compliance</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''} · {role}</p>
      </div>
      <section className="cc-comp-focus">
        <div className="cc-card-head">{focus.icon} ROLE FOCUS — {role}</div>
        <ul>
          {focus.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>
      {countryIntel && countryIntel.country_code === country.iso2 && (
        <section className="cc-comp-status">
          <div className="cc-card-head">REGULATORY STATUS</div>
          <div className="cc-status-grid">
            <div><span className="cc-label">Medical</span> {fmtStatus(countryIntel.medical_status)}</div>
            <div><span className="cc-label">Access</span> {fmtStatus(countryIntel.market_access_status)}</div>
            <div><span className="cc-label">Import</span> {fmtStatus(countryIntel.import_status)}</div>
            <div><span className="cc-label">Export</span> {fmtStatus(countryIntel.export_status)}</div>
          </div>
        </section>
      )}
      <section className="cc-comp-signals">
        <div className="cc-card-head">COMPLIANCE SIGNALS</div>
        {complianceSignals.map(s => (
          <button key={s.id} type="button" className="cc-signal-item" onClick={() => onPageChange?.('signals')}>
            <span className="cc-signal-title">{s.title}</span>
            <span className="cc-signal-meta">{s.market} · {s.timeAgo}</span>
          </button>
        ))}
        {complianceSignals.length === 0 && <div className="cc-muted">No compliance-tagged signals.</div>}
      </section>
    </div>
  )
})
