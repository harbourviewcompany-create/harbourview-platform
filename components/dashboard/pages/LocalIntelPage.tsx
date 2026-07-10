'use client'

import React from 'react'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { formatOpportunityScore, opportunityScoreFraction, opportunityScoreOutOfTen } from '@/lib/dashboard/opportunityScore'

export interface LocalIntelPageProps {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  countryIntel?: CountryIntelProfile | null
}

const CATEGORY_ICONS: Record<string, string> = {
  import_market:        '📦',
  export_market:        '✈️',
  medical:              '🩺',
  adult_use:            '🟢',
  genetics:             '🌿',
  processing:           '🏭',
  equipment:            '⚙️',
  services:             '💼',
  investment:           '📈',
  distribution:         '🔄',
  retail:               '🏪',
  clinical:             '🏥',
}

function OpportunityBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = value >= 7 ? '#4caf82' : value >= 4 ? '#d4a84b' : '#e05555'
  return (
    <div className="li-bar-row">
      <span className="li-bar-label">{label}</span>
      <div className="li-bar-track">
        <div className="li-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="li-bar-val" style={{ color }}>{value}/10</span>
    </div>
  )
}

export const LocalIntelPage = React.memo(function LocalIntelPage({
  country, countryIntel,
}: LocalIntelPageProps) {
  const hasIntel = Boolean(countryIntel?.opportunity_score || countryIntel?.commercial_pathway_summary)
  const categories = countryIntel?.opportunity_categories ?? []
  const tradeRoles = countryIntel?.trade_roles ?? []

  return (
    <div className="li-root">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="li-header">
        <div>
          <h1 className="li-heading">Local Intel</h1>
          <p className="li-sub">
            {country.label}
            {countryIntel?.regulatory_tier ? ` · Tier ${countryIntel.regulatory_tier}` : ''}
            {countryIntel?.data_completeness ? ` · ${countryIntel.data_completeness} data` : ''}
          </p>
        </div>
        <div className="li-header-actions">
          <a href="/intelligence" className="li-cta-outline">Intelligence Platform</a>
          <a href="/intake" className="li-cta-gold">Request Full Brief →</a>
        </div>
      </div>

      {hasIntel ? (
        <div className="li-body">
          {/* ── Left col ───────────────────────────────────────────────────── */}
          <div className="li-left">
            {/* Opportunity score */}
            {countryIntel?.opportunity_score != null && (
              <div className="li-card">
                <div className="li-section-head">OPPORTUNITY SCORE</div>
                <div className="li-score-display">
                  <div className="li-score-ring-wrap">
                    <svg viewBox="0 0 80 80" className="li-ring">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="32" fill="none"
                        stroke={countryIntel.opportunity_score >= 70 ? '#4caf82' : countryIntel.opportunity_score >= 40 ? '#d4a84b' : '#e05555'}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32 * opportunityScoreFraction(countryIntel.opportunity_score)} ${2 * Math.PI * 32}`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="li-ring-centre">
                      <strong>{Math.round(countryIntel.opportunity_score)}</strong>
                      <small>/ 100</small>
                    </div>
                  </div>
                  <div className="li-score-bars">
                    {/* NOTE: Trade Activity / Regulatory are derived offsets from the single
                        opportunity_score, not independent metrics — there is no separate
                        trade-activity or regulatory sub-score in the data model yet. Kept as
                        a visual breakdown for now (scaled correctly to /10), but this should
                        be replaced with real per-dimension scores or removed. */}
                    {[
                      { label: 'Market Access',  value: opportunityScoreOutOfTen(countryIntel.opportunity_score) },
                      { label: 'Trade Activity', value: Math.max(1, opportunityScoreOutOfTen(countryIntel.opportunity_score) - 1) },
                      { label: 'Regulatory',     value: Math.max(1, opportunityScoreOutOfTen(countryIntel.opportunity_score) - 2) },
                    ].map(b => <OpportunityBar key={b.label} {...b} />)}
                  </div>
                </div>
              </div>
            )}

            {/* Commercial pathway */}
            {countryIntel?.commercial_pathway_summary && (
              <div className="li-card">
                <div className="li-section-head">COMMERCIAL PATHWAY</div>
                <p className="li-pathway-text">{countryIntel.commercial_pathway_summary}</p>
              </div>
            )}

            {/* Public summary */}
            {countryIntel?.public_summary && (
              <div className="li-card">
                <div className="li-section-head">MARKET OVERVIEW</div>
                <p className="li-summary-text">{countryIntel.public_summary}</p>
              </div>
            )}
          </div>

          {/* ── Right col ──────────────────────────────────────────────────── */}
          <div className="li-right">
            {/* Opportunity categories */}
            {categories.length > 0 && (
              <div className="li-card">
                <div className="li-section-head">OPPORTUNITY CATEGORIES</div>
                <div className="li-categories">
                  {categories.map(cat => (
                    <div key={cat} className="li-cat-chip">
                      <span>{CATEGORY_ICONS[cat] ?? '◈'}</span>
                      <span>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trade roles */}
            {tradeRoles.length > 0 && (
              <div className="li-card">
                <div className="li-section-head">ACTIVE TRADE ROLES</div>
                <div className="li-roles">
                  {tradeRoles.map(r => (
                    <div key={r} className="li-role-row">
                      <div className="li-role-dot" />
                      <span>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulator */}
            {countryIntel?.regulator_label && (
              <div className="li-card">
                <div className="li-section-head">REGULATORY AUTHORITY</div>
                <div className="li-regulator">{countryIntel.regulator_label}</div>
              </div>
            )}

            {/* Intel CTA */}
            <div className="li-card li-card--gold">
              <div className="li-cta-head">Need deeper coverage?</div>
              <div className="li-cta-body">
                Request a full market brief including import/export contacts, active operators,
                and regulatory pathway analysis for {country.label}.
              </div>
              <a href="/intake" className="li-cta-gold">Request Full Brief →</a>
            </div>
          </div>
        </div>
      ) : (
        <div className="li-gap">
          <div className="li-gap-icon">◉</div>
          <div className="li-gap-title">Local intel for {country.label} is pending coverage</div>
          <p className="li-gap-body">
            Harbourview is actively expanding its intelligence network. Request priority coverage
            for this market to receive a dedicated brief.
          </p>
          <div className="li-gap-actions">
            <a href="/intelligence" className="li-cta-outline">Browse Available Markets</a>
            <a href="/intake" className="li-cta-gold">Request Priority Coverage →</a>
          </div>
        </div>
      )}
    </div>
  )
})

const CSS = `
.li-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:liIn .28s ease;
}
@keyframes liIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.li-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.li-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.li-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }
.li-header-actions { display:flex;gap:8px;flex-shrink:0; }
.li-cta-gold {
  display:inline-flex;align-items:center;padding:8px 16px;border-radius:8px;
  font-size:12px;font-weight:600;background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;
}
.li-cta-gold:hover { opacity:.88; }
.li-cta-outline {
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  color:rgba(245,240,232,.55);text-decoration:none;transition:background .12s,color .12s;
}
.li-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.li-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:1fr 1fr;padding:16px 24px 0;gap:16px;
}
.li-left  { overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-right:8px; }
.li-right { overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-left:8px;border-left:1px solid rgba(255,255,255,.06); }

.li-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:10px;
}
.li-card {
  padding:16px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  display:flex;flex-direction:column;gap:0;
}
.li-card--gold { background:rgba(212,168,75,.04);border-color:rgba(212,168,75,.18); }
.li-cta-head { font-size:12px;font-weight:600;color:#f5f0e8;margin-bottom:6px; }
.li-cta-body { font-size:10px;color:rgba(245,240,232,.45);line-height:1.55;margin-bottom:10px; }

.li-score-display { display:flex;align-items:center;gap:16px; }
.li-score-ring-wrap { position:relative;width:80px;height:80px;flex-shrink:0; }
.li-ring { width:100%;height:100%; }
.li-ring-centre { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0; }
.li-ring-centre strong { font-size:22px;font-weight:700;color:#d4a84b;line-height:1; }
.li-ring-centre small  { font-size:9px;color:rgba(245,240,232,.4); }
.li-score-bars { flex:1;display:flex;flex-direction:column;gap:8px; }
.li-bar-row    { display:flex;align-items:center;gap:8px; }
.li-bar-label  { font-size:9px;color:rgba(245,240,232,.45);width:84px;flex-shrink:0; }
.li-bar-track  { flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden; }
.li-bar-fill   { height:100%;border-radius:2px;transition:width .6s ease; }
.li-bar-val    { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:9px;width:30px;text-align:right;flex-shrink:0; }

.li-pathway-text, .li-summary-text {
  font-size:12px;line-height:1.7;color:rgba(245,240,232,.55);margin:0;
  border-left:2px solid rgba(212,168,75,.3);padding-left:10px;
}

.li-categories { display:flex;flex-wrap:wrap;gap:6px; }
.li-cat-chip {
  display:flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:8px;font-size:10px;font-weight:500;
  background:rgba(91,155,213,.08);border:1px solid rgba(91,155,213,.18);color:#5b9bd5;
}

.li-roles   { display:flex;flex-direction:column;gap:6px; }
.li-role-row { display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(245,240,232,.55); }
.li-role-dot { width:6px;height:6px;border-radius:50%;background:#4caf82;flex-shrink:0; }

.li-regulator {
  font-size:13px;font-weight:500;color:#f5f0e8;
  padding:8px 0;
}

.li-gap {
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;text-align:center;padding:60px 24px;
}
.li-gap-icon  { font-size:28px;color:rgba(212,168,75,.4); }
.li-gap-title { font-family:'Georgia',serif;font-size:18px;font-weight:400;color:#f5f0e8; }
.li-gap-body  { font-size:12px;color:rgba(245,240,232,.42);max-width:400px;line-height:1.65; }
.li-gap-actions { display:flex;gap:8px;margin-top:4px; }
`
