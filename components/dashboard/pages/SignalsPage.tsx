'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { WatchlistData } from '@/lib/dashboard/dashboardLiveData'
import type { CommandPage } from '../CommandCentre'
import { deriveImpact, derivePolicyArea, deriveSignalGroup, SIG_GROUP_ICONS, SIG_GROUP_ORDER, type SignalGroup } from '../desktop/signalHelpers'

const SignalSemanticSearch = dynamic(() => import('@/components/dashboard/SignalSemanticSearch'))
const DesktopDecisionIntelBridge = dynamic(() =>
  import('@/components/dashboard/DesktopDecisionIntelBridge').then(m => ({ default: m.DesktopDecisionIntelBridge })),
)


function signalProvenance(s: DashboardSignal): { source: string; when: string; basis?: string } {
  const source = s.sourceLabel?.trim() || s.tag?.label || 'Harbourview Intelligence'
  const when =
    s.timeAgo ||
    (s.sourcePublishedAt && !Number.isNaN(Date.parse(s.sourcePublishedAt))
      ? new Date(s.sourcePublishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null) ||
    (s.observedAt && !Number.isNaN(Date.parse(s.observedAt))
      ? `Observed ${new Date(s.observedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : null) ||
    (s.publishedAt && !Number.isNaN(Date.parse(s.publishedAt))
      ? new Date(s.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null) ||
    '—'
  return { source, when, basis: s.freshnessBasis }
}

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


// ── SignalsPage ────────────────────────────────────────────────────────────────

export const SignalsPage = React.memo(function SignalsPage({
  country, region, role, signals, digestSignals, watchlistData, onPageChange, initialShowSearch = false, decisionIntelAccess,
}: {
  country: { iso2: string; label: string }
  region:  string
  role:    string
  signals: DashboardSignal[]
  digestSignals?: DashboardSignal[]
  watchlistData?: WatchlistData
  onPageChange?: (page: CommandPage) => void
  initialShowSearch?: boolean
  decisionIntelAccess?: FeatureAccess
}) {
  const [filterImpact,  setFilterImpact]  = useState('all')
  const [filterConf,    setFilterConf]    = useState('all')
  const [filterType,    setFilterType]    = useState('all')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)
  const [signalsTab, setSignalsTab] = useState<'feed' | 'search' | 'dossiers'>(initialShowSearch ? 'search' : 'feed')
  const dossierSignals = React.useMemo(() => {
    const byId = new Map<string, DashboardSignal>()
    for (const signal of [...signals, ...(digestSignals ?? [])]) {
      const key = `${signal.id}:${signal.decisionIntelEventId ?? ''}`
      if (!byId.has(key)) byId.set(key, signal)
    }
    return [...byId.values()].filter(s => Boolean(s.decisionIntelEventId))
  }, [signals, digestSignals])
  const PAGE_SIZE = 6

  // ── Live signal fetch ──────────────────────────────────────────────────────
  // SSR props give instant first paint; this effect hydrates with the full
  // 803-row signals table, country-filtered, on mount.
  const [liveSignals, setLiveSignals] = useState<DashboardSignal[] | null>(null)
  const [liveTotal,   setLiveTotal]   = useState<number | null>(null)
  const [isFetching,  setIsFetching]  = useState(false)

  // Effective signals: live (full dataset) when available, SSR props as fallback
  const effectiveSignals = liveSignals ?? signals

  React.useEffect(() => {
    let cancelled = false
    async function fetchLiveSignals() {
      setIsFetching(true)
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (country.label) params.set('country', country.label)
        const res = await fetch(`/api/dashboard/signals?${params.toString()}`)
        if (!res.ok || cancelled) return
        const json = await res.json() as { signals: DashboardSignal[]; total: number; source: string }
        if (!cancelled && Array.isArray(json.signals) && json.signals.length > 0) {
          setLiveSignals(json.signals)
          setLiveTotal(json.total)
        }
      } catch {
        // Keep SSR props on fetch failure — silent degradation
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    fetchLiveSignals()
    return () => { cancelled = true }
  }, [country.label])

  const filtered = useMemo(() => effectiveSignals.filter(s => {
    const imp = deriveImpact(s.confidence)
    if (filterImpact !== 'all' && imp.toLowerCase() !== filterImpact) return false
    if (filterConf === 'high'   && s.confidence < 80) return false
    if (filterConf === 'medium' && (s.confidence < 65 || s.confidence >= 80)) return false
    if (filterConf === 'low'    && s.confidence >= 65) return false
    if (filterType !== 'all' && deriveSignalGroup(s.title).toLowerCase().replace(/ /g, '_') !== filterType) return false
    return true
  }), [effectiveSignals, filterImpact, filterConf, filterType])

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

  // Reset to page 1 whenever filters change
  const prevFilters = React.useRef({ filterImpact, filterConf, filterType })
  if (prevFilters.current.filterImpact !== filterImpact ||
      prevFilters.current.filterConf   !== filterConf   ||
      prevFilters.current.filterType   !== filterType) {
    prevFilters.current = { filterImpact, filterConf, filterType }
    setCurrentPage(1)
  }

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const pagedGroups = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    const end   = start + PAGE_SIZE
    let count = 0
    const result: Partial<Record<SignalGroup, DashboardSignal[]>> = {}
    for (const g of activeGroups) {
      const rows = grouped[g]!
      if (count >= end) break
      const slice = rows.slice(Math.max(0, start - count), end - count)
      count += rows.length
      if (slice.length) result[g] = slice
    }
    return result
  }, [grouped, activeGroups, currentPage, PAGE_SIZE])
  const nextBest     = effectiveSignals.find(s => s.confidence >= 80)

  const SAVED_FILTERS = useMemo(() => {
    const rules = watchlistData?.rules ?? []
    if (rules.length > 0) {
      const TYPE_LABELS: Record<string, string> = {
        jurisdiction: 'Jurisdiction Watch', signal: 'Signal Feed',
        pathway: 'Access Pathway',          policy: 'Policy Monitor',
        marketplace: 'Market Watch',        source: 'Source Monitor',
      }
      return rules.slice(0, 3).map(r => ({
        label: TYPE_LABELS[r.rule_type] ?? r.rule_type.replace(/_/g, ' ') + ' Watch',
        tags:  r.keywords.slice(0, 2).join(' · ') || r.rule_type,
      }))
    }
    return [
      { label: `${country.label} Regulatory Watch`, tags: 'Regulatory · High Impact' },
      { label: 'Cultivation Ops',        tags: 'Supply Chain · Testing' },
      { label: 'Export Opportunities',   tags: 'Export · Market Access' },
    ]
  }, [watchlistData, country])

  const HIGH_WATCH = useMemo(() => {
    const areaCount: Record<string, number> = {}
    effectiveSignals.forEach(s => {
      const a = derivePolicyArea(s.title)
      areaCount[a] = (areaCount[a] ?? 0) + 1
    })
    const entries = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (entries.length > 0) return entries.map(([label, n]) => ({ label, n }))
    return [
      { label: 'License Caps & Moratorium',  n: 2 },
      { label: 'Testing Standards',          n: 3 },
      { label: 'Water & Environmental Rules', n: 1 },
      { label: 'Federal Rescheduling',       n: 2 },
      { label: 'Export Market Access',       n: 4 },
    ]
  }, [effectiveSignals])

  return (
    <div className="cc-page cc-two-col-page">
      {/* ── Main feed ───────────────────────────────────────── */}
      <div className="cc-two-main" style={{ position: 'relative', overflow: 'hidden' }}>
        {selectedSignal && (() => {
          const imp = deriveImpact(selectedSignal.confidence)
          const impColor = selectedSignal.confidence >= 80 ? 'var(--cc-green)' : selectedSignal.confidence >= 65 ? 'var(--cc-amber)' : 'var(--cc-red)'
          const grp = deriveSignalGroup(selectedSignal.title)
          return (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--cc-page-bg, #0b1929)', zIndex: 10, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <button type="button" onClick={() => setSelectedSignal(null)} style={{ alignSelf: 'flex-start', margin: '16px 20px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,168,75,.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← INTELLIGENCE FEED
              </button>
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span className={`cc-imp-badge ${imp.toLowerCase()}`}>{imp}</span>
                  <span style={{ fontSize: '10px', color: 'var(--cc-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{grp}</span>
                  <span style={{ fontSize: '10px', color: 'var(--cc-muted)', marginLeft: 'auto' }}>{selectedSignal.timeAgo}</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cc-text)', lineHeight: 1.3, marginBottom: 8 }}>{selectedSignal.title}</h2>
                {selectedSignal.market && (
                  <p style={{ fontSize: '11px', color: 'var(--cc-muted)', marginBottom: 16 }}>
                    {selectedSignal.market}{region ? ` · ${region}` : ''}
                  </p>
                )}
              </div>
              <div className="cc-jx-fields" style={{ margin: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">◎</span>
                  <div><small>Confidence</small><strong style={{ color: impColor }}>{selectedSignal.confidence}%</strong></div>
                </div>
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">≋</span>
                  <div><small>Impact</small><strong>{imp}</strong></div>
                </div>
                {selectedSignal.market && (
                  <div className="cc-jx-field">
                    <span className="cc-jx-field-icon">◫</span>
                    <div><small>Jurisdiction</small><strong>{selectedSignal.market}</strong></div>
                  </div>
                )}
                <div className="cc-jx-field">
                  <span className="cc-jx-field-icon">◷</span>
                  <div><small>Source</small><strong>{signalProvenance(selectedSignal).source}</strong></div>
                  <div><small>When</small><strong title={selectedSignal.freshnessBasis ? `Basis: ${selectedSignal.freshnessBasis}` : undefined}>{signalProvenance(selectedSignal).when}</strong></div>
                  {selectedSignal.sourceUrl ? (
                    <div><small>Original</small><strong><a href={selectedSignal.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cc-gold)' }}>Open source</a></strong></div>
                  ) : null}
                </div>
              </div>
              {selectedSignal.commercialImpact && (
                <div style={{ margin: '0 20px 12px', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${impColor}` }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cc-champagne)', marginBottom: 6 }}>Commercial impact</p>
                  <p style={{ fontSize: '12px', color: 'rgba(243,240,234,0.75)', lineHeight: 1.55 }}>{selectedSignal.commercialImpact}</p>
                </div>
              )}
              <div style={{ margin: '0 20px 12px', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cc-champagne)', marginBottom: 6 }}>Why it matters</p>
                <p style={{ fontSize: '12px', color: 'rgba(243,240,234,0.65)', lineHeight: 1.55 }}>
                  This signal affects operations in {selectedSignal.market || country.label}{region ? ` · ${region}` : ''}. {imp === 'High' ? 'High-impact signals indicate regulatory or market changes requiring immediate attention.' : imp === 'Medium' ? 'Medium-impact signals warrant monitoring and may influence near-term decisions.' : 'Low-impact signals provide contextual intelligence for strategic planning.'}
                </p>
              </div>
              <div style={{ margin: '0 20px 20px', display: 'flex', gap: 8 }}>
                <button className="cc-sig-brief" style={{ flex: 1, padding: '8px 0', borderRadius: 10 }} onClick={() => onPageChange?.('watchlist')}>↗ Add to watchlist</button>
                <button className="cc-sig-brief" style={{ flex: 1, padding: '8px 0', borderRadius: 10 }} onClick={() => setSelectedSignal(null)}>Back to feed</button>
              </div>
            </div>
          )
        })()}
        <div className="cc-inner-header">
          <h2>{country.label}{region ? ` ${region}` : ''}{role ? ` ${role}` : ''} Signals</h2>
          <p>Intelligence feed surfacing regulatory, market, export, and operational signals relevant to the resolved jurisdiction{role ? ' and your role' : ''}.</p>
          <div className="cc-signals-tabs">
            <button type="button" className="cc-signals-search-toggle" aria-pressed={signalsTab === 'feed'} onClick={() => setSignalsTab('feed')}>
              Feed
            </button>
            <button type="button" className="cc-signals-search-toggle" aria-pressed={signalsTab === 'search'} onClick={() => setSignalsTab('search')}>
              ◈ Semantic search
            </button>
            {dossierSignals.length > 0 && (
              <button type="button" className="cc-signals-search-toggle" aria-pressed={signalsTab === 'dossiers'} onClick={() => setSignalsTab('dossiers')}>
                Dossiers
              </button>
            )}
          </div>
        </div>

        {signalsTab === 'search' ? (
          <SignalSemanticSearch />
        ) : signalsTab === 'dossiers' ? (
          <DesktopDecisionIntelBridge signals={dossierSignals} access={decisionIntelAccess} />
        ) : (
        <>
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
          {(Object.keys(pagedGroups) as SignalGroup[]).map(grp => (
            <div key={grp} className="cc-sig-group">
              <div className="cc-sig-group-hd">
                <span>{SIG_GROUP_ICONS[grp]}</span>
                {grp}
              </div>
              {pagedGroups[grp]!.map((s, i) => {
                const imp  = deriveImpact(s.confidence)
                const circ = 87.96
                return (
                  <div key={i} className="cc-sig-row">
                    <span className={`cc-sig-dot ${imp.toLowerCase()}`} />
                    <div className="cc-sig-body">
                      <strong>{s.title}</strong>
                      <small>
                        {s.market ? `${s.market}${region ? ` · ${region}` : ''} · ` : ''}
                        {signalProvenance(s).when}
                      </small>
                      <small style={{ display: 'block', marginTop: 2, color: 'rgba(245,240,232,.4)' }}>
                        Source: {signalProvenance(s).source}
                        {s.sourceUrl ? ' · linked' : ''}
                      </small>
                    </div>
                    <div className="cc-sig-why">
                      <em>Why it matters</em>
                      <span>Affects operations in {s.market || country.label}{region ? ` · ${region}` : ''}</span>
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
                      <em>When</em>
                      <span title={s.freshnessBasis ? `Basis: ${s.freshnessBasis}` : undefined}>{signalProvenance(s).when}</span>
                    </div>
                    <div className="cc-sig-acts">
                      <button className="cc-sig-brief" onClick={() => setSelectedSignal(s)}>Open brief</button>
                      <button className="cc-sig-watch" onClick={() => onPageChange?.('watchlist')}>↗ Watchlist</button>
                      <button className="cc-sig-watch" onClick={() => onPageChange?.('regulatory')}>Regulatory</button>
                      <button className="cc-sig-watch" onClick={() => onPageChange?.('marketplace')}>Marketplace</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cc-feed-footer">
          <span>
            Showing {Math.min(currentPage * PAGE_SIZE, filtered.length)}&nbsp;of&nbsp;{filtered.length}
            {filtered.length !== effectiveSignals.length ? ` (${effectiveSignals.length} total)` : ''}
            {liveTotal !== null && liveTotal > effectiveSignals.length ? ` · ${liveTotal} in database` : ''}
            {' '}signals
          </span>
          <span className="cc-auto-refresh">
            {isFetching
              ? <><span className="cc-refresh-dot" style={{ background: 'var(--cc-amber)' }}/>Refreshing…</>
              : liveSignals !== null
                ? <><span className="cc-refresh-dot"/>Live · {liveTotal ?? effectiveSignals.length} signals</>
                : <><span className="cc-refresh-dot"/>Auto-refresh on · Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
            }
          </span>
          <div className="cc-pagination">
            <button className="cc-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i+1 : currentPage <= 3 ? i+1 : currentPage + i - 2
              if (pg < 1 || pg > totalPages) return null
              return <button key={pg} className={`cc-page-btn${currentPage===pg?' active':''}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
            })}
            <button className="cc-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>›</button>
          </div>
        </div>
        </>
        )}
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
          <button className="cc-right-link" onClick={() => onPageChange?.('watchlist')}>Manage saved filters →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">HIGH-WATCH TOPICS</div>
          {HIGH_WATCH.map(t => (
            <div key={t.label} className="cc-topic-row">
              <span>{t.label}</span>
              <span className="cc-topic-count">{t.n}</span>
            </div>
          ))}
          <button className="cc-right-link" onClick={() => onPageChange?.('signals')}>View all topics →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">SIGNAL METHODOLOGY</div>
          <p className="cc-right-prose">Signals are sourced from regulatory releases, market data, trade intelligence, and verified industry sources. Each signal is scored for impact and confidence based on source credibility and recency.</p>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">REGULATORY TRACKING</div>
          <p className="cc-right-prose">Monitor legislative changes, consultation periods, and enforcement actions driving signal activity in {country.label}.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>Open Regulatory Watch →</button>
        </div>

        <div className="cc-right-section">
          <div className="cc-right-head">WATCHLIST</div>
          <p className="cc-right-prose">Saved topics and jurisdictions — track changes across your priority markets without re-filtering each session.</p>
          <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('watchlist')}>Open Watchlist →</button>
        </div>

        {nextBest && (
          <div className="cc-right-section">
            <div className="cc-right-head">NEXT BEST ACTION</div>
            <p className="cc-right-prose">{nextBest.title.length > 90 ? nextBest.title.slice(0,90)+'…' : nextBest.title}</p>
            <button className="cc-nba-btn full" style={{ marginTop: '8px' }} onClick={() => onPageChange?.('regulatory')}>View Regulatory Context →</button>
          </div>
        )}
      </aside>
    </div>
  )
})
