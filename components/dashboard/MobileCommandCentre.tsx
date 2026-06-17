'use client'

import React, { useMemo, useState } from 'react'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { DashboardMarketplaceRows, MarketRow, MarketView } from '@/components/dashboard/CommandCentre'
import type {
  CountryIntelProfile, WantedListing, LocalIntelData, PipelineCounts,
  PathwayData, WatchlistData, EvidenceData, LiveEduTile, RecentEduModule, SourceCoverageRow,
} from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

type CommandPage = 'briefing' | 'marketplace' | 'intel' | 'education' | 'prescriber' | 'settings'
type CountryOption = { iso2: string; label: string }
type SelectOption = { value: string; label: string }
type MobileMarketCard = { id:string; title:string; description:string; category:string; jurisdiction:string; status:string; action:string }

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
  localIntel?: LocalIntelData | null
  pathwayData?: PathwayData | null
  watchlistData?: WatchlistData | null
  evidenceData?: EvidenceData
  liveTiles?: LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  sourceCoverage?: SourceCoverageRow[]
}

const COUNTRIES: CountryOption[] = (ALL_COUNTRIES as { iso2: string; displayName: string }[]).map(c => ({ iso2: c.iso2, label: c.displayName }))

const MOBILE_NAV: { id: CommandPage; label: string; icon: string }[] = [
  { id: 'briefing',    label: 'Briefing Room', icon: '\u25ce' },
  { id: 'marketplace', label: 'Market',        icon: '\u229e' },
  { id: 'intel',       label: 'Intel',         icon: '\u224b' },
  { id: 'education',   label: 'Education',     icon: '\u2ba3' },
  { id: 'prescriber',  label: 'Prescriber',    icon: '\u2ba1' },
  { id: 'settings',    label: 'Settings',      icon: '\u2699' },
]

const MARKET_TABS: { id: MarketView; label: string }[] = [
  { id: 'cannabis',      label: 'Listings' },
  { id: 'wanted',        label: 'Wanted' },
  { id: 'opportunities', label: 'Buyer Routes' },
  { id: 'equipment',     label: 'Equipment' },
  { id: 'consumables',   label: 'Consumables' },
  { id: 'services',      label: 'Services' },
  { id: 'new-products',  label: 'New Products' },
]

const PENDING = 'Pending verified source review'

function titleCase(s: string) { return s.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase()) }
function fv(v?: string | number | null, fb = PENDING): string { if (typeof v === 'number') return String(v); return v && String(v).trim() ? String(v).trim() : fb }
function roleDisplay(rid: string) { if (!rid) return 'All Roles'; const p = ROLE_PROFILES[rid as keyof typeof ROLE_PROFILES]; return p?.short ?? p?.label ?? titleCase(rid) }
function normalizeRow(row: MarketRow, i: number, country: CountryOption): MobileMarketCard {
  const typed = ['supply','equip','service'].includes(String(row[0]))
  return typed
    ? { id: String(row[2]??row[7]??i), title: fv(row[2],'Marketplace opportunity'), description: fv(row[3],'Details available through mediated access.'), category: fv(row[1],'Marketplace'), jurisdiction: country.label, status: fv(row[7],'Listed'), action: fv(row[6],'Request mediated access') }
    : { id: String(row[7]??row[0]??i), title: fv(row[0],'Marketplace opportunity'), description: fv(row[1],'Details available through mediated access.'), category: fv(row[3],'Marketplace'), jurisdiction: fv(row[2],country.label), status: fv(row[4],'Pending review'), action: fv(row[5],'Request mediated access') }
}

function SectionCard({ label, title, detail, tone='neutral' }: { label:string; title:string; detail:string; tone?:'neutral'|'ok'|'warn' }) {
  return (
    <div className={'hvm-card hvm-card-' + tone}>
      <div className="hvm-kicker">{label}</div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}

function Accordion({ title, children, open=false }: { title:string; children:React.ReactNode; open?:boolean }) {
  return (
    <details className="hvm-accordion" open={open}>
      <summary>{title}<span>\u2304</span></summary>
      <div className="hvm-accordion-body">{children}</div>
    </details>
  )
}

function BriefingMobile({ country, roleLabel, countryIntel, signals }: { country:CountryOption; roleLabel:string; countryIntel?:CountryIntelProfile|null; signals:DashboardSignal[] }) {
  const summary = fv(countryIntel?.public_summary, country.label + ' dashboard context is available for ' + roleLabel + '. Field-level source review is shown where verified data has not been loaded.')
  const dateLabel = new Date().toLocaleDateString('en-CA', { month:'short', day:'numeric', year:'numeric' })
  return (
    <div className="hvm-stack">
      <section className="hvm-hero">
        <div className="hvm-country-row"><span className="hvm-globe">\ud83c\udf10</span><div><h2>{country.label}</h2><p>{roleLabel}</p></div></div>
        <blockquote>{summary}</blockquote>
      </section>
      <div className="hvm-grid">
        <SectionCard label="Program status" title={fv(countryIntel?.medical_status,'Medical access review')} detail="Country medical-program status as approved for public dashboard display." tone="ok"/>
        <SectionCard label="Market access" title={fv(countryIntel?.market_access_status)} detail="Commercial access posture for the selected jurisdiction and role."/>
        <SectionCard label="Import status" title={fv(countryIntel?.import_status)} detail="Importer route visibility remains review-gated where source evidence is incomplete."/>
        <SectionCard label="Export status" title={fv(countryIntel?.export_status)} detail="Export posture is presented as public summary only."/>
      </div>
      <Accordion title="Source, Verification and Coverage" open={true}>
        <div className="hvm-grid">
          <SectionCard label="Verification" title={fv(countryIntel?.review_status,'Review gated')} detail="Public summaries are separated from private source evidence and internal notes."/>
          <SectionCard label="Update cadence" title="Regulatory and marketplace review queue" detail={'Dashboard rendered ' + dateLabel + '. Live source cadence depends on configured watchers.'}/>
          <SectionCard label="Coverage" title={fv(countryIntel?.data_completeness,'Partial')} detail="Coverage reflects loaded country data and reviewed public fields only."/>
        </div>
      </Accordion>
      {signals.length > 0 && (
        <Accordion title="Recent signals">
          <div className="hvm-list">
            {signals.slice(0,4).map((s,i) => (
              <div className="hvm-signal" key={i}>
                <strong>{s.flag} {s.title}</strong>
                <small>{s.market} \u00b7 {s.sourceLabel} \u00b7 {s.timeAgo} \u00b7 {s.confidence}% confidence</small>
                <p>{s.commercialImpact}</p>
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  )
}

function IntelMobile({ country, roleLabel, countryIntel, signals }: { country:CountryOption; roleLabel:string; countryIntel?:CountryIntelProfile|null; signals:DashboardSignal[] }) {
  return (
    <div className="hvm-stack">
      <section className="hvm-hero compact"><h2>{country.label} Intelligence</h2><p>{roleLabel}</p></section>
      {signals.length > 0 ? (
        <Accordion title={'Signals feed \u00b7 ' + signals.length + ' active'} open={true}>
          <div className="hvm-list">
            {signals.slice(0,10).map((s,i) => (
              <div className="hvm-signal" key={i}>
                <strong>{s.flag} {s.title}</strong>
                <small>{s.market} \u00b7 {s.sourceLabel} \u00b7 {s.timeAgo} \u00b7 {s.confidence}% confidence</small>
                <p>{s.commercialImpact}</p>
              </div>
            ))}
          </div>
        </Accordion>
      ) : (
        <div className="hvm-empty"><strong>No signals loaded for {country.label}.</strong><p>Signal pipeline runs on configured watchers. Admin review required before public surfacing.</p></div>
      )}
      <Accordion title="Regulatory watch">
        <div className="hvm-grid">
          <SectionCard label="Regulatory source" title={fv(countryIntel?.regulator_label, country.label + ' authority')} detail="Reviewed source categories only. Raw URLs and private evidence stay outside the public shell."/>
          <SectionCard label="Review state" title={fv(countryIntel?.review_status,'Needs review')} detail="Regulatory data is staged for review before public display."/>
          <SectionCard label="Coverage" title={fv(countryIntel?.data_completeness,'Partial')} detail="Coverage reflects loaded country data and reviewed public fields only."/>
        </div>
      </Accordion>
      <Accordion title="Local intel">
        <div className="hvm-grid">
          <SectionCard label="Market context" title={fv(countryIntel?.commercial_pathway_summary,'Market intel under review')} detail="Local intel is review-gated until verified by Harbourview source review."/>
          <SectionCard label="Source boundary" title="DTO protected" detail="Admin notes, raw source evidence and counterparty intelligence remain outside public rendering."/>
        </div>
      </Accordion>
    </div>
  )
}

function MarketplaceMobile({ country, marketplaceRows, wantedListings=[], wantedCount=0 }: { country:CountryOption; marketplaceRows?:Partial<DashboardMarketplaceRows>; wantedListings?:WantedListing[]; wantedCount?:number }) {
  const [activeTab, setActiveTab] = useState<MarketView>('cannabis')
  const [search, setSearch] = useState('')
  const cards = useMemo<MobileMarketCard[]>(() => {
    if (activeTab === 'wanted' && wantedListings.length > 0)
      return wantedListings.map((w,i) => ({ id: w.id??'w-'+i, title:w.title, description:w.summary??'Wanted demand available through Harbourview-mediated review.', category:'Wanted Demand', jurisdiction:w.location_country??country.label, status:'Public request review', action:'Respond through Harbourview' }))
    return (marketplaceRows?.[activeTab]??[]).map((r,i) => normalizeRow(r,i,country))
  }, [activeTab, marketplaceRows, wantedListings, country])
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? cards.filter(c => [c.title,c.description,c.category,c.jurisdiction].join(' ').toLowerCase().includes(q)) : cards }, [cards, search])
  return (
    <div className="hvm-stack">
      <section className="hvm-hero compact"><h2>{country.label} Marketplace</h2><p>Mediated market access. Requests and contact release remain Harbourview-reviewed.</p></section>
      <div className="hvm-scroll-tabs" role="tablist">
        {MARKET_TABS.map(t => <button key={t.id} type="button" className={activeTab===t.id?'active':''} onClick={()=>setActiveTab(t.id)}>{t.label}{t.id==='wanted'&&wantedCount>0?' '+wantedCount:''}</button>)}
      </div>
      <label className="hvm-search-label"><span>Search listings</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search public marketplace summaries\u2026"/></label>
      <div className="hvm-list">
        {filtered.length > 0 ? filtered.slice(0,12).map(c => (
          <article key={c.id} className="hvm-market-card">
            <div className="hvm-market-top"><span>{c.category}</span><small>{c.status}</small></div>
            <h3>{c.title}</h3><p>{c.description}</p>
            <div className="hvm-market-meta"><span>{c.jurisdiction}</span><strong>{c.action}</strong></div>
          </article>
        )) : (
          <div className="hvm-empty"><strong>No public {MARKET_TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} rows for {country.label}.</strong><p>Use wanted demand or submit the country-role pathway for review.</p></div>
        )}
      </div>
      <Accordion title="Marketplace access requirements" open={true}>
        <div className="hvm-grid">
          <SectionCard label="Licence" title={country.label + ' public pathway'} detail="Licence and authorization status must be verified before contact release."/>
          <SectionCard label="Facility / site" title={PENDING} detail="Facility evidence is reviewed privately and surfaced only as public-safe status."/>
          <SectionCard label="Documentation" title="SOP, COA and traceability packet" detail="Documentation requirements are staged for Harbourview-mediated review."/>
        </div>
      </Accordion>
      <Accordion title="Verification gaps and counterparty controls">
        <div className="hvm-grid">
          <SectionCard label="Verification gaps" title="Route-specific evidence review" detail="EU-GMP, residue testing and destination rules remain field-level review items until source verified." tone="warn"/>
          <SectionCard label="Counterparty status" title="Harbourview-mediated release" detail="Counterparty contact and proof release are controlled workflows, not public mobile fields." tone="ok"/>
        </div>
      </Accordion>
    </div>
  )
}

function PrescriberMobile({ country, roleLabel, countryIntel }: { country:CountryOption; roleLabel:string; countryIntel?:CountryIntelProfile|null }) {
  return (
    <div className="hvm-stack">
      <section className="hvm-hero compact">
        <h2>Prescriber Access</h2>
        <p>{country.label} \u00b7 {roleLabel}</p>
        <blockquote>{fv(countryIntel?.commercial_pathway_summary,'Pathway evidence is under Harbourview review for this country-role context.')}</blockquote>
      </section>
      <div className="hvm-grid">
        <SectionCard label="1 \u00b7 Eligibility" title={fv(countryIntel?.market_access_status)} detail="Confirm the selected role is permitted to participate in the country pathway before outreach or transaction work."/>
        <SectionCard label="2 \u00b7 Importer requirements" title={fv(countryIntel?.import_status)} detail="Importer authorization, permit mechanics, pharmacy or distributor participation, and role-specific limits must be source-reviewed."/>
        <SectionCard label="3 \u00b7 Documents" title="Licence, authorization, COA and product dossier" detail="Use field-level review until live document requirements are loaded from verified regulatory sources."/>
        <SectionCard label="4 \u00b7 Route constraints" title="Compliance-gated market access" detail="Controlled routes remain Harbourview-mediated. Private counterparty evidence and raw provenance stay outside the mobile DTO."/>
        <SectionCard label="5 \u00b7 Review status" title={fv(countryIntel?.review_status,'Needs review')} detail="Move only reviewed public summary fields into the mobile experience." tone="warn"/>
        <SectionCard label="Next action" title="Open pathway review queue" detail="Verify current source evidence, confirm role fit, then release a reviewed access brief." tone="ok"/>
      </div>
      <Accordion title="Prescriber network">
        <div className="hvm-grid">
          <SectionCard label="Regulatory source" title={fv(countryIntel?.regulator_label, country.label + ' authority')} detail="Public mobile shell shows reviewed source categories only, not raw URLs or private evidence."/>
          <SectionCard label="Market access evidence" title={fv(countryIntel?.market_access_status)} detail={country.label + ' \u00b7 ' + roleLabel + '. Commercial pathway claims stay review-gated until verified.'}/>
          <SectionCard label="Public/private boundary" title="DTO protected" detail="Admin notes, raw source evidence and counterparty intelligence remain outside public rendering."/>
        </div>
      </Accordion>
    </div>
  )
}

function EducationMobile({ country, roleLabel, eduCategories }: { country:CountryOption; roleLabel:string; eduCategories:{icon:string;title:string;desc:string}[] }) {
  const modules = eduCategories.length > 0 ? eduCategories : [
    { icon:'\u25ae', title:'Regulatory foundations', desc:'Review country-specific rules and professional obligations.' },
    { icon:'\u2ba1', title:'Documentation discipline', desc:'Prepare evidence, COA, licence and product records.' },
    { icon:'\u229f', title:'Market access readiness', desc:'Understand mediated commercial access and review controls.' },
  ]
  return (
    <div className="hvm-stack">
      <section className="hvm-hero compact"><h2>{country.label} Learning Path</h2><p>{roleLabel}</p></section>
      <div className="hvm-list">
        {modules.map((m,i) => (
          <article className="hvm-module" key={i}>
            <span>{m.icon}</span>
            <div><strong>{i+1}. {m.title}</strong><p>{m.desc}</p><small>{i<2?'Required':'Recommended'} \u00b7 Not started</small></div>
          </article>
        ))}
      </div>
    </div>
  )
}

function SettingsMobile({ country, role, countryOptions, roleOptions, onCountryChange, onRoleChange }: { country:CountryOption; role:string; countryOptions:SelectOption[]; roleOptions:SelectOption[]; onCountryChange:(iso2:string)=>void; onRoleChange:(r:string)=>void }) {
  return (
    <div className="hvm-stack">
      <section className="hvm-hero compact"><h2>Settings</h2><p>{country.label} \u00b7 {roleDisplay(role)}</p></section>
      <div className="hvm-settings">
        <label className="hvm-search-label"><span>Country</span>
          <select value={country.iso2} onChange={e=>onCountryChange(e.target.value)}>
            {countryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="hvm-search-label"><span>Role</span>
          <select value={role} onChange={e=>onRoleChange(e.target.value)}>
            <option value="">All roles</option>
            {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <Accordion title="Platform context" open={true}>
        <div className="hvm-grid">
          <SectionCard label="Access model" title="Harbourview mediated" detail="All counterparty introductions and contact releases are Harbourview-reviewed before transmission."/>
          <SectionCard label="Data boundary" title="DTO protected" detail="Admin notes, raw source evidence and counterparty intelligence remain outside the public mobile shell."/>
          <SectionCard label="Version" title="Command Centre \u00b7 Mobile" detail="Public-shell build. Contact Harbourview for admin access or full intelligence tier."/>
        </div>
      </Accordion>
    </div>
  )
}

export default function MobileCommandCentre({ signals, eduCategories, initialCountryIso2, initialRoleId, wantedCount=0, marketplaceRows, wantedListings=[], countryIntel, localIntel }: Props) {
  const initCountry = useMemo(() => COUNTRIES.find(c=>c.iso2===initialCountryIso2)??{ iso2:'GLOBAL', label:'Global Market' }, [initialCountryIso2])
  const [country, setCountry] = useState<CountryOption>(initCountry)
  const [role, setRole] = useState(initialRoleId??'')
  const [page, setPage] = useState<CommandPage>('briefing')
  const countryOptions = useMemo<SelectOption[]>(() => COUNTRIES.map(c=>({ value:c.iso2, label:c.label })),[])
  const roleOptions = useMemo<SelectOption[]>(() => Object.entries(ROLE_PROFILES).map(([v,p])=>({ value:v, label:(p as {label:string}).label })),[])
  const roleLabel = roleDisplay(role)
  const pageTitle = MOBILE_NAV.find(n=>n.id===page)?.label??'Briefing Room'
  const handleCountry = (iso2:string) => { const c=COUNTRIES.find(c=>c.iso2===iso2); if(c) setCountry(c) }
  const content = ((): React.ReactNode => {
    switch(page) {
      case 'briefing':    return <BriefingMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals}/>
      case 'marketplace': return <MarketplaceMobile country={country} marketplaceRows={marketplaceRows} wantedListings={wantedListings} wantedCount={wantedCount}/>
      case 'intel':       return <IntelMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel} signals={signals}/>
      case 'education':   return <EducationMobile country={country} roleLabel={roleLabel} eduCategories={eduCategories}/>
      case 'prescriber':  return <PrescriberMobile country={country} roleLabel={roleLabel} countryIntel={countryIntel}/>
      case 'settings':    return <SettingsMobile country={country} role={role} countryOptions={countryOptions} roleOptions={roleOptions} onCountryChange={handleCountry} onRoleChange={setRole}/>
      default:            return null
    }
  })()
  return (
    <div className="hvm-app">
      <style>{CSS}</style>
      <header className="hvm-header">
        <div className="hvm-wordmark"><span>HARBOURVIEW</span><small>COMMAND CENTRE</small></div>
      </header>
      <section className="hvm-titlebar">
        <div><span className="hvm-kicker-title">{country.label} \u00b7 {roleLabel}</span><h1>{pageTitle}</h1></div>
        {page!=='briefing' && <button type="button" onClick={()=>setPage('briefing')}>Briefing</button>}
      </section>
      <main className="hvm-main">{content}</main>
      <nav className="hvm-bottom-nav" aria-label="Command centre navigation">
        {MOBILE_NAV.map(n => (
          <button key={n.id} type="button" className={page===n.id?'active':''} onClick={()=>setPage(n.id)}>
            <span>{n.icon}</span><em>{n.label}</em>
          </button>
        ))}
      </nav>
    </div>
  )
}

const CSS = '.hvm-app,.hvm-app *{box-sizing:border-box;min-width:0}' +
'.hvm-app{position:fixed;inset:0;width:100%;overflow-x:hidden;overflow-y:auto;background:radial-gradient(circle at 80% 12%,rgba(18,45,58,.42),transparent 34%),linear-gradient(135deg,#030711 0%,#07111d 48%,#030812 100%);color:rgba(245,240,232,.94);font-family:Inter,system-ui,-apple-system,sans-serif;padding-bottom:calc(88px + env(safe-area-inset-bottom,0px));-webkit-text-size-adjust:100%}' +
'.hvm-header{position:sticky;top:0;z-index:20;display:flex;align-items:center;width:100%;min-height:calc(60px + env(safe-area-inset-top,0px));padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:rgba(3,7,17,.96);border-bottom:1px solid rgba(255,255,255,.09);backdrop-filter:blur(14px)}' +
'.hvm-wordmark{display:flex;flex-direction:column;gap:2px}' +
'.hvm-wordmark span{color:#d4a84b;font-family:Georgia,serif;font-size:clamp(18px,5vw,23px);line-height:1;letter-spacing:.16em;white-space:nowrap}' +
'.hvm-wordmark small{color:rgba(245,240,232,.38);font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.22em;white-space:nowrap}' +
'.hvm-titlebar{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;width:100%;padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08)}' +
'.hvm-kicker-title{display:block;color:rgba(245,240,232,.46);font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;line-height:1.3}' +
'.hvm-titlebar h1{margin:5px 0 0;color:#f5f0e8;font-family:Georgia,serif;font-size:clamp(32px,10vw,44px);line-height:.98;letter-spacing:-.035em}' +
'.hvm-titlebar button{min-height:44px;border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.055);color:rgba(245,240,232,.9);font:700 13px/1 Inter,system-ui,sans-serif;padding:0 14px}' +
'.hvm-main{width:100%;padding:16px;overflow-x:hidden}' +
'.hvm-stack{display:flex;flex-direction:column;gap:14px;width:100%}' +
'.hvm-hero{padding:18px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-hero.compact h2{margin:0 0 6px}' +
'.hvm-country-row{display:flex;align-items:center;gap:13px}' +
'.hvm-globe{font-size:36px;flex:0 0 auto}' +
'.hvm-hero h2{margin:0;color:#f5f0e8;font-family:Georgia,serif;font-size:clamp(30px,8vw,42px);line-height:1.04}' +
'.hvm-hero p{margin:8px 0 0;color:rgba(245,240,232,.64);font-size:16px;line-height:1.55}' +
'.hvm-hero blockquote{margin:10px 0 0;border-left:3px solid #d4a84b;padding-left:13px;color:rgba(245,240,232,.64);font-size:15px;line-height:1.55}' +
'.hvm-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;width:100%}' +
'.hvm-card{padding:15px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-card-ok{border-color:rgba(76,175,130,.26)}' +
'.hvm-card-warn{border-color:rgba(230,165,51,.28)}' +
'.hvm-kicker{color:rgba(245,240,232,.42);font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:7px}' +
'.hvm-card strong,.hvm-signal strong,.hvm-module strong{display:block;color:rgba(245,240,232,.95);font-size:17px;line-height:1.28}' +
'.hvm-card p,.hvm-signal p,.hvm-module p{margin:8px 0 0;color:rgba(245,240,232,.62);font-size:15px;line-height:1.5}' +
'.hvm-accordion{border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px;overflow:hidden}' +
'.hvm-accordion summary{min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 15px;cursor:pointer;color:#d4a84b;font-weight:800;list-style:none}' +
'.hvm-accordion summary::-webkit-details-marker{display:none}' +
'.hvm-accordion-body{padding:0 13px 13px}' +
'.hvm-list{display:flex;flex-direction:column;gap:12px;width:100%}' +
'.hvm-signal{padding:14px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-signal small{display:block;margin-top:7px;color:rgba(245,240,232,.48);font-size:13px;line-height:1.4}' +
'.hvm-empty{padding:16px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-empty p{margin:8px 0 0;color:rgba(245,240,232,.58);line-height:1.45}' +
'.hvm-scroll-tabs{display:flex;gap:9px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}' +
'.hvm-scroll-tabs::-webkit-scrollbar{display:none}' +
'.hvm-scroll-tabs button{flex:0 0 auto;min-height:44px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.045);color:rgba(245,240,232,.68);padding:0 15px;font-weight:700}' +
'.hvm-scroll-tabs button.active{color:#d4a84b;border-color:rgba(212,168,75,.55);background:rgba(212,168,75,.08)}' +
'.hvm-search-label{display:flex;flex-direction:column;gap:7px;color:rgba(245,240,232,.48);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}' +
'.hvm-search-label input,.hvm-search-label select{width:100%;min-height:50px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(255,255,255,.055);color:rgba(245,240,232,.94);padding:0 14px;font-size:16px;outline:none;appearance:none}' +
'.hvm-settings{display:grid;gap:14px}' +
'.hvm-market-card{padding:15px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-market-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}' +
'.hvm-market-top span{color:#d4a84b;font-size:12px}' +
'.hvm-market-top small{color:rgba(245,240,232,.46);font-size:12px}' +
'.hvm-market-card h3{margin:0 0 8px;color:#f5f0e8;font-size:19px;line-height:1.28;font-family:Georgia,serif}' +
'.hvm-market-card p{margin:0 0 10px;color:rgba(245,240,232,.62);font-size:15px;line-height:1.5}' +
'.hvm-market-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}' +
'.hvm-market-meta span{color:rgba(245,240,232,.46);font-size:12px}' +
'.hvm-market-meta strong{color:#d4a84b;font-size:13px;text-align:right}' +
'.hvm-module{display:flex;gap:13px;padding:15px;border:1px solid rgba(255,255,255,.105);background:rgba(255,255,255,.045);border-radius:18px}' +
'.hvm-module>span{flex:0 0 34px;font-size:28px;line-height:1}' +
'.hvm-module small{display:block;margin-top:6px;color:rgba(245,240,232,.48);font-size:13px}' +
'.hvm-bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:25;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%;padding:7px 4px calc(7px + env(safe-area-inset-bottom,0px));background:rgba(3,7,17,.97);border-top:1px solid rgba(255,255,255,.1);backdrop-filter:blur(16px)}' +
'.hvm-bottom-nav button{min-height:60px;border:0;border-radius:14px;background:transparent;color:rgba(245,240,232,.46);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4px 2px}' +
'.hvm-bottom-nav button span{font-size:17px;line-height:1}' +
'.hvm-bottom-nav button em{font-style:normal;font-size:9px;line-height:1.15;text-align:center;overflow-wrap:anywhere}' +
'.hvm-bottom-nav button.active{color:#d4a84b;background:rgba(212,168,75,.07)}' +
'@media(orientation:landscape) and (max-width:767px){.hvm-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hvm-bottom-nav button{min-height:52px}}'
