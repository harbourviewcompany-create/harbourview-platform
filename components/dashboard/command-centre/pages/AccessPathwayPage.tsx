'use client'
import React, { useMemo, useState } from 'react'
import type { PathwayData, CountryIntelProfile, JurisdictionPlaybook } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { fmtStatus } from '../sharedHelpers'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const AccessPathwayPage = React.memo(function AccessPathwayPage({
  country, region, role, signals, pathwayData, countryIntel, jurisdictionPlaybook, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  pathwayData?: PathwayData
  countryIntel?: CountryIntelProfile | null
  jurisdictionPlaybook?: JurisdictionPlaybook
  onPageChange?: (page: CommandPage) => void
}) {
  const {
    steps = [], requirements = [], progress, requirementStatuses = [],
  } = pathwayData ?? { steps: [], requirements: [], progress: null, requirementStatuses: [] }

  const [activeStep, setActiveStep] = useState<number>(progress?.current_step ?? 1)
  const currentStep = steps.find((s: any) => s.step_number === activeStep) ?? steps[0]
  const currentStepReqs = requirements.filter((r: any) => r.step_id === currentStep?.id)
  const getReqSt = (id: string) => requirementStatuses.find((rs: any) => rs.requirement_id === id)
  const verifiedCount = currentStepReqs.filter((r: any) => getReqSt(r.id)?.status === 'verified').length
  const totalRequired = currentStepReqs.filter((r: any) => r.is_required).length
  const pct = totalRequired > 0 ? Math.round(verifiedCount / totalRequired * 100) : 0

  const relSignals = signals.filter(s => /licen|permit|access|pathway|import|export/i.test(s.title)).slice(0, 5)

  return (
    <div className="cc-access-pathway">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Access Pathway</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</p>
      </div>

      <div className="cc-ap-steps">
        {(steps.length ? steps : [
          { step_number: 1, title: 'Foundations' },
          { step_number: 2, title: 'Applications' },
          { step_number: 3, title: 'Approval' },
          { step_number: 4, title: 'Market Access' },
        ]).map((s: any) => (
          <button
            key={s.step_number}
            type="button"
            className={activeStep === s.step_number ? 'cc-step-on' : 'cc-step-off'}
            onClick={() => setActiveStep(s.step_number)}
          >
            {s.step_number}. {s.title ?? s.label ?? `Step ${s.step_number}`}
          </button>
        ))}
      </div>

      <section className="cc-ap-detail">
        <div className="cc-card-head">STEP {activeStep}</div>
        {currentStep && (
          <p className="cc-right-prose">{(currentStep as any).description ?? (currentStep as any).title}</p>
        )}
        <div className="cc-ap-progress">Progress: {verifiedCount}/{totalRequired} required ({pct}%)</div>
        <ul className="cc-ap-reqs">
          {currentStepReqs.map((r: any) => {
            const st = getReqSt(r.id)
            return (
              <li key={r.id} className={st?.status === 'verified' ? 'done' : ''}>
                {r.title ?? r.name} {r.is_required ? '(required)' : ''} — {st?.status ?? 'pending'}
              </li>
            )
          })}
          {currentStepReqs.length === 0 && <li className="cc-muted">No requirements loaded for this step.</li>}
        </ul>
      </section>

      {countryIntel && countryIntel.country_code === country.iso2 && (
        <section className="cc-ap-intel">
          <div className="cc-card-head">MARKET STATUS</div>
          <div className="cc-status-grid">
            <div><span className="cc-label">Medical</span> {fmtStatus(countryIntel.medical_status)}</div>
            <div><span className="cc-label">Access</span> {fmtStatus(countryIntel.market_access_status)}</div>
            <div><span className="cc-label">Import</span> {fmtStatus(countryIntel.import_status)}</div>
            <div><span className="cc-label">Export</span> {fmtStatus(countryIntel.export_status)}</div>
          </div>
        </section>
      )}

      {jurisdictionPlaybook && (
        <section className="cc-ap-playbook">
          <div className="cc-card-head">PLAYBOOK</div>
          <p className="cc-right-prose">{(jurisdictionPlaybook as any).summary ?? (jurisdictionPlaybook as any).title ?? 'Jurisdiction playbook available'}</p>
        </section>
      )}

      <aside className="cc-ap-side">
        <div className="cc-right-section">
          <div className="cc-right-head">RELATED SIGNALS</div>
          {relSignals.map(s => (
            <button key={s.id} type="button" className="cc-signal-item" onClick={() => onPageChange?.('signals')}>
              <span className="cc-signal-title">{s.title}</span>
              <span className="cc-signal-meta">{s.timeAgo}</span>
            </button>
          ))}
          {relSignals.length === 0 && <div className="cc-muted">No pathway signals</div>}
        </div>
      </aside>
    </div>
  )
})
