'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { PipelineCounts, WantedListing, CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

type CommandPanel = 'marketplace' | 'education' | 'signals' | 'wanted' | 'local-intel' | 'watchlist' | 'proof' | 'coa' | 'module' | 'settings' | 'search' | 'suppliers' | 'account'
type RequestState = 'idle' | 'queued' | 'unavailable'

type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
  pipeline?: PipelineCounts
  wantedListings?: WantedListing[]
  countryIntel?: CountryIntelProfile | null
}

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

import { REGIONS, REGION_LABELS, WARN_REGIONS as WARN_REGIONS_BY_COUNTRY } from '@/lib/dashboard/countryRegions'

const WARN_REGIONS = new Set(Object.values(WARN_REGIONS_BY_COUNTRY).flat())


const VIEW_LABELS: Record<MarketView, string> = {
  cannabis: 'Cannabis inventory · flower · extract · biomass · genetics',
  equipment: 'Cultivation · extraction · processing · lab instrumentation',
  consumables: 'Packaging · substrates · nutrients · solvents · inputs',
  'new-products': 'Seeds · formulations · devices · clones · new product lots',
  services: 'GDP logistics · compliance · lab testing · regulatory counsel',
  opportunities: 'Acquisitions · partnerships · licence transfers · distressed assets',
  wanted: 'Wanted demand · active buyer requests · matched supply',
}

const VIEW_BLOCK_TITLES: Record<MarketView, string> = {
  cannabis: 'Cannabis inventory',
  equipment: 'Equipment marketplace',
  consumables: 'Consumables & inputs',
  'new-products': 'New products',
  services: 'Services marketplace',
  opportunities: 'Business opportunities',
  wanted: 'Active wanted requests',
}

const VIEW_TAB_LABELS: Record<MarketView, string> = {
  cannabis: 'Cannabis',
  equipment: 'Equipment',
  consumables: 'Consumables',
  'new-products': 'New Products',
  services: 'Services',
  opportunities: 'Opportunities',
  wanted: 'Wanted',
}


function getMainAction(roleId: string | null): string {
  if (!roleId) return 'Post Wanted Demand'
  if (['exporter','cultivator_producer','processor_extractor'].includes(roleId)) return 'Create Supply Listing'
  if (['doctor_prescriber','clinic_healthcare_operator'].includes(roleId)) return 'Start Clinician Onboarding'
  if (roleId === 'pharmacist') return 'Open Pharmacy Education'
  if (['investor_operator','government_regulator'].includes(roleId)) return 'View Opportunities'
  if (['lab_qa','gmp_quality'].includes(roleId)) return 'Post Lab Services'
  return 'Post Wanted Demand'
}

function TagPills({ str }: { str: string }) {
  return <div className="hv-tags">{str.split('|').map(t => <span key={t} className="hv-tag">{t}</span>)}</div>
}

function TrustBar({ str }: { str: string }) {
  return <div className="hv-trust">{str.split('|').map(x => { const [a, c] = x.split(':'); return <i key={x} className={c ?? ''}>{a}</i> })}</div>
}

const ROLE_FIRST_MODULES: Record<string, { icon: string; title: string; desc: string; stage: string }[]> = {
  geneticist_breeder: [
    { icon: '🧬', title: 'Cultivar IP and breeding records', desc: 'Prioritize provenance logs, phenotyping evidence, lineage records, and export-safe genetic material workflows.', stage: 'Role module 01' },
    { icon: '🌱', title: 'Seed, clone, and tissue culture transfer controls', desc: 'Operator checklist for phytosanitary evidence, chain of custody, and restricted-market genetics movement.', stage: 'Role module 02' },
    { icon: '🔬', title: 'Genetic stability and QA proof pack', desc: 'Build a breeder-ready proof bundle for cultivar claims, lab verification, and counterparty review.', stage: 'Role module 03' },
  ],
}

const DEFAULT_ROLE_MODULES = [
  { icon: '🎯', title: 'Role operating path', desc: 'Role-specific market access, proof gates, and safe next actions for the selected workspace.', stage: 'Role module 01' },
  { icon: '✅', title: 'Compliance proof pack', desc: 'Documents and checks needed before marketplace contact or regional execution.', stage: 'Role module 02' },
]

const COMMAND_NAV: { id: CommandPanel; label: string; icon: string }[] = [
  { id: 'marketplace', label: 'Marketplace command', icon: '🛒' },
  { id: 'wanted', label: 'Wanted demand', icon: '📥' },
  { id: 'local-intel', label: 'Local intel', icon: '🛰️' },
  { id: 'education', label: 'Education hub', icon: '🎓' },
  { id: 'signals', label: 'Weekly signals', icon: '📡' },
  { id: 'watchlist', label: 'Watchlist', icon: '👁️' },
  { id: 'settings', label: 'Command settings', icon: '⚙️' },
]

function getRequestKind(label: string): 'proof' | 'coa' {
  return label.toLowerCase().includes('coa') ? 'coa' : 'proof'
}

function getRegionalIntel(country: { iso2: string; label: string }, region: string, roleLabel: string, warn: boolean) {
  if (country.iso2 === 'AF') {
    return {
      title: `${country.label}${region ? ` · ${region}` : ''} Local Intel`,
      summary: region
        ? `${region} is operating under a review-gated Afghanistan workspace. Commercial action should stay intelligence-led until current source review is complete.`
        : 'Afghanistan workspace is available with national intelligence, but no province has been selected for operator routing.',
      ruleStatus: 'Review-gated / restricted until verified source review',
      marketplaceImpact: 'No default transaction path; proof requests can be queued for analyst review.',
      roleImpact: `${roleLabel} actions prioritize genetics provenance, phytosanitary evidence, and non-transactional diligence.`,
      confidence: 'Limited public-source confidence · analyst verification required',
      nextAction: region ? 'Queue proof request or open regional source review.' : 'Select a province to scope source review.',
      empty: !region,
    }
  }

  return {
    title: `${country.label}${region ? ` · ${region}` : ''} Regional Intelligence`,
    summary: region
      ? `${region} rules are filtering marketplace rows, wanted demand, education modules, and proof-gated counterparty actions.`
      : `${country.label} has no configured region set yet. Use national-level intelligence until regional data is loaded.`,
    ruleStatus: region ? (warn ? 'Review required' : 'Allowed with proof') : 'National context only',
    marketplaceImpact: region ? (warn ? 'Marketplace restricted' : 'Supply + clinical routes visible') : 'Regional marketplace impact unavailable',
    roleImpact: region ? (warn ? 'Education before action' : `${roleLabel} can proceed through proof gates`) : 'Role impact unavailable until regional data is configured',
    confidence: region ? 'Regional rule status · source trail in review' : 'No regional source data configured',
    nextAction: region ? (warn ? 'Open source review before inquiry.' : 'Request proof before counterparty contact.') : 'Use country-level search or request intel coverage.',
    empty: !region,
  }
}

export default function CommandCentre({ signals, eduCategories, initialCountryIso2, initialRoleId, wantedCount = 4, marketplaceRows }: Props) {
  const router = useRouter()
  const defaultCountry = useMemo(() => COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? COUNTRIES[0], [initialCountryIso2])
  const [country, setCountry] = useState(defaultCountry)
  const [region, setRegion] = useState((REGIONS[defaultCountry.iso2] ?? [])[0] ?? '')
  const [role, setRole] = useState(initialRoleId ?? '')
  const [view, setView] = useState<MarketView>('cannabis')
  const [activePanel, setActivePanel] = useState<CommandPanel>('marketplace')
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [watching, setWatching] = useState<Set<string>>(new Set())
  const [proofState, setProofState] = useState<RequestState>('idle')
  const [coaState, setCoaState] = useState<RequestState>('idle')
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const savePreferences = useCallback((patch: { country_iso2?: string; role_id?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
    }, 600)
  }, [])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const openPanel = useCallback((panel: CommandPanel, item?: string) => {
    if (item) setSelectedItem(item)
    setActivePanel(panel)
    setPanelOpen(true)
  }, [])

  const handleCountryChange = (iso2: string) => {
    const next = COUNTRIES.find(c => c.iso2 === iso2) ?? country
    const nextRegions = REGIONS[iso2] ?? []
    setCountry(next)
    setRegion(nextRegions[0] ?? '')
    savePreferences({ country_iso2: iso2 })
  }

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole)
    savePreferences({ role_id: nextRole })
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    const query = event.currentTarget.value.trim()
    setSearch(query)
    if (query) router.push(`/marketplace?q=${encodeURIComponent(query)}`)
    else openPanel('search', 'Empty search')
  }

  const queueRequest = (kind: 'proof' | 'coa', item: string) => {
    setSelectedItem(item)
    const isUnavailable = country.iso2 === 'AF' && kind === 'coa'
    if (kind === 'coa') setCoaState(isUnavailable ? 'unavailable' : 'queued')
    if (kind === 'proof') setProofState('queued')
    openPanel(kind, item)
  }

  const toggleWatch = (item: string) => {
    setWatching(prev => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
    openPanel('watchlist', item)
  }

  const rows = marketplaceRows?.[view] ?? []
  const warn = WARN_REGIONS.has(region)
  const roleLabel = role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.label ?? 'General') : 'General'
  const roleModules = ROLE_FIRST_MODULES[role] ?? DEFAULT_ROLE_MODULES
  const learningPath = [
    ...roleModules,
    ...eduCategories.map(cat => ({ ...cat, stage: `${country.label}${region ? ` · ${region}` : ''}` })),
  ]
  const regionalIntel = getRegionalIntel(country, region, roleLabel, warn)
  const tierLabel = ['doctor_prescriber','pharmacist','clinic_healthcare_operator'].includes(role) ? 'CLINICAL PARTNER · Education' : 'FREE · Weekly Signals'

  const renderPanel = () => {
    const requestState = activePanel === 'coa' ? coaState : proofState
    return (
      <aside className={`cc-command-panel${panelOpen ? ' open' : ''}`} aria-label={`${activePanel} command panel`}>
        <div className="cc-drawer-head">
          <div><small>Command centre expansion</small><h3>{COMMAND_NAV.find(item => item.id === activePanel)?.label ?? activePanel}</h3></div>
          <button className="cc-close" onClick={() => setPanelOpen(false)} aria-label="Close command panel">×</button>
        </div>
        <div className="cc-drawer-body">
          {activePanel === 'marketplace' && <section className="cc-drawer-card"><b>{VIEW_BLOCK_TITLES[view]} expanded</b><p>{rows.length} {VIEW_TAB_LABELS[view].toLowerCase()} rows remain filtered by {country.label}{region ? ` / ${region}` : ''}, role {roleLabel}, and search {search || 'none'}.</p><div className="cc-panel-list">{rows.map(row => <span key={row[2]}>{row[2]} · {row[6]}</span>)}</div></section>}
          {activePanel === 'education' && <section className="cc-drawer-card"><b>{roleLabel} learning path</b><p>Role-specific modules are listed first, followed by {country.label}{region ? ` / ${region}` : ''} context.</p><div className="cc-panel-list">{learningPath.map(item => <span key={`${item.stage}-${item.title}`}>{item.stage}: {item.title}</span>)}</div></section>}
          {activePanel === 'signals' && <section className="cc-drawer-card"><b>Weekly Signals expanded</b><p>Signals remain inside the dashboard with source confidence and marketplace impact context.</p><div className="cc-panel-list">{signals.map(signal => <span key={signal.id}>{signal.title} · confidence {signal.confidence}</span>)}</div></section>}
          {activePanel === 'wanted' && <section className="cc-drawer-card"><b>Wanted Demand queue</b><p>{wantedCount} wanted requests are available in this command workspace. The primary action is queued instead of routing away.</p><button className="cc-primary inline" onClick={() => setProofState('queued')}>Queue wanted demand review</button></section>}
          {activePanel === 'local-intel' && <section className="cc-drawer-card"><b>{regionalIntel.title}</b><p>{regionalIntel.summary}</p><div className="cc-rule-grid"><div><small>Rule status</small><strong>{regionalIntel.ruleStatus}</strong></div><div><small>Marketplace impact</small><strong>{regionalIntel.marketplaceImpact}</strong></div><div><small>Role impact</small><strong>{regionalIntel.roleImpact}</strong></div><div><small>Confidence / source</small><strong>{regionalIntel.confidence}</strong></div></div><p className="cc-next-action">Next operator action: {regionalIntel.nextAction}</p></section>}
          {activePanel === 'watchlist' && <section className="cc-drawer-card"><b>Watch state updated</b><p>{selectedItem || 'Selected item'} is {watching.has(selectedItem) ? 'now watched' : 'removed from watch'} in the current {country.label} workspace.</p><div className="cc-panel-list">{Array.from(watching).map(item => <span key={item}>{item}</span>)}{watching.size === 0 && <span>No watched rows yet.</span>}</div></section>}
          {(activePanel === 'proof' || activePanel === 'coa') && <section className="cc-drawer-card"><b>{activePanel === 'coa' ? 'COA request' : 'Proof request'} for {selectedItem}</b><p>Status: {requestState === 'queued' ? 'Queued for operator review.' : requestState === 'unavailable' ? 'Unavailable for this country/region until source review completes.' : 'Ready to queue.'}</p><p>Context preserved: {country.label}{region ? ` / ${region}` : ''} · {roleLabel} · {VIEW_TAB_LABELS[view]}.</p></section>}
          {activePanel === 'module' && <section className="cc-drawer-card"><b>{selectedModule || 'Education module'}</b><p>Module opened inside the dashboard. Operator can continue marketplace review without losing country, region, role, search, or category context.</p></section>}
          {activePanel === 'settings' && <section className="cc-drawer-card"><b>Customize Command Centre</b><p>Global settings control for saved layouts, module priority, proof gates, and workspace density. Marketplace category rail remains category-only.</p><button className="cc-primary inline" onClick={() => setActivePanel('marketplace')}>Apply current layout</button></section>}
          {activePanel === 'search' && <section className="cc-drawer-card"><b>Search workspace</b><p>{search ? `Showing in-dashboard command results for “${search}”.` : 'Empty state: enter a query to search listings, intel, and education without leaving the dashboard.'}</p></section>}
          {activePanel === 'suppliers' && <section className="cc-drawer-card"><b>Supplier command surface</b><p>Supplier discovery opens as an in-dashboard expansion filtered by {country.label} and {roleLabel}.</p></section>}
          {activePanel === 'account' && <section className="cc-drawer-card"><b>Account controls</b><p>Workspace preferences, notification routing, and proof-request defaults are available without leaving the dashboard.</p></section>}
        </div>
      </aside>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cc-app">
        <header className="cc-top">
          <div className="cc-brand"><strong>HARBOURVIEW</strong><span>MARKET ACCESS · INTELLIGENCE · EDUCATION</span></div>
          <div className="cc-context">
            <label className="cc-field"><span>Country</span><select value={country.iso2} onChange={e => handleCountryChange(e.target.value)}>{COUNTRIES.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}</select></label>
            <label className="cc-field"><span>Region</span><select value={region} onChange={e => setRegion(e.target.value)}>{(REGIONS[country.iso2] ?? []).length ? (REGIONS[country.iso2] ?? []).map(r => <option key={r} value={r}>{r}</option>) : <option value="">Country-level only</option>}</select></label>
            <label className="cc-field"><span>Role</span><select value={role} onChange={e => handleRoleChange(e.target.value)}><option value="">— select role —</option>{Object.entries(ROLE_PROFILES).map(([id, profile]) => <option key={id} value={id}>{profile!.label}</option>)}</select></label>
            <label className="cc-field"><span>Search</span><input type="text" value={search} placeholder="Search listings, intel, education…" onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} /></label>
          </div>
          <div className="cc-actions">
            <div className="cc-tier">{tierLabel}</div>
            <button className="cc-icon-btn cc-alert" aria-label="Open notifications" title="Open notifications" onClick={() => openPanel('signals')} />
            <button className="cc-soft-btn" onClick={() => openPanel('wanted')}>{wantedCount} Wanted</button>
            <button className="cc-soft-btn" onClick={() => openPanel('settings')}>Customize</button>
            <button className="cc-primary" onClick={() => openPanel('wanted')}>{getMainAction(role)}</button>
          </div>
        </header>

        <nav className="cc-sidebar" aria-label="Command centre controls">
          {COMMAND_NAV.map(item => <button key={item.id} type="button" title={item.label} className={`cc-nav-btn${activePanel === item.id ? ' active' : ''}`} aria-label={item.label} aria-pressed={activePanel === item.id} onClick={() => openPanel(item.id)}><span aria-hidden="true">{item.icon}</span><em>{item.label}</em></button>)}
        </nav>

        <main className="cc-workspace">
          <section className="cc-panel cc-market">
            <div className="cc-head"><div><h2>Marketplace & Access</h2><small>{VIEW_LABELS[view]}</small></div><div className="cc-head-actions"><button className="cc-wanted-cta" onClick={() => openPanel('wanted')}>{wantedCount} Wanted Requests →</button><button className="cc-soft-btn" onClick={() => openPanel('marketplace')}>View All →</button></div></div>
            <div className="cc-view-bar"><div className="cc-views">{(['cannabis','equipment','consumables','new-products','services','opportunities'] as MarketView[]).map(v => <button key={v} className={`cc-view${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{VIEW_TAB_LABELS[v]}</button>)}</div></div>
            <div className="cc-market-grid"><div className="cc-market-block"><div className="cc-block-title"><b>{VIEW_BLOCK_TITLES[view]}</b><span>{rows.length > 0 ? `${rows.length} rows · region-filtered` : 'No listings yet'}</span></div><div className="cc-rows">{rows.length === 0 ? <div className="cc-empty-state"><p>No live listings for this category yet.</p><a href="/marketplace/sell" className="cc-empty-cta">Submit a listing →</a></div> : rows.map(row => <article key={row[2]} className="cc-row"><div className={`cc-spec ${row[0]}`} /><div><div className="cc-type">{row[1]}</div><h4>{row[2]}</h4><p>{row[3]}</p><TagPills str={row[4]} /><TrustBar str={row[5]} /></div><div className="cc-action-box"><strong>{row[7]}</strong><small>{row[1].toLowerCase()}</small><button className="cc-row-action" onClick={() => queueRequest(getRequestKind(row[6]), row[2])}>{row[6]}</button><button className={`cc-secondary${watching.has(row[2]) ? ' active' : ''}`} onClick={() => toggleWatch(row[2])}>{watching.has(row[2]) ? 'Watching' : 'Watch'}</button></div></article>)}</div></div></div>
          </section>

          <section className="cc-col2">
            <div className="cc-panel cc-education"><div className="cc-head"><div><h3>Education Hub</h3><small>Role-first learning path</small></div><button className="cc-link-btn" onClick={() => openPanel('education')}>View All →</button></div><div className="cc-body"><div className="cc-edu-intro"><strong>{roleLabel} Learning Path</strong><p>Role-specific modules are prioritized first, then {country.label}{region ? ` / ${region}` : ''} context.</p></div><div className="cc-edu-cards">{learningPath.slice(0, 5).map(item => <div key={`${item.stage}-${item.title}`} className="cc-edu"><small>{item.stage}</small><b>{item.icon} {item.title}</b><p>{item.desc}</p><button className="cc-edu-cta" onClick={() => { setSelectedModule(item.title); openPanel('module', item.title) }}>Open module</button></div>)}</div></div></div>
          </section>

          <section className="cc-col3">
            <div className="cc-panel cc-signals"><div className="cc-head"><div><h3>Weekly Signals</h3><small>Free summaries · paid source trail · marketplace impact</small></div><button className="cc-link-btn" onClick={() => openPanel('signals')}>View All →</button></div><div className="cc-body"><div className="cc-signal-list">{signals.slice(0, 3).map(signal => <article key={signal.id} className="cc-signal"><span className={`cc-sev${signal.tag.label === 'REGULATION' || signal.tag.label === 'COMPLIANCE' ? '' : ' low'}`} /><div><b>{signal.title}</b><p>{signal.commercialImpact}</p><small>{signal.market} · confidence {signal.confidence} · {signal.timeAgo}</small><div className="cc-impact"><span className="cc-signal-tag" style={{ borderColor: signal.tag.border, color: signal.tag.color, background: signal.tag.bg }}>{signal.tag.label}</span> Marketplace impact: {signal.commercialImpact.toLowerCase()}</div></div><button className="cc-badge" onClick={() => openPanel('signals', signal.title)}>WATCH</button></article>)}<div className="cc-pay-boundary"><b>Intel Plus unlocks</b><p>Source trails, contradiction review, counterparty movement, corridor alerts, regional rule-change monitoring, and saved watch alerts.</p></div></div></div></div>
            <div className="cc-panel cc-map-panel"><div className="cc-head"><div><h3>Local Intel / Regional Intelligence</h3><small>{REGION_LABELS[country.iso2] ?? 'Country-level intelligence'}</small></div><button className="cc-link-btn" onClick={() => openPanel('local-intel')}>Open Intel</button></div><div className="cc-body cc-map-body"><div className="cc-legend"><span>● Allow</span><span>● Review</span><span>● Restrict</span><span>● Edu required</span></div><div className="cc-map-wrap"><div className="cc-region-grid">{(REGIONS[country.iso2] ?? []).length ? (REGIONS[country.iso2] ?? []).map(r => <button key={r} className={`cc-region-tile${region === r ? ' active' : ''}${WARN_REGIONS.has(r) ? ' warn' : ''}`} onClick={() => setRegion(r)}>{r}</button>) : <div className="cc-empty-state">No regional rule tiles configured. Showing country-level intelligence.</div>}</div><div className="cc-rules"><b>{regionalIntel.title}</b><p>{regionalIntel.summary}</p><div className="cc-rule-grid"><div><small>Rule status</small><strong>{regionalIntel.ruleStatus}</strong></div><div><small>Marketplace impact</small><strong>{regionalIntel.marketplaceImpact}</strong></div><div><small>Role impact</small><strong>{regionalIntel.roleImpact}</strong></div><div><small>Confidence / source</small><strong>{regionalIntel.confidence}</strong></div></div><p className="cc-next-action">Next operator action: {regionalIntel.nextAction}</p></div></div></div></div>
          </section>
        </main>

        <footer className="cc-status"><span><b>LIVE</b> role-aware · region-filtered · proof-gated</span><span>Marketplace categories · regional rules · weekly signals</span><span>All dashboard commands resolve in-place</span></footer>
      </div>
      {panelOpen && <div className="cc-scrim" onClick={() => setPanelOpen(false)} />}
      {renderPanel()}
    </>
  )
}

const CSS = `
:root{--cc-bg:#040814;--cc-panel:#0b1929;--cc-ink:#f7efe1;--cc-text:#d8e1e9;--cc-muted:#9aa8b6;--cc-dim:#627282;--cc-line:rgba(232,240,248,.115);--cc-line2:rgba(232,240,248,.18);--cc-gold:#d9af63;--cc-gold2:#f3cf86;--cc-green:#74d28e;--cc-blue:#79b2ea;--cc-red:#e27466;--cc-amber:#e7b053;--cc-violet:#ad92ee;--cc-shadow:0 28px 88px rgba(0,0,0,.42);--cc-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;--cc-serif:Georgia,"Times New Roman",serif;--cc-mono:"SFMono-Regular","Cascadia Mono","Roboto Mono",Consolas,monospace}
.cc-app{position:fixed;inset:0;display:grid;grid-template-columns:78px minmax(0,1fr);grid-template-rows:74px minmax(0,1fr) 42px;background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);color:var(--cc-text);font-family:var(--cc-sans);overflow:hidden}.cc-top{grid-column:1/-1;grid-row:1;z-index:10;display:grid;grid-template-columns:240px minmax(0,1fr) auto;gap:16px;align-items:center;padding:12px 18px;border-bottom:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(5,10,20,.96),rgba(6,13,24,.9))}.cc-brand strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);letter-spacing:.155em;font-size:18px;font-weight:520}.cc-brand span{display:block;margin-top:2px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.14em;font-size:8px;white-space:nowrap}.cc-context{display:grid;grid-template-columns:130px 140px 160px minmax(150px,1fr);gap:9px;min-width:0}.cc-field{height:46px;position:relative}.cc-field span{position:absolute;left:12px;top:6px;color:var(--cc-dim);font-size:8px;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;z-index:1}.cc-field select,.cc-field input{width:100%;height:100%;border:1px solid var(--cc-line2);border-radius:14px;background:linear-gradient(180deg,rgba(17,35,53,.9),rgba(7,16,28,.96));color:var(--cc-ink);outline:none;padding:17px 10px 6px 12px;font:inherit;font-size:13px}.cc-actions{display:flex;align-items:center;gap:8px;justify-content:flex-end;white-space:nowrap}.cc-tier{height:44px;border:1px solid rgba(217,175,99,.35);border-radius:14px;background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:0 12px;display:flex;align-items:center;font-family:var(--cc-mono);font-size:10px;white-space:nowrap}.cc-icon-btn,.cc-soft-btn,.cc-primary{height:44px;border-radius:14px;border:1px solid var(--cc-line2);background:linear-gradient(180deg,rgba(15,31,49,.9),rgba(7,16,28,.98));color:var(--cc-muted);padding:0 13px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;font:inherit;font-size:12px;text-decoration:none}.cc-icon-btn{width:44px;padding:0;justify-content:center;position:relative}.cc-icon-btn.cc-alert::after{content:"";position:absolute;right:9px;top:9px;width:7px;height:7px;border-radius:50%;background:var(--cc-red);box-shadow:0 0 0 4px rgba(226,116,102,.12)}.cc-primary{border-color:rgba(217,175,99,.56);background:linear-gradient(135deg,#f0cc82,#c89136);color:#07111d;font-weight:790}.cc-sidebar{grid-column:1;grid-row:2/4;z-index:5;padding:16px 10px;border-right:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(4,9,18,.78),rgba(3,8,17,.96));display:flex;flex-direction:column;align-items:center;gap:9px}.cc-nav-btn{width:52px;height:52px;border-radius:17px;border:1px solid transparent;background:transparent;color:var(--cc-dim);display:grid;place-items:center;text-decoration:none;font-weight:800}.cc-nav-btn.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.35);background:rgba(217,175,99,.08)}.cc-workspace{grid-column:2;grid-row:2;z-index:1;min-width:0;min-height:0;display:grid;grid-template-columns:minmax(580px,2fr) minmax(280px,1fr) minmax(300px,1fr);gap:14px;padding:14px;overflow:hidden}.cc-panel{min-width:0;min-height:0;border:1px solid var(--cc-line);border-radius:26px;background:linear-gradient(180deg,rgba(12,28,44,.93),rgba(5,13,23,.95));box-shadow:var(--cc-shadow);overflow:hidden}.cc-head{height:62px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--cc-line)}.cc-head h2,.cc-head h3{margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520}.cc-head h2{font-size:22px}.cc-head h3{font-size:17px}.cc-head small{display:block;margin-top:3px;color:var(--cc-dim);font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--cc-mono)}.cc-head-actions{display:flex;gap:8px;align-items:center}.cc-link-btn{color:var(--cc-gold);font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.cc-wanted-cta{border:1px solid rgba(173,146,238,.42);background:rgba(173,146,238,.08);color:var(--cc-violet);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.cc-body{flex:1;min-height:0;overflow-y:auto;padding:14px}.cc-market,.cc-education,.cc-signals,.cc-map-panel{display:flex;flex-direction:column;min-height:0}.cc-view-bar{border-bottom:1px solid var(--cc-line);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.018)}.cc-views{display:flex;gap:7px;overflow:auto}.cc-view{height:34px;border:1px solid var(--cc-line);border-radius:999px;background:rgba(255,255,255,.026);color:var(--cc-muted);padding:0 12px;white-space:nowrap;font-size:12px;cursor:pointer;font:inherit}.cc-view.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.42);background:rgba(217,175,99,.09)}.cc-customize-btn{height:34px;border-radius:12px;border:1px solid rgba(217,175,99,.38);background:rgba(217,175,99,.08);color:var(--cc-gold2);font-weight:720;padding:0 12px;cursor:pointer;font:inherit;font-size:12px;white-space:nowrap}.cc-market-grid{flex:1;min-height:0;overflow:hidden;padding:12px;display:flex;flex-direction:column}.cc-market-block{border:1px solid var(--cc-line);border-radius:20px;background:rgba(255,255,255,.022);overflow:hidden;display:flex;flex-direction:column;flex:1;min-height:0}.cc-block-title{padding:10px 14px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}.cc-block-title b{color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}.cc-block-title span{font-size:11px;color:var(--cc-dim);font-family:var(--cc-mono)}.cc-rows{flex:1;overflow-y:auto;padding:10px;display:grid;gap:10px;align-content:start}.cc-row{border:1px solid var(--cc-line);border-radius:18px;background:linear-gradient(180deg,rgba(18,38,58,.72),rgba(7,17,29,.92));padding:12px;display:grid;grid-template-columns:100px minmax(0,1fr) 144px;gap:12px;align-items:center}.cc-spec{width:100px;height:80px;border-radius:14px;border:1px solid var(--cc-line2);background:#0a1624}.cc-spec.supply{background:radial-gradient(circle at 32% 28%,rgba(217,175,99,.32),transparent 25%),#0a1624}.cc-spec.equip{background:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),#0a1624}.cc-spec.service{background:linear-gradient(135deg,rgba(115,210,141,.16),rgba(122,177,234,.08)),#0a1624}.cc-type{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--cc-gold);font-family:var(--cc-mono);margin-bottom:4px}.cc-row h4{margin:0;color:var(--cc-ink);font-size:15px;line-height:1.2}.cc-row p{margin:4px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.38}.hv-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.hv-tag{height:20px;display:inline-flex;align-items:center;border:1px solid var(--cc-line2);border-radius:999px;padding:0 7px;color:var(--cc-muted);background:rgba(255,255,255,.026);font-size:9px;font-family:var(--cc-mono)}.hv-trust{margin-top:7px;display:grid;grid-template-columns:repeat(5,54px);gap:4px}.hv-trust i{font-style:normal;height:19px;border:1px solid rgba(232,239,247,.1);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--cc-dim);font-size:8px;font-family:var(--cc-mono);background:rgba(255,255,255,.018)}.hv-trust i.ok{color:var(--cc-green);border-color:rgba(115,210,141,.26)}.hv-trust i.warn{color:var(--cc-amber);border-color:rgba(230,176,83,.28)}.hv-trust i.lock{color:var(--cc-violet);border-color:rgba(173,146,238,.28)}.cc-action-box{text-align:right}.cc-action-box strong{display:block;color:var(--cc-ink);font-size:13px}.cc-action-box small{display:block;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px;margin-top:3px}.cc-row-action,.cc-secondary,.cc-edu-cta{margin-top:7px;border-radius:10px;border:1px solid rgba(217,175,99,.34);background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:7px 10px;font-size:11px;font-weight:680;text-decoration:none;display:inline-flex}.cc-secondary{border-color:var(--cc-line2);background:rgba(255,255,255,.03);color:var(--cc-muted);display:block;justify-content:center}.cc-col2,.cc-col3{display:flex;flex-direction:column;gap:14px;min-height:0;overflow:hidden}.cc-education{flex:1}.cc-education .cc-body{display:flex;flex-direction:column}.cc-edu-intro{border:1px solid rgba(217,175,99,.24);border-radius:18px;padding:12px;background:linear-gradient(135deg,rgba(217,175,99,.095),rgba(120,215,211,.045));margin-bottom:10px;flex-shrink:0}.cc-edu-intro strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);font-weight:520;font-size:17px}.cc-edu-intro p,.cc-edu p,.cc-signal p,.cc-pay-boundary p,.cc-rules p{margin:5px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.45}.cc-edu-cards{display:grid;gap:8px;overflow-y:auto;flex:1;min-height:0;align-content:start;padding-bottom:4px}.cc-edu{border:1px solid var(--cc-line);border-radius:15px;background:rgba(255,255,255,.026);padding:11px}.cc-edu b{display:block;color:var(--cc-ink);font-size:13px}.cc-funnel{border-top:1px solid var(--cc-line);padding:12px;background:linear-gradient(180deg,rgba(12,28,44,.62),rgba(5,13,23,.92));flex-shrink:0}.cc-funnel h4{margin:0 0 8px;color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}.cc-funnel-grid,.cc-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cc-funnel-box,.cc-rule-grid div{border:1px solid var(--cc-line);border-radius:12px;padding:9px;background:rgba(255,255,255,.025)}.cc-funnel-box b,.cc-rule-grid strong{display:block;color:var(--cc-ink);font-size:12px}.cc-funnel-box span,.cc-rule-grid small{display:block;color:var(--cc-muted);font-size:10px;margin-top:3px}.cc-signals{flex:1.08}.cc-map-panel{flex:.92}.cc-signal-list{display:grid;gap:10px;align-content:start}.cc-signal{border:1px solid var(--cc-line);border-radius:16px;background:rgba(255,255,255,.026);padding:12px;display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:10px;align-items:start}.cc-sev{height:100%;min-height:56px;border-radius:999px;background:var(--cc-green)}.cc-sev.low{background:var(--cc-amber)}.cc-signal b,.cc-pay-boundary b,.cc-rules b{display:block;color:var(--cc-ink);font-size:13px;line-height:1.25}.cc-signal small{display:block;margin-top:5px;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px}.cc-impact{margin-top:7px;border:1px solid rgba(217,175,99,.18);border-radius:9px;padding:6px;color:var(--cc-gold2);font-size:10px;background:rgba(217,175,99,.045)}.cc-signal-tag{border:1px solid;border-radius:999px;padding:2px 6px;font-family:var(--cc-mono);font-size:9px}.cc-badge{border:1px solid rgba(217,175,99,.3);color:var(--cc-gold);border-radius:999px;padding:3px 7px;font-family:var(--cc-mono);font-size:9px;white-space:nowrap}.cc-pay-boundary{margin-top:10px;border:1px solid rgba(173,146,238,.28);border-radius:16px;padding:12px;background:linear-gradient(135deg,rgba(173,146,238,.08),rgba(255,255,255,.02))}.cc-map-body{display:flex;flex-direction:column}.cc-legend{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.cc-legend span{height:21px;border:1px solid var(--cc-line);border-radius:999px;padding:0 7px;display:inline-flex;align-items:center;font-size:9px;color:var(--cc-muted);font-family:var(--cc-mono)}.cc-map-wrap{flex:1;min-height:0;border:1px solid var(--cc-line);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.01));overflow:hidden;display:flex;flex-direction:column}.cc-region-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px;overflow:auto}.cc-region-tile{border:1px solid var(--cc-line);border-radius:12px;background:rgba(122,177,234,.105);color:var(--cc-text);padding:10px;font:inherit;font-size:11px;cursor:pointer}.cc-region-tile.active{background:rgba(217,175,99,.22);border-color:rgba(243,207,134,.75)}.cc-region-tile.warn{box-shadow:inset 0 0 0 1px rgba(226,116,102,.24)}.cc-rules{border-top:1px solid var(--cc-line);padding:10px 12px;background:rgba(5,13,23,.76)}.cc-wanted-cta,.cc-link-btn,.cc-row-action,.cc-secondary,.cc-edu-cta,.cc-badge{cursor:pointer;font:inherit}.cc-nav-btn em{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.cc-nav-btn span{font-size:20px}.cc-secondary.active{border-color:rgba(120,215,211,.44);background:rgba(120,215,211,.12);color:var(--cc-cyan)}.cc-edu small{display:block;color:var(--cc-gold);font-family:var(--cc-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px}.cc-panel-list{display:grid;gap:7px;margin-top:12px}.cc-panel-list span{border:1px solid var(--cc-line);border-radius:10px;padding:8px;color:var(--cc-muted);font-size:11px;background:rgba(255,255,255,.025)}.cc-next-action{margin-top:10px!important;color:var(--cc-gold2)!important}.cc-empty-state{border:1px dashed var(--cc-line2);border-radius:12px;padding:12px;color:var(--cc-muted);font-size:11px}.cc-primary.inline{height:auto;padding:9px 12px;margin-top:12px}.cc-command-panel{position:fixed;right:0;top:0;bottom:0;width:440px;max-width:92vw;z-index:30;background:linear-gradient(180deg,rgba(10,22,36,.98),rgba(5,13,24,.99));border-left:1px solid var(--cc-line2);box-shadow:-28px 0 88px rgba(0,0,0,.48);transform:translateX(100%);transition:transform .28s cubic-bezier(.25,.46,.45,.94);display:flex;flex-direction:column}.cc-command-panel.open{transform:translateX(0)}.cc-status{grid-column:2/-1;grid-row:3;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-top:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(4,9,18,.92),rgba(3,8,17,.98));font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);gap:16px}.cc-status b{color:var(--cc-green)}.cc-scrim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:20;backdrop-filter:blur(2px)}.cc-drawer{position:fixed;right:0;top:0;bottom:0;width:380px;z-index:30;background:linear-gradient(180deg,rgba(10,22,36,.98),rgba(5,13,24,.99));border-left:1px solid var(--cc-line2);box-shadow:-28px 0 88px rgba(0,0,0,.48);transform:translateX(100%);transition:transform .28s cubic-bezier(.25,.46,.45,.94);display:flex;flex-direction:column}.cc-drawer.open{transform:translateX(0)}.cc-drawer-head{padding:20px 22px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}.cc-drawer-head small{display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em;font-family:var(--cc-mono)}.cc-drawer-head h3{margin:6px 0 0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;font-size:18px}.cc-close{width:36px;height:36px;border-radius:10px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);color:var(--cc-muted);font-size:22px;cursor:pointer;display:grid;place-items:center;flex-shrink:0}.cc-drawer-body{flex:1;overflow:auto;padding:20px 22px;display:grid;gap:16px;align-content:start}.cc-drawer-card{border:1px solid var(--cc-line);border-radius:18px;padding:16px;background:rgba(255,255,255,.022)}.cc-drawer-card b{display:block;color:var(--cc-ink);font-size:14px;margin-bottom:6px}.cc-drawer-card p{margin:0;color:var(--cc-muted);font-size:12px;line-height:1.45}@media(max-width:1180px){.cc-app{position:relative;min-height:100vh;overflow:auto;display:block}.cc-top{display:flex;flex-direction:column;align-items:stretch}.cc-context{grid-template-columns:1fr 1fr}.cc-sidebar{display:none}.cc-workspace{display:grid;grid-template-columns:1fr;overflow:visible}.cc-status{display:none}.cc-row{grid-template-columns:1fr}.cc-spec{width:100%;height:70px}.cc-action-box{text-align:left}.cc-col2,.cc-col3{overflow:visible}.cc-command-panel{inset:0;width:100vw;max-width:none;border-left:0}.cc-drawer{width:min(92vw,380px)}}
`
