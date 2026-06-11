'use client'

import React, { useMemo, useState } from 'react'
import type { CountryIntelProfile, PipelineCounts, WantedListing } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import { BriefingRoom } from './pages/BriefingRoom'
import { MarketplacePage } from './pages/MarketplacePage'
import { EvidencePage } from './pages/EvidencePage'

export type MarketView = 'cannabis' | 'equipment' | 'consumables' | 'new-products' | 'services' | 'opportunities' | 'wanted'
export type MarketRow = {
  id: string
  specType: string
  typeLabel: string
  title: string
  description: string
  jurisdiction: string
  category: string
  tags: string[]
  trustLabel: string
  actionLabel: string
  statusLabel: string
}
export type DashboardMarketplaceRows = Partial<Record<MarketView, MarketRow[]>>

type CommandPage = 'briefing' | 'access-pathway' | 'marketplace' | 'evidence' | 'education' | 'regulatory' | 'local-intel' | 'signals' | 'watchlist' | 'settings'

type Props = {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  initialCountryIso2?: string | null
  initialRoleId?: string | null
  wantedCount?: number
  marketplaceRows?: DashboardMarketplaceRows
  pipeline?: PipelineCounts
  wantedListings?: WantedListing[]
  countryIntel?: CountryIntelProfile | null
}

const COUNTRIES = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, label: c.displayName }))
const NAV_ITEMS: { id: CommandPage; label: string }[] = [
  { id: 'briefing', label: 'Briefing Room' },
  { id: 'access-pathway', label: 'Access Pathway' },
  { id: 'marketplace', label: 'Marketplace & Access' },
  { id: 'evidence', label: 'Evidence & Sources' },
  { id: 'education', label: 'Education Hub' },
  { id: 'regulatory', label: 'Regulatory Watch' },
  { id: 'local-intel', label: 'Local Intel' },
  { id: 'signals', label: 'Signals' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'settings', label: 'Settings' },
]

function fallbackCountry(iso2?: string | null) {
  return COUNTRIES.find(c => c.iso2 === iso2) ?? { iso2: 'GLOBAL', label: 'Global Market' }
}

function roleLabel(roleId: string) {
  return roleId ? ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES]?.short ?? roleId.replace(/_/g, ' ') : 'All roles'
}

function ReviewPendingPage({ title, country, role }: { title: string; country: { label: string }; role: string }) {
  return (
    <section className="cc-scaffold">
      <p className="cc-kicker">Review-pending module</p>
      <h2>{title}</h2>
      <p>{country.label} · {role}. Public claims remain hidden until source-backed data is connected.</p>
    </section>
  )
}

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
  const [activePage, setActivePage] = useState<CommandPage>('briefing')
  const [countryIso2, setCountryIso2] = useState(fallbackCountry(initialCountryIso2).iso2)
  const [roleId, setRoleId] = useState(initialRoleId ?? '')
  const country = useMemo(() => fallbackCountry(countryIso2), [countryIso2])
  const role = roleLabel(roleId)

  const page = (() => {
    switch (activePage) {
      case 'briefing':
        return <BriefingRoom country={country} region="" countryIntel={countryIntel} signals={signals} />
      case 'marketplace':
        return <MarketplacePage country={country} region="" role={role} marketplaceRows={marketplaceRows} wantedCount={wantedCount} wantedListings={wantedListings} pipeline={pipeline} />
      case 'evidence':
        return <EvidencePage country={country} region="" role={role} countryIntel={countryIntel} />
      case 'education':
        return <ReviewPendingPage title={`Education Hub · ${eduCategories.length} public-safe modules`} country={country} role={role} />
      default:
        return <ReviewPendingPage title={NAV_ITEMS.find(item => item.id === activePage)?.label ?? 'Command Centre'} country={country} role={role} />
    }
  })()

  return (
    <div className="cc-app" data-testid="command-centre">
      <style>{CSS}</style>
      <header className="cc-header">
        <div className="cc-brand"><strong>HARBOURVIEW</strong><span>COMMAND CENTRE</span></div>
        <label>Country<select value={country.iso2} onChange={event => setCountryIso2(event.target.value)}>{COUNTRIES.map(option => <option key={option.iso2} value={option.iso2}>{option.label}</option>)}</select></label>
        <label>Role<select value={roleId} onChange={event => setRoleId(event.target.value)}><option value="">Select role</option>{Object.entries(ROLE_PROFILES).map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}</select></label>
        <div className="cc-state"><strong>Review-gated</strong><span>Public-safe DTO mode</span></div>
      </header>
      <aside className="cc-sidebar" aria-label="Command centre navigation">{NAV_ITEMS.map(item => <button key={item.id} type="button" className={activePage === item.id ? 'active' : ''} onClick={() => setActivePage(item.id)}>{item.label}</button>)}</aside>
      <main className="cc-main">{page}</main>
      <nav className="cc-mobile-nav" aria-label="Mobile navigation">{NAV_ITEMS.slice(0, 5).map(item => <button key={item.id} type="button" className={activePage === item.id ? 'active' : ''} onClick={() => setActivePage(item.id)}>{item.label}</button>)}</nav>
    </div>
  )
}

const CSS = `
.cc-app{position:fixed;inset:0;display:grid;grid-template-columns:220px minmax(0,1fr);grid-template-rows:64px minmax(0,1fr);overflow:hidden;background:#030711;color:#f5f0e8;font-family:Inter,system-ui,sans-serif}.cc-header{grid-column:1/-1;display:flex;align-items:center;gap:16px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(3,7,17,.96)}.cc-brand{width:190px;display:flex;flex-direction:column}.cc-brand strong{font-family:Georgia,serif;color:#d4a84b;letter-spacing:.18em;font-size:13px}.cc-brand span,.cc-header label,.cc-state span,.cc-kicker{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,240,232,.38)}.cc-header label{display:flex;flex-direction:column;gap:3px}.cc-header select{max-width:220px;border:1px solid rgba(255,255,255,.12);background:#08111f;color:#f5f0e8;border-radius:8px;padding:6px 8px}.cc-state{margin-left:auto;display:flex;flex-direction:column;gap:2px;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 10px}.cc-state strong{font-size:11px}.cc-sidebar{grid-row:2;display:flex;flex-direction:column;gap:3px;padding:12px 10px;border-right:1px solid rgba(255,255,255,.08);background:rgba(3,7,17,.7);overflow:auto}.cc-sidebar button,.cc-mobile-nav button{border:1px solid transparent;background:transparent;color:rgba(245,240,232,.55);border-radius:10px;padding:10px;text-align:left;font:inherit;font-size:12px;cursor:pointer}.cc-sidebar button.active,.cc-mobile-nav button.active{color:#d4a84b;border-color:rgba(212,168,75,.25);background:rgba(212,168,75,.07)}.cc-main{grid-row:2;overflow:auto;min-width:0;background:rgba(4,9,20,.4)}.cc-scaffold{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px}.cc-scaffold h2{font-family:Georgia,serif;font-size:24px;font-weight:400;margin:6px 0}.cc-scaffold p{color:rgba(245,240,232,.58);max-width:560px}.cc-mobile-nav{display:none}@media(max-width:1024px){.cc-app{position:relative;height:100svh;width:100%;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) 58px}.cc-header{align-items:stretch;gap:8px;padding:8px;overflow-x:auto}.cc-brand{width:auto;min-width:120px}.cc-header select{max-width:140px}.cc-state{display:none}.cc-sidebar{display:none}.cc-main{grid-column:1;grid-row:2}.cc-mobile-nav{grid-row:3;display:flex;gap:0;overflow-x:auto;border-top:1px solid rgba(255,255,255,.1);background:#030711}.cc-mobile-nav button{flex:1;min-width:72px;text-align:center;border-radius:0;font-size:10px;padding:8px 4px}}
`
