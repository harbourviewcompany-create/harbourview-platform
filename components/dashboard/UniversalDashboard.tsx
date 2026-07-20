'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getDashboardRoleLabel, mapGlobeRoleToDashboardRole } from '@/lib/dashboard/globeRouteContext'
import { dashboardProductAreas, marketplaceTabs, type DashboardClientPreferences, type DashboardClientRouteContext, type MarketplaceTabId } from '@/lib/dashboard/dashboardClientTypes'
import type { PublicMarketplaceListing } from '@/lib/marketplace/publicListings'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'
import type { RoleId } from '@/types/globe-router'

type UniversalDashboardProps = {
  routeContext: DashboardClientRouteContext
  serverPreferences?: DashboardClientPreferences | null
  countries: Pick<CountryDashboardSummary, 'slug' | 'iso2' | 'displayName' | 'region' | 'dashboardStatus' | 'publicSummary'>[]
  listings: PublicMarketplaceListing[]
}

type NotificationItem = { id: string; title: string; detail: string; unread: boolean }
type RequestItem = { id: string; title: string; state: 'submitted' | 'under_review' | 'needs_clarification' | 'ready'; detail: string }

const storageKey = 'harbourview.dashboard.preferences.v1'
const stateTone: Record<string, string> = {
  submitted: 'border-sky-400/25 text-sky-200 bg-sky-400/10',
  under_review: 'border-amber-400/25 text-amber-200 bg-amber-400/10',
  needs_clarification: 'border-red-400/25 text-red-200 bg-red-400/10',
  ready: 'border-emerald-400/25 text-emerald-200 bg-emerald-400/10',
}

function hasUrlContext(context: DashboardClientRouteContext) {
  return Boolean(context.source || context.mode || context.countryIso2 || context.countries.length || context.roleId || context.intentId || context.layerId)
}

function readStoredPreferences() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as DashboardClientPreferences) : null
  } catch {
    return null
  }
}

function writeStoredPreferences(value: DashboardClientPreferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

function normalizeIso2(value?: string) {
  const trimmed = value?.trim().toUpperCase()
  return trimmed && /^[A-Z]{2}$/.test(trimmed) ? trimmed : undefined
}

function filterListings(listings: PublicMarketplaceListing[], tab: MarketplaceTabId) {
  if (tab === 'all') return listings
  return listings.filter((listing) => {
    const haystack = `${listing.title} ${listing.section} ${listing.category} ${listing.listingType}`.toLowerCase()
    if (tab === 'equipment') return /equipment|oven|system|lab|processing|extraction/.test(haystack)
    if (tab === 'supply') return /supply|inventory|biomass|cultivation|product/.test(haystack)
    return /service|advisory|packaging|quote|compliance/.test(haystack)
  })
}

function countryLabel(country?: Pick<CountryDashboardSummary, 'iso2' | 'displayName'>) {
  if (!country?.iso2) return 'Choose market'
  return `${country.displayName} · ${country.iso2}`
}

export function UniversalDashboard({ routeContext, serverPreferences, countries, listings }: UniversalDashboardProps) {
  const [preferences, setPreferences] = useState<DashboardClientPreferences>(() => serverPreferences ?? {})
  const [roleId, setRoleId] = useState<RoleId | undefined>(routeContext.roleId ?? serverPreferences?.roleId)
  const [marketplaceTab, setMarketplaceTab] = useState<MarketplaceTabId>((serverPreferences?.marketplaceTab as MarketplaceTabId | undefined) ?? 'all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'source-health', title: 'Source health refresh queued', detail: 'Public-safe source health will refresh on the next verified data run.', unread: true },
    { id: 'request-review', title: 'Request review needed', detail: 'One saved introduction request needs classification before routing.', unread: true },
    { id: 'education-refresh', title: 'Education Hub follows role', detail: 'Changing role refreshes the recommended education module.', unread: false },
  ])
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(serverPreferences?.notificationPanelOpen ?? false)
  const [educationRefreshKey, setEducationRefreshKey] = useState(0)

  useEffect(() => {
    if (hasUrlContext(routeContext) || serverPreferences) return
    const stored = readStoredPreferences()
    if (!stored) return
    setPreferences(stored)
    if (stored.roleId) setRoleId(stored.roleId)
    if (stored.marketplaceTab && marketplaceTabs.some((tab) => tab.id === stored.marketplaceTab)) {
      setMarketplaceTab(stored.marketplaceTab as MarketplaceTabId)
    }
    if (typeof stored.notificationPanelOpen === 'boolean') setNotificationPanelOpen(stored.notificationPanelOpen)
  }, [routeContext, serverPreferences])

  useEffect(() => {
    if (roleId === undefined) return
    setEducationRefreshKey((current) => current + 1)
  }, [roleId])

  const selectedIso2 = normalizeIso2(routeContext.countryIso2 ?? preferences.countryIso2)
  const selectedCountry = selectedIso2 ? countries.find((country) => country.iso2 === selectedIso2) : undefined
  const selectedCountries = routeContext.countries.length ? routeContext.countries : preferences.countries ?? []
  const dashboardRole = mapGlobeRoleToDashboardRole(roleId)
  const unreadCount = notifications.filter((item) => item.unread).length
  const visibleListings = useMemo(() => filterListings(listings, marketplaceTab), [listings, marketplaceTab])
  const savedMarkets = selectedCountry ? [selectedCountry, ...countries.filter((country) => country.iso2 !== selectedCountry.iso2).slice(0, 2)] : countries.slice(0, 3)
  const requests: RequestItem[] = [
    { id: 'intro-review', title: 'Reviewed introduction', state: 'under_review', detail: 'Counterparty fit and documentation scope pending Harbourview review.' },
    { id: 'listing-request', title: 'Marketplace listing request', state: 'submitted', detail: 'Public-safe listing candidate received; availability remains unconfirmed.' },
    { id: 'source-clarification', title: 'Source clarification', state: 'needs_clarification', detail: 'A source needs redaction and classification before publication.' },
  ]
  const sourceHealth = [
    { label: 'Marketplace listings', status: listings.length > 0 ? 'Live public DTO' : 'Fixture fallback', detail: `${listings.length} public-safe listing summaries available.` },
    { label: 'Country intelligence', status: countries.length > 0 ? 'Registry live' : 'Fixture fallback', detail: `${countries.length} tracked jurisdictions represented.` },
    { label: 'Signals', status: 'Fixture fallback', detail: 'Public-safe signal summaries are labeled until live signal publication is enabled.' },
  ]
  const nextActions = [
    selectedCountry ? `Review ${selectedCountry.displayName} country intelligence drill-down` : 'Choose a market from the globe or country selector',
    `Open ${getDashboardRoleLabel(dashboardRole)} education module`,
    visibleListings.length > 0 ? `Review ${visibleListings[0]?.title}` : 'Request marketplace review',
    unreadCount > 0 ? 'Clear unread notification triage' : 'Save a market or listing for follow-up',
  ]

  function savePreferences(next: DashboardClientPreferences) {
    const merged = { ...preferences, ...next }
    setPreferences(merged)
    writeStoredPreferences(merged)
    void fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => undefined)
  }

  function markNotificationsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
    setNotificationPanelOpen(true)
    savePreferences({ notificationPanelOpen: true })
  }

  return (
    <div className="min-h-screen bg-[#03070d] text-white">
      <header className="sticky top-0 z-40 border-b border-[#c6a55a]/15 bg-[#03070d]/95 px-5 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="font-serif text-[13px] uppercase tracking-[0.22em] text-[#f0d39a]">Harbourview</Link>
          <nav className="flex items-center gap-3 text-[11px] text-[#c6a55a]/70">
            <Link href="/marketplace" className="hover:text-[#f0d39a]">Marketplace</Link>
            <Link href="/intelligence" className="hover:text-[#f0d39a]">Intelligence</Link>
            <Link href="/education" className="hover:text-[#f0d39a]">Education</Link>
            <button type="button" onClick={markNotificationsRead} className="rounded-full border border-[#c6a55a]/25 px-3 py-1 text-[#f0d39a]">
              Notifications {unreadCount > 0 ? <span className="ml-1 rounded-full bg-red-500 px-1.5 text-white">{unreadCount}</span> : null}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-[#c6a55a]/20 bg-[linear-gradient(135deg,rgba(11,26,47,0.98),rgba(3,7,13,1))] p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c6a55a]/75">Primary user control center</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Dashboard</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                Marketplace, Intelligence, Education, Signals, Sources, Requests, Saved markets, Saved listings, preferences and recommended next actions are consolidated here after globe routing.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">{countryLabel(selectedCountry)}</span>
                <span className="rounded-full border border-[#c6a55a]/20 bg-[#c6a55a]/10 px-3 py-1 text-[#f0d39a]">Role: {roleId ?? 'unset'} · {getDashboardRoleLabel(dashboardRole)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">Mode: {routeContext.mode ?? preferences.mode ?? 'unset'}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">Source: {routeContext.source ?? preferences.source ?? 'direct'}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">Layer: {routeContext.layerId ?? preferences.layerId ?? 'unset'}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Context preserved</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-white/35">Country</dt><dd>{selectedIso2 ?? 'unset'}</dd></div>
                <div><dt className="text-white/35">Countries</dt><dd>{selectedCountries.length ? selectedCountries.join(',') : 'unset'}</dd></div>
                <div><dt className="text-white/35">Intent</dt><dd>{routeContext.intentId ?? preferences.intentId ?? 'unset'}</dd></div>
                <div><dt className="text-white/35">Notifications</dt><dd>{unreadCount} unread</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard product areas">
          {dashboardProductAreas.map((area) => (
            <Link key={area.id} href={`#${area.id}`} className="rounded-2xl border border-white/10 bg-[#07101f] p-4 transition hover:border-[#c6a55a]/30">
              <h2 className="text-sm font-semibold text-[#f0d39a]">{area.label}</h2>
              <p className="mt-2 text-xs leading-5 text-white/50">{area.summary}</p>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section id="marketplace" className="rounded-3xl border border-white/10 bg-[#07101f] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold">Marketplace</h2><p className="text-xs text-white/45">Tabs filter the listings shown below.</p></div>
              <div className="flex flex-wrap gap-2">
                {marketplaceTabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => { setMarketplaceTab(tab.id); savePreferences({ marketplaceTab: tab.id }) }} className={`rounded-full border px-3 py-1 text-xs ${marketplaceTab === tab.id ? 'border-[#c6a55a]/60 bg-[#c6a55a]/15 text-[#f0d39a]' : 'border-white/10 text-white/55'}`}>{tab.label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleListings.slice(0, 4).map((listing) => (
                <article key={listing.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60">{listing.category}</p>
                  <h3 className="mt-2 text-sm font-semibold">{listing.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/50">{listing.publicSummary}</p>
                  <Link href={`/marketplace/listings/${listing.slug}`} className="mt-3 inline-flex text-xs text-[#f0d39a] hover:underline">Open listing</Link>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section id="notifications" className="rounded-3xl border border-white/10 bg-[#07101f] p-5">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Notifications</h2><span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-100">{unreadCount} unread</span></div>
              {notificationPanelOpen ? <div className="mt-4 space-y-3">{notifications.map((item) => <div key={item.id} className="rounded-xl border border-white/10 p-3"><p className="text-sm font-medium">{item.unread ? '● ' : ''}{item.title}</p><p className="mt-1 text-xs text-white/45">{item.detail}</p></div>)}</div> : <button type="button" onClick={() => setNotificationPanelOpen(true)} className="mt-4 text-xs text-[#f0d39a]">Open notification panel</button>}
            </section>

            <section id="preferences" className="rounded-3xl border border-white/10 bg-[#07101f] p-5">
              <h2 className="text-lg font-semibold">User preferences</h2>
              <label className="mt-4 block text-xs text-white/45" htmlFor="role-select">Role context</label>
              <select id="role-select" value={roleId ?? ''} onChange={(event) => { const next = (event.target.value || undefined) as RoleId | undefined; setRoleId(next); savePreferences({ roleId: next }) }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#03070d] p-2 text-sm">
                <option value="">Unset role</option>
                <option value="importer">Importer</option>
                <option value="doctor_prescriber">Doctor / prescriber</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="lab_qa">Lab QA</option>
                <option value="regulatory_compliance">Regulatory compliance</option>
              </select>
              <p className="mt-3 text-xs text-white/45">Education refresh key: {educationRefreshKey}</p>
            </section>
          </aside>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div id="intelligence" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Intelligence</h2><p className="mt-2 text-xs text-white/50">Country pages are secondary intelligence drill-downs.</p>{selectedCountry ? <Link href={`/intelligence/country/${selectedCountry.slug}`} className="mt-4 inline-flex text-xs text-[#f0d39a]">Open {selectedCountry.displayName} intelligence</Link> : null}</div>
          <div id="education" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Education Hub</h2><p className="mt-2 text-xs text-white/50">Role-aware education refreshed for {getDashboardRoleLabel(dashboardRole)}.</p><Link href="/education" className="mt-4 inline-flex text-xs text-[#f0d39a]">Open Education</Link></div>
          <div id="signals" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Signals</h2><p className="mt-2 text-xs text-white/50">Public-safe signal summaries with reviewed publication labels.</p><Link href="/dashboard?page=evidence" className="mt-4 inline-flex text-xs text-[#f0d39a]">Open source engine</Link></div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div id="sources" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Sources / source health</h2><div className="mt-3 space-y-3">{sourceHealth.map((source) => <div key={source.label} className="rounded-xl border border-white/10 p-3"><p className="text-sm">{source.label} · <span className="text-[#f0d39a]">{source.status}</span></p><p className="mt-1 text-xs text-white/45">{source.detail}</p></div>)}</div></div>
          <div id="requests" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Requests / review state</h2><div className="mt-3 space-y-3">{requests.map((request) => <div key={request.id} className="rounded-xl border border-white/10 p-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${stateTone[request.state]}`}>{request.state.replace('_', ' ')}</span><p className="mt-2 text-sm">{request.title}</p><p className="text-xs text-white/45">{request.detail}</p></div>)}</div></div>
          <div id="saved" className="rounded-3xl border border-white/10 bg-[#07101f] p-5"><h2 className="text-lg font-semibold">Saved / watchlist</h2><p className="mt-2 text-xs text-white/45">Saved markets and listings use public-safe summaries.</p><div className="mt-3 space-y-2">{savedMarkets.map((market) => <Link key={market.slug} href={`/intelligence/country/${market.slug}`} className="block rounded-xl border border-white/10 p-3 text-sm hover:border-[#c6a55a]/30">{market.displayName} · {market.iso2}</Link>)}</div></div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#c6a55a]/15 bg-[#07101f] p-5">
          <h2 className="text-lg font-semibold">Recommended next actions</h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-2">
            {nextActions.map((action) => <li key={action} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">{action}</li>)}
          </ol>
        </section>
      </main>
    </div>
  )
}
