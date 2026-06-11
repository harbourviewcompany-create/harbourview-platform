'use client'

import React, { useMemo, useState } from 'react'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '../CommandCentre'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MarketplacePageProps {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  roleLabel:    string
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  signals:      DashboardSignal[]
  wantedCount:  number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis',      label: 'Listings'      },
  { id: 'wanted',        label: 'Wanted Demand' },
  { id: 'opportunities', label: 'Buyer Routes'  },
  { id: 'equipment',     label: 'Equipment'     },
  { id: 'consumables',   label: 'Consumables'   },
  { id: 'services',      label: 'Services'      },
  { id: 'new-products',  label: 'Opportunities' },
]

const ACCESS_ROUTE_OPTS = ['All Access Routes', 'Mediated', 'Direct', 'Introduced']
const JURISDICTION_OPTS = ['All Jurisdictions', 'EU', 'United States', 'Canada', 'Global']
const VERIF_OPTS        = ['All Verification Status', 'Verified', 'Partially Verified', 'Pending Review']

// Derive confidence % from trust pipe string
function trustToConfidence(trust: string): number {
  const items  = trust.split('|')
  const passed = items.filter(t => t.endsWith(':ok')).length
  return Math.round((passed / Math.max(items.length, 1)) * 100)
}

// Derive jurisdiction label from type label (e.g. "Cannabis Inventory · US" → "United States")
function typeToJurisdiction(typeLabel: string): string {
  const map: Record<string, string> = {
    US: 'United States', CA: 'Canada', EU: 'European Union',
    GB: 'United Kingdom', DE: 'Germany', NL: 'Netherlands',
  }
  const code = typeLabel.split('·')[1]?.trim()
  return code ? (map[code] ?? code) : 'Global'
}

// Derive access route from spec class + action
function specToRoute(spec: string, action: string): { label: string; sub: string } {
  if (action.includes('request')) return { label: 'Mediated', sub: 'Buyer Intro' }
  if (action.includes('distribution')) return { label: 'Mediated', sub: 'Offtake' }
  if (action.includes('introduction')) return { label: 'Introduced', sub: 'Collaboration' }
  if (spec === 'service') return { label: 'Direct', sub: 'Transaction' }
  return { label: 'Mediated', sub: 'Standard' }
}

// Derive verification from trust string
function trustToVerif(trust: string): { label: string; status: 'verified' | 'partial' | 'pending' } {
  const items  = trust.split('|')
  const passed = items.filter(t => t.endsWith(':ok')).length
  const ratio  = passed / Math.max(items.length, 1)
  if (ratio >= 0.9) return { label: 'Verified',           status: 'verified' }
  if (ratio >= 0.6) return { label: 'Partially Verified', status: 'partial'  }
  return              { label: 'Pending Review',          status: 'pending'  }
}

const ROWS_PER_PAGE = 5

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceRing({ pct }: { pct: number }) {
  const r  = 14
  const cx = r + 4 * 2 // some padding not needed, just use 18
  const r2 = 13
  const circ = 2 * Math.PI * r2
  const color = pct >= 75 ? '#4caf82' : pct >= 60 ? '#e6a533' : '#e05555'
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="mp-ring">
      <circle cx="20" cy="20" r={r2} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3.5" />
      <circle
        cx="20" cy="20" r={r2} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeDasharray={`${circ * pct / 100} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="600" fill={color}
        fontFamily="'JetBrains Mono','Fira Mono',monospace">
        {pct}%
      </text>
    </svg>
  )
}

function VerifBadge({ status, label }: { status: 'verified' | 'partial' | 'pending'; label: string }) {
  const cls = `mp-verif mp-verif--${status}`
  const icon = status === 'verified' ? '✓' : status === 'partial' ? '◑' : '◌'
  return (
    <span className={cls}>
      {icon} {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MarketplacePage = React.memo(function MarketplacePage({
  country, region, role, roleLabel, marketplaceRows = {}, signals, wantedCount,
}: MarketplacePageProps) {
  const [activeTab,    setActiveTab]    = useState<MarketView>('cannabis')
  const [search,       setSearch]       = useState('')
  const [accessFilter, setAccessFilter] = useState('All Access Routes')
  const [jurisFilter,  setJurisFilter]  = useState('All Jurisdictions')
  const [verifFilter,  setVerifFilter]  = useState('All Verification Status')
  const [page,         setPage]         = useState(1)

  const rawRows = useMemo(() => marketplaceRows[activeTab] ?? [], [marketplaceRows, activeTab])

  const filtered = useMemo(() => {
    let rows = rawRows
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r[2].toLowerCase().includes(q) || r[3].toLowerCase().includes(q) || r[1].toLowerCase().includes(q))
    }
    if (jurisFilter !== 'All Jurisdictions') {
      rows = rows.filter(r => typeToJurisdiction(r[1]).includes(jurisFilter))
    }
    if (verifFilter !== 'All Verification Status') {
      rows = rows.filter(r => trustToVerif(r[5]).label === verifFilter)
    }
    if (accessFilter !== 'All Access Routes') {
      rows = rows.filter(r => specToRoute(r[0], r[6]).label === accessFilter)
    }
    return rows
  }, [rawRows, search, jurisFilter, verifFilter, accessFilter])

  const pageCount  = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const pageRows   = useMemo(() =>
    filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [filtered, page],
  )

  // Reset page on filter/tab change
  const handleTabChange = (tab: MarketView) => { setActiveTab(tab); setPage(1) }
  const handleSearch    = (v: string)        => { setSearch(v);     setPage(1) }

  const totalCount = filtered.length || wantedCount

  // Related signals: top 3 by confidence
  const relatedSignals = useMemo(() =>
    [...signals].sort((a, b) => b.confidence - a.confidence).slice(0, 3),
    [signals],
  )

  return (
    <div className="mp-root">
      <style>{CSS}</style>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="mp-main">

        {/* Page header */}
        <div className="mp-header">
          <div>
            <h1 className="mp-title">
              {country.label}{region ? ` ${region}` : ''} {roleLabel} Marketplace &amp; Access
            </h1>
            <p className="mp-subtitle">
              Mediated market access to export-ready and compliance-gated opportunities.
              Requests are reviewed by Harbourview&rsquo;s market access team.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mp-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`mp-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
              {t.id === 'wanted' && wantedCount > 0 && (
                <span className="mp-tab-count">{wantedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="mp-filters">
          <SimpleSelect value={jurisFilter}  options={JURISDICTION_OPTS} onChange={v => { setJurisFilter(v);  setPage(1) }} />
          <SimpleSelect value={accessFilter} options={ACCESS_ROUTE_OPTS} onChange={v => { setAccessFilter(v); setPage(1) }} />
          <SimpleSelect value={verifFilter}  options={VERIF_OPTS}        onChange={v => { setVerifFilter(v);  setPage(1) }} />
          <div className="mp-search-wrap">
            <span className="mp-search-icon">🔍</span>
            <input
              className="mp-search"
              placeholder="Search listings…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <button className="mp-filter-btn">⊟ Filters</button>
        </div>

        {/* Table */}
        {pageRows.length > 0 ? (
          <>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>OPPORTUNITY</th>
                    <th>CATEGORY</th>
                    <th>JURISDICTION</th>
                    <th>VERIFICATION</th>
                    <th>ACCESS ROUTE</th>
                    <th>CONFIDENCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => {
                    const verif  = trustToVerif(row[5])
                    const route  = specToRoute(row[0], row[6])
                    const juris  = typeToJurisdiction(row[1])
                    const conf   = trustToConfidence(row[5])
                    const catTag = row[1].split('·')[0].trim()
                    return (
                      <tr key={i} className="mp-row">
                        <td className="mp-cell-opp">
                          <div className="mp-opp-icon">{row[0] === 'supply' ? '🌿' : row[0] === 'equip' ? '⚙️' : '🔷'}</div>
                          <div className="mp-opp-body">
                            <strong>{row[2]}</strong>
                            <small>{row[3].slice(0, 72)}{row[3].length > 72 ? '…' : ''}</small>
                            <span className="mp-cat-pill">{catTag}</span>
                          </div>
                        </td>
                        <td className="mp-cell-cat">
                          <span className="mp-cat-pill">{catTag}</span>
                        </td>
                        <td className="mp-cell-juris">
                          <span className="mp-juris-label">{juris}</span>
                        </td>
                        <td className="mp-cell-verif">
                          <VerifBadge {...verif} />
                        </td>
                        <td className="mp-cell-route">
                          <span className="mp-route-label">{route.label}</span>
                          <small className="mp-route-sub">{route.sub}</small>
                        </td>
                        <td className="mp-cell-conf">
                          <ConfidenceRing pct={conf} />
                        </td>
                        <td className="mp-cell-actions">
                          <button className="mp-action-btn mp-action-primary">{row[6]}</button>
                          <button className="mp-action-btn">Watch</button>
                          <button className="mp-action-btn">Open requirements</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mp-pagination">
              <span className="mp-pag-count">
                Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} opportunities
              </span>
              <div className="mp-pag-controls">
                <button
                  className="mp-pag-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >‹</button>
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                  const n = i + 1
                  return (
                    <button
                      key={n}
                      className={`mp-pag-btn${page === n ? ' active' : ''}`}
                      onClick={() => setPage(n)}
                    >{n}</button>
                  )
                })}
                {pageCount > 5 && <span className="mp-pag-ellipsis">…</span>}
                {pageCount > 5 && (
                  <button
                    className={`mp-pag-btn${page === pageCount ? ' active' : ''}`}
                    onClick={() => setPage(pageCount)}
                  >{pageCount}</button>
                )}
                <button
                  className="mp-pag-btn"
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => p + 1)}
                >›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="mp-empty">
            <div className="mp-empty-icon">⊞</div>
            <strong>No approved listings yet</strong>
            <p>
              {search
                ? `No results for "${search}" in ${TABS.find(t => t.id === activeTab)?.label ?? activeTab}`
                : `No approved listings in this category for ${country.label}${region ? ` · ${region}` : ''}`
              }
            </p>
            {!search && (
              <button className="mp-empty-btn" onClick={() => handleTabChange('wanted')}>
                Browse Wanted Demand →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <aside className="mp-right">

        {/* Access requirements */}
        <section className="mp-right-section">
          <header className="mp-right-head">MARKETPLACE ACCESS REQUIREMENTS</header>
          <div className="mp-req-list">
            {[
              { label: `${country.label} Operator Licence`,    status: 'verified', note: 'Verified' },
              { label: 'Facility Registration & Site Plan',    status: 'verified', note: 'Verified' },
              { label: 'Standard Operating Procedures',        status: 'verified', note: 'Verified' },
              { label: 'Traceability System Documentation',    status: 'pending',  note: 'Pending Review' },
            ].map(r => (
              <div key={r.label} className="mp-req-row">
                <span className={`mp-req-icon mp-req-icon--${r.status}`}>
                  {r.status === 'verified' ? '✓' : '◌'}
                </span>
                <div className="mp-req-body">
                  <strong>{r.label}</strong>
                  <small>{r.note}</small>
                </div>
              </div>
            ))}
          </div>
          <a href="#" className="mp-right-link">View all requirements →</a>
        </section>

        {/* Verification gaps */}
        <section className="mp-right-section">
          <header className="mp-right-head">VERIFICATION GAPS</header>
          <div className="mp-gap-list">
            {[
              { label: 'EU-GMP Certification',  note: 'Required for EU export routes' },
              { label: 'Pest Management Plan',   note: 'Requires export-level detail' },
              { label: 'Residual Testing SOP',   note: 'Needs method verification' },
            ].map(g => (
              <div key={g.label} className="mp-gap-row">
                <span className="mp-gap-icon">⚠</span>
                <div>
                  <strong>{g.label}</strong>
                  <small>{g.note}</small>
                </div>
              </div>
            ))}
          </div>
          <a href="#" className="mp-right-link">Address gaps →</a>
        </section>

        {/* Counterparty status */}
        <section className="mp-right-section">
          <header className="mp-right-head">COUNTERPARTY STATUS</header>
          <div className="mp-cpty-list">
            {[
              { label: 'Harbourview Due Diligence', note: 'Completed' },
              { label: 'Sanctions & Watchlist Screen', note: 'Clear' },
              { label: 'Financial Standing', note: 'Good' },
            ].map(c => (
              <div key={c.label} className="mp-cpty-row">
                <span className="mp-cpty-icon">✓</span>
                <div>
                  <strong>{c.label}</strong>
                  <small>{c.note}</small>
                </div>
              </div>
            ))}
          </div>
          <a href="#" className="mp-right-link">View counterparty profile →</a>
        </section>

        {/* Related signals */}
        {relatedSignals.length > 0 && (
          <section className="mp-right-section">
            <header className="mp-right-head">RELATED SIGNALS</header>
            <div className="mp-signal-list">
              {relatedSignals.map(s => (
                <div key={s.id} className="mp-signal-row">
                  <span
                    className="mp-signal-dot"
                    style={{ background: s.confidence >= 75 ? '#4caf82' : '#e6a533' }}
                  />
                  <div>
                    <strong>{s.title}</strong>
                    <small>{s.timeAgo} · {s.tag.label}</small>
                  </div>
                </div>
              ))}
            </div>
            <a href="#" className="mp-right-link">View all signals →</a>
          </section>
        )}

      </aside>
    </div>
  )
})

// ── SimpleSelect ──────────────────────────────────────────────────────────────

function SimpleSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="mp-select-wrap">
      <select
        className="mp-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="mp-select-arrow">▾</span>
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
.mp-root {
  display:grid;
  grid-template-columns:minmax(0,1fr) 280px;
  height:100%;
  overflow:hidden;
  animation:mpIn .3s ease;
}
@keyframes mpIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

/* ── Main ── */
.mp-main {
  display:flex;flex-direction:column;
  overflow:hidden;
  border-right:1px solid rgba(255,255,255,.08);
}
.mp-header {
  padding:24px 28px 0;
  flex-shrink:0;
}
.mp-title {
  font-family:'Georgia',serif;font-size:22px;font-weight:400;
  color:#f5f0e8;margin:0 0 6px;letter-spacing:-.01em;
}
.mp-subtitle {
  font-size:12px;color:rgba(245,240,232,.5);margin:0;line-height:1.6;
}

/* Tabs */
.mp-tabs {
  display:flex;gap:0;
  border-bottom:1px solid rgba(255,255,255,.08);
  padding:0 28px;margin-top:16px;
  flex-shrink:0;overflow-x:auto;
}
.mp-tab {
  padding:10px 16px;
  border:none;border-bottom:2px solid transparent;
  background:none;color:rgba(245,240,232,.45);
  font:inherit;font-size:12px;font-weight:500;
  cursor:pointer;white-space:nowrap;
  transition:color .15s,border-color .15s;
  display:flex;align-items:center;gap:6px;
  margin-bottom:-1px;
}
.mp-tab:hover { color:rgba(245,240,232,.8); }
.mp-tab.active {
  color:#d4a84b;
  border-bottom-color:#d4a84b;
}
.mp-tab-count {
  background:rgba(212,168,75,.15);color:#d4a84b;
  font-size:9px;padding:1px 5px;border-radius:10px;
  font-family:'JetBrains Mono','Fira Mono',monospace;
}

/* Filters */
.mp-filters {
  display:flex;align-items:center;gap:8px;
  padding:12px 28px;border-bottom:1px solid rgba(255,255,255,.08);
  flex-shrink:0;flex-wrap:wrap;
}
.mp-select-wrap {
  position:relative;flex-shrink:0;
}
.mp-select {
  appearance:none;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  border-radius:8px;
  padding:6px 28px 6px 10px;
  color:rgba(245,240,232,.75);
  font:inherit;font-size:11px;cursor:pointer;
  transition:border-color .12s;
}
.mp-select:hover { border-color:rgba(255,255,255,.2); }
.mp-select-arrow {
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  color:rgba(245,240,232,.4);font-size:9px;pointer-events:none;
}
.mp-search-wrap {
  flex:1;min-width:160px;position:relative;
}
.mp-search-icon {
  position:absolute;left:9px;top:50%;transform:translateY(-50%);
  font-size:11px;opacity:.5;pointer-events:none;
}
.mp-search {
  width:100%;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);border-radius:8px;
  padding:6px 10px 6px 28px;
  color:rgba(245,240,232,.8);font:inherit;font-size:11px;
  outline:none;transition:border-color .12s;
}
.mp-search:focus { border-color:rgba(212,168,75,.4); }
.mp-search::placeholder { color:rgba(245,240,232,.3); }
.mp-filter-btn {
  padding:6px 12px;border-radius:8px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.6);font:inherit;font-size:11px;
  cursor:pointer;transition:background .12s,color .12s;white-space:nowrap;
}
.mp-filter-btn:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

/* Table */
.mp-table-wrap {
  flex:1;overflow-y:auto;overflow-x:auto;
  padding:0;
}
.mp-table {
  width:100%;border-collapse:collapse;font-size:12px;
}
.mp-table th {
  padding:10px 16px;
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(245,240,232,.35);font-weight:500;
  border-bottom:1px solid rgba(255,255,255,.07);
  text-align:left;white-space:nowrap;
  position:sticky;top:0;background:#040914;z-index:2;
}
.mp-table th:first-child { padding-left:28px; }
.mp-table th:last-child  { padding-right:28px; }
.mp-row {
  border-bottom:1px solid rgba(255,255,255,.05);
  transition:background .1s;
}
.mp-row:hover { background:rgba(255,255,255,.025); }
.mp-row td {
  padding:14px 16px;vertical-align:top;
}
.mp-row td:first-child { padding-left:28px; }
.mp-row td:last-child  { padding-right:28px; }

/* Opportunity cell */
.mp-cell-opp { display:flex;gap:10px;align-items:flex-start;min-width:260px; }
.mp-opp-icon {
  width:34px;height:34px;border-radius:8px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);
  display:grid;place-items:center;font-size:15px;flex-shrink:0;
}
.mp-opp-body { display:flex;flex-direction:column;gap:3px; }
.mp-opp-body strong { font-size:12px;font-weight:600;color:#f5f0e8;line-height:1.2; }
.mp-opp-body small  { font-size:10px;color:rgba(245,240,232,.45);line-height:1.4; }
.mp-cell-cat { white-space:nowrap; }
.mp-cat-pill {
  display:inline-block;
  padding:2px 7px;border-radius:4px;
  background:rgba(212,168,75,.1);border:1px solid rgba(212,168,75,.2);
  color:#d4a84b;font-size:9px;font-weight:500;white-space:nowrap;
}
/* Hide cat pill in opp cell on wider screens (shown in its own column) */
.mp-opp-body .mp-cat-pill { display:none; }

/* Verification */
.mp-verif {
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 7px;border-radius:5px;font-size:10px;font-weight:500;
  white-space:nowrap;
}
.mp-verif--verified { background:rgba(76,175,130,.1);color:#4caf82;border:1px solid rgba(76,175,130,.2); }
.mp-verif--partial  { background:rgba(230,165,51,.1);color:#e6a533;border:1px solid rgba(230,165,51,.2); }
.mp-verif--pending  { background:rgba(255,255,255,.05);color:rgba(245,240,232,.5);border:1px solid rgba(255,255,255,.1); }

/* Route */
.mp-cell-route { display:flex;flex-direction:column;gap:2px; }
.mp-route-label { font-size:11px;font-weight:500;color:#f5f0e8; }
.mp-route-sub   { font-size:9px;color:rgba(245,240,232,.4); }

/* Jurisdiction */
.mp-juris-label { font-size:11px;color:rgba(245,240,232,.7); }

/* Confidence ring */
.mp-ring { display:block; }

/* Actions */
.mp-cell-actions { display:flex;flex-direction:column;gap:4px;min-width:160px; }
.mp-action-btn {
  width:100%;padding:5px 10px;border-radius:6px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.7);font:inherit;font-size:10px;
  cursor:pointer;transition:background .1s,color .1s;
  text-align:center;white-space:nowrap;
}
.mp-action-btn:hover { background:rgba(255,255,255,.09);color:#f5f0e8; }
.mp-action-btn.mp-action-primary {
  background:rgba(212,168,75,.1);
  border-color:rgba(212,168,75,.25);
  color:#d4a84b;font-weight:500;
}
.mp-action-btn.mp-action-primary:hover { background:rgba(212,168,75,.18); }

/* Pagination */
.mp-pagination {
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 28px;border-top:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.mp-pag-count {
  font-size:11px;color:rgba(245,240,232,.4);
  font-family:'JetBrains Mono','Fira Mono',monospace;
}
.mp-pag-controls { display:flex;align-items:center;gap:4px; }
.mp-pag-btn {
  min-width:28px;height:28px;padding:0 6px;
  border-radius:6px;border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.6);font:inherit;font-size:11px;
  cursor:pointer;transition:background .1s,color .1s;
}
.mp-pag-btn:hover:not(:disabled) { background:rgba(255,255,255,.09);color:#f5f0e8; }
.mp-pag-btn.active {
  background:rgba(212,168,75,.15);
  border-color:rgba(212,168,75,.3);
  color:#d4a84b;font-weight:600;
}
.mp-pag-btn:disabled { opacity:.3;cursor:default; }
.mp-pag-ellipsis { color:rgba(245,240,232,.3);font-size:11px;padding:0 4px; }

/* Empty state */
.mp-empty {
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:10px;
  padding:48px 28px;
}
.mp-empty-icon { font-size:28px;opacity:.3; }
.mp-empty strong { font-size:15px;color:#f5f0e8; }
.mp-empty p { font-size:12px;color:rgba(245,240,232,.45);text-align:center;max-width:340px;line-height:1.6; }
.mp-empty-btn {
  margin-top:8px;padding:8px 16px;border-radius:8px;
  border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.08);
  color:#d4a84b;font:inherit;font-size:12px;cursor:pointer;
  transition:background .12s;
}
.mp-empty-btn:hover { background:rgba(212,168,75,.15); }

/* ── Right panel ── */
.mp-right {
  padding:20px 16px;
  overflow-y:auto;
  display:flex;flex-direction:column;gap:20px;
  background:rgba(3,7,17,.55);
}
.mp-right-section { display:flex;flex-direction:column;gap:10px; }
.mp-right-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.32);
}
.mp-right-link {
  font-size:10px;color:#d4a84b;background:none;border:none;
  padding:0;cursor:pointer;text-align:left;font:inherit;
  transition:opacity .12s;
}
.mp-right-link:hover { opacity:.7; }

/* Requirements */
.mp-req-list,.mp-gap-list,.mp-cpty-list,.mp-signal-list {
  display:flex;flex-direction:column;gap:7px;
}
.mp-req-row,.mp-gap-row,.mp-cpty-row,.mp-signal-row {
  display:flex;align-items:flex-start;gap:8px;
}
.mp-req-icon {
  font-size:12px;flex-shrink:0;margin-top:1px;
}
.mp-req-icon--verified { color:#4caf82; }
.mp-req-icon--pending  { color:rgba(245,240,232,.3); }
.mp-req-body strong,.mp-gap-row strong,.mp-cpty-row strong,.mp-signal-row strong {
  display:block;font-size:11px;font-weight:500;color:#f5f0e8;line-height:1.2;
}
.mp-req-body small,.mp-gap-row small,.mp-cpty-row small,.mp-signal-row small {
  display:block;font-size:9px;color:rgba(245,240,232,.4);margin-top:1px;
}
.mp-gap-icon  { font-size:11px;color:#e6a533;flex-shrink:0;margin-top:2px; }
.mp-cpty-icon { font-size:12px;color:#4caf82;flex-shrink:0;margin-top:1px; }
.mp-signal-dot {
  width:7px;height:7px;border-radius:50%;
  flex-shrink:0;margin-top:3px;
}

/* Mobile */
@media(max-width:1024px) {
  .mp-root { grid-template-columns:1fr;grid-template-rows:auto auto;height:auto; }
  .mp-main { overflow:visible; }
  .mp-table-wrap { overflow-x:auto; }
  .mp-right { border-top:1px solid rgba(255,255,255,.08); }
  .mp-cell-cat { display:none; }
  .mp-opp-body .mp-cat-pill { display:inline-block; }
}
`
