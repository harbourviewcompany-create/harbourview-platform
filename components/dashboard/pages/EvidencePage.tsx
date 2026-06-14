'use client'

import React from 'react'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'

export interface EvidencePageProps {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  countryIntel?: CountryIntelProfile | null
}

const SOURCE_TIERS = [
  {
    tier: 'Tier 1',
    label: 'Government & Regulatory',
    color: '#4caf82',
    desc: 'Official government publications, regulatory body filings, gazette notices, legislative records.',
    examples: ['Ministry of Health directives', 'Regulatory authority guidance', 'Official government gazette', 'Parliamentary records'],
  },
  {
    tier: 'Tier 2',
    label: 'Verified Industry',
    color: '#5b9bd5',
    desc: 'Trade associations, licensed operator filings, accredited laboratory results, professional bodies.',
    examples: ['Licensed operator disclosures', 'Accredited COA results', 'Trade association reports', 'Industry body publications'],
  },
  {
    tier: 'Tier 3',
    label: 'Market Intelligence',
    color: '#d4a84b',
    desc: 'Harbourview-verified market participant data, cross-referenced commercial intelligence, analyst synthesis.',
    examples: ['Harbourview analyst reports', 'Cross-referenced market data', 'Verified operator interviews', 'Commercial deal records'],
  },
]

const METHODOLOGY_STEPS = [
  { icon: '◎', label: 'Source Collection',    desc: 'Continuous monitoring of government, regulatory, and industry sources across 50+ active markets.' },
  { icon: '✓', label: 'Expert Verification',  desc: 'Multi-layer review by domain experts with regulatory and operational backgrounds in cannabis.' },
  { icon: '◈', label: 'Cross-referencing',    desc: 'Every data point verified against minimum 2 independent sources before classification.' },
  { icon: '↻', label: 'Continuous Updates',   desc: 'Regulatory signals updated in real-time. Market data updated daily. Intelligence synthesised continuously.' },
  { icon: '⊞', label: 'Confidence Scoring',   desc: 'Weighted scoring across source authority, jurisdiction relevance, recency, and internal consistency.' },
]

export const EvidencePage = React.memo(function EvidencePage({
  country, countryIntel,
}: EvidencePageProps) {
  return (
    <div className="ev-root">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="ev-header">
        <div>
          <h1 className="ev-heading">Evidence & Sources</h1>
          <p className="ev-sub">
            {country.label}
            {countryIntel?.review_status ? ` · Review: ${countryIntel.review_status}` : ''}
            {countryIntel?.data_completeness ? ` · ${({ stub: 'Basic', partial: 'Partial', high: 'High', full: 'Full' } as Record<string,string>)[countryIntel.data_completeness] ?? countryIntel.data_completeness} coverage` : ''}
          </p>
        </div>
        <a href="/intelligence/methodology" className="ev-cta-outline">Full Methodology →</a>
      </div>

      <div className="ev-body">
        {/* ── Left: Source tier architecture ─────────────────────────────── */}
        <div className="ev-left">
          <div className="ev-section-head">SOURCE TIER ARCHITECTURE</div>
          <div className="ev-tiers">
            {SOURCE_TIERS.map((t, i) => (
              <div key={t.tier} className="ev-tier" style={{ animationDelay: `${i * 60}ms`, borderColor: `${t.color}22` }}>
                <div className="ev-tier-head">
                  <span className="ev-tier-badge" style={{ background: `${t.color}18`, color: t.color, borderColor: `${t.color}30` }}>
                    {t.tier}
                  </span>
                  <span className="ev-tier-label">{t.label}</span>
                </div>
                <p className="ev-tier-desc">{t.desc}</p>
                <div className="ev-tier-examples">
                  {t.examples.map(e => (
                    <span key={e} className="ev-example">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Methodology + data state ────────────────────────────── */}
        <div className="ev-right">
          <div className="ev-section-head">VERIFICATION METHODOLOGY</div>
          <div className="ev-methodology">
            {METHODOLOGY_STEPS.map((s, i) => (
              <div key={s.label} className="ev-method-step" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="ev-method-icon">{s.icon}</div>
                <div className="ev-method-body">
                  <div className="ev-method-label">{s.label}</div>
                  <div className="ev-method-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Country coverage state */}
          <div className="ev-coverage">
            <div className="ev-section-head">COVERAGE STATE — {country.label.toUpperCase()}</div>
            <div className="ev-coverage-grid">
              {[
                { label: 'Review Status',    val: countryIntel?.review_status      ?? 'Pending'  },
                { label: 'Data Completeness',val: ({ stub: 'Basic', partial: 'Partial', high: 'High', full: 'Full' } as Record<string,string>)[countryIntel?.data_completeness ?? ''] ?? countryIntel?.data_completeness ?? 'Not assessed' },
                { label: 'Regulatory Tier',  val: countryIntel?.regulatory_tier    ?? 'Unclassed'},
                { label: 'Source Region',    val: countryIntel?.region             ?? 'Unknown'  },
              ].map(row => (
                <div key={row.label} className="ev-cov-row">
                  <span className="ev-cov-label">{row.label}</span>
                  <span className="ev-cov-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ev-cta-card">
            <div className="ev-cta-head">Request a source audit</div>
            <div className="ev-cta-body">
              Harbourview provides source attribution on request for due diligence, compliance
              reporting, and institutional review.
            </div>
            <a href="/intake" className="ev-cta-gold">Request Source Documentation →</a>
          </div>
        </div>
      </div>
    </div>
  )
})

const CSS = `
.ev-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:evIn .28s ease;
}
@keyframes evIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.ev-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.ev-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.ev-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }
.ev-cta-outline {
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  color:rgba(245,240,232,.55);text-decoration:none;flex-shrink:0;
  transition:background .12s,color .12s;
}
.ev-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.ev-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:1fr 1fr;padding:20px 24px 0;gap:0;
}
.ev-left  { overflow-y:auto;padding-right:20px;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:12px; }
.ev-right { overflow-y:auto;padding-left:20px;display:flex;flex-direction:column;gap:16px; }

.ev-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:12px;
}

.ev-tiers { display:flex;flex-direction:column;gap:10px; }
.ev-tier {
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.02);border:1px solid;
  animation:tierIn .3s ease both;
}
@keyframes tierIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
.ev-tier-head { display:flex;align-items:center;gap:8px;margin-bottom:7px; }
.ev-tier-badge {
  font-family:'JetBrains Mono','Fira Mono',monospace;font-size:8px;
  letter-spacing:.12em;padding:2px 8px;border-radius:4px;border:1px solid;font-weight:700;
}
.ev-tier-label { font-size:12px;font-weight:600;color:#f5f0e8; }
.ev-tier-desc  { font-size:11px;color:rgba(245,240,232,.45);line-height:1.55;margin:0 0 8px; }
.ev-tier-examples { display:flex;flex-wrap:wrap;gap:4px; }
.ev-example {
  font-size:9px;padding:2px 7px;border-radius:4px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);
  color:rgba(245,240,232,.38);
}

.ev-methodology { display:flex;flex-direction:column;gap:10px; }
.ev-method-step {
  display:flex;align-items:flex-start;gap:10px;
  animation:methodIn .3s ease both;
}
@keyframes methodIn { from{opacity:0;transform:translateX(4px)} to{opacity:1;transform:translateX(0)} }
.ev-method-icon { font-size:14px;color:#d4a84b;flex-shrink:0;margin-top:1px;width:16px;text-align:center; }
.ev-method-label { font-size:12px;font-weight:600;color:#f5f0e8;margin-bottom:2px; }
.ev-method-desc  { font-size:10px;color:rgba(245,240,232,.42);line-height:1.5; }

.ev-coverage { display:flex;flex-direction:column;gap:8px; }
.ev-coverage-grid { display:flex;flex-direction:column;gap:5px; }
.ev-cov-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:7px 12px;border-radius:7px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);
}
.ev-cov-label { font-size:11px;color:rgba(245,240,232,.45); }
.ev-cov-val   { font-size:11px;font-weight:500;color:#f5f0e8; }

.ev-cta-card {
  padding:14px;border-radius:10px;
  background:rgba(212,168,75,.04);border:1px solid rgba(212,168,75,.18);
  display:flex;flex-direction:column;gap:8px;
}
.ev-cta-head { font-size:12px;font-weight:600;color:#f5f0e8; }
.ev-cta-body { font-size:10px;color:rgba(245,240,232,.45);line-height:1.55; }
.ev-cta-gold {
  display:inline-flex;align-items:center;padding:8px 16px;border-radius:8px;
  font-size:12px;font-weight:600;background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;
}
.ev-cta-gold:hover { opacity:.88; }
`
