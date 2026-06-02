'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
}

// ── Static data ───────────────────────────────────────────────────────────────
const COUNTRIES = [
  { iso2:'AU', label:'Australia',      cur:'AUD', c1:'Sydney, AU',      c2:'Melbourne, AU',  c3:'Brisbane, AU'   },
  { iso2:'CA', label:'Canada',         cur:'CAD', c1:'Toronto, CA',     c2:'Vancouver, CA',  c3:'Montreal, CA'   },
  { iso2:'DE', label:'Germany',        cur:'EUR', c1:'Berlin, DE',      c2:'Hamburg, DE',    c3:'Munich, DE'     },
  { iso2:'NL', label:'Netherlands',    cur:'EUR', c1:'Amsterdam, NL',   c2:'Rotterdam, NL',  c3:'Utrecht, NL'    },
  { iso2:'GB', label:'United Kingdom', cur:'GBP', c1:'London, GB',      c2:'Manchester, GB', c3:'Bristol, GB'    },
  { iso2:'US', label:'United States',  cur:'USD', c1:'California, US',  c2:'New York, US',   c3:'Colorado, US'   },
  { iso2:'IL', label:'Israel',         cur:'ILS', c1:'Tel Aviv, IL',    c2:'Jerusalem, IL',  c3:'Haifa, IL'      },
  { iso2:'PT', label:'Portugal',       cur:'EUR', c1:'Lisbon, PT',      c2:'Porto, PT',      c3:'Faro, PT'       },
  { iso2:'CH', label:'Switzerland',    cur:'CHF', c1:'Zurich, CH',      c2:'Basel, CH',      c3:'Geneva, CH'     },
  { iso2:'NZ', label:'New Zealand',    cur:'NZD', c1:'Auckland, NZ',    c2:'Wellington, NZ', c3:'Christchurch,NZ'},
]

const REGIONS: Record<string, string[]> = {
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
  AU:'Australia · state-level rule instrument', CA:'Canada · province-level rule instrument',
  DE:'Germany · federal-state rule instrument', NL:'Netherlands · province-level rule instrument',
  GB:'United Kingdom · nation-level rule instrument', US:'United States · state-level rule instrument',
  IL:'Israel · district-level rule instrument', PT:'Portugal · region-level rule instrument',
  CH:'Switzerland · canton-level rule instrument', NZ:'New Zealand · region-level rule instrument',
}

const WARN_REGIONS = new Set(['Queensland','Texas','Ticino','Limburg','Alberta','Northern Ireland','Saxony'])

type MarketView = 'market' | 'importer' | 'clinical' | 'equipment' | 'signals'

const ROW_DATA: Record<MarketView, [string, string, string, string, string, string, string, string][]> = {
  market:[
    ['supply','Supply','GMP-ready dried flower batch package','Export-oriented supplier profile with COA, batch record, and document review path.','verified shell|supply|import/export','VER:ok|PROOF:warn|REG:ok|72:warn|PUBLIC','Ask for proof','On enquiry'],
    ['equip','Equipment','Used extraction and lab equipment lot','Distressed asset listing with inspection requirement and buyer-side verification flag.','equipment|inspection|seller review','VER:warn|PROOF:warn|REG:ok|61:warn|PUBLIC','Request inspection','Request quote'],
    ['service','Services','GDP logistics partner — import handoff','Regional logistics and customs support for regulated product movement.','reviewed|customs|cold chain','VER:ok|PROOF:ok|REG:warn|78:ok|PUBLIC','Book intro','Service'],
    ['eduSpec','Education Lead','Pharmacy group onboarding request','Clinician-facing education request tied to country and regional dispensing rules.','education lead|pharmacy|clinical','VER:ok|PROOF:ok|REG:ok|84:ok|PUBLIC','Send packet','Lead'],
  ],
  importer:[
    ['supply','Matched Supply','Verified medical supply candidate','Supplier fit for wanted demand with proof package not yet complete.','matched supply|proof needed|regional check','VER:ok|PROOF:warn|REG:ok|73:warn|PRIVATE:lock','Request intro','Matched'],
    ['service','Counterparty Intro','Reviewed exporter introduction','Private intro candidate with source notes gated until admin review.','counterparty|intro|private notes','VER:ok|PROOF:warn|REG:warn|64|PRIVATE:lock','Open inquiry','Intro'],
    ['equip','Equipment','Extraction equipment buyer review','Used equipment lot requires inspection before deal-room movement.','equipment|asset|inspection','VER:warn|PROOF:warn|REG:ok|59:warn|PUBLIC','Ask inspection','Asset'],
    ['eduSpec','Professional Lead','Pharmacy supply education lead','Buyer demand includes pharmacy-facing education requirement.','education lead|pharmacy|buyer need','VER:ok|PROOF:ok|REG:ok|81:ok|PUBLIC','Send packet','Lead'],
  ],
  clinical:[
    ['eduSpec','Doctor Pathway','Clinician onboarding package','Country-specific access, patient pathway, and product-format education.','doctor|clinical|education','VER:ok|PROOF:ok|REG:ok|88:ok|PUBLIC','Start onboarding','Core'],
    ['eduSpec','Pharmacist Module','Dispensing and storage education','Region-aware pharmacy workflow and verification steps.','pharmacist|dispensing|regional','VER:ok|PROOF:ok|REG:ok|86:ok|PUBLIC','Invite pharmacy','Core'],
    ['service','Compliance Session','Professional compliance review','Claim boundaries before professional-facing marketplace action.','compliance|review|required','VER:ok|PROOF:warn|REG:ok|75:warn|PRIVATE:lock','Book session','Review'],
    ['supply','Clinical Access','Product information request','Professional-safe access pathway without unsupported public claims.','clinical access|product format|education','VER:warn|PROOF:warn|REG:warn|62:warn|PUBLIC','Request packet','Info'],
  ],
  equipment:[
    ['equip','Equipment','Used extraction line — inspection ready','Commercial asset listing with buyer diligence and verification workflow.','equipment|inspection|distressed asset','VER:warn|PROOF:warn|REG:ok|67:warn|PUBLIC','Request inspection','Asset'],
    ['equip','Equipment','Lab instrumentation package','Testing equipment lot with service history pending review.','lab equipment|QA|review','VER:warn|PROOF:warn|REG:ok|63:warn|PUBLIC','Ask records','Asset'],
    ['service','Service','Equipment verification consultant','Inspection and valuation support for private deal room movement.','service|valuation|verification','VER:ok|PROOF:ok|REG:ok|79:ok|PUBLIC','Book review','Service'],
    ['supply','Wanted Demand','Buyer seeking extraction equipment','Buyer-side demand can be matched to used/new equipment listings.','wanted|equipment buyer|high intent','VER:ok|PROOF:warn|REG:ok|71:warn|PRIVATE:lock','Respond to demand','Wanted'],
  ],
  signals:[
    ['service','Intel Action','Source trail review request','Paid review connects weekly signal to marketplace action and watch alerts.','intel plus|source trail|watchlist','VER:ok|PROOF:warn|REG:warn|70:warn|PRIVATE:lock','Unlock trail','Plus'],
    ['supply','Signal-linked Supply','Supply category affected by weekly signal','Marketplace row surfaced because signal indicates regional relevance.','signal linked|supply|regional','VER:ok|PROOF:warn|REG:warn|69:warn|PUBLIC','Review impact','Signal'],
    ['eduSpec','Education Lead','Pharmacy signal follow-up','Weekly signal creates education packet opportunity for pharmacy group.','education lead|signal|pharmacy','VER:ok|PROOF:ok|REG:ok|82:ok|PUBLIC','Send packet','Lead'],
    ['service','Country Rules','Regional rules change watch','Map-linked rule review before a commercial listing or inquiry proceeds.','rules|region|review','VER:warn|PROOF:warn|REG:warn|57:warn|PUBLIC','Open rules','Review'],
  ],
}

const VIEW_LABELS: Record<MarketView, string> = {
  market:'Commercial engine · transaction flow · proof-aware rows',
  importer:'Importer commercial queue',
  clinical:'Clinical acquisition · professional education · safe marketplace paths',
  equipment:'Equipment deals · inspection · verification workflow',
  signals:'Weekly signals converted into marketplace actions',
}

const VIEW_BLOCK_TITLES: Record<MarketView, string> = {
  market:'Segmented marketplace',
  importer:'Importer commercial queue',
  clinical:'Professional marketplace leads',
  equipment:'Equipment and asset marketplace',
  signals:'Signal-linked commercial actions',
}

// ── Role → main action label ──────────────────────────────────────────────────
function getMainAction(roleId: string | null): string {
  if (!roleId) return 'Post Wanted Demand'
  if (['exporter','cultivator_producer','processor_extractor'].includes(roleId)) return 'Create Supply Listing'
  if (['doctor_prescriber','clinic_healthcare_operator'].includes(roleId)) return 'Start Clinician Onboarding'
  if (roleId === 'pharmacist') return 'Open Pharmacy Education'
  if (['investor_operator','government_regulator'].includes(roleId)) return 'View Opportunities'
  if (['lab_qa','gmp_quality'].includes(roleId)) return 'Post Lab Services'
  return 'Post Wanted Demand'
}

// ── Tag/trust renderers ───────────────────────────────────────────────────────
function TagPills({ str }: { str: string }) {
  return (
    <div className="hv-tags">
      {str.split('|').map(t => {
        const cls = /proof|supply|education lead|wanted/.test(t) ? 'gold'
          : /verified|reviewed|pharmacy|doctor/.test(t) ? 'green'
          : /inspection|required|review/.test(t) ? 'red'
          : /counterparty|service|intel/.test(t) ? 'blue' : ''
        return <span key={t} className={`hv-tag ${cls}`}>{t}</span>
      })}
    </div>
  )
}

function TrustBar({ str }: { str: string }) {
  return (
    <div className="hv-trust">
      {str.split('|').map(x => {
        const [a, c] = x.split(':')
        return <i key={x} className={c ?? ''}>{a}</i>
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CommandCentre({
  signals,
  eduCategories,
  initialCountryIso2,
  initialRoleId,
  wantedCount = 4,
}: Props) {
  const defaultCountry = COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? COUNTRIES[0]
  const defaultRegions = REGIONS[defaultCountry.iso2] ?? []

  const [country, setCountry] = useState(defaultCountry)
  const [region, setRegion] = useState(defaultRegions[0] ?? '')
  const [role, setRole] = useState(initialRoleId ?? '')
  const [view, setView] = useState<MarketView>('market')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Persist preferences
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePreferences = useCallback((patch: { country_iso2?: string; role_id?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(() => {})
    }, 600)
  }, [])

  const handleCountryChange = (iso2: string) => {
    const next = COUNTRIES.find(c => c.iso2 === iso2) ?? country
    const nextRegions = REGIONS[iso2] ?? []
    setCountry(next)
    setRegion(nextRegions[0] ?? '')
    savePreferences({ country_iso2: iso2 })
  }

  const handleRoleChange = (r: string) => {
    setRole(r)
    savePreferences({ role_id: r })
  }

  const warn = WARN_REGIONS.has(region)
  const mainAction = getMainAction(role)
  const tierLabel = ['doctor_prescriber','pharmacist','clinic_healthcare_operator'].includes(role)
    ? 'CLINICAL PARTNER · Education' : 'FREE · Weekly Signals'

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const rows = ROW_DATA[view]

  return (
    <>
      <style>{CSS}</style>

      <div className="cc-app">
        {/* ── Grid line overlay ── */}
        <div className="cc-grid-overlay" aria-hidden />

        {/* ── Top bar ── */}
        <header className="cc-top">
          <div className="cc-brand">
            <strong>HARBOURVIEW</strong>
            <span>MARKET ACCESS · INTELLIGENCE · EDUCATION</span>
          </div>
          <div className="cc-context">
            <div className="cc-field">
              <label>Country</label>
              <select value={country.iso2} onChange={e => handleCountryChange(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}
              </select>
            </div>
            <div className="cc-field">
              <label>Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)}>
                {(REGIONS[country.iso2] ?? []).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="cc-field">
              <label>Role</label>
              <select value={role} onChange={e => handleRoleChange(e.target.value)}>
                <option value="">— select role —</option>
                {Object.entries(ROLE_PROFILES).map(([id, p]) =>
                  <option key={id} value={id}>{p!.label}</option>
                )}
              </select>
            </div>
            <div className="cc-field">
              <label>Search</label>
              <div className="cc-search-wrap">
                <span className="cc-search-icon" aria-hidden />
                <input type="text" placeholder="Search listings, intel, education…" />
              </div>
            </div>
          </div>
          <div className="cc-actions">
            <div className="cc-tier">{tierLabel}</div>
            <button className="cc-icon-btn cc-alert" aria-label="Notifications" />
            <Link href="/marketplace/wanted" className="cc-soft-btn">{wantedCount} Wanted</Link>
            <button className="cc-primary" onClick={() => setDrawerOpen(true)}>{mainAction}</button>
          </div>
        </header>

        {/* ── Sidebar ── */}
        <nav className="cc-sidebar" aria-label="Main navigation">
          {[
            { href:'/dashboard',          label:'Dashboard',    icon:<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>, active:true },
            { href:'/marketplace',        label:'Marketplace',  icon:<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></> },
            { href:'/intel-signals',      label:'Intel',        icon:<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/> },
            { href:'/education',          label:'Education',    icon:<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></> },
            { href:'/supplier-directory', label:'Suppliers',    icon:<><circle cx="17" cy="7" r="4"/><path d="M3 21v-2a7 7 0 017-7h1"/></> },
          ].map(({ href, label, icon, active }) => (
            <Link key={href} href={href} className={`cc-nav-btn${active ? ' active' : ''}`} aria-label={label}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
            </Link>
          ))}
          <span className="cc-nav-spacer" />
          <Link href="/account" className="cc-nav-btn" aria-label="Account">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </Link>
        </nav>

        {/* ── Main workspace ── */}
        <main className="cc-workspace">

          {/* ── Col 1: Marketplace ── */}
          <section className="cc-panel cc-market">
            <div className="cc-head">
              <div>
                <h2>Marketplace & Access</h2>
                <small id="cc-market-subtitle">{VIEW_LABELS[view]}</small>
              </div>
              <div className="cc-head-actions">
                <Link href="/marketplace/wanted" className="cc-wanted-cta">{wantedCount} Wanted Requests →</Link>
                <Link href="/marketplace" className="cc-soft-btn">View All →</Link>
              </div>
            </div>

            {/* View tabs */}
            <div className="cc-view-bar">
              <div className="cc-views">
                {(['market','importer','clinical','equipment','signals'] as MarketView[]).map(v => (
                  <button key={v} className={`cc-view${view === v ? ' active' : ''}`}
                    onClick={() => setView(v)}>
                    {{ market:'Market', importer:'Importer', clinical:'Clinical', equipment:'Equipment', signals:'Signals' }[v]}
                  </button>
                ))}
              </div>
              <button className="cc-customize-btn" onClick={() => setDrawerOpen(true)}>Customize</button>
            </div>

            {/* Pipeline */}
            <div className="cc-pipeline">
              {[
                { label:'Wanted', val:'4 active', active: true },
                { label:'Matched', val:'2 pending' },
                { label:'Proof Review', val:'1 open' },
                { label:'Inquiry', val:'0 live' },
                { label:'Deal Room', val:'0 active' },
              ].map(({ label, val, active }) => (
                <div key={label} className={`cc-pipe${active ? ' active' : ''}`}>
                  <b>{label}</b><span>{val}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="cc-market-grid">
              <div className="cc-market-block">
                <div className="cc-block-title">
                  <b>{VIEW_BLOCK_TITLES[view]}</b>
                  <span>{rows.length} rows · region-filtered</span>
                </div>
                <div className="cc-rows">
                  {rows.map(r => (
                    <article key={r[2]} className="cc-row">
                      <div className={`cc-spec ${r[0]}`} />
                      <div>
                        <div className="cc-type">{r[1]}</div>
                        <h4>{r[2]}</h4>
                        <p>{r[3]}</p>
                        <TagPills str={r[4]} />
                        <TrustBar str={r[5]} />
                      </div>
                      <div className="cc-action-box">
                        <strong>{r[7]}</strong>
                        <small>{r[1].toLowerCase()}</small>
                        <button className="cc-row-action">{r[6]}</button>
                        <button className="cc-secondary">Watch</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Col 2: Education + Map ── */}
          <section className="cc-col2">
            <div className="cc-panel cc-education">
              <div className="cc-head">
                <div><h3>Education Hub</h3><small>Role-relevant learning</small></div>
                <Link href="/education" className="cc-link-btn">View All →</Link>
              </div>
              <div className="cc-body">
                <div className="cc-edu-intro">
                  <strong>{role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.label ?? 'General') : 'General'} Learning Path</strong>
                  <p>Role-specific education, compliance modules, and country rules for your selected market.</p>
                </div>
                <div className="cc-edu-cards">
                  {eduCategories.slice(0, 3).map(cat => (
                    <div key={cat.title} className="cc-edu">
                      <div className="cc-edu-top">
                        <div>
                          <b>{cat.icon} {cat.title}</b>
                          <p>{cat.desc}</p>
                        </div>
                      </div>
                      <button className="cc-edu-cta">Open module</button>
                    </div>
                  ))}
                </div>
                <div className="cc-funnel">
                  <h4>Education Funnel</h4>
                  <div className="cc-funnel-grid">
                    <div className="cc-funnel-box"><b>3 modules ready</b><span>Role-matched content</span></div>
                    <div className="cc-funnel-box"><b>2 country rules</b><span>{country.label} framework</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="cc-panel cc-map-panel">
              <div className="cc-head">
                <div>
                  <h3>{country.label}</h3>
                  <small id="cc-map-label">{REGION_LABELS[country.iso2] ?? 'Region-level rule instrument'}</small>
                </div>
              </div>
              <div className="cc-body cc-map-body">
                <div className="cc-legend">
                  <span className="allow">● Allow</span>
                  <span className="review">● Review</span>
                  <span className="restrict">● Restrict</span>
                  <span className="edu-req">● Edu required</span>
                </div>
                <div className="cc-map-wrap">
                  <svg className="cc-map-svg" viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg">
                    {country.iso2 === 'AU' && <>
                      <rect className="cc-country-base" x="60" y="60" width="400" height="280" rx="18"/>
                      <path className="cc-region" data-region="Western Australia" onClick={() => setRegion('Western Australia')} d="M60 60 L210 60 L210 168 L300 161 L300 340 L60 340 Z"/>
                      <path className="cc-region" data-region="Northern Territory" onClick={() => setRegion('Northern Territory')} d="M210 60 L300 60 L300 161 L210 168 Z"/>
                      <path className="cc-region" data-region="South Australia" onClick={() => setRegion('South Australia')} d="M210 168 L300 161 L323 198 L317 278 L271 276 L210 320 Z"/>
                      <path className="cc-region warn" data-region="Queensland" onClick={() => setRegion('Queensland')} d="M300 60 L460 60 L460 207 L389 207 L344 192 L323 198 L300 161 Z"/>
                      <path className={`cc-region${region === 'New South Wales' ? ' active' : ''}`} data-region="New South Wales" onClick={() => setRegion('New South Wales')} d="M323 198 L344 192 L389 207 L446 207 L420 249 L379 272 L330 279 L317 278 Z"/>
                      <path className="cc-region" data-region="Victoria" onClick={() => setRegion('Victoria')} d="M317 278 L330 279 L379 272 L360 294 L323 296 L271 276 Z"/>
                      <path className="cc-region" data-region="Tasmania" onClick={() => setRegion('Tasmania')} d="M338 294 L373 302 L391 319 L371 335 L333 326 L319 309 Z"/>
                      <text className="cc-map-label" x="100" y="210">WA</text>
                      <text className="cc-map-label" x="240" y="105">NT</text>
                      <text className="cc-map-label" x="240" y="240">SA</text>
                      <text className="cc-map-label" x="370" y="130">QLD</text>
                      <text className="cc-map-label" x="370" y="235">NSW</text>
                      <text className="cc-map-label" x="315" y="290">VIC</text>
                      <text className="cc-map-label" x="345" y="320">TAS</text>
                    </>}
                    {country.iso2 !== 'AU' && <>
                      <rect className="cc-country-base" x="80" y="80" width="360" height="220" rx="18"/>
                      {(REGIONS[country.iso2] ?? []).map((r, i) => {
                        const cols = 3, rows = Math.ceil((REGIONS[country.iso2]?.length ?? 1) / cols)
                        const col = i % cols, row2 = Math.floor(i / cols)
                        const w = 110, h = Math.floor(200 / rows)
                        const x = 90 + col * (w + 8), y2 = 90 + row2 * (h + 8)
                        return (
                          <g key={r} onClick={() => setRegion(r)} style={{cursor:'pointer'}}>
                            <rect className={`cc-region${region === r ? ' active' : ''}${WARN_REGIONS.has(r) ? ' warn' : ''}`}
                              x={x} y={y2} width={w} height={h} rx="10"/>
                            <text className="cc-map-label" x={x + w/2} y={y2 + h/2 + 4} textAnchor="middle"
                              style={{fontSize:'9px'}}>
                              {r.length > 12 ? r.slice(0,11)+'…' : r}
                            </text>
                          </g>
                        )
                      })}
                    </>}
                    <text className="cc-map-note" x="60" y="372">Simplified regional map · {country.label}</text>
                  </svg>
                  <div className="cc-rules">
                    <b>{region || 'Select a region'}</b>
                    <p>{region} selected. Regional rules filter listings, wanted demand, education modules, and counterparty contact actions.</p>
                    <div className="cc-rule-grid">
                      <div className="cc-rule-box"><small>Rule status</small><strong>{warn ? 'Review required' : 'Allowed with proof'}</strong></div>
                      <div className="cc-rule-box"><small>Category impact</small><strong>{warn ? 'Marketplace restricted' : 'Supply + clinical'}</strong></div>
                      <div className="cc-rule-box"><small>Professional implication</small><strong>{warn ? 'Education before action' : 'Pharmacy guidance'}</strong></div>
                      <div className="cc-rule-box"><small>Marketplace action</small><strong>{warn ? 'Hold inquiry until review' : 'Proof before inquiry'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Col 3: Signals ── */}
          <section className="cc-col3">
            <div className="cc-panel cc-signals">
              <div className="cc-head">
                <div><h3>Weekly Signals</h3><small>Free summaries · paid source trail · marketplace impact</small></div>
                <Link href="/intel-signals" className="cc-link-btn">View All →</Link>
              </div>
              <div className="cc-body">
                <div className="cc-signal-list">
                  {signals.slice(0, 3).map(s => (
                    <article key={s.id} className="cc-signal">
                      <span className={`cc-sev${s.tag.label === 'REGULATION' || s.tag.label === 'COMPLIANCE' ? '' : ' low'}`} />
                      <div>
                        <b>{s.title}</b>
                        <p>{s.commercialImpact}</p>
                        <small>{s.market} · confidence {s.confidence} · {s.timeAgo}</small>
                        <div className="cc-impact">
                          <span className="cc-signal-tag" style={{borderColor: s.tag.border, color: s.tag.color, background: s.tag.bg}}>{s.tag.label}</span>
                          {' '}Marketplace impact: {s.commercialImpact.toLowerCase()}
                        </div>
                      </div>
                      <span className="cc-badge">FREE</span>
                    </article>
                  ))}
                  <div className="cc-pay-boundary">
                    <b>Intel Plus unlocks</b>
                    <p>Source trails, contradiction review, counterparty movement, corridor alerts, regional rule-change monitoring, and saved watch alerts.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── Status bar ── */}
        <footer className="cc-status">
          <span><b>LIVE</b> role-aware · region-filtered · proof-gated</span>
          <span>Pipeline: wanted demand · matched supply · proof review · inquiry · deal room</span>
          <span>Saved views alter role/action labels and marketplace emphasis</span>
        </footer>
      </div>

      {/* ── Customize drawer ── */}
      {drawerOpen && <div className="cc-scrim" onClick={() => setDrawerOpen(false)} />}
      <aside className={`cc-drawer${drawerOpen ? ' open' : ''}`} aria-label="Customize command centre">
        <div className="cc-drawer-head">
          <div><small>Customize Command Centre</small><h3>Controlled workspace personalization</h3></div>
          <button className="cc-close" onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div className="cc-drawer-body">
          <section className="cc-drawer-card">
            <b>Saved layouts</b>
            <p>Choose controlled presets that preserve the commercial hierarchy.</p>
            <div className="cc-toggle-grid">
              {['Marketplace-first','Clinical-first','Importer View','Equipment Buyer','Pharmacy Education','Weekly Signals'].map((t, i) => (
                <div key={t} className={`cc-toggle${i === 0 ? ' on' : ''}`}>{t}</div>
              ))}
            </div>
          </section>
          <section className="cc-drawer-card">
            <b>Module priority</b>
            <p>Pin, hide, or prioritize approved modules.</p>
            <div className="cc-toggle-grid">
              {['Pin wanted demand','Show proof badges','Regional map mode','Clinical-first education','Hide equipment','Investor signals'].map((t, i) => (
                <div key={t} className={`cc-toggle${i < 3 ? ' on' : ''}`}>{t}</div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
:root{
  --cc-bg:#040814;--cc-panel:#0b1929;--cc-ink:#f7efe1;--cc-text:#d8e1e9;--cc-muted:#9aa8b6;--cc-dim:#627282;
  --cc-line:rgba(232,240,248,.115);--cc-line2:rgba(232,240,248,.18);
  --cc-gold:#d9af63;--cc-gold2:#f3cf86;--cc-green:#74d28e;--cc-blue:#79b2ea;--cc-red:#e27466;--cc-amber:#e7b053;--cc-violet:#ad92ee;
  --cc-shadow:0 28px 88px rgba(0,0,0,.42);
  --cc-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
  --cc-serif:Georgia,"Times New Roman",serif;
  --cc-mono:"SFMono-Regular","Cascadia Mono","Roboto Mono",Consolas,monospace;
}
.cc-app{
  position:fixed;inset:0;display:grid;
  grid-template-columns:78px minmax(0,1fr);
  grid-template-rows:74px minmax(0,1fr) 42px;
  background:radial-gradient(circle at 16% 0%,rgba(217,175,99,.13),transparent 28%),
    radial-gradient(circle at 88% 10%,rgba(120,215,211,.105),transparent 24%),
    linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);
  color:var(--cc-text);font-family:var(--cc-sans);overflow:hidden;
}
.cc-grid-overlay{
  position:fixed;inset:0;pointer-events:none;opacity:.3;z-index:0;
  background:linear-gradient(rgba(255,255,255,.026) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
  background-size:34px 34px;mask-image:radial-gradient(circle at 52% 44%,#000 0%,transparent 83%);
}
/* Top bar */
.cc-top{
  grid-column:1/-1;grid-row:1;z-index:10;display:grid;
  grid-template-columns:240px minmax(0,1fr) auto;gap:16px;align-items:center;
  padding:12px 18px;border-bottom:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(5,10,20,.96),rgba(6,13,24,.9));
}
.cc-brand strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);letter-spacing:.155em;font-size:18px;font-weight:520}
.cc-brand span{display:block;margin-top:2px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.14em;font-size:8px;white-space:nowrap}
.cc-context{display:grid;grid-template-columns:130px 140px 160px minmax(150px,1fr);gap:9px;min-width:0}
.cc-field{height:46px;position:relative}
.cc-field label{position:absolute;left:12px;top:6px;color:var(--cc-dim);font-size:8px;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;z-index:1}
.cc-field select,.cc-field input{
  width:100%;height:100%;border:1px solid var(--cc-line2);border-radius:14px;
  background:linear-gradient(180deg,rgba(17,35,53,.9),rgba(7,16,28,.96));
  color:var(--cc-ink);outline:none;padding:17px 10px 6px 12px;font:inherit;font-size:13px;
  box-shadow:0 1px 0 rgba(255,255,255,.035) inset;
}
.cc-field select:focus,.cc-field input:focus{border-color:rgba(217,175,99,.56);box-shadow:0 0 0 3px rgba(217,175,99,.09)}
.cc-search-wrap{position:relative;height:100%}
.cc-search-icon{position:absolute;left:14px;bottom:11px;width:13px;height:13px;border:1.6px solid var(--cc-muted);border-radius:50%;pointer-events:none}
.cc-search-icon:after{content:"";position:absolute;width:6px;height:1.6px;right:-5px;bottom:-3px;background:var(--cc-muted);border-radius:2px;transform:rotate(45deg)}
.cc-search-wrap input{padding-left:36px}
.cc-actions{display:flex;align-items:center;gap:8px;justify-content:flex-end;white-space:nowrap}
.cc-tier{height:44px;border:1px solid rgba(217,175,99,.35);border-radius:14px;background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:0 12px;display:flex;align-items:center;font-family:var(--cc-mono);font-size:10px;white-space:nowrap}
.cc-icon-btn,.cc-soft-btn,.cc-primary{height:44px;border-radius:14px;border:1px solid var(--cc-line2);background:linear-gradient(180deg,rgba(15,31,49,.9),rgba(7,16,28,.98));color:var(--cc-muted);padding:0 13px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;font:inherit;font-size:12px;text-decoration:none}
.cc-icon-btn{width:44px;padding:0;justify-content:center}
.cc-icon-btn.cc-alert::after{content:"";position:absolute;right:9px;top:9px;width:7px;height:7px;border-radius:50%;background:var(--cc-red);box-shadow:0 0 0 4px rgba(226,116,102,.12)}
.cc-icon-btn::before{content:"";width:17px;height:17px;border:1.6px solid currentColor;border-radius:5px}
.cc-primary{border-color:rgba(217,175,99,.56);background:linear-gradient(135deg,#f0cc82,#c89136);color:#07111d;font-weight:790}
/* Sidebar */
.cc-sidebar{
  grid-column:1;grid-row:2/4;z-index:5;padding:16px 10px;
  border-right:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(4,9,18,.78),rgba(3,8,17,.96));
  display:flex;flex-direction:column;align-items:center;gap:9px;
}
.cc-nav-btn{width:52px;height:52px;border-radius:17px;border:1px solid transparent;background:transparent;color:var(--cc-dim);display:grid;place-items:center;text-decoration:none;cursor:pointer}
.cc-nav-btn svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.75}
.cc-nav-btn.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.35);background:radial-gradient(circle at 50% 15%,rgba(217,175,99,.2),rgba(217,175,99,.045) 68%)}
.cc-nav-btn:hover{color:var(--cc-ink);border-color:var(--cc-line2)}
.cc-nav-spacer{flex:1}
/* Workspace */
.cc-workspace{
  grid-column:2;grid-row:2;z-index:1;min-width:0;min-height:0;
  display:grid;grid-template-columns:minmax(580px,2fr) minmax(280px,1fr) minmax(300px,1fr);
  gap:14px;padding:14px;overflow:hidden;
}
.cc-panel{
  min-width:0;min-height:0;border:1px solid var(--cc-line);border-radius:26px;
  background:linear-gradient(180deg,rgba(12,28,44,.93),rgba(5,13,23,.95));
  box-shadow:var(--cc-shadow);overflow:hidden;
}
.cc-head{height:62px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--cc-line)}
.cc-head h2{margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;letter-spacing:-.025em;font-size:22px}
.cc-head h3{margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;font-size:17px}
.cc-head small{display:block;margin-top:3px;color:var(--cc-dim);font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--cc-mono)}
.cc-head-actions{display:flex;gap:8px;align-items:center}
.cc-link-btn{color:var(--cc-gold);font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}
.cc-wanted-cta{border:1px solid rgba(173,146,238,.42);background:rgba(173,146,238,.08);color:var(--cc-violet);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}
.cc-body{height:calc(100% - 62px);min-height:0;overflow:auto;padding:14px}
/* Market panel */
.cc-market{display:grid;grid-template-rows:62px 50px 66px minmax(0,1fr)}
.cc-market>.cc-body{display:none}
.cc-view-bar{border-bottom:1px solid var(--cc-line);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.018)}
.cc-views{display:flex;gap:7px;overflow:auto}
.cc-view{height:34px;border:1px solid var(--cc-line);border-radius:999px;background:rgba(255,255,255,.026);color:var(--cc-muted);padding:0 12px;white-space:nowrap;font-size:12px;cursor:pointer;font:inherit}
.cc-view.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.42);background:rgba(217,175,99,.09)}
.cc-customize-btn{height:34px;border-radius:12px;border:1px solid rgba(217,175,99,.38);background:rgba(217,175,99,.08);color:var(--cc-gold2);font-weight:720;padding:0 12px;cursor:pointer;font:inherit;font-size:12px;white-space:nowrap}
.cc-pipeline{border-bottom:1px solid var(--cc-line);padding:9px 14px;display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.cc-pipe{border:1px solid var(--cc-line);border-radius:14px;background:rgba(255,255,255,.024);padding:8px 10px;position:relative}
.cc-pipe:not(:last-child)::after{content:"";position:absolute;right:-9px;top:50%;width:9px;height:1px;background:rgba(217,175,99,.32)}
.cc-pipe b{display:block;color:var(--cc-ink);font-size:11px;line-height:1.1}
.cc-pipe span{display:block;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px;margin-top:4px}
.cc-pipe.active{border-color:rgba(217,175,99,.42);background:rgba(217,175,99,.07)}
.cc-market-grid{min-height:0;overflow:hidden;padding:12px}
.cc-market-block{border:1px solid var(--cc-line);border-radius:20px;background:rgba(255,255,255,.022);overflow:hidden;display:grid;grid-template-rows:44px minmax(0,1fr);height:100%}
.cc-block-title{padding:0 14px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}
.cc-block-title b{color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.cc-block-title span{font-size:11px;color:var(--cc-dim);font-family:var(--cc-mono)}
.cc-rows{overflow:auto;padding:10px;display:grid;gap:10px}
.cc-row{border:1px solid var(--cc-line);border-radius:18px;background:linear-gradient(180deg,rgba(18,38,58,.72),rgba(7,17,29,.92));padding:12px;display:grid;grid-template-columns:100px minmax(0,1fr) 144px;gap:12px;align-items:center}
.cc-spec{width:100px;height:80px;border-radius:14px;border:1px solid var(--cc-line2);position:relative;overflow:hidden;background:#0a1624}
.cc-spec.supply{background:radial-gradient(circle at 32% 28%,rgba(217,175,99,.32),transparent 25%),linear-gradient(135deg,rgba(122,177,234,.15),rgba(255,255,255,.02)),#0a1624}
.cc-spec.equip{background:linear-gradient(135deg,rgba(120,215,211,.12),rgba(255,255,255,.02)),repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),#0a1624}
.cc-spec.eduSpec{background:radial-gradient(circle at 50% 38%,rgba(173,146,238,.28),transparent 28%),linear-gradient(135deg,rgba(217,175,99,.12),transparent),#0a1624}
.cc-spec.service{background:linear-gradient(135deg,rgba(115,210,141,.16),rgba(122,177,234,.08)),#0a1624}
.cc-spec::before,.cc-spec::after{content:"";position:absolute;border:1px solid rgba(255,255,255,.14);border-radius:6px}
.cc-spec::before{left:14px;top:12px;width:54px;height:32px}
.cc-spec::after{right:12px;bottom:10px;width:28px;height:16px}
.cc-type{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--cc-gold);font-family:var(--cc-mono);margin-bottom:4px}
.cc-row h4{margin:0;color:var(--cc-ink);font-size:15px;line-height:1.2}
.cc-row p{margin:4px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.38}
.hv-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
.hv-tag{height:20px;display:inline-flex;align-items:center;border:1px solid var(--cc-line2);border-radius:999px;padding:0 7px;color:var(--cc-muted);background:rgba(255,255,255,.026);font-size:9px;font-family:var(--cc-mono)}
.hv-tag.gold{border-color:rgba(217,175,99,.35);color:var(--cc-gold)}
.hv-tag.green{border-color:rgba(115,210,141,.28);color:var(--cc-green)}
.hv-tag.red{border-color:rgba(226,116,102,.34);color:var(--cc-red)}
.hv-tag.blue{border-color:rgba(122,177,234,.32);color:var(--cc-blue)}
.hv-trust{margin-top:7px;display:grid;grid-template-columns:repeat(5,54px);gap:4px}
.hv-trust i{font-style:normal;height:19px;border:1px solid rgba(232,239,247,.1);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--cc-dim);font-size:8px;font-family:var(--cc-mono);background:rgba(255,255,255,.018)}
.hv-trust i.ok{color:var(--cc-green);border-color:rgba(115,210,141,.26)}
.hv-trust i.warn{color:var(--cc-amber);border-color:rgba(230,176,83,.28)}
.hv-trust i.lock{color:var(--cc-violet);border-color:rgba(173,146,238,.28)}
.cc-action-box{text-align:right}
.cc-action-box strong{display:block;color:var(--cc-ink);font-size:13px}
.cc-action-box small{display:block;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px;margin-top:3px}
.cc-row-action{margin-top:7px;height:30px;border-radius:10px;border:1px solid rgba(217,175,99,.34);background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:0 10px;font-size:11px;font-weight:680;cursor:pointer;font:inherit}
.cc-secondary{margin-top:5px;height:26px;border-radius:9px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.03);color:var(--cc-muted);padding:0 8px;font-size:10px;cursor:pointer;font:inherit;display:block}
/* Col 2 */
.cc-col2{display:grid;grid-template-rows:minmax(320px,.95fr) minmax(0,1fr);gap:14px;min-height:0}
.cc-col2 .cc-panel{min-height:0}
.cc-education{display:grid;grid-template-rows:62px minmax(0,1fr)}
.cc-edu-intro{border:1px solid rgba(217,175,99,.24);border-radius:18px;padding:12px;background:linear-gradient(135deg,rgba(217,175,99,.095),rgba(120,215,211,.045));margin-bottom:10px}
.cc-edu-intro strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);font-weight:520;font-size:17px}
.cc-edu-intro p{margin:5px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.45}
.cc-edu-cards{display:grid;gap:8px}
.cc-edu{border:1px solid var(--cc-line);border-radius:15px;background:rgba(255,255,255,.026);padding:11px}
.cc-edu-top{display:flex;align-items:start;justify-content:space-between;gap:10px}
.cc-edu b{display:block;color:var(--cc-ink);font-size:13px}
.cc-edu p{margin:3px 0 0;color:var(--cc-muted);font-size:11px;line-height:1.35}
.cc-edu-cta{margin-top:8px;height:28px;border-radius:9px;border:1px solid rgba(217,175,99,.32);background:rgba(217,175,99,.065);color:var(--cc-gold2);padding:0 10px;font-size:11px;cursor:pointer;font:inherit}
.cc-funnel{border-top:1px solid var(--cc-line);padding:12px;background:linear-gradient(180deg,rgba(12,28,44,.62),rgba(5,13,23,.92))}
.cc-funnel h4{margin:0 0 8px;color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.cc-funnel-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.cc-funnel-box{border:1px solid var(--cc-line);border-radius:12px;padding:9px;background:rgba(255,255,255,.025)}
.cc-funnel-box b{display:block;color:var(--cc-ink);font-size:12px}
.cc-funnel-box span{display:block;color:var(--cc-muted);font-size:10px;margin-top:3px}
/* Map */
.cc-map-panel{display:grid;grid-template-rows:62px minmax(0,1fr)}
.cc-map-body{padding:12px}
.cc-legend{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.cc-legend span{height:21px;border:1px solid var(--cc-line);border-radius:999px;padding:0 7px;display:inline-flex;align-items:center;font-size:9px;color:var(--cc-muted);font-family:var(--cc-mono)}
.cc-legend .allow{color:var(--cc-green)}
.cc-legend .review{color:var(--cc-amber)}
.cc-legend .restrict{color:var(--cc-red)}
.cc-legend .edu-req{color:var(--cc-blue)}
.cc-map-wrap{height:calc(100% - 32px);border:1px solid var(--cc-line);border-radius:18px;background:radial-gradient(circle at 48% 40%,rgba(122,177,234,.16),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.01));overflow:hidden;display:grid;grid-template-rows:minmax(0,1fr) auto}
.cc-map-svg{width:100%;height:100%;min-height:130px}
.cc-country-base{fill:rgba(8,19,32,.8);stroke:rgba(246,239,226,.34);stroke-width:1.4}
.cc-region{fill:rgba(122,177,234,.105);stroke:rgba(246,239,226,.34);stroke-width:1.5;transition:fill .18s ease,stroke .18s ease;cursor:pointer}
.cc-region:hover{fill:rgba(217,175,99,.18);stroke:rgba(243,207,134,.78)}
.cc-region.active{fill:rgba(217,175,99,.32);stroke:rgba(243,207,134,.92)}
.cc-region.warn{fill:rgba(226,116,102,.14)}
.cc-map-label{fill:rgba(247,239,225,.72);font-size:10px;font-family:var(--cc-mono);font-weight:700;pointer-events:none;letter-spacing:.04em}
.cc-map-note{fill:rgba(154,168,182,.58);font-size:9px;font-family:var(--cc-mono);pointer-events:none}
.cc-rules{border-top:1px solid var(--cc-line);padding:10px 12px;background:rgba(5,13,23,.76)}
.cc-rules b{display:block;color:var(--cc-ink);font-size:13px}
.cc-rules p{margin:4px 0 0;color:var(--cc-muted);font-size:11px;line-height:1.35}
.cc-rule-grid{margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cc-rule-box{border:1px solid var(--cc-line);border-radius:10px;padding:7px;background:rgba(255,255,255,.022)}
.cc-rule-box small{display:block;color:var(--cc-dim);font-size:9px;font-family:var(--cc-mono);text-transform:uppercase;letter-spacing:.1em}
.cc-rule-box strong{display:block;color:var(--cc-ink);font-size:11px;margin-top:3px}
/* Col 3: Signals */
.cc-col3{min-height:0}
.cc-signals{display:grid;grid-template-rows:62px minmax(0,1fr);height:100%}
.cc-signal-list{display:grid;gap:10px}
.cc-signal{border:1px solid var(--cc-line);border-radius:16px;background:rgba(255,255,255,.026);padding:12px;display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:10px;align-items:start}
.cc-sev{height:100%;min-height:56px;border-radius:999px;background:var(--cc-green)}
.cc-sev.low{background:var(--cc-amber)}
.cc-signal b{display:block;color:var(--cc-ink);font-size:13px;line-height:1.25}
.cc-signal p{margin:4px 0 0;color:var(--cc-muted);font-size:11px;line-height:1.35}
.cc-signal small{display:block;margin-top:5px;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px}
.cc-impact{margin-top:7px;border:1px solid rgba(217,175,99,.18);border-radius:9px;padding:6px;color:var(--cc-gold2);font-size:10px;background:rgba(217,175,99,.045)}
.cc-signal-tag{border:1px solid;border-radius:999px;padding:2px 6px;font-family:var(--cc-mono);font-size:9px}
.cc-badge{border:1px solid rgba(217,175,99,.3);color:var(--cc-gold);border-radius:999px;padding:3px 7px;font-family:var(--cc-mono);font-size:9px;white-space:nowrap}
.cc-pay-boundary{margin-top:10px;border:1px solid rgba(173,146,238,.28);border-radius:16px;padding:12px;background:linear-gradient(135deg,rgba(173,146,238,.08),rgba(255,255,255,.02))}
.cc-pay-boundary b{color:var(--cc-ink);font-size:13px}
.cc-pay-boundary p{margin:4px 0 0;color:var(--cc-muted);font-size:11px;line-height:1.35}
/* Status bar */
.cc-status{
  grid-column:2/-1;grid-row:3;z-index:5;display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;border-top:1px solid var(--cc-line);
  background:linear-gradient(180deg,rgba(4,9,18,.92),rgba(3,8,17,.98));
  font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);gap:16px;
}
.cc-status b{color:var(--cc-green)}
/* Drawer */
.cc-scrim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:20;backdrop-filter:blur(2px)}
.cc-drawer{
  position:fixed;right:0;top:0;bottom:0;width:380px;z-index:30;
  background:linear-gradient(180deg,rgba(10,22,36,.98),rgba(5,13,24,.99));
  border-left:1px solid var(--cc-line2);box-shadow:-28px 0 88px rgba(0,0,0,.48);
  transform:translateX(100%);transition:transform .28s cubic-bezier(.25,.46,.45,.94);
  display:flex;flex-direction:column;
}
.cc-drawer.open{transform:translateX(0)}
.cc-drawer-head{padding:20px 22px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}
.cc-drawer-head small{display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em;font-family:var(--cc-mono)}
.cc-drawer-head h3{margin:6px 0 0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;font-size:18px}
.cc-close{width:36px;height:36px;border-radius:10px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);color:var(--cc-muted);font-size:22px;cursor:pointer;display:grid;place-items:center;flex-shrink:0}
.cc-drawer-body{flex:1;overflow:auto;padding:20px 22px;display:grid;gap:16px;align-content:start}
.cc-drawer-card{border:1px solid var(--cc-line);border-radius:18px;padding:16px;background:rgba(255,255,255,.022)}
.cc-drawer-card b{display:block;color:var(--cc-ink);font-size:14px;margin-bottom:6px}
.cc-drawer-card p{margin:0 0 12px;color:var(--cc-muted);font-size:12px;line-height:1.45}
.cc-toggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.cc-toggle{border:1px solid var(--cc-line);border-radius:10px;padding:8px 10px;font-size:11px;color:var(--cc-dim);background:rgba(255,255,255,.02);cursor:pointer}
.cc-toggle.on{border-color:rgba(217,175,99,.38);color:var(--cc-gold2);background:rgba(217,175,99,.07)}
`
