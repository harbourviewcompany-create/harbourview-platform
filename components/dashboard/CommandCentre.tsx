'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CountryIntelProfile, PipelineCounts, WantedListing } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import { BriefingRoom } from './pages/BriefingRoom'
import { AccessPathwayPage } from './pages/AccessPathwayPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { EvidencePage } from './pages/EvidencePage'
import { EducationPage } from './pages/EducationPage'
import { RegulatoryPage } from './pages/RegulatoryPage'
import { LocalIntelPage } from './pages/LocalIntelPage'
import { SignalsPage } from './pages/SignalsPage'
import { WatchlistPage } from './pages/WatchlistPage'
import { SettingsPage } from './pages/SettingsPage'

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
        return <AccessPathwayPage {...sharedProps} countryIntel={countryIntel} pipeline={pipeline} />
      case 'marketplace':
        return <MarketplacePage {...sharedProps} marketplaceRows={marketplaceRows} wantedCount={wantedCount} wantedListings={wantedListings} pipeline={pipeline} />
      case 'evidence':
        return <EvidencePage {...sharedProps} countryIntel={countryIntel} />
      case 'education':
        return <EducationPage {...sharedProps} eduCategories={eduCategories} />
      case 'regulatory':
        return <RegulatoryPage {...sharedProps} countryIntel={countryIntel} signals={signals} />
      case 'local-intel':
        return <LocalIntelPage {...sharedProps} countryIntel={countryIntel} />
      case 'signals':
        return <SignalsPage {...sharedProps} signals={signals} />
      case 'watchlist':
        return <WatchlistPage {...sharedProps} />
      case 'settings':
        return <SettingsPage {...sharedProps} />
      default:
        return null
    }
  }, [activePage, country, region, roleLabel, countryIntel, signals, pipeline, marketplaceRows, wantedCount, wantedListings, eduCategories])

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
  .cc-header-right .cc-user-chip { display:none; }
}
`

