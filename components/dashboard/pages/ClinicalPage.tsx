'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  ClinicalEducationModule,
  ClinicalEducationCountryReadiness,
} from '@/lib/fixtures/clinical-education'
import {
  standardClinicalEducationDisclaimer,
  dosageBoundaryDisclaimer,
  patientBoundaryDisclaimer,
} from '@/lib/fixtures/clinical-education'

type Props = {
  countryLabel: string
  countryIso2?: string | null
  roleLabel: string
  modules?: ClinicalEducationModule[]
  readiness?: ClinicalEducationCountryReadiness[]
}

const STATUS_TONE: Record<string, string> = {
  Live: 'ok',
  'Available by request': 'neutral',
  'Research in progress': 'warn',
  'Professional review required': 'warn',
  'Future module': 'neutral',
  'Admin-only': 'neutral',
}

function riskColor(level: string): string {
  if (level === 'low') return '#4caf82'
  if (level === 'medium') return '#d4a84b'
  return '#e05555'
}

function disclaimerFor(module: ClinicalEducationModule): string {
  if (module.disclaimerType === 'dosage') return dosageBoundaryDisclaimer
  if (module.disclaimerType === 'patient-boundary') return patientBoundaryDisclaimer
  return standardClinicalEducationDisclaimer
}

export default function ClinicalPage({
  countryLabel,
  countryIso2,
  roleLabel,
  modules = [],
  readiness = [],
}: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'review'>('all')

  const countryReadiness = useMemo(() => {
    if (!countryLabel || countryLabel === 'Global Market') return readiness
    const match = readiness.filter(
      r => r.country.toLowerCase() === countryLabel.toLowerCase(),
    )
    return match.length > 0 ? match : readiness
  }, [readiness, countryLabel])

  const filteredModules = useMemo(() => {
    if (filter === 'live') return modules.filter(m => m.moduleStatus === 'Live' && m.publicUseApproved)
    if (filter === 'review') return modules.filter(m => m.professionalReviewRequired || !m.publicUseApproved)
    return modules
  }, [modules, filter])

  const selected = selectedSlug
    ? modules.find(m => m.slug === selectedSlug) ?? null
    : null

  if (selected) {
    return (
      <div className="hv-clinical-page">
        <button
          type="button"
          className="hv-clinical-back"
          onClick={() => setSelectedSlug(null)}
        >
          ← Clinical modules
        </button>

        <header className="hv-clinical-hero">
          <div className="hv-clinical-kicker">
            {countryLabel} · {roleLabel} · Clinical Education
          </div>
          <h2>{selected.title}</h2>
          <p>{selected.publicSummary}</p>
          <div className="hv-clinical-chips">
            <span className={`hv-clinical-chip hv-clinical-chip--${STATUS_TONE[selected.moduleStatus] ?? 'neutral'}`}>
              {selected.moduleStatus}
            </span>
            <span
              className="hv-clinical-chip"
              style={{ color: riskColor(selected.riskLevel), borderColor: `${riskColor(selected.riskLevel)}55` }}
            >
              Risk: {selected.riskLevel}
            </span>
            {selected.professionalReviewRequired && (
              <span className="hv-clinical-chip hv-clinical-chip--warn">Professional review required</span>
            )}
          </div>
        </header>

        <section className="hv-clinical-panel">
          <div className="hv-clinical-kicker">Education themes</div>
          <ul className="hv-clinical-list">
            {selected.educationThemes.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        {selected.safeLanguage.length > 0 && (
          <section className="hv-clinical-panel">
            <div className="hv-clinical-kicker">Safe language frame</div>
            <ul className="hv-clinical-list">
              {selected.safeLanguage.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {selected.restrictedLanguage.length > 0 && (
          <section className="hv-clinical-panel hv-clinical-panel--warn">
            <div className="hv-clinical-kicker">Restricted language</div>
            <ul className="hv-clinical-list">
              {selected.restrictedLanguage.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="hv-clinical-panel">
          <div className="hv-clinical-kicker">Audience & boundaries</div>
          <div className="hv-clinical-meta-grid">
            <div>
              <strong>Audience</strong>
              <span>{selected.audience.join(', ') || 'Professionals'}</span>
            </div>
            <div>
              <strong>Audience boundary</strong>
              <span>{selected.audienceBoundary.replace(/-/g, ' ')}</span>
            </div>
            <div>
              <strong>Source basis</strong>
              <span>{selected.sourceBasis.replace(/-/g, ' ')}</span>
            </div>
            <div>
              <strong>Medical advice boundary</strong>
              <span>{selected.medicalAdviceBoundary}</span>
            </div>
          </div>
        </section>

        <section className="hv-clinical-disclaimer">
          <div className="hv-clinical-kicker">Disclaimer</div>
          <p>{disclaimerFor(selected)}</p>
        </section>

        {selected.ctaHref && (
          <Link href={selected.ctaHref} className="hv-clinical-cta">
            {selected.ctaLabel || 'Request education support'} →
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="hv-clinical-page">
      <header className="hv-clinical-hero">
        <div className="hv-clinical-kicker">Clinical · Professional education</div>
        <h2>Clinical Education</h2>
        <p>
          {countryLabel} · {roleLabel}. Non-promotional professional education for regulated
          cannabis markets — not medical advice, prescribing guidance, or patient-facing content.
        </p>
      </header>

      <div className="hv-clinical-filters" role="tablist" aria-label="Clinical module filters">
        {([
          { id: 'all', label: 'All modules' },
          { id: 'live', label: 'Live' },
          { id: 'review', label: 'Needs review' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            className={filter === tab.id ? 'active' : ''}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hv-clinical-module-grid">
        {filteredModules.length === 0 ? (
          <div className="hv-clinical-empty">
            <strong>No clinical modules in this filter.</strong>
            <p>Live modules appear after source-backed editorial and professional review.</p>
            <Link href="/network/clinical-education">Open clinical education hub →</Link>
          </div>
        ) : (
          filteredModules.map(mod => (
            <article
              key={mod.id}
              className="hv-clinical-card"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSlug(mod.slug)}
              onKeyDown={e => e.key === 'Enter' && setSelectedSlug(mod.slug)}
            >
              <div className="hv-clinical-card-top">
                <span className={`hv-clinical-chip hv-clinical-chip--${STATUS_TONE[mod.moduleStatus] ?? 'neutral'}`}>
                  {mod.moduleStatus}
                </span>
                <span style={{ color: riskColor(mod.riskLevel), fontSize: 11, fontWeight: 700 }}>
                  {mod.riskLevel} risk
                </span>
              </div>
              <h3>{mod.title}</h3>
              <p>{mod.publicSummary}</p>
              <div className="hv-clinical-card-footer">
                <span>{mod.audience.slice(0, 3).join(' · ')}</span>
                <strong>Open →</strong>
              </div>
            </article>
          ))
        )}
      </div>

      {countryReadiness.length > 0 && (
        <section className="hv-clinical-panel">
          <div className="hv-clinical-kicker">
            Country readiness{countryIso2 ? ` · ${countryIso2}` : ''}
          </div>
          <div className="hv-clinical-readiness-list">
            {countryReadiness.map(row => (
              <div key={row.country} className="hv-clinical-readiness-row">
                <div>
                  <strong>{row.country}</strong>
                  <span className="hv-clinical-muted"> · {row.region}</span>
                </div>
                <p>{row.professionalEducationReadiness}</p>
                {row.knownTrainingGap && (
                  <p className="hv-clinical-muted">Gap: {row.knownTrainingGap}</p>
                )}
                <div className="hv-clinical-chips">
                  <span className="hv-clinical-chip">Pharmacist: {row.pharmacistRelevance}</span>
                  <span className="hv-clinical-chip">Clinician: {row.clinicianRelevance}</span>
                  <span className="hv-clinical-chip">{row.briefAvailability}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="hv-clinical-disclaimer">
        <div className="hv-clinical-kicker">Platform boundary</div>
        <p>{standardClinicalEducationDisclaimer}</p>
        <Link href="/network/clinical-education/request" className="hv-clinical-cta">
          Request clinical education support →
        </Link>
      </section>

      <style>{`
        .hv-clinical-page { display: flex; flex-direction: column; gap: 18px; padding: 4px 2px 24px; color: rgba(245,240,232,.92); }
        .hv-clinical-kicker { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: rgba(245,240,232,.42); margin-bottom: 8px; }
        .hv-clinical-hero h2 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 28px; color: #f5f0e8; letter-spacing: -.02em; }
        .hv-clinical-hero p { margin: 0; color: rgba(245,240,232,.62); line-height: 1.55; font-size: 14px; max-width: 62ch; }
        .hv-clinical-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .hv-clinical-filters button { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: rgba(245,240,232,.65); font-weight: 700; font-size: 12px; cursor: pointer; }
        .hv-clinical-filters button.active { border-color: rgba(212,168,75,.5); color: #d4a84b; background: rgba(212,168,75,.08); }
        .hv-clinical-module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
        .hv-clinical-card { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); border-radius: 14px; padding: 14px 16px; cursor: pointer; transition: border-color .15s, background .15s; }
        .hv-clinical-card:hover { border-color: rgba(212,168,75,.35); background: rgba(255,255,255,.07); }
        .hv-clinical-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
        .hv-clinical-card h3 { margin: 0 0 8px; font-size: 16px; color: #f5f0e8; }
        .hv-clinical-card p { margin: 0; font-size: 13px; line-height: 1.5; color: rgba(245,240,232,.6); }
        .hv-clinical-card-footer { display: flex; justify-content: space-between; gap: 10px; margin-top: 12px; font-size: 11px; color: rgba(245,240,232,.45); }
        .hv-clinical-card-footer strong { color: #d4a84b; }
        .hv-clinical-chip { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); font-size: 10px; font-weight: 700; color: rgba(245,240,232,.7); }
        .hv-clinical-chip--ok { border-color: rgba(76,175,130,.35); color: #4caf82; }
        .hv-clinical-chip--warn { border-color: rgba(212,168,75,.4); color: #d4a84b; }
        .hv-clinical-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .hv-clinical-panel { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.035); border-radius: 14px; padding: 14px 16px; }
        .hv-clinical-panel--warn { border-color: rgba(224,85,85,.25); background: rgba(224,85,85,.05); }
        .hv-clinical-list { margin: 0; padding-left: 18px; color: rgba(245,240,232,.72); font-size: 13px; line-height: 1.55; }
        .hv-clinical-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .hv-clinical-meta-grid strong { display: block; font-size: 11px; color: #d4a84b; margin-bottom: 4px; }
        .hv-clinical-meta-grid span { font-size: 13px; color: rgba(245,240,232,.7); line-height: 1.45; }
        .hv-clinical-readiness-list { display: flex; flex-direction: column; gap: 12px; }
        .hv-clinical-readiness-row strong { color: #f5f0e8; }
        .hv-clinical-readiness-row p { margin: 6px 0 0; font-size: 13px; color: rgba(245,240,232,.7); line-height: 1.5; }
        .hv-clinical-muted { color: rgba(245,240,232,.45); font-size: 12px; }
        .hv-clinical-disclaimer { border: 1px solid rgba(212,168,75,.22); background: rgba(212,168,75,.06); border-radius: 14px; padding: 14px 16px; }
        .hv-clinical-disclaimer p { margin: 0; font-size: 12px; line-height: 1.55; color: rgba(245,240,232,.65); }
        .hv-clinical-cta { display: inline-block; margin-top: 12px; color: #d4a84b; font-size: 13px; font-weight: 700; text-decoration: none; }
        .hv-clinical-cta:hover { opacity: .85; }
        .hv-clinical-back { align-self: flex-start; background: none; border: none; color: #d4a84b; font-size: 13px; font-weight: 700; cursor: pointer; padding: 0; min-height: 36px; }
        .hv-clinical-empty { padding: 20px; border-radius: 14px; border: 1px dashed rgba(255,255,255,.15); text-align: center; }
        .hv-clinical-empty strong { display: block; color: #f5f0e8; margin-bottom: 6px; }
        .hv-clinical-empty p { margin: 0 0 12px; color: rgba(245,240,232,.55); font-size: 13px; }
        .hv-clinical-empty a { color: #d4a84b; font-weight: 700; text-decoration: none; font-size: 13px; }
      `}</style>
    </div>
  )
}
