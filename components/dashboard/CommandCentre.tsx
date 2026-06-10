'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { CountryIntelProfile, PipelineCounts, WantedListing } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

type CommandPage =
  | 'briefing'
  | 'access-pathway'
  | 'marketplace'
  | 'evidence'
  | 'education'
  | 'regulatory'
  | 'local-intel'
  | 'signals'
  | 'watchlist'
  | 'settings'

type Props = {
  signals:          DashboardSignal[]
  eduCategories:    { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?:   string | null
  wantedCount?:     number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?:        PipelineCounts
  wantedListings?:  WantedListing[]
  countryIntel?:    CountryIntelProfile | null
}

// ── Globe (dynamic — SSR off) ─────────────────────────────────────────────────

const GlobeCanvas = dynamic(
  () => import('@/components/globe/r3f/GlobeCanvas').then(m => ({ default: m.GlobeCanvas })),
  { ssr: false, loading: () => <div className="cc-globe-loading" /> },
)

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

const NAV_ITEMS: { id: CommandPage; label: string; icon: string }[] = [
  { id: 'briefing',       label: 'Briefing Room',      icon: '◎' },
  { id: 'access-pathway', label: 'Access Pathway',     icon: '⬡' },
  { id: 'marketplace',    label: 'Marketplace & Access',icon: '⊞' },
  { id: 'evidence',       label: 'Evidence & Sources', icon: '⊟' },
  { id: 'education',      label: 'Education Hub',      icon: '⬛' },
  { id: 'regulatory',     label: 'Regulatory Watch',   icon: '◷' },
  { id: 'local-intel',    label: 'Local Intel',        icon: '◉' },
  { id: 'signals',        label: 'Signals',            icon: '≋' },
  { id: 'watchlist',      label: 'Watchlist',          icon: '◈' },
  { id: 'settings',       label: 'Settings',           icon: '⊙' },
]

// ── BriefingRoom page ─────────────────────────────────────────────────────────

const EVIDENCE_CONFIDENCE_BARS = [
  { label: 'Regulatory',        pct: 85 },
  { label: 'Market Data',       pct: 80 },
  { label: 'Access Pathway',    pct: 78 },
  { label: 'Local Intel',       pct: 76 },
  { label: 'Education Content', pct: 90 },
]

function overallConfidence(bars: { pct: number }[]) {
  return Math.round(bars.reduce((s, b) => s + b.pct, 0) / bars.length)
}

const BriefingRoom = React.memo(function BriefingRoom({
  country,
  region,
  countryIntel,
  signals,
  onCountrySelect,
}: {
  country:          { iso2: string; label: string }
  region:           string
  countryIntel?:    CountryIntelProfile | null
  signals:          DashboardSignal[]
  onCountrySelect?: (iso2: string) => void
}) {
  const [focusedIso2, setFocusedIso2] = useState<string | undefined>(undefined)
  const overall = overallConfidence(EVIDENCE_CONFIDENCE_BARS)
  const recentChanges = useMemo(() =>
    signals.slice(0, 3).map(s => ({
      market:  s.market,
      title:   s.title,
      timeAgo: s.timeAgo,
      up:      s.confidence >= 75,
    })),
    [signals],
  )

  return (
    <div className="cc-page cc-briefing">

      {/* ── Left: Jurisdiction brief ──────────────────────────────── */}
      <aside className="cc-briefing-left">
        <div className="cc-jx-brief">
          <div className="cc-jx-flag">{country.iso2 === 'US' ? '🇺🇸' : country.iso2 === 'CA' ? '🇨🇦' : '🌐'}</div>
          <div>
            <div className="cc-jx-country">{country.label}</div>
            {region && <div className="cc-jx-region">{region}</div>}
          </div>
        </div>

        {countryIntel?.public_summary && (
          <p className="cc-jx-summary">{countryIntel.public_summary}</p>
        )}

        <div className="cc-jx-fields">
          <div className="cc-jx-field">
            <span className="cc-jx-field-icon">◎</span>
            <div>
              <small>Program Status</small>
              <strong>Active Medical Program</strong>
            </div>
          </div>
          <div className="cc-jx-field">
            <span className="cc-jx-field-icon">↑</span>
            <div>
              <small>Patient Access</small>
              <strong>Increasing</strong>
            </div>
          </div>
          <div className="cc-jx-field">
            <span className="cc-jx-field-icon">◐</span>
            <div>
              <small>Physician Access</small>
              <strong>Moderate</strong>
            </div>
          </div>
          <div className="cc-jx-field">
            <span className="cc-jx-field-icon">⊛</span>
            <div>
              <small>Market Dynamics</small>
              <strong>Maturing</strong>
            </div>
          </div>
          <div className="cc-jx-field">
            <span className="cc-jx-field-icon">⊙</span>
            <div>
              <small>Regulatory Outlook</small>
              <strong>Stable</strong>
            </div>
          </div>
        </div>

        <button className="cc-jx-btn">View Full Jurisdiction Profile →</button>
      </aside>

      {/* ── Centre: Globe ─────────────────────────────────────────── */}
      <div className="cc-briefing-globe">
        <div className="cc-globe-wrap">
          <GlobeCanvas
            className="absolute inset-0 w-full h-full"
            selectedCountryIso2={country.iso2}
            selectedCountryIso2s={[country.iso2]}
            focusedCountryIso2={focusedIso2}
            activeLayerId="country_select"
            onHoverCountry={setFocusedIso2}
            onSelectCountry={onCountrySelect}
          />
          <div className="cc-globe-label">
            {country.label}
            {region && <span> · {region}</span>}
          </div>
          <div className="cc-globe-hint">Click a region to explore · Rotate · Zoom · Drag</div>
        </div>

        {/* Methodology strip */}
        <div className="cc-methodology">
          {[
            { icon: '◎', label: 'Data Sources',    val: 'Government, regulatory, market & verified industry sources' },
            { icon: '✓', label: 'Verification',    val: 'Multi-layer review and validation by domain experts' },
            { icon: '↻', label: 'Update Cadence',  val: 'Regulatory: Real-time · Market: Daily · Intel: Continuous' },
            { icon: '⊞', label: 'Coverage',        val: '50 U.S. States · 8 Countries · 100+ Data Sources' },
            { icon: '◷', label: 'Last Updated',    val: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` },
          ].map(item => (
            <div key={item.label} className="cc-methodology-item">
              <span className="cc-methodology-icon">{item.icon}</span>
              <div>
                <small>{item.label}</small>
                <span>{item.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Evidence confidence + Watch regions ────────────── */}
      <aside className="cc-briefing-right">

        <div className="cc-right-section">
          <div className="cc-right-head">EVIDENCE CONFIDENCE <span className="cc-right-info">ⓘ</span></div>
          <div className="cc-confidence-summary">
            <div className="cc-confidence-donut">
              <svg viewBox="0 0 64 64" className="cc-donut-svg">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="var(--cc-gold)" strokeWidth="7"
                  strokeDasharray={`${163.4 * overall / 100} 163.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dasharray .6s ease' }}
                />
              </svg>
              <div className="cc-donut-label">
                <strong>{overall}%</strong>
                <small>Overall<br/>Confidence</small>
              </div>
            </div>
            <div className="cc-confidence-bars">
              {EVIDENCE_CONFIDENCE_BARS.map(bar => (
                <div key={bar.label} className="cc-conf-bar-row">
                  <span className="cc-conf-bar-lbl">{bar.label}</span>
                  <div className="cc-conf-bar-track">
                    <div className="cc-conf-bar-fill" style={{ width: `${bar.pct}%` }} />
                  </div>
                  <span className="cc-conf-bar-pct">{bar.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <a href="#" className="cc-right-link">Confidence methodology →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">WATCH REGIONS</div>
          <div className="cc-watch-regions">
            {[
              { label: country.label, status: 'Active Program', star: true },
              ...signals
                .map(s => s.market)
                .filter((m, i, a) => m !== country.label && a.indexOf(m) === i)
                .slice(0, 4)
                .map(m => ({ label: m, status: 'Signal Activity', star: false })),
            ].map(r => (
              <div key={r.label} className="cc-watch-region-row">
                <span className="cc-watch-region-star">{r.star ? '★' : '○'}</span>
                <div className="cc-watch-region-info">
                  <strong>{r.label}</strong>
                  <small>{r.status}</small>
                </div>
                <button className="cc-watch-region-btn">View</button>
              </div>
            ))}
          </div>
          <a href="#" className="cc-right-link">View all jurisdictions →</a>
        </div>

        {recentChanges.length > 0 && (
          <div className="cc-right-section">
            <div className="cc-right-head">RECENT CHANGE NOTES</div>
            <div className="cc-change-notes">
              {recentChanges.map((c, i) => (
                <div key={i} className="cc-change-note">
                  <span className={`cc-change-arrow ${c.up ? 'up' : 'neutral'}`}>{c.up ? '↑' : '●'}</span>
                  <div>
                    <strong>{c.market}</strong>
                    <small>{c.title}</small>
                    <span className="cc-change-time">{c.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="#" className="cc-right-link">View all change activity →</a>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Signals helpers ───────────────────────────────────────────────────────────

type SignalGroup = 'REGULATORY' | 'MARKET ACCESS' | 'SUPPLY CHAIN' | 'TESTING & COMPLIANCE' | 'EXPORT / BUYER MOVEMENT' | 'EVIDENCE UPDATES'

function deriveSignalGroup(title: string): SignalGroup {
  const t = title.toLowerCase()
  if (/export|import|buyer|gacp|eu.gmp|international/.test(t)) return 'EXPORT / BUYER MOVEMENT'
  if (/test|coa|compliance|qa|quality|lab|microbial|pesticide|threshold/.test(t)) return 'TESTING & COMPLIANCE'
  if (/supply|packaging|shipping|logistics|lead.time|transport/.test(t)) return 'SUPPLY CHAIN'
  if (/retail|dispensary|demand|patient|consumer|pos|sales/.test(t)) return 'MARKET ACCESS'
  if (/study|evidence|research|clinical|terpene|data/.test(t)) return 'EVIDENCE UPDATES'
  return 'REGULATORY'
}

function deriveImpact(conf: number): 'High' | 'Medium' | 'Low' {
  return conf >= 80 ? 'High' : conf >= 65 ? 'Medium' : 'Low'
}

const SIG_GROUP_ICONS: Record<SignalGroup, string> = {
  'REGULATORY':               '◎',
  'MARKET ACCESS':            '⊞',
  'SUPPLY CHAIN':             '⬡',
  'TESTING & COMPLIANCE':     '⬟',
  'EXPORT / BUYER MOVEMENT':  '◈',
  'EVIDENCE UPDATES':         '⊟',
}

const SIG_GROUP_ORDER: SignalGroup[] = [
  'REGULATORY', 'MARKET ACCESS', 'SUPPLY CHAIN',
  'TESTING & COMPLIANCE', 'EXPORT / BUYER MOVEMENT', 'EVIDENCE UPDATES',
]

// ── SignalsPage ────────────────────────────────────────────────────────────────

const SignalsPage = React.memo(function SignalsPage({
  country, region, role, signals,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  signals: DashboardSignal[]
}) {
  const [filterImpact,  setFilterImpact]  = useState('all')
  const [filterConf,    setFilterConf]    = useState('all')
  const [filterType,    setFilterType]    = useState('all')

  const filtered = useMemo(() => signals.filter(s => {
    const imp = deriveImpact(s.confidence)
    if (filterImpact !== 'all' && imp.toLowerCase() !== filterImpact) return false
    if (filterConf === 'high'   && s.confidence < 80) return false
    if (filterConf === 'medium' && (s.confidence < 65 || s.confidence >= 80)) return false
    if (filterConf === 'low'    && s.confidence >= 65) return false
    if (filterType !== 'all' && deriveSignalGroup(s.title).toLowerCase().replace(/ /g, '_') !== filterType) return false
    return true
  }), [signals, filterImpact, filterConf, filterType])

  const grouped = useMemo(() => {
    const map: Partial<Record<SignalGroup, DashboardSignal[]>> = {}
    filtered.forEach(s => {
      const g = deriveSignalGroup(s.title)
      ;(map[g] ??= []).push(s)
    })
    return map
  }, [filtered])

  const activeGroups = SIG_GROUP_ORDER.filter(g => grouped[g]?.length)
  const hasFilters   = filterImpact !== 'all' || filterConf !== 'all' || filterType !== 'all'
  const nextBest     = signals.find(s => s.confidence >= 80)

  const SAVED_FILTERS = [
    { label: `${country.label} Regulatory Watch`, tags: 'Regulatory · High Impact' },
    { label: 'Cultivation Ops',        tags: 'Supply Chain · Testing' },
    { label: 'Export Opportunities',   tags: 'Export · Market Access' },
  ]
  const HIGH_WATCH = [
    { label: 'License Caps & Moratorium',  n: 2 },
    { label: 'Testing Standards',          n: 3 },
    { label: 'Water & Environmental Rules',n: 1 },
    { label: 'Federal Rescheduling',       n: 2 },
    { label: 'Export Market Access',       n: 4 },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main feed ───────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{region ? ` ${region}` : ''}{role ? ` ${role}` : ''} Signals</h2>
          <p>Intelligence feed surfacing regulatory, market, export, and operational signals relevant to the resolved jurisdiction{role ? ' and your role' : ''}.</p>
        </div>

        <div className="cc-filter-bar">
          <CustomSelect value={filterType} className="cc-filter-sel" onChange={setFilterType} options={[
            { value: 'all',                    label: 'All Types' },
            { value: 'regulatory',             label: 'Regulatory' },
            { value: 'market_access',          label: 'Market Access' },
            { value: 'supply_chain',           label: 'Supply Chain' },
            { value: 'testing_&_compliance',   label: 'Testing & Compliance' },
            { value: 'export_/_buyer_movement',label: 'Export / Buyer' },
            { value: 'evidence_updates',       label: 'Evidence Updates' },
          ]} />
          <CustomSelect value={filterImpact} className="cc-filter-sel" onChange={setFilterImpact} options={[
            { value: 'all',   label: 'All Impact' },
            { value: 'high',  label: 'High Impact' },
            { value: 'medium',label: 'Medium Impact' },
            { value: 'low',   label: 'Low Impact' },
          ]} />
          <CustomSelect value={filterConf} className="cc-filter-sel" onChange={setFilterConf} options={[
            { value: 'all',   label: 'All Confidence' },
            { value: 'high',  label: 'High (≥80%)' },
            { value: 'medium',label: 'Medium (65–79%)' },
            { value: 'low',   label: 'Low (<65%)' },
          ]} />
          {hasFilters && (
            <button className="cc-filter-clear" onClick={() => { setFilterImpact('all'); setFilterConf('all'); setFilterType('all') }}>
              ↺ Clear All
            </button>
          )}
        </div>

        <div className="cc-sig-feed">
          {activeGroups.length === 0 && (
            <div className="cc-empty-state">No signals match the current filters.</div>
          )}
          {activeGroups.map(grp => (
            <div key={grp} className="cc-sig-group">
              <div className="cc-sig-group-hd">
                <span>{SIG_GROUP_ICONS[grp]}</span>
                {grp}
              </div>
              {grouped[grp]!.map((s, i) => {
                const imp  = deriveImpact(s.confidence)
                const circ = 87.96
                return (
                  <div key={i} className="cc-sig-row">
                    <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                    <div className="cc-sig-body">
                      <strong>{s.title}</strong>
                      <small>{s.market}{region ? ` · ${region}` : ''} · {s.timeAgo}</small>
                    </div>
                    <div className="cc-sig-why">
                      <em>Why it matters</em>
                      <span>Affects operations in {s.market}{region ? ` · ${region}` : ''}</span>
                    </div>
                    <span className={`cc-imp-badge ${imp.toLowerCase()}`}>{imp}</span>
                    <svg viewBox="0 0 36 36" className="cc-mini-donut" aria-label={`${s.confidence}% confidence`}>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4"/>
                      <circle cx="18" cy="18" r="14" fill="none"
                        stroke={s.confidence>=80?'var(--cc-green)':s.confidence>=65?'var(--cc-amber)':'var(--cc-red)'}
                        strokeWidth="4"
                        strokeDasharray={`${circ*s.confidence/100} ${circ}`}
                        strokeLinecap="round" transform="rotate(-90 18 18)"
                      />
                      <text x="18" y="22" textAnchor="middle" fontSize="9" fill="var(--cc-text)" fontWeight="600">{s.confidence}%</text>
                    </svg>
                    <div className="cc-sig-date">
                      <em>Date</em>
                      <span>{s.timeAgo}</span>
                    </div>
                    <div className="cc-sig-acts">
                      <button className="cc-sig-brief">Open brief</button>
                      <button className="cc-sig-watch">↗ Add to watchlist</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cc-feed-footer">
          <span>Showing {Math.min(filtered.length, 6)}&nbsp;of&nbsp;{signals.length} signals</span>
          <span className="cc-auto-refresh"><span className="cc-refresh-dot"/>Auto-refresh on · Updated 2 min ago</span>
          <div className="cc-pagination">
            <button className="cc-page-btn">‹</button>
            <button className="cc-page-btn active">1</button>
            <button className="cc-page-btn">2</button>
            <button className="cc-page-btn">3</button>
            <button className="cc-page-btn">›</button>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">SAVED FILTERS</div>
          {SAVED_FILTERS.map(f => (
            <div key={f.label} className="cc-saved-row">
              <div>
                <strong>{f.label}</strong>
                <small>{f.tags}</small>
              </div>
              <button className="cc-apply-btn">Apply</button>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Manage saved filters →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">HIGH-WATCH TOPICS</div>
          {HIGH_WATCH.map(t => (
            <div key={t.label} className="cc-topic-row">
              <span>{t.label}</span>
              <span className="cc-topic-count">{t.n}</span>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all topics →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SIGNAL METHODOLOGY</div>
          <p className="cc-right-prose">Signals are sourced from regulatory releases, market data, trade intelligence, and verified industry sources. Each signal is scored for impact and confidence based on source credibility and recency.</p>
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Learn more about our methodology →</a>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">{nextBest.title.length > 90 ? nextBest.title.slice(0,90)+'…' : nextBest.title}</p>
            <button className="cc-nba-btn">Open Signal Brief ↗</button>
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all recommended actions →</a>
          </div>
        )}
      </aside>
    </div>
  )
})

// ── Marketplace helpers ────────────────────────────────────────────────────────

const MKT_TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis',      label: 'Listings' },
  { id: 'wanted',        label: 'Wanted Demand' },
  { id: 'opportunities', label: 'Buyer Routes' },
  { id: 'equipment',     label: 'Equipment' },
  { id: 'consumables',   label: 'Consumables' },
  { id: 'services',      label: 'Services' },
  { id: 'new-products',  label: 'Opportunities' },
]

// MarketRow tuple field indices
const MR = { TITLE:0, DESC:1, JURISDICTION:2, CATEGORY:3, VERIFICATION:4, ACCESS_ROUTE:5, CONFIDENCE:6, ID:7 } as const

// ── MarketplacePage ────────────────────────────────────────────────────────────

const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, marketplaceRows, wantedListings, wantedCount,
}: {
  country:         { iso2: string; label: string }
  region:          string
  role:            string
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  wantedListings?:  WantedListing[]
  wantedCount?:     number
}) {
  const [activeTab, setActiveTab] = useState<MarketView>('cannabis')
  const [search,    setSearch]    = useState('')

  const rows = useMemo<MarketRow[]>(() => {
    let r: MarketRow[] = marketplaceRows?.[activeTab] ?? []
    if (activeTab === 'wanted' && wantedListings?.length) {
      r = wantedListings.map(w => [
        w.title,
        w.summary ?? '',
        w.location_country ?? country.iso2,
        'Wanted Demand',
        'Verified',
        'Direct',
        '72',
        w.id,
      ] as MarketRow)
    }
    if (search.trim()) {
      const lq = search.toLowerCase()
      r = r.filter(row => row[MR.TITLE].toLowerCase().includes(lq) || row[MR.DESC].toLowerCase().includes(lq))
    }
    return r
  }, [activeTab, marketplaceRows, wantedListings, search, country])

  const ACCESS_REQS = [
    { label: `${country.label} Licence`,                  ok: true,  detail: 'Verified · Expires Feb 14, 2026' },
    { label: 'Facility Registration & Site Plan',         ok: true,  detail: 'Verified · May 23, 2025' },
    { label: 'Standard Operating Procedures',            ok: false, detail: 'Pending' },
    { label: 'Traceability System Documentation',        ok: false, detail: 'Pending' },
  ]
  const VERIFY_GAPS = [
    { label: 'EU-GMP Certification',   detail: 'Required for EU export routes' },
    { label: 'Pest Management Plan',   detail: 'Requires export-level detail' },
    { label: 'Residual Testing SOP',   detail: 'Needs method verification' },
  ]
  const COUNTERPARTY = [
    { label: 'Harbourview Due Diligence',    detail: 'Completed May 20, 2025' },
    { label: 'Sanctions & Watchlist Screen', detail: 'Clear · May 20, 2025' },
    { label: 'Financial Standing',           detail: 'Good' },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main table ──────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header">
          <h2>{country.label}{role ? ` ${role}` : ''} Marketplace &amp; Access</h2>
          <p>Mediated market access to export-ready and compliance-gated opportunities. Requests are reviewed by Harbourview's market access team.</p>
        </div>

        <div className="cc-mkt-tabs">
          {MKT_TABS.map(t => (
            <button key={t.id}
              className={`cc-mkt-tab${activeTab===t.id?' active':''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.id==='wanted' && wantedCount ? <span className="cc-tab-badge">{wantedCount}</span> : null}
            </button>
          ))}
        </div>

        <div className="cc-mkt-filters">
          <div className="cc-mkt-search-wrap">
            <span>⌕</span>
            <input className="cc-mkt-search" placeholder="Search listings…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="cc-mkt-filter-btn">≡ Filters</button>
        </div>

        {rows.length > 0 ? (
          <>
            <div className="cc-mkt-table">
              <div className="cc-mkt-thead">
                <span className="cc-mkt-th opp-col">OPPORTUNITY</span>
                <span className="cc-mkt-th">CATEGORY</span>
                <span className="cc-mkt-th">JURISDICTION</span>
                <span className="cc-mkt-th">VERIFICATION</span>
                <span className="cc-mkt-th">ACCESS ROUTE</span>
                <span className="cc-mkt-th">EVIDENCE</span>
                <span className="cc-mkt-th">ACTIONS</span>
              </div>
              {rows.slice(0,10).map((row, i) => {
                const conf = parseInt(row[MR.CONFIDENCE])||72
                const ok   = row[MR.VERIFICATION]?.toLowerCase()==='verified'
                return (
                  <div key={row[MR.ID]||String(i)} className="cc-mkt-row">
                    <div className="cc-mkt-cell opp-col">
                      <div className="cc-opp-icon">◎</div>
                      <div className="cc-opp-body">
                        <strong>{row[MR.TITLE]}</strong>
                        {row[MR.DESC] && <p>{row[MR.DESC].slice(0,80)}{row[MR.DESC].length>80?'…':''}</p>}
                        {row[MR.CATEGORY] && <span className="cc-opp-tag">{row[MR.CATEGORY]}</span>}
                      </div>
                    </div>
                    <div className="cc-mkt-cell">{row[MR.CATEGORY]||'—'}</div>
                    <div className="cc-mkt-cell cc-juris-cell">
                      <span>{row[MR.JURISDICTION]||country.iso2}</span>
                      {ok && <span className="cc-export-tag">Export-Ready</span>}
                    </div>
                    <div className="cc-mkt-cell">
                      <span className={`cc-verify-badge ${ok?'ok':'pending'}`}>
                        {ok?'✓':'○'} {row[MR.VERIFICATION]||'Pending Review'}
                      </span>
                    </div>
                    <div className="cc-mkt-cell">{row[MR.ACCESS_ROUTE]||'Mediated'}</div>
                    <div className="cc-mkt-cell">
                      <svg viewBox="0 0 36 36" className="cc-mini-donut">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4"/>
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={conf>=80?'var(--cc-green)':conf>=65?'var(--cc-amber)':'var(--cc-red)'}
                          strokeWidth="4"
                          strokeDasharray={`${87.96*conf/100} 87.96`}
                          strokeLinecap="round" transform="rotate(-90 18 18)"
                        />
                        <text x="18" y="22" textAnchor="middle" fontSize="9" fill="var(--cc-text)" fontWeight="600">{conf}%</text>
                      </svg>
                    </div>
                    <div className="cc-mkt-cell cc-acts-col">
                      <button className="cc-act-primary">Request access</button>
                      <button className="cc-act-sec">Watch</button>
                      <button className="cc-act-sec">Requirements</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="cc-feed-footer">
              <span>Showing {Math.min(rows.length,10)} of {rows.length} opportunities</span>
            </div>
          </>
        ) : (
          <div className="cc-empty-state">
            <span>⊞</span>
            <p>No {MKT_TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} listings for {country.label}{region?` · ${region}`:''}.{' '}
              {activeTab!=='wanted' && <button className="cc-right-link" onClick={()=>setActiveTab('wanted')}>Browse wanted demand →</button>}
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">MARKETPLACE ACCESS REQUIREMENTS</div>
          {ACCESS_REQS.map(r => (
            <div key={r.label} className="cc-req-row">
              <span className={`cc-req-icon ${r.ok?'ok':'pending'}`}>{r.ok?'✓':'○'}</span>
              <div>
                <strong>{r.label}</strong>
                <small>{r.detail}</small>
              </div>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View all requirements →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">VERIFICATION GAPS</div>
          {VERIFY_GAPS.map(g => (
            <div key={g.label} className="cc-req-row">
              <span className="cc-req-icon gap">△</span>
              <div>
                <strong>{g.label}</strong>
                <small>{g.detail}</small>
              </div>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Address gaps →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">COUNTERPARTY STATUS</div>
          {COUNTERPARTY.map(c => (
            <div key={c.label} className="cc-req-row">
              <span className="cc-req-icon ok">✓</span>
              <div>
                <strong>{c.label}</strong>
                <small>{c.detail}</small>
              </div>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View counterparty profile →</a>
        </div>
      </aside>
    </div>
  )
})

// ── Education helpers ──────────────────────────────────────────────────────────

type LearningModule = {
  num: number; icon: string; title: string; desc: string
  level: 'REQUIRED'|'RECOMMENDED'|'OPTIONAL'; progress: number; minutes: number
}

function buildLearningPath(eduCats: { icon: string; title: string; desc: string }[]): LearningModule[] {
  const defaults: LearningModule[] = [
    { num:1, icon:'◎', title:'Licence & Regulatory Foundations', desc:'Understand the regulatory framework, licensing requirements, and your ongoing obligations.',                         level:'REQUIRED',    progress:0, minutes:35 },
    { num:2, icon:'⬡', title:'Production Readiness',              desc:'Build compliant operational practices, facility standards, and operational controls.',                               level:'REQUIRED',    progress:0, minutes:45 },
    { num:3, icon:'⬟', title:'Testing, COA & Compliance',         desc:'Navigate testing requirements, COAs, batch release, and quality assurance.',                                        level:'REQUIRED',    progress:0, minutes:40 },
    { num:4, icon:'◈', title:'Buyer & Export Readiness',           desc:'Meet buyer expectations, understand export fundamentals, and documentation for international markets.',            level:'RECOMMENDED', progress:0, minutes:50 },
    { num:5, icon:'⊟', title:'Evidence & Documentation',           desc:'Master recordkeeping, evidence management, and audit readiness for regulators and buyers.',                        level:'OPTIONAL',    progress:0, minutes:30 },
  ]
  return defaults.map((m, i) => {
    const cat = eduCats[i]
    if (!cat) return m
    return { ...m, icon: cat.icon || m.icon, title: cat.title || m.title, desc: cat.desc || m.desc }
  })
}

const PATHWAY_STEPS = [
  { num:1, label:'Foundations',  unlocked:true  },
  { num:2, label:'Compliance',   unlocked:true  },
  { num:3, label:'Application',  unlocked:false },
  { num:4, label:'Approval',     unlocked:false },
  { num:5, label:'Market Access',unlocked:false },
]

// ── EducationPage ──────────────────────────────────────────────────────────────

const EducationPage = React.memo(function EducationPage({
  country, region, role, eduCategories,
}: {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  eduCategories: { icon: string; title: string; desc: string }[]
}) {
  const modules   = useMemo(() => buildLearningPath(eduCategories), [eduCategories])
  const roleDisp  = role ? role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Professional'
  const nextModule= modules.find(m => m.progress < 100 && m.level === 'REQUIRED')

  const REL_EVIDENCE = [
    { tag:'REGULATION', title:`${country.label} Regulatory Framework Overview`, date:'May 22, 2025' },
    { tag:'GUIDANCE',   title:'Cultivation Facility Standards Guide',            date:'May 20, 2025' },
    { tag:'TEMPLATE',   title:'Sample COA Requirements',                         date:'May 18, 2025' },
  ]
  const RECENT_UPDATES = [
    { title:'Testing, COA & Compliance',       detail:'Added batch release & recall guidance',    date:'May 27, 2025' },
    { title:'Buyer & Export Readiness',        detail:'Updated export documentation overview',    date:'May 26, 2025' },
    { title:'Licence & Regulatory Foundations',detail:'Clarified reporting obligations',          date:'May 24, 2025' },
  ]

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main ────────────────────────────────────────────── */}
      <div className="cc-two-main">
        <div className="cc-inner-header cc-edu-header-row">
          <span className="cc-edu-hd-icon">⬛</span>
          <div>
            <h2>{country.label} {roleDisp} Learning Path</h2>
            <p>Build the knowledge and documentation discipline that drives compliance, export eligibility, and market access.</p>
          </div>
        </div>

        <div className="cc-section-label">LEARNING MODULES</div>

        <div className="cc-edu-modules">
          {modules.map(m => (
            <div key={m.num} className="cc-edu-row">
              <div className="cc-edu-row-icon"><span>{m.icon}</span></div>
              <div className="cc-edu-row-body">
                <div className="cc-edu-row-title">
                  <strong>{m.num}. {m.title}</strong>
                  <span className={`cc-edu-badge ${m.level.toLowerCase()}`}>{m.level}</span>
                </div>
                <p>{m.desc}</p>
                <small className="cc-edu-time">◷ {m.minutes} min</small>
              </div>
              <div className="cc-edu-row-prog">
                {m.progress > 0
                  ? <><span className="cc-edu-pct">{m.progress}% complete</span>
                      <div className="cc-edu-track"><div className="cc-edu-fill" style={{width:`${m.progress}%`}}/></div></>
                  : <span className="cc-edu-ns">Not started</span>
                }
              </div>
              <button className={`cc-edu-cta ${m.progress>0?'continue':'start'}`}>
                {m.progress>0?'Continue':'Start module'}
              </button>
            </div>
          ))}
        </div>

        <div className="cc-edu-pathway-wrap">
          <div className="cc-section-label">EDUCATION UNLOCKS ACCESS PATHWAY STEPS</div>
          <div className="cc-edu-steps">
            {PATHWAY_STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className={`cc-edu-step ${step.unlocked?'unlocked':'locked'}`}>
                  <div className="cc-edu-step-circ">{step.unlocked?'✓':'🔒'}</div>
                  <span className="cc-edu-step-name">{step.num}. {step.label}</span>
                  <span className="cc-edu-step-st">{step.unlocked?'Unlocked':'Locked'}</span>
                </div>
                {i < PATHWAY_STEPS.length-1 && <span className="cc-step-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="cc-edu-pathway-foot">
            <p>Complete required modules to unlock and advance each step.</p>
            <button className="cc-edu-pathway-btn">View Access Pathway →</button>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <aside className="cc-two-right">
        <div className="cc-right-section">
          <div className="cc-right-head">RELATED EVIDENCE <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link ml-auto">View all →</a></div>
          {REL_EVIDENCE.map(e => (
            <div key={e.title} className="cc-edu-ev-row">
              <span className="cc-edu-ev-icon">⊟</span>
              <div>
                <strong>{e.title}</strong>
                <div className="cc-edu-ev-meta">
                  <span className="cc-edu-ev-tag">{e.tag}</span>
                  <small>{e.date}</small>
                </div>
              </div>
            </div>
          ))}
          <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">Go to Evidence &amp; Sources →</a>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">RECENTLY UPDATED MODULES <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link ml-auto">View all →</a></div>
          {RECENT_UPDATES.map(u => (
            <div key={u.title} className="cc-edu-ev-row">
              <span className="cc-edu-ev-icon">⊟</span>
              <div>
                <strong>{u.title}</strong>
                <small>{u.detail}</small>
                <span className="cc-change-time">{u.date}</span>
              </div>
            </div>
          ))}
        </div>

        {nextModule && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <div className="cc-nba-card">
              <div className="cc-nba-card-icon">◎</div>
              <div>
                <strong>Continue {nextModule.title}</strong>
                <small>You're {nextModule.progress}% complete</small>
                <p>Finishing this module unlocks the Compliance step and accelerates pathway progression.</p>
              </div>
            </div>
            <button className="cc-nba-btn full">Continue module →</button>
            <a href="#" onClick={e=>e.preventDefault()} className="cc-right-link">View module details →</a>
          </div>
        )}

        <div className="cc-right-section">
          <div className="cc-right-head">NEED HELP?</div>
          <div className="cc-need-help">
            <span>⬟</span>
            <div>
              <p>Book a session with a Harbourview Advisor.</p>
              <button className="cc-nba-btn" style={{marginTop:'8px'}}>Book now</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
})

// ── Placeholder pages (scaffolded, real content in next passes) ───────────────

const ScaffoldPage = React.memo(function ScaffoldPage({
  title, country, region, role,
}: {
  title: string
  country: { label: string }
  region: string
  role: string
}) {
  return (
    <div className="cc-page cc-scaffold">
      <div className="cc-scaffold-inner">
        <div className="cc-scaffold-icon">◎</div>
        <h2>{title}</h2>
        <p>{country.label}{region ? ` · ${region}` : ''} · {role || 'All roles'}</p>
        <div className="cc-scaffold-note">Full page implementation in progress</div>
      </div>
    </div>
  )
})

// ── Command palette ───────────────────────────────────────────────────────────

type CmdItem = { id: string; group: string; label: string; sub?: string; icon?: string; action: () => void }

function CommandPalette({
  open, onClose, country, role, onPage,
}: {
  open:    boolean
  onClose: () => void
  country: { iso2: string; label: string }
  role:    string
  onPage:  (p: CommandPage) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 40) }
  }, [open])

  const items = useMemo<CmdItem[]>(() => [
    ...NAV_ITEMS.map(n => ({
      id: n.id, group: 'Navigation', label: n.label, icon: n.icon,
      action: () => { onPage(n.id); onClose() },
    })),
    { id: 'mkt', group: 'Marketplace', label: 'Browse listings', icon: '⊞',
      action: () => { onPage('marketplace'); onClose() } },
    { id: 'sig', group: 'Intelligence', label: 'Weekly signals', icon: '≋',
      action: () => { onPage('signals'); onClose() } },
  ], [onPage, onClose])

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const lq = q.toLowerCase()
    return items.filter(i => i.label.toLowerCase().includes(lq) || i.group.toLowerCase().includes(lq))
  }, [items, q])

  useEffect(() => setIdx(0), [filtered])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')    { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { filtered[idx]?.action() }
  }

  if (!open) return null

  const groups = [...new Set(filtered.map(i => i.group))]

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="cp-search-row">
          <span className="cp-search-icon">⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pages, actions…"
            className="cp-input"
          />
          {q && <button className="cp-clear" onClick={() => setQ('')}>×</button>}
        </div>
        <div className="cp-results">
          {groups.map(group => (
            <div key={group}>
              <div className="cp-group-label">{group}</div>
              {filtered.filter(i => i.group === group).map((item, gi) => {
                const globalIdx = filtered.indexOf(item)
                return (
                  <button
                    key={item.id}
                    className={`cp-item${globalIdx === idx ? ' focused' : ''}`}
                    onMouseEnter={() => setIdx(globalIdx)}
                    onClick={item.action}
                  >
                    {item.icon && <span className="cp-item-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.sub && <small>{item.sub}</small>}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="cp-empty">No results for &ldquo;{q}&rdquo;</div>}
        </div>
        <div className="cp-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="cp-footer-ctx">
            {country.label}{role ? ` · ${ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.short ?? role}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── CustomSelect ──────────────────────────────────────────────────────────────

type SelectOpt = { value: string; label: string }

function CustomSelect({ value, options, placeholder, onChange, className }: {
  value: string; options: SelectOpt[]; placeholder?: string
  onChange: (v: string) => void; className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const label = options.find(o => o.value === value)?.label ?? placeholder ?? 'Select'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={rootRef} className={`cc-select${open ? ' open' : ''}${className ? ` ${className}` : ''}`}>
      <button type="button" className="cc-select-trigger" onClick={() => setOpen(o => !o)} aria-haspopup="listbox">
        <span>{label}</span>
        <span className="cc-select-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="cc-select-dropdown" role="listbox">
          {options.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cc-select-opt${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  wantedCount = 0,
  marketplaceRows,
  pipeline,
  wantedListings = [],
  countryIntel,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const initialCountry = useMemo(() => {
    const found = COUNTRIES.find(c => c.iso2 === initialCountryIso2)
    return found ?? { iso2: 'GLOBAL', label: 'Global Market' }
  }, [initialCountryIso2])

  const [country,      setCountry]     = useState(initialCountry)
  const [region,       setRegion]      = useState('')
  const [role,         setRole]        = useState(initialRoleId ?? '')
  const [activePage,   setActivePage]  = useState<CommandPage>('briefing')
  const [paletteOpen,  setPaletteOpen] = useState(false)

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const countryOptions = useMemo<SelectOpt[]>(() => COUNTRIES.map(c => ({ value: c.iso2, label: c.label })), [])
  const roleOptions    = useMemo<SelectOpt[]>(() =>
    Object.entries(ROLE_PROFILES).map(([k, v]) => ({ value: k, label: v.label })),
    [],
  )
  const roleLabel = useMemo(() =>
    role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.short ?? role) : '',
    [role],
  )
  const pageTitle = useMemo(() => NAV_ITEMS.find(n => n.id === activePage)?.label ?? 'Command Centre', [activePage])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCountryChange = useCallback((iso2: string) => {
    const found = COUNTRIES.find(c => c.iso2 === iso2)
    if (found) { setCountry(found); setRegion('') }
  }, [])

  // ── Page renderer ──────────────────────────────────────────────────────────
  const renderPage = useCallback(() => {
    const sharedProps = { country, region, role: roleLabel }
    switch (activePage) {
      case 'briefing':
        return <BriefingRoom country={country} region={region} countryIntel={countryIntel} signals={signals} onCountrySelect={handleCountryChange} />
      case 'access-pathway':
        return <ScaffoldPage title="Access Pathway" {...sharedProps} />
      case 'marketplace':
        return <MarketplacePage country={country} region={region} role={roleLabel} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount} />
      case 'evidence':
        return <ScaffoldPage title="Evidence & Sources" {...sharedProps} />
      case 'education':
        return <EducationPage country={country} region={region} role={roleLabel} eduCategories={eduCategories} />
      case 'regulatory':
        return <ScaffoldPage title="Regulatory Watch" {...sharedProps} />
      case 'local-intel':
        return <ScaffoldPage title="Local Intel" {...sharedProps} />
      case 'signals':
        return <SignalsPage country={country} region={region} role={roleLabel} signals={signals} />
      case 'watchlist':
        return <ScaffoldPage title="Watchlist" {...sharedProps} />
      case 'settings':
        return <ScaffoldPage title="Settings" {...sharedProps} />
      default:
        return null
    }
  }, [activePage, country, region, roleLabel, countryIntel, signals])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cc-app">
      <style>{CSS}</style>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="cc-header">
        <div className="cc-header-left">
          <div className="cc-wordmark">
            <span className="cc-wordmark-main">HARBOURVIEW</span>
            <span className="cc-wordmark-sub">COMMAND CENTRE</span>
          </div>
        </div>

        <div className="cc-header-centre">
          <div className="cc-breadcrumb">
            <span className="cc-bc-label">ROUTE CONTEXT</span>
            <span className="cc-bc-sep">›</span>
            <CustomSelect
              value={country.iso2}
              options={countryOptions}
              onChange={handleCountryChange}
              className="cc-bc-select"
            />
            {region && (
              <>
                <span className="cc-bc-sep">/</span>
                <span className="cc-bc-region">{region.toUpperCase()}</span>
              </>
            )}
          </div>
          <div className="cc-page-title">
            {pageTitle}
            {activePage !== 'briefing' && (
              <button className="cc-change-ctx" onClick={() => setActivePage('briefing')}>
                Change Context
              </button>
            )}
          </div>
        </div>

        <div className="cc-header-right">
          <div className="cc-role-selector">
            <span className="cc-role-label">ROLE</span>
            <CustomSelect
              value={role}
              options={roleOptions}
              placeholder="Select role"
              onChange={setRole}
              className="cc-role-select"
            />
          </div>

          <button
            className="cc-kbd-btn"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (⌘K)"
          >
            ⌘K
          </button>

          <div className="cc-user-chip">
            <div className="cc-user-avatar">TC</div>
            <div className="cc-user-info">
              <strong>Taylor Chambers</strong>
              <small>Harbourview</small>
            </div>
            <span className="cc-user-arrow">▾</span>
          </div>
        </div>
      </header>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <nav className="cc-sidebar" aria-label="Command centre navigation">
        <div className="cc-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              className={`cc-nav-btn${activePage === item.id ? ' active' : ''}`}
              onClick={() => setActivePage(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <span className="cc-nav-icon" aria-hidden="true">{item.icon}</span>
              <em>{item.label}</em>
            </button>
          ))}
        </div>

        <div className="cc-sidebar-status">
          <span className="cc-status-dot" />
          <div>
            <strong>System Online</strong>
            <small>All systems operational</small>
          </div>
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="cc-main">
        {renderPage()}
      </main>

      {/* ── Mobile nav ────────────────────────────────────────────── */}
      <nav className="cc-mob-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.slice(0, 5).map(item => (
          <button
            key={item.id}
            className={`cc-mob-nav-btn${activePage === item.id ? ' active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <em>{item.label}</em>
          </button>
        ))}
      </nav>

      {/* ── Command palette ───────────────────────────────────────── */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        country={country}
        role={role}
        onPage={setActivePage}
      />
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* Tokens */
:root {
  --cc-gold:   #d4a84b;
  --cc-gold2:  #d9af63;
  --cc-ink:    #f5f0e8;
  --cc-text:   rgba(245,240,232,.92);
  --cc-muted:  rgba(245,240,232,.55);
  --cc-dim:    rgba(245,240,232,.32);
  --cc-line:   rgba(255,255,255,.08);
  --cc-line2:  rgba(255,255,255,.13);
  --cc-blue:   #5b9bd5;
  --cc-green:  #4caf82;
  --cc-amber:  #e6a533;
  --cc-violet: #9b72d0;
  --cc-red:    #e05555;
  --cc-sans:   'Inter', system-ui, sans-serif;
  --cc-serif:  'Georgia', serif;
  --cc-mono:   'JetBrains Mono', 'Fira Mono', monospace;
  --cc-header: 64px;
  --cc-sidebar:220px;
  --cc-radius: 12px;
}

/* Shell */
.cc-app {
  position:fixed;inset:0;
  display:grid;
  grid-template-columns:var(--cc-sidebar) minmax(0,1fr);
  grid-template-rows:var(--cc-header) minmax(0,1fr);
  background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);
  color:var(--cc-text);
  font-family:var(--cc-sans);
  overflow:hidden;
}

/* Header */
.cc-header {
  grid-column:1/-1;grid-row:1;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px 0 0;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.96);
  backdrop-filter:blur(12px);
  z-index:20;gap:0;
}
.cc-header-left {
  width:var(--cc-sidebar);flex-shrink:0;
  display:flex;align-items:center;
  padding:0 16px;
  border-right:1px solid var(--cc-line);
  height:100%;
}
.cc-wordmark { display:flex;flex-direction:column;gap:1px; }
.cc-wordmark-main {
  font-family:var(--cc-serif);font-size:13px;
  letter-spacing:.18em;color:var(--cc-gold);
  font-weight:600;
}
.cc-wordmark-sub {
  font-family:var(--cc-mono);font-size:7px;
  letter-spacing:.22em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-header-centre {
  flex:1;padding:0 24px;display:flex;flex-direction:column;gap:2px;
}
.cc-breadcrumb {
  display:flex;align-items:center;gap:6px;
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.14em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-bc-label { color:var(--cc-dim); }
.cc-bc-sep   { color:var(--cc-dim);opacity:.5; }
.cc-bc-region{ color:var(--cc-gold);font-weight:600; }
.cc-bc-select .cc-select-trigger {
  background:none;border:none;padding:0;
  color:var(--cc-gold);font-family:var(--cc-mono);
  font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  cursor:pointer;display:flex;align-items:center;gap:4px;
}
.cc-bc-select .cc-select-arrow { font-size:7px;opacity:.6; }
.cc-page-title {
  font-family:var(--cc-serif);font-size:22px;font-weight:400;
  color:var(--cc-ink);letter-spacing:-.01em;
  display:flex;align-items:center;gap:12px;
}
.cc-change-ctx {
  font-family:var(--cc-sans);font-size:11px;font-weight:500;
  padding:3px 10px;border-radius:20px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;
  transition:background .12s,color .12s;
}
.cc-change-ctx:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-header-right {
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.cc-role-selector {
  display:flex;flex-direction:column;align-items:flex-end;gap:1px;
}
.cc-role-label {
  font-family:var(--cc-mono);font-size:8px;
  letter-spacing:.16em;color:var(--cc-dim);text-transform:uppercase;
}
.cc-role-select .cc-select-trigger {
  background:none;border:none;padding:0;cursor:pointer;
  color:var(--cc-ink);font-size:13px;font-weight:500;
  display:flex;align-items:center;gap:6px;
}
.cc-role-select .cc-select-arrow { color:var(--cc-dim); }
.cc-kbd-btn {
  font-family:var(--cc-mono);font-size:10px;
  padding:5px 10px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;
  transition:background .12s,color .12s;
}
.cc-kbd-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-user-chip {
  display:flex;align-items:center;gap:10px;
  padding:6px 10px;border-radius:10px;
  border:1px solid var(--cc-line);background:rgba(255,255,255,.03);
  cursor:pointer;transition:background .12s;
}
.cc-user-chip:hover { background:rgba(255,255,255,.06); }
.cc-user-avatar {
  width:32px;height:32px;border-radius:50%;
  background:linear-gradient(135deg,var(--cc-gold),#8b6914);
  display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#1a1000;flex-shrink:0;
}
.cc-user-info { display:flex;flex-direction:column;gap:1px; }
.cc-user-info strong { font-size:12px;font-weight:600;color:var(--cc-ink);line-height:1; }
.cc-user-info small  { font-size:10px;color:var(--cc-dim); }
.cc-user-arrow { color:var(--cc-dim);font-size:9px; }

/* Sidebar */
.cc-sidebar {
  grid-column:1;grid-row:2;
  display:flex;flex-direction:column;justify-content:space-between;
  padding:12px 10px;
  border-right:1px solid var(--cc-line);
  background:rgba(3,7,17,.7);
  overflow-y:auto;
}
.cc-sidebar-nav { display:flex;flex-direction:column;gap:2px; }
.cc-nav-btn {
  width:100%;height:38px;border-radius:10px;
  border:1px solid transparent;background:transparent;
  color:var(--cc-dim);
  display:flex;align-items:center;gap:10px;
  padding:0 10px;
  cursor:pointer;font:inherit;font-size:11px;text-align:left;
  transition:color .15s,background .15s,border-color .15s;
  flex-shrink:0;
}
.cc-nav-icon { font-size:13px;flex-shrink:0;width:16px;text-align:center; }
.cc-nav-btn em { font-style:normal;font-size:11px;white-space:nowrap;overflow:hidden; }
.cc-nav-btn:hover { color:var(--cc-text);background:rgba(255,255,255,.05); }
.cc-nav-btn.active {
  color:var(--cc-gold2);
  border-color:rgba(212,168,75,.25);
  background:rgba(212,168,75,.07);
}
.cc-sidebar-status {
  display:flex;align-items:center;gap:10px;
  padding:10px 10px;
  border-top:1px solid var(--cc-line);
  margin-top:8px;
}
.cc-status-dot {
  width:8px;height:8px;border-radius:50%;
  background:var(--cc-green);flex-shrink:0;
  box-shadow:0 0 6px var(--cc-green);
  animation:pulseDot 2.4s ease infinite;
}
.cc-sidebar-status strong { display:block;font-size:11px;color:var(--cc-text); }
.cc-sidebar-status small  { display:block;font-size:9px;color:var(--cc-dim); }

/* Main */
.cc-main {
  grid-column:2;grid-row:2;
  overflow-y:auto;overflow-x:hidden;
  background:rgba(4,9,20,.4);
}

/* CustomSelect dropdown */
.cc-select { position:relative; }
.cc-select-dropdown {
  position:absolute;top:calc(100% + 6px);left:0;
  background:#08172a;border:1px solid var(--cc-line2);
  border-radius:10px;padding:6px;
  min-width:180px;max-height:260px;overflow-y:auto;
  z-index:200;box-shadow:0 16px 48px rgba(0,0,0,.7);
}
.cc-select-opt {
  width:100%;text-align:left;padding:7px 10px;border-radius:7px;
  border:none;background:transparent;color:var(--cc-text);
  font:inherit;font-size:12px;cursor:pointer;
  transition:background .1s;
}
.cc-select-opt:hover,.cc-select-opt.selected { background:rgba(255,255,255,.07); }
.cc-select-opt.selected { color:var(--cc-gold); }

/* ── Briefing Room ──────────────────────────────────────────────────────────── */
.cc-page {
  height:100%;display:flex;
  animation:fadeSlideUp .3s ease;
}
.cc-briefing {
  display:grid;
  grid-template-columns:300px minmax(0,1fr) 300px;
  gap:0;height:100%;
}
.cc-briefing-left {
  padding:24px 20px;
  border-right:1px solid var(--cc-line);
  overflow-y:auto;display:flex;flex-direction:column;gap:16px;
  background:rgba(3,7,17,.5);
}
.cc-jx-brief { display:flex;align-items:center;gap:12px; }
.cc-jx-flag  { font-size:28px;line-height:1; }
.cc-jx-country {
  font-family:var(--cc-serif);font-size:20px;
  color:var(--cc-ink);font-weight:400;
}
.cc-jx-region {
  font-family:var(--cc-mono);font-size:11px;
  color:var(--cc-gold);letter-spacing:.1em;margin-top:2px;
}
.cc-jx-summary {
  font-size:12px;line-height:1.65;color:var(--cc-muted);
  border-left:2px solid var(--cc-gold);padding-left:12px;
}
.cc-jx-fields { display:flex;flex-direction:column;gap:10px; }
.cc-jx-field {
  display:flex;align-items:flex-start;gap:10px;
  padding:8px 10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-jx-field-icon {
  font-size:13px;color:var(--cc-gold);
  flex-shrink:0;margin-top:1px;
}
.cc-jx-field small  { display:block;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em; }
.cc-jx-field strong { display:block;font-size:12px;color:var(--cc-ink);margin-top:2px; }
.cc-jx-btn {
  margin-top:4px;padding:9px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  text-align:left;transition:background .12s,color .12s;
}
.cc-jx-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-briefing-globe {
  display:flex;flex-direction:column;overflow:hidden;
}
.cc-globe-wrap {
  flex:1;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 45%,rgba(16,42,72,.6),transparent 70%),
             linear-gradient(180deg,#020814 0%,#010509 100%);
}
.cc-globe-loading {
  position:absolute;inset:0;
  background:radial-gradient(circle at 50% 45%,rgba(16,42,72,.4),transparent 70%);
}
.cc-globe-label {
  position:absolute;
  top:50%;left:50%;
  transform:translate(-50%,-50%) translateX(120px) translateY(40px);
  background:rgba(8,18,32,.92);border:1px solid var(--cc-line2);
  border-radius:8px;padding:5px 12px;
  font-size:12px;font-weight:500;color:var(--cc-ink);
  pointer-events:none;white-space:nowrap;
}
.cc-globe-hint {
  position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font-family:var(--cc-mono);font-size:9px;color:var(--cc-dim);
  letter-spacing:.12em;pointer-events:none;
}
.cc-methodology {
  display:flex;gap:0;
  border-top:1px solid var(--cc-line);
  background:rgba(3,7,17,.7);
  flex-shrink:0;
}
.cc-methodology-item {
  flex:1;display:flex;align-items:flex-start;gap:8px;
  padding:12px 14px;
  border-right:1px solid var(--cc-line);
}
.cc-methodology-item:last-child { border-right:none; }
.cc-methodology-icon { font-size:13px;color:var(--cc-gold);flex-shrink:0;margin-top:1px; }
.cc-methodology-item small { display:block;font-size:8px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.12em; }
.cc-methodology-item span  { display:block;font-size:9px;color:var(--cc-muted);margin-top:2px;line-height:1.4; }

.cc-briefing-right {
  padding:20px 16px;
  border-left:1px solid var(--cc-line);
  overflow-y:auto;display:flex;flex-direction:column;gap:20px;
  background:rgba(3,7,17,.5);
}
.cc-right-section { display:flex;flex-direction:column;gap:10px; }
.cc-right-head {
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.18em;color:var(--cc-dim);
  text-transform:uppercase;display:flex;align-items:center;gap:6px;
}
.cc-right-info { color:var(--cc-dim);cursor:help; }
.cc-right-link {
  font-size:10px;color:var(--cc-gold);
  background:none;border:none;padding:0;
  cursor:pointer;text-align:left;
  transition:opacity .12s;font-family:inherit;
}
.cc-right-link:hover { opacity:.75; }

.cc-confidence-summary { display:flex;gap:14px;align-items:flex-start; }
.cc-confidence-donut   { position:relative;width:72px;height:72px;flex-shrink:0; }
.cc-donut-svg          { width:100%;height:100%; }
.cc-donut-label {
  position:absolute;inset:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.cc-donut-label strong { font-size:16px;font-weight:700;color:var(--cc-gold);line-height:1; }
.cc-donut-label small  { font-size:7px;color:var(--cc-dim);text-align:center;line-height:1.3; }
.cc-confidence-bars    { flex:1;display:flex;flex-direction:column;gap:6px; }
.cc-conf-bar-row       { display:flex;align-items:center;gap:6px; }
.cc-conf-bar-lbl       { font-size:9px;color:var(--cc-muted);width:100px;flex-shrink:0; }
.cc-conf-bar-track     { flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden; }
.cc-conf-bar-fill      { height:100%;background:var(--cc-gold);border-radius:2px; }
.cc-conf-bar-pct       { font-family:var(--cc-mono);font-size:9px;color:var(--cc-muted);width:28px;text-align:right; }

.cc-watch-regions     { display:flex;flex-direction:column;gap:6px; }
.cc-watch-region-row  { display:flex;align-items:center;gap:8px; }
.cc-watch-region-star { color:var(--cc-gold);font-size:11px;flex-shrink:0; }
.cc-watch-region-info { flex:1; }
.cc-watch-region-info strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-watch-region-info small  { display:block;font-size:9px;color:var(--cc-dim); }
.cc-watch-region-btn {
  font-size:9px;padding:3px 8px;border-radius:5px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);cursor:pointer;font:inherit;
  transition:background .1s;flex-shrink:0;
}
.cc-watch-region-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }

.cc-change-notes  { display:flex;flex-direction:column;gap:8px; }
.cc-change-note   { display:flex;gap:8px;align-items:flex-start; }
.cc-change-arrow  { font-size:12px;flex-shrink:0;margin-top:1px; }
.cc-change-arrow.up      { color:var(--cc-green); }
.cc-change-arrow.neutral { color:var(--cc-amber); }
.cc-change-note strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-change-note small  { display:block;font-size:10px;color:var(--cc-muted);line-height:1.4; }
.cc-change-time        { display:block;font-size:9px;color:var(--cc-dim);margin-top:2px; }

/* Scaffold placeholder */
.cc-scaffold {
  width:100%;display:flex;align-items:center;justify-content:center;
}
.cc-scaffold-inner {
  text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;
}
.cc-scaffold-icon { font-size:32px;color:var(--cc-gold);opacity:.4; }
.cc-scaffold-inner h2 { font-family:var(--cc-serif);font-size:24px;font-weight:400;color:var(--cc-ink); }
.cc-scaffold-inner p  { font-size:13px;color:var(--cc-muted); }
.cc-scaffold-note {
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.14em;color:var(--cc-dim);
  padding:6px 14px;border-radius:20px;
  border:1px solid var(--cc-line);background:rgba(255,255,255,.02);
}

/* Command palette */
.cp-overlay {
  position:fixed;inset:0;background:rgba(0,0,0,.7);
  backdrop-filter:blur(4px);z-index:500;
  display:grid;place-items:start center;padding-top:80px;
}
.cp-modal {
  width:100%;max-width:540px;
  background:#060f1e;border:1px solid var(--cc-line2);
  border-radius:14px;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.8);
}
.cp-search-row {
  display:flex;align-items:center;gap:10px;
  padding:14px 16px;border-bottom:1px solid var(--cc-line);
}
.cp-search-icon { color:var(--cc-gold);font-size:14px;flex-shrink:0; }
.cp-input {
  flex:1;background:none;border:none;outline:none;
  color:var(--cc-text);font:inherit;font-size:14px;
}
.cp-clear {
  background:none;border:none;color:var(--cc-dim);
  cursor:pointer;font-size:16px;padding:0 4px;
}
.cp-results { max-height:340px;overflow-y:auto;padding:8px; }
.cp-group-label {
  padding:6px 10px 4px;
  font-family:var(--cc-mono);font-size:9px;
  letter-spacing:.16em;color:var(--cc-dim);text-transform:uppercase;
}
.cp-item {
  width:100%;display:flex;align-items:center;gap:10px;
  padding:9px 10px;border-radius:8px;
  border:none;background:transparent;
  color:var(--cc-text);font:inherit;font-size:12px;
  cursor:pointer;text-align:left;
  transition:background .1s;
}
.cp-item:hover,.cp-item.focused { background:rgba(255,255,255,.07); }
.cp-item-icon { color:var(--cc-gold);font-size:13px;flex-shrink:0; }
.cp-item small { margin-left:auto;color:var(--cc-dim);font-size:10px; }
.cp-empty { padding:20px;text-align:center;color:var(--cc-dim);font-size:12px; }
.cp-footer {
  display:flex;align-items:center;gap:16px;
  padding:10px 16px;border-top:1px solid var(--cc-line);
  font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);
}
.cp-footer-ctx { margin-left:auto;color:var(--cc-muted); }

/* Animations */
@keyframes fadeSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseDot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

/* ── Shared two-column page layout ─────────────────────────────────────────── */
.cc-two-col-page {
  display:grid;
  grid-template-columns:minmax(0,1fr) 280px;
  height:100%;
  overflow:hidden;
}
.cc-two-main {
  overflow-y:auto;overflow-x:hidden;
  display:flex;flex-direction:column;
  padding:0;
}
.cc-two-right {
  overflow-y:auto;
  padding:20px 16px;
  border-left:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);
  display:flex;flex-direction:column;gap:20px;
}
.cc-inner-header {
  padding:24px 24px 0;
  border-bottom:1px solid var(--cc-line);
  padding-bottom:16px;
  flex-shrink:0;
}
.cc-inner-header h2 {
  font-family:var(--cc-serif);font-size:22px;font-weight:400;
  color:var(--cc-ink);margin:0 0 6px;
}
.cc-inner-header p { font-size:12px;color:var(--cc-muted);margin:0;line-height:1.55; }
.cc-section-label {
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
  padding:16px 24px 8px;flex-shrink:0;
}
.cc-filter-bar {
  display:flex;align-items:center;gap:8px;
  padding:12px 24px;
  border-bottom:1px solid var(--cc-line);
  flex-shrink:0;background:rgba(3,7,17,.3);
}
.cc-filter-sel .cc-select-trigger {
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);
  border-radius:8px;padding:5px 10px;cursor:pointer;
  color:var(--cc-text);font:inherit;font-size:11px;
  display:flex;align-items:center;gap:6px;white-space:nowrap;
}
.cc-filter-sel .cc-select-arrow { color:var(--cc-dim);font-size:9px; }
.cc-filter-clear {
  background:none;border:1px solid var(--cc-line);border-radius:8px;
  padding:5px 10px;color:var(--cc-muted);font:inherit;font-size:11px;
  cursor:pointer;white-space:nowrap;transition:color .12s,border-color .12s;
}
.cc-filter-clear:hover { color:var(--cc-text);border-color:var(--cc-line2); }
.cc-empty-state {
  flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:10px;padding:40px;text-align:center;
  color:var(--cc-muted);font-size:13px;
}
.cc-empty-state span { font-size:28px;color:var(--cc-gold);opacity:.4; }
.cc-feed-footer {
  display:flex;align-items:center;gap:16px;
  padding:12px 24px;
  border-top:1px solid var(--cc-line);
  font-size:11px;color:var(--cc-dim);flex-shrink:0;
  background:rgba(3,7,17,.4);flex-wrap:wrap;
}
.cc-auto-refresh { display:flex;align-items:center;gap:6px;margin-left:auto; }
.cc-refresh-dot {
  width:6px;height:6px;border-radius:50%;background:var(--cc-green);
  box-shadow:0 0 5px var(--cc-green);flex-shrink:0;
  animation:pulseDot 2s ease infinite;
}
.cc-pagination { display:flex;gap:3px;align-items:center; }
.cc-page-btn {
  min-width:26px;height:26px;border-radius:6px;
  border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  transition:background .1s,color .1s;padding:0 6px;
}
.cc-page-btn:hover,.cc-page-btn.active {
  background:rgba(212,168,75,.1);border-color:rgba(212,168,75,.3);color:var(--cc-gold);
}
.cc-right-prose {
  font-size:11px;line-height:1.65;color:var(--cc-muted);margin:0;
}
.cc-nba-btn {
  display:block;width:auto;padding:8px 14px;border-radius:8px;
  background:linear-gradient(135deg,var(--cc-gold),#a87c1e);
  border:none;color:#0b1a2f;font:inherit;font-size:11px;font-weight:700;
  cursor:pointer;transition:opacity .12s;text-align:left;
}
.cc-nba-btn.full { width:100%;text-align:center; }
.cc-nba-btn:hover { opacity:.88; }
.cc-nba-card {
  display:flex;gap:10px;align-items:flex-start;
  padding:10px;border-radius:8px;
  background:rgba(212,168,75,.06);border:1px solid rgba(212,168,75,.15);
}
.cc-nba-card-icon { font-size:16px;color:var(--cc-gold);flex-shrink:0;margin-top:1px; }
.cc-nba-card strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-nba-card small  { display:block;font-size:10px;color:var(--cc-dim); }
.cc-nba-card p      { font-size:10px;color:var(--cc-muted);margin:4px 0 0;line-height:1.5; }
.cc-need-help {
  display:flex;align-items:flex-start;gap:10px;
  padding:10px;border-radius:8px;
  background:rgba(255,255,255,.03);border:1px solid var(--cc-line);
}
.cc-need-help span { font-size:18px;color:var(--cc-gold);flex-shrink:0; }
.cc-need-help p    { font-size:11px;color:var(--cc-muted);margin:0; }
.cc-mini-donut { width:36px;height:36px;flex-shrink:0; }
.cc-imp-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:3px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;
  letter-spacing:.06em;text-transform:uppercase;
}
.cc-imp-badge.high   { background:rgba(224,85,85,.15);color:#e05555;border:1px solid rgba(224,85,85,.3); }
.cc-imp-badge.medium { background:rgba(230,165,51,.15);color:#e6a533;border:1px solid rgba(230,165,51,.3); }
.cc-imp-badge.low    { background:rgba(255,255,255,.06);color:var(--cc-dim);border:1px solid var(--cc-line2); }
.cc-saved-row {
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-saved-row:last-of-type { border-bottom:none; }
.cc-saved-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-saved-row small  { display:block;font-size:9px;color:var(--cc-dim); }
.cc-apply-btn {
  padding:3px 10px;border-radius:6px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:10px;cursor:pointer;
  flex-shrink:0;transition:background .1s,color .1s;
}
.cc-apply-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-topic-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:5px 0;border-bottom:1px solid var(--cc-line);font-size:11px;color:var(--cc-muted);
}
.cc-topic-row:last-of-type { border-bottom:none; }
.cc-topic-count {
  font-family:var(--cc-mono);font-size:10px;font-weight:700;
  padding:1px 7px;border-radius:10px;
  background:rgba(212,168,75,.12);color:var(--cc-gold);
  border:1px solid rgba(212,168,75,.2);flex-shrink:0;
}
.ml-auto { margin-left:auto; }

/* ── Signals page ────────────────────────────────────────────────────────────── */
.cc-sig-feed { flex:1;overflow-y:auto;padding:0 0 16px; }
.cc-sig-group { margin-bottom:2px; }
.cc-sig-group-hd {
  display:flex;align-items:center;gap:8px;
  padding:10px 24px;
  font-family:var(--cc-mono);font-size:9px;letter-spacing:.16em;
  color:var(--cc-dim);text-transform:uppercase;
  background:rgba(255,255,255,.02);border-bottom:1px solid var(--cc-line);
  font-weight:700;
}
.cc-sig-group-hd span { font-size:12px;color:var(--cc-gold); }
.cc-sig-row {
  display:grid;
  grid-template-columns:12px 1fr 220px 72px 44px 80px 200px;
  align-items:center;gap:12px;
  padding:14px 24px;
  border-bottom:1px solid var(--cc-line);
  transition:background .1s;
}
.cc-sig-row:hover { background:rgba(255,255,255,.025); }
.cc-sig-dot {
  width:8px;height:8px;border-radius:50%;flex-shrink:0;
}
.cc-sig-dot.high   { background:#e05555;box-shadow:0 0 5px rgba(224,85,85,.5); }
.cc-sig-dot.medium { background:#e6a533;box-shadow:0 0 5px rgba(230,165,51,.4); }
.cc-sig-dot.low    { background:var(--cc-dim); }
.cc-sig-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.4; }
.cc-sig-body small  { display:block;font-size:10px;color:var(--cc-dim);margin-top:2px; }
.cc-sig-why em   { display:block;font-style:normal;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px; }
.cc-sig-why span { font-size:10px;color:var(--cc-muted);line-height:1.4; }
.cc-sig-date em  { display:block;font-style:normal;font-size:9px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px; }
.cc-sig-date span{ font-size:10px;color:var(--cc-muted); }
.cc-sig-acts { display:flex;flex-direction:column;gap:4px;align-items:flex-start; }
.cc-sig-brief {
  padding:5px 12px;border-radius:6px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-text);font:inherit;font-size:10px;cursor:pointer;
  transition:background .1s;white-space:nowrap;
}
.cc-sig-brief:hover { background:rgba(255,255,255,.08); }
.cc-sig-watch {
  background:none;border:none;color:var(--cc-dim);font:inherit;
  font-size:10px;cursor:pointer;padding:2px 0;
  transition:color .1s;white-space:nowrap;
}
.cc-sig-watch:hover { color:var(--cc-gold); }

/* ── Marketplace page ────────────────────────────────────────────────────────── */
.cc-mkt-tabs {
  display:flex;align-items:center;gap:0;
  padding:0 24px;
  border-bottom:1px solid var(--cc-line);
  flex-shrink:0;overflow-x:auto;
}
.cc-mkt-tab {
  padding:12px 14px;border:none;background:none;
  color:var(--cc-dim);font:inherit;font-size:12px;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;
  white-space:nowrap;display:flex;align-items:center;gap:6px;
  transition:color .12s,border-color .12s;flex-shrink:0;
}
.cc-mkt-tab:hover { color:var(--cc-text); }
.cc-mkt-tab.active { color:var(--cc-gold);border-bottom-color:var(--cc-gold); }
.cc-tab-badge {
  font-family:var(--cc-mono);font-size:9px;font-weight:700;
  padding:1px 6px;border-radius:10px;
  background:rgba(212,168,75,.15);color:var(--cc-gold);
}
.cc-mkt-filters {
  display:flex;align-items:center;gap:8px;
  padding:10px 24px;border-bottom:1px solid var(--cc-line);
  flex-shrink:0;background:rgba(3,7,17,.3);
}
.cc-mkt-search-wrap {
  flex:1;display:flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);
  border-radius:8px;padding:6px 12px;
  font-size:14px;color:var(--cc-dim);
}
.cc-mkt-search {
  flex:1;background:none;border:none;outline:none;
  color:var(--cc-text);font:inherit;font-size:12px;
}
.cc-mkt-filter-btn {
  padding:6px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  white-space:nowrap;transition:background .1s;flex-shrink:0;
}
.cc-mkt-filter-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-mkt-table { flex:1;overflow-y:auto; }
.cc-mkt-thead {
  display:grid;
  grid-template-columns:2fr 100px 120px 130px 110px 56px 200px;
  gap:8px;padding:8px 24px;
  border-bottom:1px solid var(--cc-line);
  background:rgba(3,7,17,.5);position:sticky;top:0;z-index:2;
}
.cc-mkt-th {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.14em;
  color:var(--cc-dim);text-transform:uppercase;display:flex;align-items:center;
}
.cc-mkt-row {
  display:grid;
  grid-template-columns:2fr 100px 120px 130px 110px 56px 200px;
  gap:8px;padding:14px 24px;
  border-bottom:1px solid var(--cc-line);align-items:center;
  transition:background .1s;
}
.cc-mkt-row:hover { background:rgba(255,255,255,.025); }
.cc-mkt-cell { font-size:12px;color:var(--cc-text);min-width:0; }
.opp-col { display:flex;align-items:flex-start;gap:10px; }
.cc-opp-icon {
  width:34px;height:34px;border-radius:8px;flex-shrink:0;
  background:rgba(212,168,75,.1);border:1px solid rgba(212,168,75,.2);
  display:grid;place-items:center;font-size:14px;color:var(--cc-gold);
}
.cc-opp-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.3; }
.cc-opp-body p      { font-size:10px;color:var(--cc-muted);margin:2px 0;line-height:1.4; }
.cc-opp-tag {
  display:inline-block;font-size:9px;font-weight:600;
  padding:1px 7px;border-radius:4px;
  background:rgba(91,155,213,.12);color:#5b9bd5;border:1px solid rgba(91,155,213,.2);
}
.cc-juris-cell { display:flex;flex-direction:column;gap:3px; }
.cc-export-tag {
  display:inline-block;font-size:9px;font-weight:600;
  padding:1px 6px;border-radius:4px;
  background:rgba(76,175,130,.1);color:var(--cc-green);border:1px solid rgba(76,175,130,.2);
}
.cc-verify-badge {
  font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px;
}
.cc-verify-badge.ok      { color:var(--cc-green); }
.cc-verify-badge.pending { color:var(--cc-amber); }
.cc-acts-col { display:flex;flex-direction:column;gap:4px; }
.cc-act-primary {
  padding:5px 12px;border-radius:6px;
  background:rgba(212,168,75,.12);border:1px solid rgba(212,168,75,.3);
  color:var(--cc-gold);font:inherit;font-size:10px;font-weight:600;
  cursor:pointer;transition:background .1s;white-space:nowrap;
}
.cc-act-primary:hover { background:rgba(212,168,75,.2); }
.cc-act-sec {
  padding:4px 12px;border-radius:6px;
  border:1px solid var(--cc-line);background:transparent;
  color:var(--cc-muted);font:inherit;font-size:10px;cursor:pointer;
  transition:background .1s,color .1s;white-space:nowrap;
}
.cc-act-sec:hover { background:rgba(255,255,255,.05);color:var(--cc-text); }
.cc-req-row {
  display:flex;align-items:flex-start;gap:8px;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-req-row:last-of-type { border-bottom:none; }
.cc-req-icon { font-size:12px;flex-shrink:0;margin-top:1px;font-weight:700; }
.cc-req-icon.ok      { color:var(--cc-green); }
.cc-req-icon.pending { color:var(--cc-dim); }
.cc-req-icon.gap     { color:var(--cc-amber); }
.cc-req-row strong { display:block;font-size:11px;color:var(--cc-ink); }
.cc-req-row small  { display:block;font-size:10px;color:var(--cc-dim); }

/* ── Education page ──────────────────────────────────────────────────────────── */
.cc-edu-header-row {
  display:flex;align-items:flex-start;gap:14px;
}
.cc-edu-hd-icon {
  font-size:28px;color:var(--cc-gold);flex-shrink:0;margin-top:3px;
}
.cc-edu-modules {
  display:flex;flex-direction:column;gap:0;
  padding:0 24px;flex-shrink:0;
}
.cc-edu-row {
  display:grid;
  grid-template-columns:44px 1fr 160px 120px;
  gap:12px;align-items:center;
  padding:16px 0;
  border-bottom:1px solid var(--cc-line);
}
.cc-edu-row:last-child { border-bottom:none; }
.cc-edu-row-icon {
  width:36px;height:36px;border-radius:50%;flex-shrink:0;
  background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.18);
  display:grid;place-items:center;font-size:14px;
}
.cc-edu-row-body strong { display:block;font-size:12px;color:var(--cc-ink);line-height:1.3; }
.cc-edu-row-body p      { font-size:10px;color:var(--cc-muted);margin:3px 0;line-height:1.5; }
.cc-edu-row-title { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
.cc-edu-badge {
  font-family:var(--cc-mono);font-size:8px;font-weight:700;letter-spacing:.1em;
  padding:2px 7px;border-radius:4px;text-transform:uppercase;flex-shrink:0;
}
.cc-edu-badge.required    { background:rgba(91,155,213,.12);color:#5b9bd5;border:1px solid rgba(91,155,213,.25); }
.cc-edu-badge.recommended { background:rgba(155,114,208,.12);color:var(--cc-violet);border:1px solid rgba(155,114,208,.25); }
.cc-edu-badge.optional    { background:rgba(255,255,255,.05);color:var(--cc-dim);border:1px solid var(--cc-line2); }
.cc-edu-time { font-size:10px;color:var(--cc-dim);display:flex;align-items:center;gap:4px; }
.cc-edu-row-prog { display:flex;flex-direction:column;gap:5px; }
.cc-edu-pct  { font-size:10px;color:var(--cc-muted); }
.cc-edu-ns   { font-size:10px;color:var(--cc-dim); }
.cc-edu-track {
  height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;
}
.cc-edu-fill {
  height:100%;background:var(--cc-gold);border-radius:2px;
  transition:width .4s ease;
}
.cc-edu-cta {
  padding:7px 14px;border-radius:8px;font:inherit;font-size:11px;font-weight:500;
  cursor:pointer;white-space:nowrap;transition:background .1s,color .1s;
}
.cc-edu-cta.continue {
  background:rgba(212,168,75,.12);border:1px solid rgba(212,168,75,.3);color:var(--cc-gold);
}
.cc-edu-cta.continue:hover { background:rgba(212,168,75,.2); }
.cc-edu-cta.start {
  background:rgba(255,255,255,.04);border:1px solid var(--cc-line2);color:var(--cc-muted);
}
.cc-edu-cta.start:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-edu-pathway-wrap {
  padding:20px 24px;
  border-top:1px solid var(--cc-line);
  background:rgba(3,7,17,.3);flex-shrink:0;
}
.cc-edu-steps {
  display:flex;align-items:center;flex-wrap:wrap;gap:6px;
  padding:12px 0;
}
.cc-edu-step {
  display:flex;flex-direction:column;align-items:center;gap:4px;min-width:80px;
}
.cc-edu-step-circ {
  width:32px;height:32px;border-radius:50%;
  display:grid;place-items:center;font-size:12px;
  border:2px solid var(--cc-line2);
  background:rgba(255,255,255,.04);
}
.cc-edu-step.unlocked .cc-edu-step-circ {
  border-color:var(--cc-gold);background:rgba(212,168,75,.12);color:var(--cc-gold);
}
.cc-edu-step.locked .cc-edu-step-circ { color:var(--cc-dim); }
.cc-edu-step-name { font-size:10px;color:var(--cc-text);text-align:center;line-height:1.3; }
.cc-edu-step-st   { font-family:var(--cc-mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase; }
.cc-edu-step.unlocked .cc-edu-step-st { color:var(--cc-gold); }
.cc-edu-step.locked   .cc-edu-step-st { color:var(--cc-dim); }
.cc-step-arrow { color:var(--cc-dim);font-size:16px;flex-shrink:0; }
.cc-edu-pathway-foot {
  display:flex;align-items:center;justify-content:space-between;
  padding-top:8px;gap:12px;
}
.cc-edu-pathway-foot p  { font-size:11px;color:var(--cc-muted);margin:0; }
.cc-edu-pathway-btn {
  padding:7px 14px;border-radius:8px;
  border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);
  color:var(--cc-muted);font:inherit;font-size:11px;cursor:pointer;
  white-space:nowrap;flex-shrink:0;transition:background .1s,color .1s;
}
.cc-edu-pathway-btn:hover { background:rgba(255,255,255,.08);color:var(--cc-text); }
.cc-edu-ev-row {
  display:flex;gap:8px;align-items:flex-start;
  padding:6px 0;border-bottom:1px solid var(--cc-line);
}
.cc-edu-ev-row:last-of-type { border-bottom:none; }
.cc-edu-ev-icon { font-size:13px;color:var(--cc-dim);flex-shrink:0;margin-top:1px; }
.cc-edu-ev-row strong  { display:block;font-size:11px;color:var(--cc-ink);line-height:1.3; }
.cc-edu-ev-row small   { display:block;font-size:10px;color:var(--cc-dim); }
.cc-edu-ev-meta { display:flex;align-items:center;gap:6px;margin-top:2px; }
.cc-edu-ev-tag {
  font-family:var(--cc-mono);font-size:8px;letter-spacing:.1em;
  padding:1px 6px;border-radius:3px;text-transform:uppercase;
  background:rgba(255,255,255,.06);color:var(--cc-dim);border:1px solid var(--cc-line);
}

/* Mobile */
.cc-mob-nav { display:none; }
@media(max-width:1024px) {
  .cc-app {
    grid-template-columns:1fr;
    grid-template-rows:var(--cc-header) minmax(0,1fr) 56px;
    position:relative;height:100svh;
  }
  .cc-sidebar { display:none; }
  .cc-main { grid-column:1; }
  .cc-mob-nav {
    display:flex;align-items:stretch;
    grid-column:1;grid-row:3;
    border-top:1px solid var(--cc-line);
    background:rgba(3,7,17,.97);
  }
  .cc-mob-nav-btn {
    flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:3px;border:none;background:none;
    color:var(--cc-dim);font:inherit;font-size:8px;cursor:pointer;
    transition:color .12s;padding:6px 4px;
  }
  .cc-mob-nav-btn em   { font-style:normal;font-size:7px; }
  .cc-mob-nav-btn.active { color:var(--cc-gold); }
  .cc-briefing {
    grid-template-columns:1fr;
    grid-template-rows:auto auto auto;
    height:auto;
  }
  .cc-briefing-left,.cc-briefing-right { border:none;border-bottom:1px solid var(--cc-line); }
  .cc-methodology { flex-wrap:wrap; }
  .cc-header-right .cc-user-chip { display:none; }
}
`

