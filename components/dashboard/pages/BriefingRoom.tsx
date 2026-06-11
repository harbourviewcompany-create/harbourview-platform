'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="br-globe-loading" /> },
)

export interface BriefingRoomProps {
  country: { iso2: string; label: string }
  region: string
  countryIntel?: CountryIntelProfile | null
  signals: DashboardSignal[]
}

const FLAG: Record<string, string> = { US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', AU: '🇦🇺', NL: '🇳🇱', MX: '🇲🇽' }

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

export const BriefingRoom = React.memo(function BriefingRoom({ country, region, countryIntel, signals }: BriefingRoomProps) {
  const recentSignals = useMemo(() => signals.slice(0, 3), [signals])
  const statusFields = [
    ['Medical Status', countryIntel?.medical_status],
    ['Market Access', countryIntel?.market_access_status],
    ['Import Status', countryIntel?.import_status],
    ['Export Status', countryIntel?.export_status],
    ['Review State', publicReviewLabel(countryIntel?.review_status)],
  ] as const
  const methodology = [
    ['Data Sources', countryIntel ? 'Approved public summary fields loaded' : 'Source coverage pending'],
    ['Verification', publicReviewLabel(countryIntel?.review_status)],
    ['Update Cadence', 'Shown after source health checks are connected'],
    ['Coverage', display(countryIntel?.data_completeness, 'Coverage review pending')],
    ['Last Updated', 'Use source registry timestamp when available'],
  ] as const

  return (
    <div className="br-root">
      <style>{CSS}</style>
      <aside className="br-left">
        <header className="br-section-head">JURISDICTION BRIEF</header>
        <div className="br-jx-hero"><span className="br-flag">{FLAG[country.iso2] ?? '🌐'}</span><div><div className="br-country">{country.label}</div>{region && <div className="br-region">{region}</div>}</div></div>
        <p className="br-summary">{countryIntel?.public_summary ?? 'No public-safe jurisdiction summary is available yet. This market remains review pending until source-backed summaries are published.'}</p>
        <div className="br-status-fields">{statusFields.map(([label, value]) => <div key={label} className="br-status-field"><span className="br-status-icon">◎</span><div className="br-status-body"><small>{label}</small><strong>{display(value)}</strong><span>Public-safe field</span></div></div>)}</div>
        <button type="button" className="br-profile-btn" disabled aria-disabled="true">Full jurisdiction profile unavailable →</button>
      </aside>
      <div className="br-centre">
        <div className="br-globe-wrap"><GlobeCanvas className="absolute inset-0 w-full h-full" selectedCountryIso2={country.iso2} selectedCountryIso2s={[country.iso2]} focusedCountryIso2={undefined} activeLayerId="country_select" /><div className="br-globe-chip"><span className="br-globe-chip-dot" /><span>{region || country.label}</span><span className="br-globe-chip-status">{publicReviewLabel(countryIntel?.review_status)}</span></div><div className="br-globe-controls">Country context view · Rotate · Zoom · Drag</div></div>
        <div className="br-methodology"><div className="br-method-head">METHODOLOGY &amp; OPERATING STATE</div><div className="br-method-cols">{methodology.map(([label, val]) => <div key={label} className="br-method-col"><span className="br-method-icon">◎</span><div><small>{label}</small><p>{val}</p></div></div>)}</div></div>
      </div>
      <aside className="br-right">
        <section className="br-right-section"><header className="br-right-head">EVIDENCE STATE</header><div className="br-evidence-state"><strong>{publicReviewLabel(countryIntel?.review_status)}</strong><p>Confidence scores are not displayed until source-backed scoring data is connected to this public DTO.</p></div><button type="button" className="br-link" disabled aria-disabled="true">Confidence methodology unavailable →</button></section>
        <section className="br-right-section"><header className="br-right-head">WATCH REGIONS</header><div className="br-watch-list">{[country.label, ...signals.map(s => s.market).filter((market, index, all) => market !== country.label && all.indexOf(market) === index).slice(0, 4)].map(label => <div key={label} className="br-watch-row"><span className="br-watch-star">○</span><div className="br-watch-info"><strong>{label}</strong><small>{label === country.label ? 'Current context' : 'Signal-linked context'}</small></div><button type="button" className="br-watch-btn" disabled aria-disabled="true">View</button></div>)}</div></section>
        {recentSignals.length > 0 && <section className="br-right-section"><header className="br-right-head">RECENT PUBLIC-SAFE SIGNALS</header><div className="br-changes">{recentSignals.map(signal => <div key={signal.id} className="br-change"><span className="br-change-dir">●</span><div className="br-change-body"><strong>{signal.market}</strong><small>{signal.title}</small><time>{signal.timeAgo} · {signal.confidence}% confidence</time></div></div>)}</div></section>}
      </aside>
    </div>
  )
})

const CSS = `
.br-root{display:grid;grid-template-columns:300px minmax(0,1fr) 300px;height:100%;overflow:hidden}.br-left{padding:24px 20px;border-right:1px solid rgba(255,255,255,.08);background:rgba(3,7,17,.55);overflow-y:auto;display:flex;flex-direction:column;gap:18px}.br-section-head,.br-right-head,.br-method-head{font-family:JetBrains Mono,Fira Mono,monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,240,232,.32)}.br-jx-hero{display:flex;align-items:center;gap:14px}.br-flag{font-size:30px}.br-country{font-family:Georgia,serif;font-size:22px;color:#f5f0e8}.br-region{font-size:13px;color:#d4a84b}.br-summary{font-size:12px;line-height:1.7;color:rgba(245,240,232,.58);border-left:2px solid rgba(212,168,75,.5);padding-left:12px;margin:0}.br-status-fields{display:flex;flex-direction:column;gap:8px}.br-status-field{display:flex;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07)}.br-status-icon{font-size:14px;color:rgba(245,240,232,.45)}.br-status-body{display:flex;flex-direction:column;gap:1px}.br-status-body small{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:rgba(245,240,232,.35)}.br-status-body strong{font-size:12px;color:#f5f0e8}.br-status-body span{font-size:10px;color:rgba(245,240,232,.45)}.br-profile-btn,.br-watch-btn,.br-link{cursor:not-allowed}.br-profile-btn{margin-top:auto;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(245,240,232,.45);font:inherit;font-size:11px;text-align:left}.br-centre{display:flex;flex-direction:column;overflow:hidden}.br-globe-wrap{flex:1;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(16,42,72,.65),transparent 66%),linear-gradient(180deg,#020814 0%,#010509 100%)}.br-globe-loading{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(16,42,72,.35),transparent 60%)}.br-globe-chip{position:absolute;bottom:36%;right:27%;display:flex;align-items:center;gap:6px;background:rgba(8,18,32,.92);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:5px 12px;font-size:12px;color:#f5f0e8;pointer-events:none}.br-globe-chip-dot{width:7px;height:7px;border-radius:50%;background:#d4a84b}.br-globe-chip-status{font-size:10px;color:rgba(245,240,232,.5);padding-left:6px;border-left:1px solid rgba(255,255,255,.15)}.br-globe-controls{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-family:JetBrains Mono,Fira Mono,monospace;font-size:9px;color:rgba(245,240,232,.3);white-space:nowrap}.br-methodology{border-top:1px solid rgba(255,255,255,.08);background:rgba(3,7,17,.72)}.br-method-head{font-size:8px;padding:10px 16px 0}.br-method-cols{display:flex}.br-method-col{flex:1;display:flex;gap:8px;padding:10px 14px 14px;border-right:1px solid rgba(255,255,255,.06)}.br-method-col:last-child{border-right:none}.br-method-icon{font-size:12px;color:#d4a84b}.br-method-col small{display:block;font-size:8px;color:rgba(245,240,232,.35);text-transform:uppercase}.br-method-col p{margin:2px 0 0;font-size:9px;color:rgba(245,240,232,.5);line-height:1.45}.br-right{padding:20px 16px;border-left:1px solid rgba(255,255,255,.08);background:rgba(3,7,17,.55);overflow-y:auto;display:flex;flex-direction:column;gap:22px}.br-right-section{display:flex;flex-direction:column;gap:12px}.br-evidence-state{padding:12px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}.br-evidence-state p{font-size:10px;color:rgba(245,240,232,.48);line-height:1.55;margin:5px 0 0}.br-watch-list,.br-changes{display:flex;flex-direction:column;gap:10px}.br-watch-row,.br-change{display:flex;gap:8px;align-items:flex-start}.br-watch-star,.br-change-dir{color:#d4a84b}.br-watch-info{flex:1}.br-watch-info strong,.br-change-body strong{display:block;font-size:11px;color:#f5f0e8}.br-watch-info small,.br-change-body small{display:block;font-size:10px;color:rgba(245,240,232,.5)}.br-watch-btn{font-size:9px;padding:3px 9px;border-radius:5px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(245,240,232,.45);font:inherit}.br-link{font-size:10px;color:rgba(212,168,75,.55);background:none;border:none;padding:0;text-align:left;font:inherit}.br-change-body time{display:block;font-size:9px;color:rgba(245,240,232,.3);margin-top:2px}@media(max-width:1024px){.br-root{grid-template-columns:1fr;height:auto;overflow-y:auto}.br-left,.br-right{border:none;border-bottom:1px solid rgba(255,255,255,.08)}.br-globe-wrap{height:340px}.br-method-cols{flex-wrap:wrap}.br-method-col{min-width:50%;border-bottom:1px solid rgba(255,255,255,.06)}}
`
