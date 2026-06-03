'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'

type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

type EduCategory = { icon: string; title: string; desc: string }
type CommandSurface = 'drawer' | 'workspace' | 'sheet'
type CommandStatus = 'ready' | 'queued' | 'watching' | 'unavailable'
type CommandSection =
  | 'dashboard'
  | 'marketplace'
  | 'wanted'
  | 'intel'
  | 'education'
  | 'signals'
  | 'suppliers'
  | 'settings'
  | 'local-intel'
  | 'proof'
  | 'coa'
  | 'module'
  | 'watch'

type CommandAction = {
  id: string
  section: CommandSection
  label: string
  description: string
  surface: CommandSurface
  status: CommandStatus
}

type Props = {
  signals: DashboardSignal[]
  eduCategories: EduCategory[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: DashboardMarketplaceRows
}

const FALLBACK_COUNTRY = { iso2: 'AF', label: 'Afghanistan' }
const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))
  .sort((a, b) => a.label.localeCompare(b.label))
const COUNTRY_OPTIONS = COUNTRIES.some(c => c.iso2 === 'AF') ? COUNTRIES : [FALLBACK_COUNTRY, ...COUNTRIES]

const REGIONS: Record<string, string[]> = {
  AF: ['National', 'Kabul', 'Herat', 'Kandahar', 'Balkh'],
  AU:['New South Wales','Victoria','Queensland','Western Australia','South Australia','Northern Territory','Tasmania'],
  CA:['Ontario','Quebec','British Columbia','Alberta','Nova Scotia','Manitoba','Saskatchewan'],
  DE:['Berlin','Hamburg','Bavaria','North Rhine-Westphalia','Hesse','Saxony'],
  NL:['North Holland','South Holland','Utrecht','North Brabant','Limburg'],
  GB:['England','Scotland','Wales','Northern Ireland'],
  US:['California','New York','Colorado','Illinois','Florida','Texas','Washington'],
  IL:['Tel Aviv','Jerusalem','Haifa','Beersheba'],
  PT:['Lisbon','Porto','Algarve','Alentejo','Madeira'],
  CH:['Zurich','Basel-Stadt','Geneva','Vaud','Bern','Ticino'],
  NZ:['Auckland','Wellington','Canterbury','Otago','Waikato'],
}

const REGION_LABELS: Record<string, string> = {
  AF:'Afghanistan · national/review-only intelligence posture',
  AU:'Australia · state-level rule instrument', CA:'Canada · province-level rule instrument',
  DE:'Germany · federal-state rule instrument', NL:'Netherlands · province-level rule instrument',
  GB:'United Kingdom · nation-level rule instrument', US:'United States · state-level rule instrument',
  IL:'Israel · district-level rule instrument', PT:'Portugal · region-level rule instrument',
  CH:'Switzerland · canton-level rule instrument', NZ:'New Zealand · region-level rule instrument',
}

const WARN_REGIONS = new Set(['National', 'Kabul', 'Herat', 'Kandahar', 'Balkh', 'Queensland','Texas','Ticino','Limburg','Alberta','Northern Ireland','Saxony'])

const VIEW_LABELS: Record<MarketView, string> = {
  cannabis: 'Cannabis inventory · flower · extract · biomass · genetics',
  equipment: 'Cultivation · extraction · processing · lab instrumentation',
  consumables: 'Packaging · substrates · nutrients · solvents · inputs',
  'new-products': 'Seeds · formulations · devices · clones · new product lots',
  services: 'GDP logistics · compliance · lab testing · regulatory counsel',
  opportunities: 'Acquisitions · partnerships · licence transfers · distressed assets',
}

const VIEW_BLOCK_TITLES: Record<MarketView, string> = {
  cannabis: 'Cannabis inventory',
  equipment: 'Equipment marketplace',
  consumables: 'Consumables & inputs',
  'new-products': 'New products',
  services: 'Services marketplace',
  opportunities: 'Business opportunities',
}

const VIEW_TAB_LABELS: Record<MarketView, string> = {
  cannabis: 'Cannabis',
  equipment: 'Equipment',
  consumables: 'Consumables',
  'new-products': 'New Products',
  services: 'Services',
  opportunities: 'Opportunities',
}

const FALLBACK_ROW_DATA: Record<MarketView, MarketRow[]> = {
  cannabis: [
    ['supply','Flower','EU-GMP certified dried flower — 100kg lot','COA, batch record, and certificates of analysis attached. Import-ready.','verified|flower|GMP|bulk','VER:ok|PROOF:warn|REG:ok|79:warn|PUBLIC','Request proof','On enquiry'],
    ['supply','Extract','Full-spectrum CO₂ oil — refined distillate','German-market specification. 92% THC distillate with full terpene retention.','distillate|extract|bulk|verified','VER:ok|PROOF:warn|REG:warn|74:warn|PUBLIC','Request COA','On enquiry'],
    ['supply','Biomass','Trim and biomass lot — wholesale','Drying-complete biomass available for licensed extractors. Inspection welcome.','biomass|trim|wholesale|licensed','VER:warn|PROOF:warn|REG:ok|61:warn|PUBLIC','Request inspection','Wholesale'],
    ['supply','Genetics','Stabilised cultivar seed — commercial quantity','Feminised seeds from a licensed breeding programme. Phytosanitary docs available.','genetics|seeds|cultivar|licensed','VER:ok|PROOF:ok|REG:warn|83:ok|PUBLIC','Open inquiry','Genetics'],
  ],
  equipment: [
    ['equip','Cultivation','LED grow system — 200-light commercial lot','Decommissioned licensed facility. Full inspection package and service logs available.','cultivation|LED|commercial|asset','VER:warn|PROOF:warn|REG:ok|67:warn|PUBLIC','Request inspection','Asset'],
    ['equip','Extraction','Used CO₂ extraction line — inspection ready','Apeks 5L SCFX unit with maintenance history. Buyer diligence and verification workflow.','extraction|CO2|commercial|inspection','VER:warn|PROOF:warn|REG:ok|63:warn|PUBLIC','Ask inspection','Asset'],
  ],
  consumables: [
    ['supply','Packaging','Child-resistant packaging — EU batch','Packaging lot with supplier declaration and material safety pack.','packaging|CR|EU|bulk','VER:ok|PROOF:warn|REG:ok|72:warn|PUBLIC','Request proof','Available'],
    ['supply','Inputs','Organic substrate pallets','Cultivation inputs available with chain-of-custody review.','substrate|inputs|organic','VER:warn|PROOF:warn|REG:ok|62:warn|PUBLIC','Request records','Available'],
  ],
  'new-products': [
    ['supply','Genetics','Stabilised feminised seeds — licensed breeding stock','Phytosanitary certificates and CITES documentation. Export-ready lot.','genetics|seeds|licensed|CITES','VER:ok|PROOF:ok|REG:warn|80:ok|PUBLIC','Open inquiry','Export ready'],
    ['supply','Formulation','CBD topical prototype batch','New product batch seeking distributor qualification and regulatory fit review.','formulation|CBD|topical','VER:warn|PROOF:warn|REG:warn|55:warn|PUBLIC','Request COA','Prototype'],
  ],
  services: [
    ['service','Testing','COA and contaminant testing partner','Reviewed laboratory route for potency, microbial, heavy metal, and pesticide testing.','lab|COA|testing|QA','VER:ok|PROOF:ok|REG:ok|88:ok|PUBLIC','Open inquiry','Service'],
    ['service','Compliance','Import documentation review','Controlled workflow for certificates, import permits, and shipment readiness.','compliance|import|documentation','VER:ok|PROOF:warn|REG:ok|76:warn|PUBLIC','Request proof','Service'],
  ],
  opportunities: [
    ['deal','Partnership','Regional distributor seeking genetics program','Wanted demand for genetics partnerships, locally review-gated before introduction.','wanted|genetics|distributor','VER:warn|PROOF:warn|REG:warn|60:warn|PUBLIC','Open inquiry','Wanted'],
    ['deal','Acquisition','Distressed cultivation assets','Asset review package pending proof and local operating diligence.','distressed|cultivation|assets','VER:warn|PROOF:warn|REG:warn|58:warn|PUBLIC','Request records','Opportunity'],
  ],
}

const ROLE_SPECIFIC_EDU: Record<string, EduCategory[]> = {
  geneticist_breeder: [
    { icon: '🧬', title: 'Genetics & IP', desc: 'Variety protection, breeding records, licensing boundaries, and disclosure controls.' },
    { icon: '🌱', title: 'Seed / Clone Market Access', desc: 'Phytosanitary, plant material, genetics transfer, and channel-fit modules.' },
    { icon: '📜', title: 'Provenance Documentation', desc: 'COAs, passports, cultivar lineage evidence, and chain-of-custody requirements.' },
  ],
}

const SIDEBAR_CONTROLS: { section: CommandSection; icon: string; label: string; tooltip: string }[] = [
  { section: 'dashboard', icon: '⌘', label: 'Dashboard', tooltip: 'Command centre overview' },
  { section: 'marketplace', icon: '◈', label: 'Marketplace', tooltip: 'Expand marketplace access' },
  { section: 'intel', icon: '◇', label: 'Intel', tooltip: 'Open regional intelligence' },
  { section: 'education', icon: '◐', label: 'Education', tooltip: 'Open learning path' },
  { section: 'signals', icon: '◌', label: 'Signals', tooltip: 'Expand weekly signals' },
  { section: 'settings', icon: '⚙', label: 'Settings', tooltip: 'Customize command centre' },
]

const COMMAND_REGISTRY: Record<CommandSection, CommandAction> = {
  dashboard: { id: 'dashboard.overview', section: 'dashboard', label: 'Command overview', description: 'Dashboard context preserved. Workspace summary is active.', surface: 'workspace', status: 'ready' },
  marketplace: { id: 'marketplace.expand', section: 'marketplace', label: 'Marketplace expansion', description: 'Expanded current category and preserved country, region, role, search, and category filters.', surface: 'workspace', status: 'ready' },
  wanted: { id: 'wanted.expand', section: 'wanted', label: 'Wanted demand queue', description: 'Wanted requests opened in the command centre queue.', surface: 'drawer', status: 'ready' },
  intel: { id: 'intel.expand', section: 'intel', label: 'Regional intelligence', description: 'Local intel opened without leaving the dashboard.', surface: 'drawer', status: 'ready' },
  education: { id: 'education.expand', section: 'education', label: 'Education pathway', description: 'Role-first learning path expanded in-dashboard.', surface: 'workspace', status: 'ready' },
  signals: { id: 'signals.expand', section: 'signals', label: 'Weekly signals expansion', description: 'Weekly signals opened in-dashboard with source and impact status.', surface: 'workspace', status: 'ready' },
  suppliers: { id: 'suppliers.expand', section: 'suppliers', label: 'Reviewed suppliers', description: 'Supplier controls opened as a right-side command panel.', surface: 'drawer', status: 'ready' },
  settings: { id: 'settings.open', section: 'settings', label: 'Customize command centre', description: 'Global workspace and notification settings opened.', surface: 'drawer', status: 'ready' },
  'local-intel': { id: 'local-intel.open', section: 'local-intel', label: 'Local Intel / Regional Intelligence', description: 'Country and region intelligence is active.', surface: 'drawer', status: 'ready' },
  proof: { id: 'proof.request', section: 'proof', label: 'Proof request queued', description: 'Proof request queued for Harbourview review. No supplier identity is exposed.', surface: 'drawer', status: 'queued' },
  coa: { id: 'coa.request', section: 'coa', label: 'COA request queued', description: 'COA request queued. If source evidence is not available, operator review is required.', surface: 'drawer', status: 'queued' },
  module: { id: 'module.open', section: 'module', label: 'Education module open', description: 'Selected module opened inside the command centre.', surface: 'drawer', status: 'ready' },
  watch: { id: 'watch.toggle', section: 'watch', label: 'Watch state updated', description: 'Watchlist state changed for the selected dashboard context.', surface: 'drawer', status: 'watching' },
}

function TagPills({ str }: { str: string }) {
  return <div className="hv-tags">{str.split('|').map(t => <span key={t} className="hv-tag">{t}</span>)}</div>
}

function TrustBar({ str }: { str: string }) {
  return <div className="hv-trust">{str.split('|').map(x => { const [a, c] = x.split(':'); return <i key={x} className={c ?? ''}>{a}</i> })}</div>
}

function getMainAction(roleId: string | null): string {
  if (!roleId) return 'Post Wanted Demand'
  if (['exporter','cultivator_producer','processor_extractor','geneticist_breeder'].includes(roleId)) return 'Create Supply Listing'
  if (['doctor_prescriber','clinic_healthcare_operator'].includes(roleId)) return 'Start Clinician Onboarding'
  if (roleId === 'pharmacist') return 'Open Pharmacy Education'
  if (['investor_operator','government_regulator'].includes(roleId)) return 'View Opportunities'
  if (['lab_qa','gmp_quality'].includes(roleId)) return 'Post Lab Services'
  return 'Post Wanted Demand'
}

function buildEducationPath(role: string, roleLabel: string, countryLabel: string, region: string, eduCategories: EduCategory[]): EduCategory[] {
  const roleFirst = ROLE_SPECIFIC_EDU[role] ?? eduCategories.slice(0, 3)
  const countryContext = [
    { icon: '🗺️', title: `${countryLabel} regional context`, desc: `${region || 'National'} rules and route constraints for ${roleLabel}.` },
    { icon: '⚖️', title: 'Rule status & operating boundary', desc: 'Role-specific constraints before marketplace action or disclosure.' },
  ]
  const seen = new Set<string>()
  return [...roleFirst, ...countryContext, ...eduCategories].filter(item => {
    const key = item.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getLocalIntel(countryLabel: string, countryIso2: string, region: string, roleLabel: string) {
  if (countryIso2 === 'AF') {
    return {
      title: 'Local Intel / Regional Intelligence',
      ruleStatus: 'Review-only / restricted posture — verified cannabis commerce pathway not available in public dashboard data.',
      marketplaceImpact: 'Marketplace actions are proof-gated and introduction-gated. Genetic material movement should remain queued until operator review confirms lawful pathway.',
      roleImpact: `${roleLabel} workflows prioritize provenance, phytosanitary documentation, non-disclosure controls, and no default supplier introduction.`,
      confidence: 'Confidence: limited public operating data · Source status: Harbourview review required',
      nextAction: 'Next operator action: queue regional review, request proof packet, and keep marketplace disclosure paused.',
      empty: false,
    }
  }

  const hasRegion = Boolean(region)
  return {
    title: 'Local Intel / Regional Intelligence',
    ruleStatus: hasRegion ? `${region} requires rule confirmation before fulfilment.` : `No regional rule layer available for ${countryLabel}.`,
    marketplaceImpact: hasRegion ? 'Listings remain visible, but proof/COA requests enter the command queue before introduction.' : 'Regional marketplace impact unavailable until a reviewed rule layer is added.',
    roleImpact: hasRegion ? `${roleLabel} pathway is filtered by selected country and region context.` : `${roleLabel} pathway has country-level context only.`,
    confidence: hasRegion ? 'Confidence: medium · Source status: dashboard fixture + reviewed signals' : 'Confidence: unavailable · Source status: empty regional dataset',
    nextAction: hasRegion ? 'Next operator action: verify documents and watch rule changes.' : 'Next operator action: request Harbourview regional review.',
    empty: !hasRegion,
  }
}

function getRowsForView(view: MarketView, marketplaceRows?: DashboardMarketplaceRows) {
  const liveRows = marketplaceRows?.[view]
  return liveRows && liveRows.length > 0 ? liveRows : FALLBACK_ROW_DATA[view]
}

export default function CommandCentre({ signals, eduCategories, initialCountryIso2, initialRoleId, wantedCount = 4, marketplaceRows }: Props) {
  const defaultCountry = useMemo(() => COUNTRY_OPTIONS.find(c => c.iso2 === initialCountryIso2) ?? FALLBACK_COUNTRY, [initialCountryIso2])
  const [country, setCountry] = useState(defaultCountry)
  const [region, setRegion] = useState((REGIONS[defaultCountry.iso2] ?? ['National'])[0] ?? 'National')
  const [role, setRole] = useState(initialRoleId ?? 'geneticist_breeder')
  const [view, setView] = useState<MarketView>('cannabis')
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<CommandSection>('dashboard')
  const [activeCommand, setActiveCommand] = useState<CommandAction | null>(null)
  const [watched, setWatched] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const savePreferences = useCallback((patch: { country_iso2?: string; role_id?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
    }, 600)
  }, [])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const roleLabel = role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.label ?? 'General') : 'General'
  const rows = getRowsForView(view, marketplaceRows)
  const filteredRows = search.trim()
    ? rows.filter(r => r.join(' ').toLowerCase().includes(search.trim().toLowerCase()))
    : rows
  const tierLabel = ['doctor_prescriber','pharmacist','clinic_healthcare_operator'].includes(role) ? 'CLINICAL PARTNER · Education' : 'COMMAND CENTRE · Live workspace'
  const eduPath = buildEducationPath(role, roleLabel, country.label, region, eduCategories)
  const localIntel = getLocalIntel(country.label, country.iso2, region, roleLabel)

  const runCommand = (section: CommandSection, detail?: string) => {
    const command = { ...COMMAND_REGISTRY[section] }
    if (detail) command.description = detail
    if (section === 'watch') setWatched(current => !current)
    setActiveSection(section)
    setActiveCommand(command)
  }

  const handleCountryChange = (iso2: string) => {
    const next = COUNTRY_OPTIONS.find(c => c.iso2 === iso2) ?? country
    const nextRegions = REGIONS[iso2] ?? ['National']
    setCountry(next)
    setRegion(nextRegions[0] ?? 'National')
    savePreferences({ country_iso2: iso2 })
    runCommand('local-intel', `Country context changed to ${next.label}; regional intelligence refreshed in-dashboard.`)
  }

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole)
    savePreferences({ role_id: nextRole })
    runCommand('education', 'Role context updated; education path re-ordered role first, then country/region context.')
  }

  const openRowAction = (row: MarketRow) => {
    const action = row[6].toLowerCase()
    if (action.includes('coa')) runCommand('coa', `${row[2]}: COA request queued for ${country.label} / ${region}.`)
    else if (action.includes('proof') || action.includes('inspection') || action.includes('records')) runCommand('proof', `${row[2]}: proof packet request queued for operator review.`)
    else runCommand('wanted', `${row[2]}: inquiry opened in the dashboard command queue.`)
  }

  const expansionOpen = activeCommand && ['workspace', 'sheet'].includes(activeCommand.surface)
  const drawerOpen = activeCommand?.surface === 'drawer'

  return (
    <>
      <style>{CSS}</style>
      <div className="cc-app">
        <header className="cc-top">
          <div className="cc-brand"><strong>HARBOURVIEW</strong><span>OS COMMAND CENTRE</span></div>
          <div className="cc-context">
            <label className="cc-field"><span>Country</span><select value={country.iso2} onChange={e => handleCountryChange(e.target.value)}>{COUNTRY_OPTIONS.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}</select></label>
            <label className="cc-field"><span>Region</span><select value={region} onChange={e => { setRegion(e.target.value); runCommand('local-intel', `Regional intelligence refreshed for ${e.target.value}.`) }}>{(REGIONS[country.iso2] ?? ['National']).map(r => <option key={r} value={r}>{r}</option>)}</select></label>
            <label className="cc-field"><span>Role</span><select value={role} onChange={e => handleRoleChange(e.target.value)}><option value="">— select role —</option>{Object.entries(ROLE_PROFILES).map(([id, p]) => <option key={id} value={id}>{p!.label}</option>)}</select></label>
            <label className="cc-field"><span>Search</span><input type="text" value={search} placeholder="Filter listings, intel, education…" onChange={e => { setSearch(e.target.value); runCommand('marketplace', e.target.value ? `Search filter active: ${e.target.value}` : 'Search filter cleared; dashboard context preserved.') }} /></label>
          </div>
          <div className="cc-actions">
            <div className="cc-tier">{tierLabel}</div>
            <button className="cc-icon-btn cc-alert" type="button" onClick={() => runCommand('signals')} aria-label="Open weekly signal alerts" title="Open weekly signal alerts">!</button>
            <button className="cc-soft-btn" type="button" onClick={() => runCommand('wanted')}>{wantedCount} Wanted</button>
            <button className="cc-soft-btn" type="button" onClick={() => runCommand('settings')}>Customize</button>
            <button className="cc-primary" type="button" onClick={() => runCommand('wanted')}>{getMainAction(role)}</button>
          </div>
        </header>

        <nav className="cc-sidebar" aria-label="Command centre controls">
          {SIDEBAR_CONTROLS.map(control => (
            <button
              key={control.section}
              type="button"
              className={`cc-nav-btn${activeSection === control.section ? ' active' : ''}`}
              aria-label={control.label}
              title={control.tooltip}
              onClick={() => runCommand(control.section)}
            >
              <span aria-hidden="true">{control.icon}</span><small>{control.label}</small>
            </button>
          ))}
        </nav>

        <main className="cc-workspace">
          <section className="cc-panel cc-market">
            <div className="cc-head"><div><h2>Marketplace & Access</h2><small>{VIEW_LABELS[view]}</small></div><div className="cc-head-actions"><button type="button" className="cc-wanted-cta" onClick={() => runCommand('wanted')}>{wantedCount} Wanted Requests</button><button type="button" className="cc-soft-btn" onClick={() => runCommand('marketplace')}>View All</button></div></div>
            <div className="cc-view-bar"><div className="cc-views">{(['cannabis','equipment','consumables','new-products','services','opportunities'] as MarketView[]).map(v => <button key={v} type="button" className={`cc-view${view === v ? ' active' : ''}`} onClick={() => { setView(v); runCommand('marketplace', `${VIEW_BLOCK_TITLES[v]} selected; category rail state preserved.`) }}>{VIEW_TAB_LABELS[v]}</button>)}</div></div>
            <div className="cc-market-grid"><div className="cc-market-block"><div className="cc-block-title"><b>{VIEW_BLOCK_TITLES[view]}</b><span>{filteredRows.length} rows · region-filtered</span></div><div className="cc-rows">{filteredRows.map(r => <article key={r[2]} className="cc-row"><div className={`cc-spec ${r[0]}`} /><div><div className="cc-type">{r[1]}</div><h4>{r[2]}</h4><p>{r[3]}</p><TagPills str={r[4]} /><TrustBar str={r[5]} /></div><div className="cc-action-box"><strong>{r[7]}</strong><small>{r[1]} · {country.iso2}</small><button type="button" onClick={() => openRowAction(r)}>{r[6]}</button><button type="button" className={watched ? 'active-watch' : ''} onClick={() => runCommand('watch', `${r[2]} ${watched ? 'removed from' : 'added to'} watchlist.`)}>{watched ? 'Watching' : 'Watch'}</button></div></article>)}</div></div></div>
          </section>

          <section className="cc-col2">
            <div className="cc-panel cc-education"><div className="cc-head"><div><h3>Education Hub</h3><small>Role-first learning path</small></div><button type="button" className="cc-link-btn" onClick={() => runCommand('education')}>View All</button></div><div className="cc-body"><div className="cc-edu-intro"><strong>{roleLabel} Learning Path</strong><p>Role-specific modules appear first, followed by {country.label} / {region} context. No funnel block is shown in the visible hub.</p></div><div className="cc-edu-cards">{eduPath.slice(0, 5).map(cat => <button type="button" key={cat.title} className="cc-edu" onClick={() => runCommand('module', `${cat.title} opened in-dashboard for ${roleLabel} in ${country.label}.`)}><span>{cat.icon}</span><b>{cat.title}</b><p>{cat.desc}</p><em>Open Module</em></button>)}</div></div></div>
          </section>

          <section className="cc-col3">
            <div className="cc-panel cc-signals"><div className="cc-head"><div><h3>Weekly Signals</h3><small>Free summaries · source confidence · marketplace impact</small></div><button type="button" className="cc-link-btn" onClick={() => runCommand('signals')}>View All</button></div><div className="cc-body"><div className="cc-signal-list">{signals.slice(0, 3).map(s => <article key={s.id} className="cc-signal"><span className={`cc-sev${s.tag.label === 'REGULATION' || s.tag.label === 'COMPLIANCE' ? '' : ' low'}`} /><div><b>{s.title}</b><p>{s.market} · {s.commercialImpact}</p><small>{s.timeAgo} · confidence {s.confidence}%</small><div className="cc-impact">Marketplace impact: {s.commercialImpact}</div></div><button type="button" className="cc-signal-tag" onClick={() => runCommand('signals', `${s.title} opened inside Weekly Signals expansion.`)}>{s.tag.label}</button></article>)}</div></div></div>
            <div className="cc-panel cc-map-panel"><div className="cc-head"><div><h3>{localIntel.title}</h3><small>{REGION_LABELS[country.iso2] ?? 'Country-level intelligence'}</small></div><button type="button" className="cc-link-btn" onClick={() => runCommand('local-intel')}>Local Intel</button></div><div className="cc-body cc-map-body"><div className="cc-legend"><span>Rule status</span><span>Marketplace impact</span><span>Role impact</span><span>Confidence</span></div><div className="cc-map-wrap"><div className="cc-region-grid">{(REGIONS[country.iso2] ?? []).map(r => <button key={r} type="button" className={`cc-region-tile${r === region ? ' active' : ''}${WARN_REGIONS.has(r) ? ' warn' : ''}`} onClick={() => { setRegion(r); runCommand('local-intel', `Local intel focused on ${country.label} / ${r}.`) }}>{r}</button>)}</div><div className="cc-rules"><b>{country.label} / {region}</b>{localIntel.empty ? <p>No regional intelligence dataset is currently available. Queue a Harbourview review before acting.</p> : <><p><strong>Rule status:</strong> {localIntel.ruleStatus}</p><p><strong>Marketplace impact:</strong> {localIntel.marketplaceImpact}</p><p><strong>Role impact:</strong> {localIntel.roleImpact}</p><p><strong>Confidence/source:</strong> {localIntel.confidence}</p><p><strong>Next operator action:</strong> {localIntel.nextAction}</p></>}</div></div></div></div>
          </section>

          {expansionOpen && <section className="cc-expansion" aria-live="polite"><div><small>{activeCommand.id}</small><h3>{activeCommand.label}</h3><p>{activeCommand.description}</p><dl><div><dt>Country</dt><dd>{country.label}</dd></div><div><dt>Region</dt><dd>{region}</dd></div><div><dt>Role</dt><dd>{roleLabel}</dd></div><div><dt>Category</dt><dd>{VIEW_BLOCK_TITLES[view]}</dd></div><div><dt>Search</dt><dd>{search || 'No search filter'}</dd></div><div><dt>Status</dt><dd>{activeCommand.status}</dd></div></dl><button type="button" className="cc-primary" onClick={() => setActiveCommand(null)}>Collapse expansion</button></div></section>}
        </main>

        <footer className="cc-status"><span><b>LIVE</b> role-aware · region-filtered · proof-gated</span><span>Active: {COMMAND_REGISTRY[activeSection].label}</span><span>Context preserved across command expansions</span></footer>
      </div>
      {drawerOpen && <div className="cc-scrim" onClick={() => setActiveCommand(null)} />}
      <aside className={`cc-drawer${drawerOpen ? ' open' : ''}`} aria-label="Command centre panel" aria-live="polite"><div className="cc-drawer-head"><div><small>{activeCommand?.id}</small><h3>{activeCommand?.label}</h3></div><button type="button" className="cc-close" onClick={() => setActiveCommand(null)} aria-label="Close command panel">×</button></div><div className="cc-drawer-body"><section className="cc-drawer-card"><b>Command state</b><p>{activeCommand?.description}</p></section><section className="cc-drawer-card"><b>Preserved context</b><p>{country.label} / {region} · {roleLabel} · {VIEW_BLOCK_TITLES[view]} · search: {search || 'none'}</p></section><section className="cc-drawer-card"><b>Operator result</b><p>{activeCommand?.status === 'queued' ? 'Queued for controlled Harbourview review. No external page opened and no private source detail exposed.' : activeCommand?.status === 'watching' ? `Watchlist is now ${watched ? 'active' : 'inactive'} for this context.` : 'Panel is ready for the next in-dashboard operator action.'}</p></section></div></aside>
    </>
  )
}

const CSS = `
:root {
  --cc-bg:#040814; --cc-panel:#0b1929; --cc-ink:#f7efe1; --cc-text:#d8e1e9; --cc-muted:#9aa8b6;
  --cc-dim:#627282; --cc-line:rgba(232,240,248,.115); --cc-line2:rgba(232,240,248,.18);
  --cc-gold:#d9af63; --cc-gold2:#f3cf86; --cc-green:#74d28e; --cc-blue:#79b2ea; --cc-red:#e27466; --cc-amber:#e7b053;
  --cc-shadow:0 28px 88px rgba(0,0,0,.42); --cc-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif; --cc-serif:Georgia,"Times New Roman",serif; --cc-mono:"SFMono-Regular","Cascadia Mono",monospace;
}
button, select, input { font: inherit; }
button { cursor: pointer; }
.cc-app{position:fixed;inset:0;display:grid;grid-template-columns:86px minmax(0,1fr);grid-template-rows:78px minmax(0,1fr) 42px;background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);color:var(--cc-text);font-family:var(--cc-sans);overflow:hidden}
.cc-top{grid-column:1/-1;grid-row:1;z-index:10;display:grid;grid-template-columns:230px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 18px;border-bottom:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(5,10,20,.97),rgba(5,10,20,.86))}
.cc-brand strong{display:block;color:var(--cc-ink);font-family:var(--cc-serif);font-size:20px;letter-spacing:.08em}.cc-brand span{color:var(--cc-gold);font-size:9px;letter-spacing:.18em}.cc-context{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:9px}.cc-field{border:1px solid var(--cc-line);border-radius:12px;padding:6px 8px;background:rgba(255,255,255,.035)}.cc-field span{display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em}.cc-field select,.cc-field input{width:100%;border:0;background:transparent;color:var(--cc-ink);outline:0;font-size:12px}.cc-field option{background:#0b1929;color:#f7efe1}.cc-actions{display:flex;align-items:center;gap:8px}.cc-tier{border:1px solid rgba(217,175,99,.3);color:var(--cc-gold);border-radius:999px;padding:7px 10px;font-size:9px;font-family:var(--cc-mono);white-space:nowrap}.cc-soft-btn,.cc-primary,.cc-wanted-cta,.cc-link-btn{border:1px solid var(--cc-line2);border-radius:10px;background:rgba(255,255,255,.045);color:var(--cc-ink);padding:8px 12px;text-decoration:none;font-size:11px}.cc-primary{background:linear-gradient(135deg,var(--cc-gold),#a9792e);border-color:rgba(243,207,134,.8);color:#06111d;font-weight:800}.cc-icon-btn{width:34px;height:34px;border-radius:999px;border:1px solid rgba(226,116,102,.45);background:rgba(226,116,102,.14);color:#ffb2a8;font-weight:900}.cc-sidebar{grid-column:1;grid-row:2/4;border-right:1px solid var(--cc-line);background:rgba(3,8,17,.88);display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px 8px}.cc-nav-btn{width:66px;min-height:56px;border:1px solid var(--cc-line);border-radius:16px;background:rgba(255,255,255,.026);color:var(--cc-muted);display:grid;place-items:center;gap:2px}.cc-nav-btn span{font-size:20px}.cc-nav-btn small{font-size:9px}.cc-nav-btn.active{border-color:rgba(243,207,134,.78);background:rgba(217,175,99,.13);color:var(--cc-gold2);box-shadow:0 0 0 1px rgba(217,175,99,.1)}
.cc-workspace{grid-column:2;grid-row:2;display:grid;grid-template-columns:minmax(430px,1.12fr) minmax(290px,.72fr) minmax(330px,.82fr);gap:12px;padding:12px;overflow:hidden;position:relative}.cc-panel{border:1px solid var(--cc-line);border-radius:20px;background:linear-gradient(180deg,rgba(12,25,41,.92),rgba(7,16,27,.92));box-shadow:var(--cc-shadow);min-height:0;overflow:hidden}.cc-market,.cc-col2,.cc-col3{min-height:0}.cc-market{display:flex;flex-direction:column}.cc-col2,.cc-col3{display:flex;flex-direction:column;gap:12px;overflow:hidden}.cc-education{flex:1}.cc-signals{flex:1.1}.cc-map-panel{flex:.95}.cc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--cc-line)}.cc-head h2,.cc-head h3{margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520}.cc-head h2{font-size:24px}.cc-head h3{font-size:18px}.cc-head small{color:var(--cc-muted);font-size:11px}.cc-head-actions{display:flex;gap:8px;align-items:center}.cc-view-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--cc-line)}.cc-views{display:flex;gap:7px;flex-wrap:wrap}.cc-view{border:1px solid var(--cc-line);border-radius:999px;background:rgba(255,255,255,.03);color:var(--cc-muted);padding:7px 10px;font-size:11px}.cc-view.active{border-color:rgba(243,207,134,.7);color:var(--cc-gold2);background:rgba(217,175,99,.12)}.cc-market-grid,.cc-body{padding:12px;overflow:auto;min-height:0}.cc-market-grid{flex:1}.cc-block-title{display:flex;justify-content:space-between;color:var(--cc-muted);font-size:11px;margin-bottom:9px}.cc-block-title b{color:var(--cc-gold2)}.cc-rows{display:grid;gap:10px}.cc-row{border:1px solid var(--cc-line);border-radius:18px;background:rgba(255,255,255,.026);padding:12px;display:grid;grid-template-columns:9px minmax(0,1fr) 124px;gap:12px}.cc-spec{border-radius:999px;background:var(--cc-blue)}.cc-spec.supply{background:var(--cc-green)}.cc-spec.equip{background:var(--cc-amber)}.cc-spec.service{background:var(--cc-blue)}.cc-spec.deal{background:var(--cc-gold)}.cc-type{color:var(--cc-gold);font-size:10px;text-transform:uppercase;letter-spacing:.16em}.cc-row h4{margin:3px 0;color:var(--cc-ink);font-size:14px}.cc-row p{margin:0 0 8px;color:var(--cc-muted);font-size:12px;line-height:1.4}.hv-tags,.hv-trust{display:flex;gap:5px;flex-wrap:wrap}.hv-tag,.hv-trust i{border:1px solid var(--cc-line);border-radius:999px;padding:2px 6px;color:var(--cc-muted);font-size:9px;font-style:normal;font-family:var(--cc-mono)}.hv-trust i.ok{color:var(--cc-green)}.hv-trust i.warn{color:var(--cc-amber)}.cc-action-box{display:grid;gap:6px;align-content:start;text-align:right}.cc-action-box strong{color:var(--cc-ink);font-size:12px}.cc-action-box small{color:var(--cc-dim);font-size:10px}.cc-action-box button{border:1px solid rgba(217,175,99,.35);border-radius:10px;background:rgba(217,175,99,.08);color:var(--cc-gold2);padding:7px;font-size:10px}.cc-action-box .active-watch{background:rgba(116,210,142,.12);border-color:rgba(116,210,142,.45);color:var(--cc-green)}.cc-edu-intro{border:1px solid rgba(217,175,99,.24);border-radius:18px;padding:12px;background:linear-gradient(135deg,rgba(217,175,99,.095),rgba(120,215,211,.045));margin-bottom:10px}.cc-edu-intro strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);font-size:17px}.cc-edu-intro p,.cc-edu p,.cc-signal p,.cc-rules p,.cc-drawer-card p,.cc-expansion p{margin:5px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.45}.cc-edu-cards{display:grid;gap:8px}.cc-edu{border:1px solid var(--cc-line);border-radius:15px;background:rgba(255,255,255,.026);padding:11px;text-align:left;color:var(--cc-text)}.cc-edu span{font-size:19px}.cc-edu b{display:block;color:var(--cc-ink);font-size:13px}.cc-edu em{display:inline-block;margin-top:8px;color:var(--cc-gold2);font-size:10px;font-style:normal;text-transform:uppercase;letter-spacing:.12em}.cc-signal-list{display:grid;gap:10px}.cc-signal{border:1px solid var(--cc-line);border-radius:16px;background:rgba(255,255,255,.026);padding:12px;display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:10px}.cc-sev{min-height:56px;border-radius:999px;background:var(--cc-green)}.cc-sev.low{background:var(--cc-amber)}.cc-signal b,.cc-rules b{display:block;color:var(--cc-ink);font-size:13px}.cc-signal small{display:block;margin-top:5px;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px}.cc-impact{margin-top:7px;border:1px solid rgba(217,175,99,.18);border-radius:9px;padding:6px;color:var(--cc-gold2);font-size:10px;background:rgba(217,175,99,.045)}.cc-signal-tag{height:26px;border:1px solid rgba(217,175,99,.35);border-radius:999px;background:rgba(217,175,99,.08);color:var(--cc-gold2);font-size:9px}.cc-map-body{display:flex;flex-direction:column}.cc-legend{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.cc-legend span{border:1px solid var(--cc-line);border-radius:999px;padding:4px 7px;font-size:9px;color:var(--cc-muted);font-family:var(--cc-mono)}.cc-map-wrap{border:1px solid var(--cc-line);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.02)}.cc-region-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}.cc-region-tile{border:1px solid var(--cc-line);border-radius:12px;background:rgba(122,177,234,.105);color:var(--cc-text);padding:10px;font-size:11px}.cc-region-tile.active{background:rgba(217,175,99,.22);border-color:rgba(243,207,134,.75)}.cc-region-tile.warn{box-shadow:inset 0 0 0 1px rgba(226,116,102,.24)}.cc-rules{border-top:1px solid var(--cc-line);padding:12px;background:rgba(5,13,23,.76)}.cc-rules strong{color:var(--cc-gold2)}.cc-expansion{position:absolute;inset:18px;z-index:8;border:1px solid rgba(243,207,134,.45);border-radius:24px;background:linear-gradient(135deg,rgba(8,19,32,.98),rgba(5,12,22,.97));box-shadow:var(--cc-shadow);padding:28px;display:grid;align-items:center}.cc-expansion small{color:var(--cc-gold);font-family:var(--cc-mono);letter-spacing:.14em;text-transform:uppercase}.cc-expansion h3{margin:8px 0;color:var(--cc-ink);font-family:var(--cc-serif);font-size:28px}.cc-expansion dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:20px 0}.cc-expansion dl div{border:1px solid var(--cc-line);border-radius:14px;padding:10px}.cc-expansion dt{color:var(--cc-dim);font-size:10px;text-transform:uppercase}.cc-expansion dd{margin:3px 0 0;color:var(--cc-ink);font-size:13px}.cc-status{grid-column:2/-1;grid-row:3;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-top:1px solid var(--cc-line);background:rgba(3,8,17,.98);font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);gap:16px}.cc-status b{color:var(--cc-green)}.cc-scrim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:20;backdrop-filter:blur(2px)}.cc-drawer{position:fixed;right:0;top:0;bottom:0;width:400px;z-index:30;background:linear-gradient(180deg,rgba(10,22,36,.98),rgba(5,13,24,.99));border-left:1px solid var(--cc-line2);box-shadow:-28px 0 88px rgba(0,0,0,.48);transform:translateX(100%);transition:transform .24s ease;display:flex;flex-direction:column}.cc-drawer.open{transform:translateX(0)}.cc-drawer-head{padding:20px 22px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}.cc-drawer-head small{display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em;font-family:var(--cc-mono)}.cc-drawer-head h3{margin:6px 0 0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;font-size:18px}.cc-close{width:36px;height:36px;border-radius:10px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);color:var(--cc-muted);font-size:22px}.cc-drawer-body{flex:1;overflow:auto;padding:20px 22px;display:grid;gap:16px;align-content:start}.cc-drawer-card{border:1px solid var(--cc-line);border-radius:18px;padding:16px;background:rgba(255,255,255,.022)}.cc-drawer-card b{display:block;color:var(--cc-ink);font-size:14px;margin-bottom:6px}
@media(max-width:1180px){
  .cc-app{position:relative;min-height:100vh;overflow:auto;display:block}.cc-top{display:flex;flex-direction:column;align-items:stretch}.cc-context{grid-template-columns:1fr 1fr}.cc-actions{flex-wrap:wrap}.cc-sidebar{display:grid;grid-template-columns:repeat(6,1fr);position:sticky;top:0;z-index:11;border-right:0;border-bottom:1px solid var(--cc-line);padding:8px}.cc-nav-btn{width:auto}.cc-workspace{display:grid;grid-template-columns:1fr;overflow:visible}.cc-status{display:none}.cc-row{grid-template-columns:7px minmax(0,1fr)}.cc-action-box{text-align:left}.cc-col2,.cc-col3{overflow:visible}.cc-drawer{width:100vw}.cc-drawer.open{transform:translateX(0)}.cc-expansion{position:fixed;inset:0;z-index:40;border-radius:0;overflow:auto}.cc-expansion dl{grid-template-columns:1fr}.cc-region-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:720px){.cc-context{grid-template-columns:1fr}.cc-actions{align-items:stretch}.cc-actions button,.cc-actions .cc-tier{flex:1}.cc-sidebar{grid-template-columns:repeat(3,1fr)}.cc-head{flex-direction:column}.cc-head-actions{width:100%;flex-wrap:wrap}.cc-head-actions button{flex:1}.cc-views{display:grid;grid-template-columns:1fr 1fr;width:100%}.cc-row{display:block}.cc-spec{height:6px;margin-bottom:10px}.cc-action-box{margin-top:10px}.cc-region-grid{grid-template-columns:1fr}}
`
