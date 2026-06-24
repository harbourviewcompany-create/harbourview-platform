'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { flagEmoji } from '@/lib/utils/flagEmoji'

// ── Globe (SSR off — Three.js) ────────────────────────────────────────────────

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="br-globe-loading" /> },
)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BriefingRoomProps {
  country:      { iso2: string; label: string }
  region:       string
  countryIntel?: CountryIntelProfile | null
  signals:      DashboardSignal[]
}

// ── Confidence bars (driven by signals in future; static scaffold for now) ────

const CONFIDENCE_BARS = [
  { label: 'Regulatory',        pct: 85, color: '#d4a84b' },
  { label: 'Market Data',       pct: 80, color: '#d4a84b' },
  { label: 'Access Pathway',    pct: 78, color: '#d4a84b' },
  { label: 'Local Intel',       pct: 76, color: '#d4a84b' },
  { label: 'Education Content', pct: 90, color: '#d4a84b' },
]

function getOverall(bars: { pct: number }[]) {
  return Math.round(bars.reduce((s, b) => s + b.pct, 0) / bars.length)
}


// ── Component ─────────────────────────────────────────────────────────────────

export const BriefingRoom = React.memo(function BriefingRoom({
  country, region, countryIntel, signals,
}: BriefingRoomProps) {
  const overall = getOverall(CONFIDENCE_BARS)
  const circumference = 2 * Math.PI * 26 // r=26

  const recentChanges = useMemo(() =>
    signals.slice(0, 3).map(s => ({
      market:  s.market,
      title:   s.title,
      timeAgo: s.timeAgo,
      dir:     s.confidence >= 75 ? 'up' : 'neutral' as 'up' | 'neutral',
    })),
    [signals],
  )

  const lastUpdated = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      + ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  }, [])

  return (
    <div className="br-root">
      <style>{CSS}</style>

      {/* ── Left: Jurisdiction brief ──────────────────────────────────────── */}
      <aside className="br-left">

        <header className="br-section-head">JURISDICTION BRIEF</header>

        <div className="br-jx-hero">
          <span className="br-flag">{flagEmoji(country.iso2)}</span>
          <div>
            <div className="br-country">{country.label}</div>
            {region && <div className="br-region">{region}</div>}
          </div>
        </div>

        {countryIntel?.public_summary && (
          <p className="br-summary">{countryIntel.public_summary}</p>
        )}

        <div className="br-status-fields">
          <div className="br-status-field">
            <span className="br-status-icon">◎</span>
            <div className="br-status-body">
              <small>Program Status</small>
              <strong>Active Medical Program</strong>
              <span>(vertical model)</span>
            </div>
          </div>
          <div className="br-status-field">
            <span className="br-status-icon br-icon-up">↑</span>
            <div className="br-status-body">
              <small>Patient Access</small>
              <strong>Increasing</strong>
              <span>+8.4% Q/Q</span>
            </div>
          </div>
          <div className="br-status-field">
            <span className="br-status-icon">◐</span>
            <div className="br-status-body">
              <small>Physician Access</small>
              <strong>Moderate</strong>
              <span>1,842 registered</span>
            </div>
          </div>
          <div className="br-status-field">
            <span className="br-status-icon">⊛</span>
            <div className="br-status-body">
              <small>Market Dynamics</small>
              <strong>Maturing</strong>
              <span>High competition</span>
            </div>
          </div>
          <div className="br-status-field">
            <span className="br-status-icon br-icon-stable">⊙</span>
            <div className="br-status-body">
              <small>Regulatory Outlook</small>
              <strong>Stable</strong>
              <span>No pending changes</span>
            </div>
          </div>
        </div>

        <button className="br-profile-btn">View Full Jurisdiction Profile →</button>

      </aside>

      {/* ── Centre: Globe + methodology strip ────────────────────────────── */}
      <div className="br-centre">

        <div className="br-globe-wrap">
          <GlobeCanvas
            className="absolute inset-0 w-full h-full"
            selectedCountryIso2={country.iso2}
            selectedCountryIso2s={[country.iso2]}
            focusedCountryIso2={undefined}
            activeLayerId="country_select"
          />

          {/* Tooltip chip matching mockup */}
          <div className="br-globe-chip">
            <span className="br-globe-chip-dot" />
            <span>{region || country.label}</span>
            <span className="br-globe-chip-status">Active Program</span>
          </div>

          <div className="br-globe-controls">
            Click a region to explore&nbsp;&nbsp;·&nbsp;&nbsp;
            Rotate&nbsp;&nbsp;·&nbsp;&nbsp;Zoom&nbsp;&nbsp;·&nbsp;&nbsp;Drag
          </div>
        </div>

        {/* Methodology strip */}
        <div className="br-methodology">
          <div className="br-method-head">METHODOLOGY &amp; OPERATING STATE</div>
          <div className="br-method-cols">
            {[
              { icon: '◎', label: 'Data Sources',    val: 'Government, regulatory, market and verified industry sources' },
              { icon: '✓', label: 'Verification',    val: 'Multi-layer review and validation by domain experts' },
              { icon: '↻', label: 'Update Cadence',  val: 'Regulatory: Real-time · Market: Daily · Intel: Continuous' },
              { icon: '⊞', label: 'Coverage',        val: '50 U.S. States · 8 Countries · 100+ Data Sources' },
              { icon: '◷', label: 'Last Updated',    val: lastUpdated },
            ].map(col => (
              <div key={col.label} className="br-method-col">
                <span className="br-method-icon">{col.icon}</span>
                <div>
                  <small>{col.label}</small>
                  <p>{col.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right: Evidence confidence + watch regions + change notes ─────── */}
      <aside className="br-right">

        {/* Evidence confidence */}
        <section className="br-right-section">
          <header className="br-right-head">
            EVIDENCE CONFIDENCE
            <span className="br-info-icon" title="Weighted scoring across source authority, jurisdiction relevance, recency, and consistency.">ⓘ</span>
          </header>

          <div className="br-confidence">
            <div className="br-donut-wrap">
              <svg viewBox="0 0 64 64" className="br-donut">
                {/* Track */}
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="rgba(255,255,255,.07)"
                  strokeWidth="7"
                />
                {/* Fill */}
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="#d4a84b"
                  strokeWidth="7"
                  strokeDasharray={`${circumference * overall / 100} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="br-donut-centre">
                <strong>{overall}%</strong>
                <small>Overall<br/>Confidence</small>
              </div>
            </div>

            <div className="br-conf-bars">
              {CONFIDENCE_BARS.map(bar => (
                <div key={bar.label} className="br-conf-row">
                  <span className="br-conf-lbl">{bar.label}</span>
                  <div className="br-conf-track">
                    <div className="br-conf-fill" style={{ width: `${bar.pct}%` }} />
                  </div>
                  <span className="br-conf-pct">{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <button className="br-link br-link-btn" type="button" disabled>Confidence methodology →</button>
        </section>

        {/* Watch regions */}
        <section className="br-right-section">
          <header className="br-right-head">WATCH REGIONS</header>

          <div className="br-watch-list">
            {[
              { label: country.label, status: 'Active Program',       star: true  },
              { label: 'California',  status: 'Active Program',       star: false },
              { label: 'New York',    status: 'Program Expanding',    star: false },
              { label: 'Texas',       status: 'Legislation Pending',  star: false },
              { label: 'Illinois',    status: 'Market Maturing',      star: false },
            ].map(r => (
              <div key={r.label} className="br-watch-row">
                <span className="br-watch-star">{r.star ? '★' : '○'}</span>
                <div className="br-watch-info">
                  <strong>{r.label}</strong>
                  <small>{r.status}</small>
                </div>
                <button className="br-watch-btn">View</button>
              </div>
            ))}
          </div>

          <button className="br-link br-link-btn" type="button" disabled>View all jurisdictions →</button>
        </section>

        {/* Recent change notes */}
        {recentChanges.length > 0 && (
          <section className="br-right-section">
            <header className="br-right-head">RECENT CHANGE NOTES</header>

            <div className="br-changes">
              {recentChanges.map((c, i) => (
                <div key={i} className="br-change">
                  <span className={`br-change-dir br-change-dir--${c.dir}`}>
                    {c.dir === 'up' ? '↑' : '●'}
                  </span>
                  <div className="br-change-body">
                    <strong>{c.market}</strong>
                    <small>{c.title}</small>
                    <time>{c.timeAgo}</time>
                  </div>
                </div>
              ))}
            </div>

            <button className="br-link br-link-btn" type="button" disabled>View all change activity →</button>
          </section>
        )}

      </aside>
    </div>
  )
})

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
.br-root {
  display:grid;
  grid-template-columns:300px minmax(0,1fr) 300px;
  height:100%;
  overflow:hidden;
  animation:brIn .3s ease;
}
@keyframes brIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

/* ── Left ── */
.br-left {
  grid-column:1;
  padding:24px 20px 24px;
  border-right:1px solid rgba(255,255,255,.08);
  background:rgba(3,7,17,.55);
  overflow-y:auto;
  display:flex;flex-direction:column;gap:18px;
}
.br-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(245,240,232,.32);
}
.br-jx-hero { display:flex;align-items:center;gap:14px; }
.br-flag    { font-size:30px;line-height:1;flex-shrink:0; }
.br-country {
  font-family:'Georgia',serif;font-size:22px;font-weight:400;
  color:#f5f0e8;line-height:1.1;
}
.br-region {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:13px;color:#d4a84b;
  margin-top:3px;letter-spacing:.04em;
}
.br-summary {
  font-size:12px;line-height:1.7;color:rgba(245,240,232,.58);
  border-left:2px solid rgba(212,168,75,.5);padding-left:12px;margin:0;
}
.br-status-fields { display:flex;flex-direction:column;gap:8px; }
.br-status-field {
  display:flex;align-items:flex-start;gap:10px;
  padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.07);
}
.br-status-icon {
  font-size:14px;color:rgba(245,240,232,.45);
  flex-shrink:0;margin-top:2px;
}
.br-icon-up     { color:#4caf82; }
.br-icon-stable { color:#d4a84b; }
.br-status-body { display:flex;flex-direction:column;gap:1px; }
.br-status-body small  { font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:rgba(245,240,232,.35); }
.br-status-body strong { font-size:12px;font-weight:600;color:#f5f0e8;margin-top:1px; }
.br-status-body span   { font-size:10px;color:rgba(245,240,232,.45); }
.br-profile-btn {
  margin-top:auto;padding:10px 14px;border-radius:8px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.6);font:inherit;font-size:11px;
  cursor:pointer;text-align:left;
  transition:background .12s,color .12s;
}
.br-profile-btn:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

/* ── Centre ── */
.br-centre {
  grid-column:2;
  display:flex;flex-direction:column;
  overflow:hidden;
}
.br-globe-wrap {
  flex:1;position:relative;overflow:hidden;
  background:
    radial-gradient(circle at 50% 42%,rgba(16,42,72,.65),transparent 66%),
    linear-gradient(180deg,#020814 0%,#010509 100%);
}
.br-globe-loading {
  position:absolute;inset:0;
  background:radial-gradient(circle at 50% 42%,rgba(16,42,72,.35),transparent 60%);
}
.br-globe-chip {
  position:absolute;
  /* Positioned roughly over where Florida sits on the globe */
  bottom:36%;right:27%;
  display:flex;align-items:center;gap:6px;
  background:rgba(8,18,32,.92);
  border:1px solid rgba(255,255,255,.12);
  border-radius:8px;padding:5px 12px;
  font-size:12px;font-weight:500;color:#f5f0e8;
  pointer-events:none;white-space:nowrap;
}
.br-globe-chip-dot {
  width:7px;height:7px;border-radius:50%;
  background:#4caf82;
  box-shadow:0 0 5px #4caf82;
  flex-shrink:0;
}
.br-globe-chip-status {
  font-size:10px;color:rgba(245,240,232,.5);
  padding-left:6px;border-left:1px solid rgba(255,255,255,.15);
}
.br-globe-controls {
  position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.12em;
  color:rgba(245,240,232,.3);pointer-events:none;white-space:nowrap;
}

/* Methodology */
.br-methodology {
  flex-shrink:0;
  border-top:1px solid rgba(255,255,255,.08);
  background:rgba(3,7,17,.72);
}
.br-method-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:8px;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(245,240,232,.28);
  padding:10px 16px 0;
}
.br-method-cols { display:flex; }
.br-method-col {
  flex:1;display:flex;align-items:flex-start;gap:8px;
  padding:10px 14px 14px;
  border-right:1px solid rgba(255,255,255,.06);
}
.br-method-col:last-child { border-right:none; }
.br-method-icon { font-size:12px;color:#d4a84b;flex-shrink:0;margin-top:2px; }
.br-method-col small { display:block;font-size:8px;color:rgba(245,240,232,.35);text-transform:uppercase;letter-spacing:.1em; }
.br-method-col p     { margin:2px 0 0;font-size:9px;color:rgba(245,240,232,.5);line-height:1.45; }

/* ── Right ── */
.br-right {
  grid-column:3;
  padding:20px 16px;
  border-left:1px solid rgba(255,255,255,.08);
  background:rgba(3,7,17,.55);
  overflow-y:auto;
  display:flex;flex-direction:column;gap:22px;
}
.br-right-section { display:flex;flex-direction:column;gap:12px; }
.br-right-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.32);
  display:flex;align-items:center;gap:6px;
}
.br-info-icon {
  color:rgba(245,240,232,.28);cursor:help;font-size:10px;
}
.br-link {
  font-size:10px;color:#d4a84b;background:none;border:none;
  padding:0;cursor:pointer;text-align:left;font:inherit;
  transition:opacity .12s;
}
.br-link:hover { opacity:.7; }
.br-link-btn:disabled { opacity:.4;cursor:default; }

/* Confidence */
.br-confidence  { display:flex;gap:14px;align-items:flex-start; }
.br-donut-wrap  { position:relative;width:80px;height:80px;flex-shrink:0; }
.br-donut       { width:100%;height:100%; }
.br-donut circle { transition:stroke-dasharray .7s ease; }
.br-donut-centre {
  position:absolute;inset:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.br-donut-centre strong { font-size:17px;font-weight:700;color:#d4a84b;line-height:1; }
.br-donut-centre small  { font-size:7px;color:rgba(245,240,232,.4);text-align:center;line-height:1.3; }
.br-conf-bars  { flex:1;display:flex;flex-direction:column;gap:7px; }
.br-conf-row   { display:flex;align-items:center;gap:6px; }
.br-conf-lbl   { font-size:9px;color:rgba(245,240,232,.5);width:96px;flex-shrink:0;line-height:1.2; }
.br-conf-track { flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden; }
.br-conf-fill  { height:100%;background:#d4a84b;border-radius:2px;transition:width .6s ease; }
.br-conf-pct   { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:9px;color:rgba(245,240,232,.45);width:26px;text-align:right; }

/* Watch regions */
.br-watch-list { display:flex;flex-direction:column;gap:7px; }
.br-watch-row  { display:flex;align-items:center;gap:8px; }
.br-watch-star {
  font-size:11px;color:#d4a84b;flex-shrink:0;width:14px;text-align:center;
}
.br-watch-info { flex:1;min-width:0; }
.br-watch-info strong { display:block;font-size:11px;font-weight:500;color:#f5f0e8;line-height:1; }
.br-watch-info small  { display:block;font-size:9px;color:rgba(245,240,232,.4);margin-top:1px; }
.br-watch-btn {
  font-size:9px;padding:3px 9px;border-radius:5px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.55);cursor:pointer;font:inherit;flex-shrink:0;
  transition:background .1s,color .1s;
}
.br-watch-btn:hover { background:rgba(255,255,255,.09);color:#f5f0e8; }

/* Change notes */
.br-changes      { display:flex;flex-direction:column;gap:10px; }
.br-change       { display:flex;gap:8px;align-items:flex-start; }
.br-change-dir   { font-size:13px;flex-shrink:0;margin-top:2px; }
.br-change-dir--up      { color:#4caf82; }
.br-change-dir--neutral { color:#e6a533; }
.br-change-body strong { display:block;font-size:11px;font-weight:500;color:#f5f0e8; }
.br-change-body small  { display:block;font-size:10px;color:rgba(245,240,232,.5);margin-top:1px;line-height:1.4; }
.br-change-body time   { display:block;font-size:9px;color:rgba(245,240,232,.3);margin-top:2px; }

/* Mobile */
@media(max-width:1024px) {
  .br-root {
    grid-template-columns:1fr;
    grid-template-rows:auto auto auto;
    height:auto;overflow-y:auto;
  }
  .br-left,.br-right { border:none;border-bottom:1px solid rgba(255,255,255,.08); }
  .br-globe-wrap { height:340px; }
  .br-method-cols { flex-wrap:wrap; }
  .br-method-col { min-width:50%;border-bottom:1px solid rgba(255,255,255,.06); }
}
`
