'use client'
import Link from 'next/link'

import React from 'react'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { formatOpportunityScore, opportunityScoreOutOfTen } from '@/lib/dashboard/opportunityScore'

export interface RegulatoryPageProps {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  countryIntel?: CountryIntelProfile | null
  signals:      DashboardSignal[]
}

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="rp-badge rp-badge--unknown">Unknown</span>
  const v = value.toLowerCase()
  let cls = 'rp-badge--neutral'
  if (v.includes('active') || v.includes('open') || v.includes('legal') || v === 'regulated') cls = 'rp-badge--active'
  else if (v.includes('restrict') || v.includes('prohibit') || v.includes('illegal')) cls = 'rp-badge--restricted'
  else if (v.includes('emerging') || v.includes('pending') || v.includes('review')) cls = 'rp-badge--emerging'
  return <span className={`rp-badge ${cls}`}>{value}</span>
}

function OpportunityMeter({ score }: { score?: number | null }) {
  const val = opportunityScoreOutOfTen(score)
  const segments = [1,2,3,4,5,6,7,8,9,10]
  return (
    <div className="rp-meter">
      {segments.map(n => (
        <div
          key={n}
          className="rp-meter-seg"
          style={{
            background: n <= val
              ? val >= 7 ? '#4caf82' : val >= 4 ? '#d4a84b' : '#e05555'
              : 'rgba(255,255,255,.06)',
          }}
        />
      ))}
      <span className="rp-meter-val">{formatOpportunityScore(score)}</span>
    </div>
  )
}

export const RegulatoryPage = React.memo(function RegulatoryPage({
  country, countryIntel, signals,
}: RegulatoryPageProps) {
  const regulatorySignals = signals
    .filter(s => {
      const t = s.type.toLowerCase()
      return t.includes('reg') || t.includes('policy') || t.includes('law') || t.includes('compliance')
    })
    .slice(0, 5)

  const hasData = Boolean(countryIntel?.market_access_status || countryIntel?.medical_status)

  return (
    <div className="rp-root">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rp-header">
        <div>
          <h1 className="rp-heading">Regulatory Watch</h1>
          <p className="rp-sub">
            {country.label}
            {countryIntel?.region ? ` · ${countryIntel.region}` : ''}
            {countryIntel?.regulator_label ? ` · ${countryIntel.regulator_label}` : ''}
          </p>
        </div>
        <div className="rp-header-actions">
          <a href="/compliance" className="rp-cta-outline">Compliance Framework</a>
          <a href="/intake" className="rp-cta-gold">Request Review →</a>
        </div>
      </div>

      <div className="rp-body">
        {/* ── Left: Status fields ─────────────────────────────────────────── */}
        <div className="rp-left">
          <div className="rp-section-head">MARKET STATUS</div>

          {hasData ? (
            <div className="rp-status-grid">
              {[
                { label: 'Market Access',   val: countryIntel?.market_access_status },
                { label: 'Medical Program', val: countryIntel?.medical_status },
                { label: 'Adult Use',       val: countryIntel?.adult_use_status },
                { label: 'Import Status',   val: countryIntel?.import_status },
                { label: 'Export Status',   val: countryIntel?.export_status },
              ].map(row => (
                <div key={row.label} className="rp-status-row">
                  <span className="rp-status-label">{row.label}</span>
                  <StatusBadge value={row.val} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-no-data">
              <div className="rp-no-data-icon">◷</div>
              <div>Full regulatory data for {country.label} is pending Harbourview coverage.</div>
              <a href="/intake" className="rp-link">Request coverage →</a>
            </div>
          )}

          {countryIntel?.opportunity_score != null && (
            <div className="rp-opp-section">
              <div className="rp-section-head">OPPORTUNITY SCORE</div>
              <OpportunityMeter score={countryIntel.opportunity_score} />
            </div>
          )}

          {countryIntel?.data_completeness && (
            <div className="rp-completeness">
              <span className="rp-comp-label">Data completeness</span>
              <span className={`rp-comp-badge rp-comp-${countryIntel.data_completeness}`}>
                {countryIntel.data_completeness}
              </span>
            </div>
          )}

          {(countryIntel?.trade_roles ?? []).length > 0 && (
            <div className="rp-roles-section">
              <div className="rp-section-head">ACTIVE TRADE ROLES</div>
              <div className="rp-roles">
                {(countryIntel!.trade_roles!).map(r => (
                  <span key={r} className="rp-role-chip">{r}</span>
                ))}
              </div>
            </div>
          )}

          {countryIntel?.public_summary && (
            <p className="rp-summary">{countryIntel.public_summary}</p>
          )}

          <div className="rp-actions">
            <a href="/compliance" className="rp-cta-outline">Country Compliance Guide</a>
            <Link href="/intelligence" className="rp-cta-outline">Full Intelligence Profile</Link>
          </div>
        </div>

        {/* ── Right: Regulatory signals ───────────────────────────────────── */}
        <div className="rp-right">
          <div className="rp-section-head">
            REGULATORY SIGNALS
            <Link href="/signals" className="rp-link rp-link--right">View All →</Link>
          </div>

          {regulatorySignals.length > 0 ? (
            <div className="rp-signals">
              {regulatorySignals.map((s, i) => (
                <div key={s.id} className="rp-signal" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="rp-signal-head">
                    <span className="rp-signal-market">{s.market}</span>
                    <span className="rp-signal-time">{s.timeAgo}</span>
                  </div>
                  <div className="rp-signal-title">{s.title}</div>
                  <div className="rp-signal-conf">
                    <div className="rp-conf-bar">
                      <div className="rp-conf-fill" style={{ width: `${s.confidence}%` }} />
                    </div>
                    <span className="rp-conf-val">{s.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-no-signals">
              <div>No regulatory signals for this market yet.</div>
              <Link href="/signals" className="rp-link">Browse signal archive →</Link>
            </div>
          )}

          <div className="rp-compliance-cta">
            <div className="rp-cta-card">
              <div className="rp-cta-head">Need regulatory guidance?</div>
              <div className="rp-cta-body">
                Harbourview&apos;s compliance team reviews import/export pathways, licence requirements,
                and GMP standards for regulated cannabis markets.
              </div>
              <a href="/intake" className="rp-cta-gold">Request Compliance Review →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

const CSS = `
.rp-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:rpIn .28s ease;
}
@keyframes rpIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.rp-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.rp-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.rp-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }
.rp-header-actions { display:flex;gap:8px;flex-shrink:0; }

.rp-cta-gold {
  display:inline-flex;align-items:center;
  padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;
  background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;
}
.rp-cta-gold:hover { opacity:.88; }
.rp-cta-outline {
  display:inline-flex;align-items:center;
  padding:8px 14px;border-radius:8px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  color:rgba(245,240,232,.55);text-decoration:none;
  transition:background .12s,color .12s;
}
.rp-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.rp-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:340px 1fr;
  gap:0;padding:16px 24px 0;
}

.rp-left {
  display:flex;flex-direction:column;gap:16px;
  padding-right:20px;overflow-y:auto;
  border-right:1px solid rgba(255,255,255,.06);
}
.rp-right { padding-left:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px; }

.rp-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);display:flex;align-items:center;gap:8px;
}

.rp-status-grid { display:flex;flex-direction:column;gap:6px; }
.rp-status-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 12px;border-radius:8px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);
}
.rp-status-label { font-size:11px;color:rgba(245,240,232,.55); }
.rp-badge {
  font-size:10px;font-weight:600;padding:3px 9px;border-radius:6px;
}
.rp-badge--active    { background:rgba(76,175,130,.15);color:#4caf82;border:1px solid rgba(76,175,130,.25); }
.rp-badge--restricted{ background:rgba(224,85,85,.12);color:#e05555;border:1px solid rgba(224,85,85,.2); }
.rp-badge--emerging  { background:rgba(212,168,75,.12);color:#d4a84b;border:1px solid rgba(212,168,75,.2); }
.rp-badge--neutral   { background:rgba(255,255,255,.06);color:rgba(245,240,232,.55);border:1px solid rgba(255,255,255,.1); }
.rp-badge--unknown   { background:rgba(255,255,255,.04);color:rgba(245,240,232,.3);border:1px solid rgba(255,255,255,.07); }

.rp-no-data {
  padding:24px;border-radius:10px;
  border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);
  display:flex;flex-direction:column;gap:8px;text-align:center;
  font-size:12px;color:rgba(245,240,232,.4);
}
.rp-no-data-icon { font-size:24px;opacity:.3; }
.rp-link {
  font-size:10px;color:#d4a84b;text-decoration:none;
  transition:opacity .12s;
}
.rp-link:hover { opacity:.7; }
.rp-link--right { margin-left:auto; }

.rp-opp-section { display:flex;flex-direction:column;gap:8px; }
.rp-meter { display:flex;align-items:center;gap:3px; }
.rp-meter-seg { height:6px;flex:1;border-radius:2px;transition:background .3s; }
.rp-meter-val { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:10px;color:rgba(245,240,232,.45);margin-left:8px;flex-shrink:0; }

.rp-completeness {
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 12px;border-radius:8px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);
}
.rp-comp-label { font-size:11px;color:rgba(245,240,232,.45); }
.rp-comp-badge { font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px; }
.rp-comp-full    { background:rgba(76,175,130,.12);color:#4caf82; }
.rp-comp-partial { background:rgba(212,168,75,.1);color:#d4a84b; }
.rp-comp-stub    { background:rgba(255,255,255,.05);color:rgba(245,240,232,.4); }

.rp-roles-section { display:flex;flex-direction:column;gap:8px; }
.rp-roles { display:flex;flex-wrap:wrap;gap:4px; }
.rp-role-chip {
  font-size:9px;padding:3px 8px;border-radius:5px;
  background:rgba(91,155,213,.1);border:1px solid rgba(91,155,213,.2);color:#5b9bd5;
}

.rp-summary {
  font-size:11px;line-height:1.65;color:rgba(245,240,232,.45);
  border-left:2px solid rgba(212,168,75,.3);padding-left:10px;margin:0;
}
.rp-actions { display:flex;gap:6px;flex-wrap:wrap; }

.rp-signals { display:flex;flex-direction:column;gap:8px; }
.rp-signal {
  padding:12px;border-radius:8px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  animation:sigIn .3s ease both;
}
@keyframes sigIn { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
.rp-signal-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:5px; }
.rp-signal-market { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:9px;color:#5b9bd5;letter-spacing:.1em; }
.rp-signal-time  { font-size:9px;color:rgba(245,240,232,.3); }
.rp-signal-title { font-size:12px;font-weight:500;color:#f5f0e8;line-height:1.4;margin-bottom:6px; }
.rp-signal-conf  { display:flex;align-items:center;gap:8px; }
.rp-conf-bar  { flex:1;height:2px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden; }
.rp-conf-fill { height:100%;background:#d4a84b;border-radius:2px; }
.rp-conf-val  { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:9px;color:rgba(245,240,232,.4); }

.rp-no-signals {
  padding:24px;text-align:center;font-size:11px;color:rgba(245,240,232,.35);
  display:flex;flex-direction:column;gap:8px;
}

.rp-compliance-cta { margin-top:auto;padding-top:12px; }
.rp-cta-card {
  padding:16px;border-radius:10px;
  background:rgba(212,168,75,.05);border:1px solid rgba(212,168,75,.15);
  display:flex;flex-direction:column;gap:8px;
}
.rp-cta-head { font-size:12px;font-weight:600;color:#f5f0e8; }
.rp-cta-body { font-size:11px;color:rgba(245,240,232,.5);line-height:1.55; }
`
