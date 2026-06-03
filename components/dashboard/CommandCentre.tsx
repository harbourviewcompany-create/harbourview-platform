'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities'
export type MarketRow = [string, string, string, string, string, string, string, string]
export type DashboardMarketplaceRows = Record<MarketView, MarketRow[]>

type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: Partial<DashboardMarketplaceRows>
}

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))

import { REGIONS, REGION_LABELS, WARN_REGIONS as WARN_REGIONS_BY_COUNTRY } from '@/lib/dashboard/countryRegions'

const WARN_REGIONS = new Set(Object.values(WARN_REGIONS_BY_COUNTRY).flat())


const VIEW_HREF: Record<MarketView, string> = {
  cannabis: '/marketplace/cannabis-inventory',
  equipment: '/marketplace/used-surplus',
  consumables: '/marketplace/consumables',
  'new-products': '/marketplace/new-products',
  services: '/marketplace/services',
  opportunities: '/marketplace/business-opportunities',
}

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

const ROW_DATA: Record<MarketView, MarketRow[]> = {
  cannabis: [
    ['supply','Flower','EU-GMP certified dried flower — 100kg lot','COA, batch record, and certificates of analysis attached. Import-ready.','verified|flower|GMP|bulk','VER:ok|PROOF:warn|REG:ok|79:warn|PUBLIC','Request proof','On enquiry'],
    ['supply','Extract','Full-spectrum CO₂ oil — refined distillate','German-market specification. 92% THC distillate with full terpene retention.','distillate|extract|bulk|verified','VER:ok|PROOF:warn|REG:warn|74:warn|PUBLIC','Request COA','On enquiry'],
    ['supply','Biomass','Trim and biomass lot — wholesale','Drying-complete biomass available for licensed extractors. Inspection welcome.','biomass|trim|wholesale|licensed','VER:warn|PROOF:warn|REG:ok|61:warn|PUBLIC','Request inspection','Wholesale'],
    ['supply','Genetics','Stabilised cultivar seed — commercial quantity','Feminised seeds from a licensed breeding programme. Phytosanitary docs available.','genetics|seeds|cultivar|licensed','VER:ok|PROOF:ok|REG:warn|83:ok|PUBLIC','Open inquiry','Genetics'],
  ],
  equipment: [
    ['equip','Cultivation','LED grow system — 200-light commercial lot','Decommissioned licensed facility. Full inspection package and service logs available.','cultivation|LED|commercial|asset','VER:warn|PROOF:warn|REG:ok|67:warn|PUBLIC','Request inspection','Asset'],
    ['equip','Extraction','Used CO₂ extraction line — inspection ready','Apeks 5L SCFX unit with maintenance history. Buyer diligence and verification workflow.','extraction|CO2|commercial|inspection','VER:warn|PROOF:warn|REG:ok|63:warn|PUBLIC','Ask inspection','Asset'],
    ['equip','Processing','Ethanol extraction and distillation train','Short-path distillation unit, 50L/day throughput. Priced for fast exit.','processing|distillation|distressed','VER:warn|PROOF:warn|REG:ok|59:warn|PUBLIC','Request records','Asset'],
    ['equip','Lab','Lab instrumentation package — HPLC + GC-MS','Testing equipment lot with full service history pending review. Import documentation available.','lab|HPLC|GC-MS|QA|review','VER:warn|PROOF:warn|REG:ok|71:warn|PUBLIC','Ask records','Asset'],
  ],
  consumables: [
    ['supply','Packaging','Child-resistant compliance packaging — EU spec','Stock lot of CR-compliant pouches and bottles. Meets German and UK labelling standards.','packaging|CR|compliance|EU','VER:ok|PROOF:ok|REG:ok|81:ok|PUBLIC','Request samples','In stock'],
    ['supply','Media','Substrate and growth media — sterile lot','Coco coir, perlite, and nutrient packs. Licensed producer supply. Bulk available.','substrate|media|sterile|bulk','VER:ok|PROOF:warn|REG:ok|74:warn|PUBLIC','Request quote','Bulk'],
    ['supply','Nutrients','GMP-compliant nutrient line — commercial size','Nutrient concentrates formulated for medical-grade cultivation compliance.','nutrients|GMP|commercial|medical','VER:ok|PROOF:ok|REG:ok|85:ok|PUBLIC','Order samples','Commercial'],
    ['supply','Solvents','Pharmaceutical-grade ethanol — IDA 99.9%','SDS, CoA, and import permit documentation available. Cold-chain delivery.','ethanol|pharmaceutical|solvent|CoA','VER:ok|PROOF:ok|REG:warn|77:ok|PUBLIC','Request docs','On order'],
  ],
  'new-products': [
    ['supply','Genetics','Stabilised feminised seeds — licensed breeding stock','Phytosanitary certificates and CITES documentation. Export-ready lot.','genetics|seeds|licensed|CITES','VER:ok|PROOF:ok|REG:warn|80:ok|PUBLIC','Open inquiry','Export ready'],
    ['supply','Formulation','Oil capsule lot — private label ready','Standardised THC:CBD capsules, GMP-compliant. White-label documentation included.','formulation|capsule|private label|GMP','VER:ok|PROOF:warn|REG:warn|72:warn|PUBLIC','Request specs','New product'],
    ['supply','Clones','Rooted cuttings — certified pathogen-free','Tissue-cultured cuttings from established cultivars. Phytosanitary cert included.','clones|tissue culture|certified|cultivar','VER:ok|PROOF:ok|REG:warn|76:ok','Request quote','Genetics'],
    ['supply','Devices','Medical vaporiser — CE-marked, import-ready','CE-marked vaporiser device with device dossier. Suitable for pharmacy channel.','device|vaporiser|CE|pharmacy','VER:ok|PROOF:warn|REG:warn|69:warn|PUBLIC','Request dossier','Device'],
  ],
  services: [
    ['service','Logistics','GDP cold-chain import handoff — EU gateway','Licensed GDP logistics operator covering DE, NL, UK ports. Track and trace included.','GDP|cold chain|customs|logistics','VER:ok|PROOF:ok|REG:warn|78:ok|PUBLIC','Book intro','Service'],
    ['service','Compliance','GMP gap analysis and audit readiness','Pre-audit consulting for EU-GMP certification. Experienced with BfArM requirements.','compliance|GMP|audit|BfArM','VER:ok|PROOF:ok|REG:ok|88:ok','Book session','Consulting'],
    ['service','Labs','ISO 17025 batch testing — third-party COA','Independent lab testing with accredited COA. Potency, pesticides, heavy metals, mycotoxins.','lab|testing|COA|ISO 17025','VER:ok|PROOF:ok|REG:ok|91:ok','Submit sample','Lab service'],
    ['service','Legal','Regulatory counsel — import permit and licensing','Experienced regulatory law firm covering Germany, UK, and Brazil import permits.','legal|regulatory|permit|licensing','VER:ok|PROOF:ok|REG:ok|86:ok','Request intro','Legal'],
  ],
  opportunities: [
    ['supply','Acquisition','Licensed cultivation facility — distressed exit','Full-scale indoor facility with existing EU-GMP certification and inventory. Asset sale.','acquisition|facility|EU-GMP|distressed','VER:warn|PROOF:warn|REG:ok|64:warn|PRIVATE:lock','Open inquiry','M&A'],
    ['supply','Partnership','Import distribution JV — DACH market entry','Established importer seeking supply partner for Germany, Austria, Switzerland coverage.','JV|partnership|distribution|DACH','VER:ok|PROOF:warn|REG:ok|71:warn|PRIVATE:lock','Express interest','Partnership'],
    ['supply','Licence Transfer','Retail dispensary licence — transfer ready','Existing retail dispensary licence available for assignment. Legal counsel required.','licence|retail|transfer|dispensary','VER:warn|PROOF:warn|REG:warn|55:warn|PRIVATE:lock','Open inquiry','Licence'],
    ['supply','Distressed','Processing facility — lease assignment','GMP-grade processing space available for lease assignment. Equipment included.','distressed|lease|processing|GMP','VER:warn|PROOF:warn|REG:ok|60:warn|PUBLIC','Request details','Lease'],
  ],
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

export default function CommandCentre({ signals, eduCategories, initialCountryIso2, initialRoleId, wantedCount = 4, marketplaceRows }: Props) {
  const router = useRouter()
  const defaultCountry = useMemo(() => COUNTRIES.find(c => c.iso2 === initialCountryIso2) ?? COUNTRIES[0], [initialCountryIso2])
  const [country, setCountry] = useState(defaultCountry)
  const [region, setRegion] = useState((REGIONS[defaultCountry.iso2] ?? [])[0] ?? '')
  const [role, setRole] = useState(initialRoleId ?? '')
  const [view, setView] = useState<MarketView>('cannabis')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const savePreferences = useCallback((patch: { country_iso2?: string; role_id?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/dashboard/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
    }, 600)
  }, [])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

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
    if (query) router.push(`/marketplace?q=${encodeURIComponent(query)}`)
  }

  const liveRows = marketplaceRows?.[view]
  const rows = (liveRows && liveRows.length > 0) ? liveRows : ROW_DATA[view]
  const warn = WARN_REGIONS.has(region)
  const roleLabel = role ? (ROLE_PROFILES[role as keyof typeof ROLE_PROFILES]?.label ?? 'General') : 'General'
  const tierLabel = ['doctor_prescriber','pharmacist','clinic_healthcare_operator'].includes(role) ? 'CLINICAL PARTNER · Education' : 'FREE · Weekly Signals'

  return (
    <>
      <style>{CSS}</style>
      <div className="cc-app">
        <header className="cc-top">
          <div className="cc-brand"><strong>HARBOURVIEW</strong><span>MARKET ACCESS · INTELLIGENCE · EDUCATION</span></div>
          <div className="cc-context">
            <label className="cc-field"><span>Country</span><select value={country.iso2} onChange={e => handleCountryChange(e.target.value)}>{COUNTRIES.map(c => <option key={c.iso2} value={c.iso2}>{c.label}</option>)}</select></label>
            <label className="cc-field"><span>Region</span><select value={region} onChange={e => setRegion(e.target.value)}>{(REGIONS[country.iso2] ?? []).map(r => <option key={r} value={r}>{r}</option>)}</select></label>
            <label className="cc-field"><span>Role</span><select value={role} onChange={e => handleRoleChange(e.target.value)}><option value="">— select role —</option>{Object.entries(ROLE_PROFILES).map(([id, p]) => <option key={id} value={id}>{p!.label}</option>)}</select></label>
            <label className="cc-field"><span>Search</span><input type="text" placeholder="Search listings, intel, education…" onKeyDown={handleSearchKeyDown} /></label>
          </div>
          <div className="cc-actions">
            <div className="cc-tier">{tierLabel}</div>
            <Link href="/intel-signals" className="cc-icon-btn cc-alert" aria-label="Notifications" />
            <Link href="/marketplace/wanted" className="cc-soft-btn">{wantedCount} Wanted</Link>
            <button className="cc-primary" onClick={() => setDrawerOpen(true)}>{getMainAction(role)}</button>
          </div>
        </header>

        <nav className="cc-sidebar" aria-label="Main navigation">
          {[
            ['/dashboard','Dashboard'], ['/marketplace','Marketplace'], ['/intel-signals','Intel'], ['/education','Education'], ['/supplier-directory','Suppliers'], ['/account','Account'],
          ].map(([href, label]) => <Link key={href} href={href} className={`cc-nav-btn${href === '/dashboard' ? ' active' : ''}`} aria-label={label}>{label.slice(0,1)}</Link>)}
        </nav>

        <main className="cc-workspace">
          <section className="cc-panel cc-market">
            <div className="cc-head"><div><h2>Marketplace & Access</h2><small>{VIEW_LABELS[view]}</small></div><div className="cc-head-actions"><Link href="/marketplace/wanted" className="cc-wanted-cta">{wantedCount} Wanted Requests →</Link><Link href={VIEW_HREF[view]} className="cc-soft-btn">View All →</Link></div></div>
            <div className="cc-view-bar"><div className="cc-views">{(['cannabis','equipment','consumables','new-products','services','opportunities'] as MarketView[]).map(v => <button key={v} className={`cc-view${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{VIEW_TAB_LABELS[v]}</button>)}</div><button className="cc-customize-btn" onClick={() => setDrawerOpen(true)}>Customize</button></div>
            <div className="cc-market-grid"><div className="cc-market-block"><div className="cc-block-title"><b>{VIEW_BLOCK_TITLES[view]}</b><span>{rows.length} rows · region-filtered</span></div><div className="cc-rows">{rows.map(r => <article key={r[2]} className="cc-row"><div className={`cc-spec ${r[0]}`} /><div><div className="cc-type">{r[1]}</div><h4>{r[2]}</h4><p>{r[3]}</p><TagPills str={r[4]} /><TrustBar str={r[5]} /></div><div className="cc-action-box"><strong>{r[7]}</strong><small>{r[1].toLowerCase()}</small><Link className="cc-row-action" href={VIEW_HREF[view]}>{r[6]}</Link><Link className="cc-secondary" href="/marketplace/wanted">Watch</Link></div></article>)}</div></div></div>
          </section>

          <section className="cc-col2">
            <div className="cc-panel cc-education"><div className="cc-head"><div><h3>Education Hub</h3><small>Role-relevant learning</small></div><Link href="/education" className="cc-link-btn">View All →</Link></div><div className="cc-body"><div className="cc-edu-intro"><strong>{roleLabel} Learning Path</strong><p>Role-specific education, compliance modules, and country rules for your selected market.</p></div><div className="cc-edu-cards">{eduCategories.slice(0, 3).map(cat => <div key={cat.title} className="cc-edu"><b>{cat.icon} {cat.title}</b><p>{cat.desc}</p><Link href="/education" className="cc-edu-cta">Open module</Link></div>)}</div><div className="cc-funnel"><h4>Education Funnel</h4><div className="cc-funnel-grid"><div className="cc-funnel-box"><b>{eduCategories.length} modules ready</b><span>Role-matched content</span></div><div className="cc-funnel-box"><b>{country.label} framework</b><span>Regional rules selected</span></div></div></div></div></div>
          </section>

          <section className="cc-col3">
            <div className="cc-panel cc-signals"><div className="cc-head"><div><h3>Weekly Signals</h3><small>Free summaries · paid source trail · marketplace impact</small></div><Link href="/intel-signals" className="cc-link-btn">View All →</Link></div><div className="cc-body"><div className="cc-signal-list">{signals.slice(0, 3).map(s => <article key={s.id} className="cc-signal"><span className={`cc-sev${s.tag.label === 'REGULATION' || s.tag.label === 'COMPLIANCE' ? '' : ' low'}`} /><div><b>{s.title}</b><p>{s.commercialImpact}</p><small>{s.market} · confidence {s.confidence} · {s.timeAgo}</small><div className="cc-impact"><span className="cc-signal-tag" style={{ borderColor: s.tag.border, color: s.tag.color, background: s.tag.bg }}>{s.tag.label}</span> Marketplace impact: {s.commercialImpact.toLowerCase()}</div></div><span className="cc-badge">FREE</span></article>)}<div className="cc-pay-boundary"><b>Intel Plus unlocks</b><p>Source trails, contradiction review, counterparty movement, corridor alerts, regional rule-change monitoring, and saved watch alerts.</p></div></div></div></div>
            <div className="cc-panel cc-map-panel"><div className="cc-head"><div><h3>{country.label}</h3><small>{REGION_LABELS[country.iso2] ?? 'Region-level rule instrument'}</small></div></div><div className="cc-body cc-map-body"><div className="cc-legend"><span>● Allow</span><span>● Review</span><span>● Restrict</span><span>● Edu required</span></div><div className="cc-map-wrap"><div className="cc-region-grid">{(REGIONS[country.iso2] ?? []).map(r => <button key={r} className={`cc-region-tile${region === r ? ' active' : ''}${WARN_REGIONS.has(r) ? ' warn' : ''}`} onClick={() => setRegion(r)}>{r}</button>)}</div><div className="cc-rules"><b>{region || 'Select a region'}</b><p>{region || country.label} selected. Regional rules filter listings, wanted demand, education modules, and counterparty contact actions.</p><div className="cc-rule-grid"><div><small>Rule status</small><strong>{warn ? 'Review required' : 'Allowed with proof'}</strong></div><div><small>Category impact</small><strong>{warn ? 'Marketplace restricted' : 'Supply + clinical'}</strong></div><div><small>Professional implication</small><strong>{warn ? 'Education before action' : 'Pharmacy guidance'}</strong></div><div><small>Marketplace action</small><strong>{warn ? 'Hold inquiry until review' : 'Proof before inquiry'}</strong></div></div></div></div></div></div>
          </section>
        </main>

        <footer className="cc-status"><span><b>LIVE</b> role-aware · region-filtered · proof-gated</span><span>Marketplace categories · regional rules · weekly signals</span><span>Saved country and role preferences alter dashboard context</span></footer>
      </div>
      {drawerOpen && <div className="cc-scrim" onClick={() => setDrawerOpen(false)} />}
      <aside className={`cc-drawer${drawerOpen ? ' open' : ''}`} aria-label="Customize command centre"><div className="cc-drawer-head"><div><small>Customize Command Centre</small><h3>Controlled workspace personalization</h3></div><button className="cc-close" onClick={() => setDrawerOpen(false)}>×</button></div><div className="cc-drawer-body"><section className="cc-drawer-card"><b>Saved layouts</b><p>Choose controlled presets that preserve the commercial hierarchy.</p></section><section className="cc-drawer-card"><b>Module priority</b><p>Pin, hide, or prioritize approved modules.</p></section></div></aside>
    </>
  )
}

const CSS = `
:root{--cc-bg:#040814;--cc-panel:#0b1929;--cc-ink:#f7efe1;--cc-text:#d8e1e9;--cc-muted:#9aa8b6;--cc-dim:#627282;--cc-line:rgba(232,240,248,.115);--cc-line2:rgba(232,240,248,.18);--cc-gold:#d9af63;--cc-gold2:#f3cf86;--cc-green:#74d28e;--cc-blue:#79b2ea;--cc-red:#e27466;--cc-amber:#e7b053;--cc-violet:#ad92ee;--cc-shadow:0 28px 88px rgba(0,0,0,.42);--cc-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;--cc-serif:Georgia,"Times New Roman",serif;--cc-mono:"SFMono-Regular","Cascadia Mono","Roboto Mono",Consolas,monospace}
.cc-app{position:fixed;inset:0;display:grid;grid-template-columns:78px minmax(0,1fr);grid-template-rows:74px minmax(0,1fr) 42px;background:linear-gradient(135deg,#030711 0%,#07111d 47%,#030812 100%);color:var(--cc-text);font-family:var(--cc-sans);overflow:hidden}.cc-top{grid-column:1/-1;grid-row:1;z-index:10;display:grid;grid-template-columns:240px minmax(0,1fr) auto;gap:16px;align-items:center;padding:12px 18px;border-bottom:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(5,10,20,.96),rgba(6,13,24,.9))}.cc-brand strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);letter-spacing:.155em;font-size:18px;font-weight:520}.cc-brand span{display:block;margin-top:2px;color:var(--cc-dim);text-transform:uppercase;letter-spacing:.14em;font-size:8px;white-space:nowrap}.cc-context{display:grid;grid-template-columns:130px 140px 160px minmax(150px,1fr);gap:9px;min-width:0}.cc-field{height:46px;position:relative}.cc-field span{position:absolute;left:12px;top:6px;color:var(--cc-dim);font-size:8px;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;z-index:1}.cc-field select,.cc-field input{width:100%;height:100%;border:1px solid var(--cc-line2);border-radius:14px;background:linear-gradient(180deg,rgba(17,35,53,.9),rgba(7,16,28,.96));color:var(--cc-ink);outline:none;padding:17px 10px 6px 12px;font:inherit;font-size:13px}.cc-actions{display:flex;align-items:center;gap:8px;justify-content:flex-end;white-space:nowrap}.cc-tier{height:44px;border:1px solid rgba(217,175,99,.35);border-radius:14px;background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:0 12px;display:flex;align-items:center;font-family:var(--cc-mono);font-size:10px;white-space:nowrap}.cc-icon-btn,.cc-soft-btn,.cc-primary{height:44px;border-radius:14px;border:1px solid var(--cc-line2);background:linear-gradient(180deg,rgba(15,31,49,.9),rgba(7,16,28,.98));color:var(--cc-muted);padding:0 13px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;font:inherit;font-size:12px;text-decoration:none}.cc-icon-btn{width:44px;padding:0;justify-content:center;position:relative}.cc-icon-btn.cc-alert::after{content:"";position:absolute;right:9px;top:9px;width:7px;height:7px;border-radius:50%;background:var(--cc-red);box-shadow:0 0 0 4px rgba(226,116,102,.12)}.cc-primary{border-color:rgba(217,175,99,.56);background:linear-gradient(135deg,#f0cc82,#c89136);color:#07111d;font-weight:790}.cc-sidebar{grid-column:1;grid-row:2/4;z-index:5;padding:16px 10px;border-right:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(4,9,18,.78),rgba(3,8,17,.96));display:flex;flex-direction:column;align-items:center;gap:9px}.cc-nav-btn{width:52px;height:52px;border-radius:17px;border:1px solid transparent;background:transparent;color:var(--cc-dim);display:grid;place-items:center;text-decoration:none;font-weight:800}.cc-nav-btn.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.35);background:rgba(217,175,99,.08)}.cc-workspace{grid-column:2;grid-row:2;z-index:1;min-width:0;min-height:0;display:grid;grid-template-columns:minmax(580px,2fr) minmax(280px,1fr) minmax(300px,1fr);gap:14px;padding:14px;overflow:hidden}.cc-panel{min-width:0;min-height:0;border:1px solid var(--cc-line);border-radius:26px;background:linear-gradient(180deg,rgba(12,28,44,.93),rgba(5,13,23,.95));box-shadow:var(--cc-shadow);overflow:hidden}.cc-head{height:62px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--cc-line)}.cc-head h2,.cc-head h3{margin:0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520}.cc-head h2{font-size:22px}.cc-head h3{font-size:17px}.cc-head small{display:block;margin-top:3px;color:var(--cc-dim);font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-family:var(--cc-mono)}.cc-head-actions{display:flex;gap:8px;align-items:center}.cc-link-btn{color:var(--cc-gold);font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.cc-wanted-cta{border:1px solid rgba(173,146,238,.42);background:rgba(173,146,238,.08);color:var(--cc-violet);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.cc-body{flex:1;min-height:0;overflow-y:auto;padding:14px}.cc-market,.cc-education,.cc-signals,.cc-map-panel{display:flex;flex-direction:column;min-height:0}.cc-view-bar{border-bottom:1px solid var(--cc-line);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.018)}.cc-views{display:flex;gap:7px;overflow:auto}.cc-view{height:34px;border:1px solid var(--cc-line);border-radius:999px;background:rgba(255,255,255,.026);color:var(--cc-muted);padding:0 12px;white-space:nowrap;font-size:12px;cursor:pointer;font:inherit}.cc-view.active{color:var(--cc-gold2);border-color:rgba(217,175,99,.42);background:rgba(217,175,99,.09)}.cc-customize-btn{height:34px;border-radius:12px;border:1px solid rgba(217,175,99,.38);background:rgba(217,175,99,.08);color:var(--cc-gold2);font-weight:720;padding:0 12px;cursor:pointer;font:inherit;font-size:12px;white-space:nowrap}.cc-market-grid{flex:1;min-height:0;overflow:hidden;padding:12px;display:flex;flex-direction:column}.cc-market-block{border:1px solid var(--cc-line);border-radius:20px;background:rgba(255,255,255,.022);overflow:hidden;display:flex;flex-direction:column;flex:1;min-height:0}.cc-block-title{padding:10px 14px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}.cc-block-title b{color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}.cc-block-title span{font-size:11px;color:var(--cc-dim);font-family:var(--cc-mono)}.cc-rows{flex:1;overflow-y:auto;padding:10px;display:grid;gap:10px;align-content:start}.cc-row{border:1px solid var(--cc-line);border-radius:18px;background:linear-gradient(180deg,rgba(18,38,58,.72),rgba(7,17,29,.92));padding:12px;display:grid;grid-template-columns:100px minmax(0,1fr) 144px;gap:12px;align-items:center}.cc-spec{width:100px;height:80px;border-radius:14px;border:1px solid var(--cc-line2);background:#0a1624}.cc-spec.supply{background:radial-gradient(circle at 32% 28%,rgba(217,175,99,.32),transparent 25%),#0a1624}.cc-spec.equip{background:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),#0a1624}.cc-spec.service{background:linear-gradient(135deg,rgba(115,210,141,.16),rgba(122,177,234,.08)),#0a1624}.cc-type{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--cc-gold);font-family:var(--cc-mono);margin-bottom:4px}.cc-row h4{margin:0;color:var(--cc-ink);font-size:15px;line-height:1.2}.cc-row p{margin:4px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.38}.hv-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.hv-tag{height:20px;display:inline-flex;align-items:center;border:1px solid var(--cc-line2);border-radius:999px;padding:0 7px;color:var(--cc-muted);background:rgba(255,255,255,.026);font-size:9px;font-family:var(--cc-mono)}.hv-trust{margin-top:7px;display:grid;grid-template-columns:repeat(5,54px);gap:4px}.hv-trust i{font-style:normal;height:19px;border:1px solid rgba(232,239,247,.1);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--cc-dim);font-size:8px;font-family:var(--cc-mono);background:rgba(255,255,255,.018)}.hv-trust i.ok{color:var(--cc-green);border-color:rgba(115,210,141,.26)}.hv-trust i.warn{color:var(--cc-amber);border-color:rgba(230,176,83,.28)}.hv-trust i.lock{color:var(--cc-violet);border-color:rgba(173,146,238,.28)}.cc-action-box{text-align:right}.cc-action-box strong{display:block;color:var(--cc-ink);font-size:13px}.cc-action-box small{display:block;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px;margin-top:3px}.cc-row-action,.cc-secondary,.cc-edu-cta{margin-top:7px;border-radius:10px;border:1px solid rgba(217,175,99,.34);background:rgba(217,175,99,.07);color:var(--cc-gold2);padding:7px 10px;font-size:11px;font-weight:680;text-decoration:none;display:inline-flex}.cc-secondary{border-color:var(--cc-line2);background:rgba(255,255,255,.03);color:var(--cc-muted);display:block;justify-content:center}.cc-col2,.cc-col3{display:flex;flex-direction:column;gap:14px;min-height:0;overflow:hidden}.cc-education{flex:1}.cc-education .cc-body{display:flex;flex-direction:column}.cc-edu-intro{border:1px solid rgba(217,175,99,.24);border-radius:18px;padding:12px;background:linear-gradient(135deg,rgba(217,175,99,.095),rgba(120,215,211,.045));margin-bottom:10px;flex-shrink:0}.cc-edu-intro strong{display:block;color:var(--cc-gold2);font-family:var(--cc-serif);font-weight:520;font-size:17px}.cc-edu-intro p,.cc-edu p,.cc-signal p,.cc-pay-boundary p,.cc-rules p{margin:5px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.45}.cc-edu-cards{display:grid;gap:8px;overflow-y:auto;flex:1;min-height:0;align-content:start;padding-bottom:4px}.cc-edu{border:1px solid var(--cc-line);border-radius:15px;background:rgba(255,255,255,.026);padding:11px}.cc-edu b{display:block;color:var(--cc-ink);font-size:13px}.cc-funnel{border-top:1px solid var(--cc-line);padding:12px;background:linear-gradient(180deg,rgba(12,28,44,.62),rgba(5,13,23,.92));flex-shrink:0}.cc-funnel h4{margin:0 0 8px;color:var(--cc-gold);font-size:11px;letter-spacing:.16em;text-transform:uppercase}.cc-funnel-grid,.cc-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cc-funnel-box,.cc-rule-grid div{border:1px solid var(--cc-line);border-radius:12px;padding:9px;background:rgba(255,255,255,.025)}.cc-funnel-box b,.cc-rule-grid strong{display:block;color:var(--cc-ink);font-size:12px}.cc-funnel-box span,.cc-rule-grid small{display:block;color:var(--cc-muted);font-size:10px;margin-top:3px}.cc-signals{flex:1.08}.cc-map-panel{flex:.92}.cc-signal-list{display:grid;gap:10px;align-content:start}.cc-signal{border:1px solid var(--cc-line);border-radius:16px;background:rgba(255,255,255,.026);padding:12px;display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:10px;align-items:start}.cc-sev{height:100%;min-height:56px;border-radius:999px;background:var(--cc-green)}.cc-sev.low{background:var(--cc-amber)}.cc-signal b,.cc-pay-boundary b,.cc-rules b{display:block;color:var(--cc-ink);font-size:13px;line-height:1.25}.cc-signal small{display:block;margin-top:5px;color:var(--cc-dim);font-family:var(--cc-mono);font-size:10px}.cc-impact{margin-top:7px;border:1px solid rgba(217,175,99,.18);border-radius:9px;padding:6px;color:var(--cc-gold2);font-size:10px;background:rgba(217,175,99,.045)}.cc-signal-tag{border:1px solid;border-radius:999px;padding:2px 6px;font-family:var(--cc-mono);font-size:9px}.cc-badge{border:1px solid rgba(217,175,99,.3);color:var(--cc-gold);border-radius:999px;padding:3px 7px;font-family:var(--cc-mono);font-size:9px;white-space:nowrap}.cc-pay-boundary{margin-top:10px;border:1px solid rgba(173,146,238,.28);border-radius:16px;padding:12px;background:linear-gradient(135deg,rgba(173,146,238,.08),rgba(255,255,255,.02))}.cc-map-body{display:flex;flex-direction:column}.cc-legend{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.cc-legend span{height:21px;border:1px solid var(--cc-line);border-radius:999px;padding:0 7px;display:inline-flex;align-items:center;font-size:9px;color:var(--cc-muted);font-family:var(--cc-mono)}.cc-map-wrap{flex:1;min-height:0;border:1px solid var(--cc-line);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.01));overflow:hidden;display:flex;flex-direction:column}.cc-region-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px;overflow:auto}.cc-region-tile{border:1px solid var(--cc-line);border-radius:12px;background:rgba(122,177,234,.105);color:var(--cc-text);padding:10px;font:inherit;font-size:11px;cursor:pointer}.cc-region-tile.active{background:rgba(217,175,99,.22);border-color:rgba(243,207,134,.75)}.cc-region-tile.warn{box-shadow:inset 0 0 0 1px rgba(226,116,102,.24)}.cc-rules{border-top:1px solid var(--cc-line);padding:10px 12px;background:rgba(5,13,23,.76)}.cc-status{grid-column:2/-1;grid-row:3;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-top:1px solid var(--cc-line);background:linear-gradient(180deg,rgba(4,9,18,.92),rgba(3,8,17,.98));font-size:10px;color:var(--cc-dim);font-family:var(--cc-mono);gap:16px}.cc-status b{color:var(--cc-green)}.cc-scrim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:20;backdrop-filter:blur(2px)}.cc-drawer{position:fixed;right:0;top:0;bottom:0;width:380px;z-index:30;background:linear-gradient(180deg,rgba(10,22,36,.98),rgba(5,13,24,.99));border-left:1px solid var(--cc-line2);box-shadow:-28px 0 88px rgba(0,0,0,.48);transform:translateX(100%);transition:transform .28s cubic-bezier(.25,.46,.45,.94);display:flex;flex-direction:column}.cc-drawer.open{transform:translateX(0)}.cc-drawer-head{padding:20px 22px;border-bottom:1px solid var(--cc-line);display:flex;align-items:center;justify-content:space-between}.cc-drawer-head small{display:block;color:var(--cc-dim);font-size:9px;text-transform:uppercase;letter-spacing:.16em;font-family:var(--cc-mono)}.cc-drawer-head h3{margin:6px 0 0;color:var(--cc-ink);font-family:var(--cc-serif);font-weight:520;font-size:18px}.cc-close{width:36px;height:36px;border-radius:10px;border:1px solid var(--cc-line2);background:rgba(255,255,255,.04);color:var(--cc-muted);font-size:22px;cursor:pointer;display:grid;place-items:center;flex-shrink:0}.cc-drawer-body{flex:1;overflow:auto;padding:20px 22px;display:grid;gap:16px;align-content:start}.cc-drawer-card{border:1px solid var(--cc-line);border-radius:18px;padding:16px;background:rgba(255,255,255,.022)}.cc-drawer-card b{display:block;color:var(--cc-ink);font-size:14px;margin-bottom:6px}.cc-drawer-card p{margin:0;color:var(--cc-muted);font-size:12px;line-height:1.45}@media(max-width:1180px){.cc-app{position:relative;min-height:100vh;overflow:auto;display:block}.cc-top{display:flex;flex-direction:column;align-items:stretch}.cc-context{grid-template-columns:1fr 1fr}.cc-sidebar{display:none}.cc-workspace{display:grid;grid-template-columns:1fr;overflow:visible}.cc-status{display:none}.cc-row{grid-template-columns:1fr}.cc-spec{width:100%;height:70px}.cc-action-box{text-align:left}.cc-col2,.cc-col3{overflow:visible}.cc-drawer{width:min(92vw,380px)}}
`
