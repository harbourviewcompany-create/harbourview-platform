'use client'
import Link from 'next/link'

import React, { useState } from 'react'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

export interface SignalsPageProps {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  signals: DashboardSignal[]
}

type Lane = 'all' | 'regulatory' | 'economic' | 'trade'

const LANE_COLORS: Record<string, string> = {
  regulatory: '#5b9bd5',
  economic:   '#d4a84b',
  trade:      '#4caf82',
}

function confidenceClass(n: number) {
  if (n >= 80) return 'sig-conf--high'
  if (n >= 60) return 'sig-conf--mid'
  return 'sig-conf--low'
}

function laneFromType(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('reg') || t.includes('policy') || t.includes('law') || t.includes('compliance')) return 'regulatory'
  if (t.includes('econ') || t.includes('market') || t.includes('price') || t.includes('demand')) return 'economic'
  if (t.includes('trade') || t.includes('import') || t.includes('export') || t.includes('supply')) return 'trade'
  return 'regulatory'
}

export const SignalsPage = React.memo(function SignalsPage({
  country, signals,
}: SignalsPageProps) {
  const [lane, setLane] = useState<Lane>('all')

  const filtered = lane === 'all'
    ? signals
    : signals.filter(s => laneFromType(s.type) === lane)

  const counts = {
    regulatory: signals.filter(s => laneFromType(s.type) === 'regulatory').length,
    economic:   signals.filter(s => laneFromType(s.type) === 'economic').length,
    trade:      signals.filter(s => laneFromType(s.type) === 'trade').length,
  }

  return (
    <div className="sp-root">
      <style>{CSS}</style>

      <div className="sp-header">
        <div>
          <h1 className="sp-heading">Intelligence Signals</h1>
          <p className="sp-sub">{country.label} · {signals.length} signals this period</p>
        </div>
        <Link href="/signals" className="sp-link-btn">Full Signal Report →</Link>
      </div>

      {/* Lane filter */}
      <div className="sp-lanes">
        <button className={`sp-lane${lane === 'all' ? ' active' : ''}`} onClick={() => setLane('all')}>
          All <span className="sp-lane-count">{signals.length}</span>
        </button>
        {(['regulatory','economic','trade'] as const).map(l => (
          <button
            key={l}
            className={`sp-lane${lane === l ? ' active' : ''}`}
            style={lane === l ? { borderColor: LANE_COLORS[l], color: LANE_COLORS[l] } : {}}
            onClick={() => setLane(l)}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}
            <span className="sp-lane-count">{counts[l]}</span>
          </button>
        ))}
      </div>

      {/* Signal list */}
      <div className="sp-list">
        {filtered.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-icon">≋</div>
            <div>No signals in this lane for {country.label}</div>
            <Link href="/signals" className="sp-link-btn" style={{marginTop:8}}>Browse All Signals →</Link>
          </div>
        ) : filtered.map((sig, i) => {
          const sigLane = laneFromType(sig.type)
          const laneColor = LANE_COLORS[sigLane] ?? '#d4a84b'
          return (
            <div key={sig.id} className="sp-signal" style={{ animationDelay: `${i * 35}ms` }}>
              <div className="sp-signal-left">
                <div
                  className="sp-lane-dot"
                  style={{ background: laneColor, boxShadow: `0 0 6px ${laneColor}80` }}
                  title={sigLane}
                />
                <div className={`sp-conf ${confidenceClass(sig.confidence)}`}>
                  {sig.confidence}%
                </div>
              </div>
              <div className="sp-signal-body">
                <div className="sp-signal-market">
                  <span className="sp-market-chip" style={{ borderColor: `${laneColor}40`, color: laneColor }}>
                    {sigLane.toUpperCase()}
                  </span>
                  <span className="sp-market-label">{sig.market}</span>
                  <span className="sp-time">{sig.timeAgo}</span>
                </div>
                <div className="sp-signal-title">{sig.title}</div>
                <div className="sp-signal-impact">{sig.commercialImpact}</div>
              </div>
              <div
                className="sp-tag-chip"
                style={{ background: `${sig.tag.bg}`, borderColor: sig.tag.border, color: sig.tag.color }}
              >
                {sig.tag.label}
              </div>
            </div>
          )
        })}
      </div>

      {signals.length > 0 && (
        <div className="sp-footer">
          <span className="sp-footer-note">Signals are reviewed and classified by the Harbourview intelligence team.</span>
          <Link href="/intelligence" className="sp-link-btn">Intelligence Platform →</Link>
        </div>
      )}
    </div>
  )
})

const CSS = `
.sp-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:spIn .28s ease;
}
@keyframes spIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.sp-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.sp-heading {
  font-family:'Georgia',serif;font-size:22px;font-weight:400;
  color:#f5f0e8;letter-spacing:-.01em;
}
.sp-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }

.sp-link-btn {
  font-size:11px;color:#d4a84b;background:none;border:none;
  padding:0;cursor:pointer;font:inherit;text-decoration:none;
  display:inline-flex;align-items:center;flex-shrink:0;
  transition:opacity .12s;
}
.sp-link-btn:hover { opacity:.7; }

.sp-lanes {
  display:flex;gap:4px;padding:12px 24px;flex-shrink:0;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.sp-lane {
  display:flex;align-items:center;gap:5px;
  padding:5px 12px;border-radius:8px;
  border:1px solid rgba(255,255,255,.1);background:transparent;
  color:rgba(245,240,232,.45);font:inherit;font-size:11px;cursor:pointer;
  transition:all .12s;
}
.sp-lane:hover { color:#f5f0e8;background:rgba(255,255,255,.05); }
.sp-lane.active { border-color:rgba(212,168,75,.4);color:#d4a84b;background:rgba(212,168,75,.06); }
.sp-lane-count {
  background:rgba(255,255,255,.08);
  font-size:9px;padding:1px 5px;border-radius:10px;
}

.sp-list { flex:1;overflow-y:auto;padding:12px 24px 24px;display:flex;flex-direction:column;gap:8px; }

.sp-empty {
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;padding:60px 24px;color:rgba(245,240,232,.35);font-size:12px;text-align:center;
}
.sp-empty-icon { font-size:28px;opacity:.4; }

.sp-signal {
  display:flex;align-items:flex-start;gap:12px;
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  animation:sigIn .3s ease both;
  transition:border-color .12s,background .12s;
}
.sp-signal:hover { border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.04); }
@keyframes sigIn { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }

.sp-signal-left { display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;padding-top:2px; }
.sp-lane-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
.sp-conf {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;font-weight:600;
}
.sp-conf--high { color:#4caf82; }
.sp-conf--mid  { color:#d4a84b; }
.sp-conf--low  { color:#e05555; }

.sp-signal-body { flex:1;display:flex;flex-direction:column;gap:5px;min-width:0; }
.sp-signal-market { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
.sp-market-chip {
  font-family:'JetBrains Mono','Fira Mono',monospace;font-size:8px;
  letter-spacing:.14em;padding:2px 7px;border-radius:4px;
  border:1px solid;background:transparent;font-weight:600;
}
.sp-market-label { font-size:11px;color:rgba(245,240,232,.55); }
.sp-time { margin-left:auto;font-size:9px;color:rgba(245,240,232,.3);white-space:nowrap; }
.sp-signal-title { font-size:13px;font-weight:500;color:#f5f0e8;line-height:1.4; }
.sp-signal-impact { font-size:11px;color:rgba(245,240,232,.45);line-height:1.45; }

.sp-tag-chip {
  font-size:9px;padding:3px 8px;border-radius:5px;
  border:1px solid;flex-shrink:0;margin-top:2px;font-weight:500;white-space:nowrap;
}

.sp-footer {
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 24px;border-top:1px solid rgba(255,255,255,.06);
  flex-shrink:0;gap:16px;
}
.sp-footer-note { font-size:10px;color:rgba(245,240,232,.3); }
`
