'use client'

import React from 'react'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'

export interface EvidencePageProps {
  country: { iso2: string; label: string }
  region: string
  role: string
  countryIntel?: CountryIntelProfile | null
}

function display(value: string | number | null | undefined, fallback = 'Review pending') {
  if (typeof value === 'number') return String(value)
  return value && value.trim() ? value.trim() : fallback
}

function publicReviewLabel(value?: string | null) {
  if (!value) return 'Review pending'
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ')
  if (normalized === 'active' || normalized === 'published') return 'Public summary available'
  if (normalized.includes('review') || normalized.includes('pending')) return 'Review pending'
  return 'Public-safe state available'
}

export const EvidencePage = React.memo(function EvidencePage({
  country, region, role, countryIntel,
}: EvidencePageProps) {
  const coverageRows = [
    { label: 'Review State', value: publicReviewLabel(countryIntel?.review_status) },
    { label: 'Data Completeness', value: display(countryIntel?.data_completeness) },
    { label: 'Regulatory Tier', value: display(countryIntel?.regulatory_tier) },
    { label: 'Source Region', value: display(countryIntel?.region ?? region) },
    { label: 'Medical Status', value: display(countryIntel?.medical_status) },
    { label: 'Import Status', value: display(countryIntel?.import_status) },
    { label: 'Export Status', value: display(countryIntel?.export_status) },
    { label: 'Regulator', value: display(countryIntel?.regulator_label) },
  ]

  return (
    <div className="ev-root">
      <style>{CSS}</style>
      <header className="ev-header">
        <div>
          <p className="ev-kicker">Evidence &amp; Sources</p>
          <h1>{country.label} public evidence state</h1>
          <p>{role ? `${role} · ` : ''}Public users see approved summary fields only. Admin provenance, raw source evidence, internal notes, and reviewer state remain excluded from this client module.</p>
        </div>
        <a href="/intake" className="ev-cta">Request source documentation</a>
      </header>

      <div className="ev-body">
        <section className="ev-card ev-summary">
          <h2>Public summary</h2>
          <p>{countryIntel?.public_summary ?? 'No public-safe jurisdiction summary is available yet. This country-role pathway remains review pending until source-backed summaries are published.'}</p>
          {countryIntel?.commercial_pathway_summary && <p>{countryIntel.commercial_pathway_summary}</p>}
        </section>

        <section className="ev-card">
          <h2>Coverage state</h2>
          <div className="ev-grid">
            {coverageRows.map(row => (
              <div key={row.label} className="ev-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="ev-card ev-boundary">
          <h2>Public/private boundary</h2>
          <ul>
            <li>Public DTOs may expose country labels, approved summaries, and public-safe status labels.</li>
            <li>Admin evidence, provenance, source URLs, reviewer notes, and raw verification fields stay outside this client payload.</li>
            <li>Unsupported medical, legal, dosage, import/export, and country-specific claims remain review gated.</li>
          </ul>
        </section>
      </div>
    </div>
  )
})

const CSS = `
.ev-root{height:100%;overflow:auto;padding:24px;color:#f5f0e8}.ev-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.ev-kicker{font-family:JetBrains Mono,Fira Mono,monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,240,232,.35);margin:0 0 6px}.ev-header h1{font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0 0 8px}.ev-header p,.ev-card p,.ev-boundary li{font-size:12px;line-height:1.65;color:rgba(245,240,232,.58);margin:0}.ev-cta{display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.08);color:#d4a84b;text-decoration:none;font-size:12px;white-space:nowrap}.ev-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}.ev-card{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:14px;padding:16px}.ev-summary{grid-column:1/-1}.ev-card h2{font-family:Georgia,serif;font-size:18px;font-weight:400;margin:0 0 10px}.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.ev-row{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:10px;padding:10px}.ev-row span{display:block;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,240,232,.35)}.ev-row strong{display:block;margin-top:4px;font-size:12px;color:#f5f0e8}.ev-boundary ul{margin:0;padding-left:18px;display:grid;gap:8px}@media(max-width:760px){.ev-root{padding:14px}.ev-header{flex-direction:column}.ev-body{grid-template-columns:1fr}.ev-cta{width:100%;justify-content:center}}
`
