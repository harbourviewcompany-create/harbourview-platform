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

type RequestState = 'idle' | 'queued' | 'unavailable'

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

const VIEW_TAB_LABELS: Record<MarketView, string> = {
  cannabis:      'Listings',
  equipment:     'Equipment',
  consumables:   'Consumables',
  'new-products':'New Products',
  services:      'Services',
  opportunities: 'Opportunities',
  wanted:        'Wanted Demand',
}

// ── BriefingRoom page ─────────────────────────────────────────────────────────

const PROGRAM_STATUS_FIELDS = [
  { key: 'program_status',    label: 'Program Status'    },
  { key: 'patient_access',    label: 'Patient Access'    },
  { key: 'physician_access',  label: 'Physician Access'  },
  { key: 'market_dynamics',   label: 'Market Dynamics'   },
  { key: 'regulatory_outlook',label: 'Regulatory Outlook'},
] as const

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
}: {
  country:     { iso2: string; label: string }
  region:      string
  countryIntel?: CountryIntelProfile | null
  signals:     DashboardSignal[]
}) {
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
              <strong>{countryIntel?.review_status ?? 'Stable'}</strong>
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
            focusedCountryIso2={undefined}
            activeLayerId="country_select"
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
              { label: 'California',  status: 'Active Program',  star: false },
              { label: 'New York',    status: 'Program Expanding', star: false },
              { label: 'Texas',       status: 'Legislation Pending', star: false },
              { label: 'Illinois',    status: 'Market Maturing', star: false },
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
        return <BriefingRoom country={country} region={region} countryIntel={countryIntel} signals={signals} />
      case 'access-pathway':
        return <ScaffoldPage title="Access Pathway" {...sharedProps} />
      case 'marketplace':
        return <ScaffoldPage title="Marketplace & Access" {...sharedProps} />
      case 'evidence':
        return <ScaffoldPage title="Evidence & Sources" {...sharedProps} />
      case 'education':
        return <ScaffoldPage title="Education Hub" {...sharedProps} />
      case 'regulatory':
        return <ScaffoldPage title="Regulatory Watch" {...sharedProps} />
      case 'local-intel':
        return <ScaffoldPage title="Local Intel" {...sharedProps} />
      case 'signals':
        return <ScaffoldPage title="Signals" {...sharedProps} />
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
              aria-pressed={activePage === item.id}
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

