'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useDashboard, type DashboardRole } from '@/lib/dashboard/DashboardContext'
import { getDashboardRoleLabel } from '@/lib/dashboard/dashboardShared'

interface DashboardCountryOption {
  iso2: string
  slug: string
  displayName: string
  region: string
  dashboardStatus: string
  publicSummary: string
  dashboardPath: string
}

interface Props {
  countries: DashboardCountryOption[]
  hasServerPreferences?: boolean
}

type MarketplaceTab = 'featured' | 'equipment' | 'supply' | 'requests' | 'saved'
type NotificationItem = { id: string; title: string; detail: string; unread: boolean }

const marketplaceTabs: { id: MarketplaceTab; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'supply', label: 'Supply' },
  { id: 'requests', label: 'Requests' },
  { id: 'saved', label: 'Saved' },
]

const roleEducation: Record<DashboardRole, string[]> = {
  commercial_operator: ['Import readiness checklist', 'Counterparty screening basics', 'Marketplace listing quality'],
  medical_professional: ['Clinical access pathways', 'Pharmacy and prescribing guardrails', 'Patient education review'],
  regulatory_legal: ['GMP and QA documentation', 'Customs and licensing evidence', 'Source review methodology'],
}

const roleOptions: DashboardRole[] = ['commercial_operator', 'medical_professional', 'regulatory_legal']

function statusLabel(status: string) {
  return status.replace(/-/g, ' ')
}

function buildListings(countryName: string | undefined, activeTab: MarketplaceTab, savedListingIds: Set<string>) {
  const market = countryName ?? 'Selected market'
  const listings = [
    { id: 'gmp-equipment', tab: 'equipment', title: `${market} GMP equipment lot`, meta: 'Verified seller · fixture fallback', href: '/marketplace/listings' },
    { id: 'qualified-supply', tab: 'supply', title: `${market} qualified supply screen`, meta: 'Request-reviewed suppliers', href: '/marketplace' },
    { id: 'qa-request', tab: 'requests', title: `${market} lab QA document request`, meta: 'Review state: needs evidence', href: '/marketplace/quote' },
    { id: 'intro-packet', tab: 'featured', title: `${market} introduction packet`, meta: 'Recommended for current role', href: '/contact' },
  ]

  if (activeTab === 'saved') return listings.filter((listing) => savedListingIds.has(listing.id))
  if (activeTab === 'featured') return listings
  return listings.filter((listing) => listing.tab === activeTab)
}

export default function HarbourviewDashboard({ countries, hasServerPreferences = false }: Props) {
  const { countryIso2, countryName, role, routeContext, setCountry, setRole } = useDashboard()
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('featured')
  const [savedMarkets, setSavedMarkets] = useState<string[]>([])
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set(['intro-packet']))
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'source-health', title: 'Source health changed', detail: 'Two public sources require review before deeper routing.', unread: true },
    { id: 'request-state', title: 'Request review pending', detail: 'Your selected market has one request in review state.', unread: true },
    { id: 'education-refresh', title: 'Education Hub refreshed', detail: 'Role-specific modules update when your role changes.', unread: false },
  ])
  const [panelOpen, setPanelOpen] = useState(false)
  const [hydratedFromStorage, setHydratedFromStorage] = useState(false)

  const selectedCountry = useMemo(
    () => countries.find((country) => country.iso2 === countryIso2),
    [countries, countryIso2],
  )
  const visibleListings = useMemo(
    () => buildListings(countryName, activeTab, savedListingIds),
    [activeTab, countryName, savedListingIds],
  )
  const unreadCount = notifications.filter((notification) => notification.unread).length
  const educationModules = roleEducation[role]

  useEffect(() => {
    if (routeContext?.source || hasServerPreferences) return
    const stored = window.localStorage.getItem('harbourview.dashboard.context')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as { countryIso2?: string; countryName?: string; role?: DashboardRole; savedMarkets?: string[] }
      if (parsed.countryIso2 && parsed.countryName && !countryIso2) setCountry(parsed.countryIso2, parsed.countryName)
      if (parsed.role) setRole(parsed.role)
      if (Array.isArray(parsed.savedMarkets)) setSavedMarkets(parsed.savedMarkets)
      setHydratedFromStorage(true)
    } catch {
      window.localStorage.removeItem('harbourview.dashboard.context')
    }
  }, [countryIso2, hasServerPreferences, routeContext?.source, setCountry, setRole])

  useEffect(() => {
    window.localStorage.setItem('harbourview.dashboard.context', JSON.stringify({ countryIso2, countryName, role, savedMarkets }))
  }, [countryIso2, countryName, role, savedMarkets])

  function toggleSavedListing(id: string) {
    setSavedListingIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSavedMarket(iso2?: string) {
    if (!iso2) return
    setSavedMarkets((current) => current.includes(iso2) ? current.filter((item) => item !== iso2) : [...current, iso2])
  }

  function markNotificationsRead() {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })))
  }

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <header className="sticky top-0 z-40 border-b border-[#c6a55a]/15 bg-[#03070d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="font-serif text-sm uppercase tracking-[0.24em] text-[#f0d39a]">Harbourview</Link>
          <nav className="hidden items-center gap-4 text-xs text-white/60 md:flex" aria-label="Dashboard product areas">
            <Link href="/dashboard#marketplace" className="hover:text-[#f0d39a]">Marketplace</Link>
            <Link href="/dashboard#intelligence" className="hover:text-[#f0d39a]">Intelligence</Link>
            <Link href="/dashboard#education" className="hover:text-[#f0d39a]">Education</Link>
            <Link href="/dashboard#requests" className="hover:text-[#f0d39a]">Requests</Link>
          </nav>
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="relative rounded-full border border-[#c6a55a]/25 px-3 py-1 text-xs text-[#f0d39a]"
          >
            Notifications
            {unreadCount > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#c6a55a]/15 bg-[#07101d] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#c6a55a]/70">Role / country context</p>
            <h1 className="mt-3 text-2xl font-semibold">User control center</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Globe routing lands here first. Country pages remain secondary Country Intelligence drill-downs.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65">
              <div className="flex justify-between gap-3"><span>Country</span><strong className="text-white">{countryName ?? 'Not selected'}</strong></div>
              <div className="mt-2 flex justify-between gap-3"><span>ISO2</span><strong className="font-mono text-white">{countryIso2 ?? '—'}</strong></div>
              <div className="mt-2 flex justify-between gap-3"><span>Role</span><strong className="text-white">{getDashboardRoleLabel(role)}</strong></div>
              {routeContext?.source && <div className="mt-2 text-[#f0d39a]">source={routeContext.source} · mode={routeContext.mode}</div>}
              {hydratedFromStorage && <div className="mt-2 text-white/40">Local preference fallback restored because no URL context or server preferences were present.</div>}
            </div>
            <label className="mt-4 block text-xs text-white/50" htmlFor="country-select">Country</label>
            <select
              id="country-select"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1726] px-3 py-2 text-sm text-white"
              value={countryIso2 ?? ''}
              onChange={(event) => {
                const country = countries.find((item) => item.iso2 === event.target.value)
                if (country) setCountry(country.iso2, country.displayName)
              }}
            >
              <option value="">Choose a market</option>
              {countries.map((country) => <option key={country.iso2} value={country.iso2}>{country.displayName}</option>)}
            </select>
            <label className="mt-3 block text-xs text-white/50" htmlFor="role-select">Role</label>
            <select
              id="role-select"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1726] px-3 py-2 text-sm text-white"
              value={role}
              onChange={(event) => setRole(event.target.value as DashboardRole)}
            >
              {roleOptions.map((option) => <option key={option} value={option}>{getDashboardRoleLabel(option)}</option>)}
            </select>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#07101d] p-4">
            <h2 className="text-sm font-semibold text-[#f0d39a]">Saved / Watchlist</h2>
            <button type="button" onClick={() => toggleSavedMarket(countryIso2)} className="mt-3 w-full rounded-lg border border-[#c6a55a]/30 px-3 py-2 text-xs text-[#f0d39a]">
              {countryIso2 && savedMarkets.includes(countryIso2) ? 'Remove selected market' : 'Save selected market'}
            </button>
            <div className="mt-3 space-y-2 text-xs text-white/55">
              {savedMarkets.length === 0 ? <p>No saved markets yet.</p> : savedMarkets.map((iso2) => <p key={iso2}>{iso2}</p>)}
              <p>{savedListingIds.size} saved listing{savedListingIds.size === 1 ? '' : 's'}</p>
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          <section className="rounded-3xl border border-[#c6a55a]/20 bg-gradient-to-br from-[#0b1a2f] to-[#050b14] p-5 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a55a]/70">Primary dashboard</p>
                <h2 className="mt-2 text-3xl font-semibold">Operate from one control center.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Marketplace, Intelligence, Education, Signals, Sources, Requests, Saved items, preferences, notifications, and recommended next actions are represented here with public-safe live data where available.
                </p>
              </div>
              <Link href={selectedCountry?.dashboardPath ?? '/intelligence/country'} className="rounded-full border border-[#c6a55a]/30 px-4 py-2 text-sm text-[#f0d39a]">
                Open Country Intelligence drill-down
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3" id="intelligence">
            <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4">
              <h3 className="text-sm font-semibold text-[#f0d39a]">Intelligence</h3>
              <p className="mt-2 text-sm text-white/60">{selectedCountry?.publicSummary ?? 'Choose a country to load dashboard-safe intelligence context.'}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/35">{selectedCountry ? statusLabel(selectedCountry.dashboardStatus) : 'No market selected'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4" id="signals">
              <h3 className="text-sm font-semibold text-[#f0d39a]">Signals</h3>
              <ul className="mt-2 space-y-2 text-sm text-white/60">
                <li>Regulatory signal watch: public-safe fixture fallback</li>
                <li>Marketplace demand: live route available where published</li>
                <li>Documentation burden: role-filtered recommendations</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4">
              <h3 className="text-sm font-semibold text-[#f0d39a]">Sources / source health</h3>
              <p className="mt-2 text-sm text-white/60">Public-safe source health is shown without exposing private operator notes.</p>
              <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Fixture fallback clearly labeled until reviewed source records are published.</div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#07101d] p-4" id="marketplace">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#f0d39a]">Marketplace</h3>
                <p className="text-sm text-white/55">Tabs directly filter listings.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {marketplaceTabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-full border px-3 py-1 text-xs ${activeTab === tab.id ? 'border-[#c6a55a] bg-[#c6a55a]/15 text-[#f0d39a]' : 'border-white/10 text-white/55'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleListings.length === 0 ? <p className="text-sm text-white/50">No listings match this tab.</p> : visibleListings.map((listing) => (
                <article key={listing.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <h4 className="font-medium text-white">{listing.title}</h4>
                  <p className="mt-1 text-sm text-white/50">{listing.meta}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={listing.href} className="text-xs text-[#f0d39a]">Open</Link>
                    <button type="button" onClick={() => toggleSavedListing(listing.id)} className="text-xs text-white/55">{savedListingIds.has(listing.id) ? 'Saved' : 'Save'}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4" id="education">
              <h3 className="text-lg font-semibold text-[#f0d39a]">Education Hub</h3>
              <p className="mt-1 text-sm text-white/55">Refreshes immediately when role changes.</p>
              <div className="mt-4 grid gap-2">
                {educationModules.map((module) => <Link key={module} href="/education" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70">{module}</Link>)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4" id="requests">
              <h3 className="text-lg font-semibold text-[#f0d39a]">Requests / review state</h3>
              <div className="mt-4 space-y-2 text-sm text-white/60">
                <p>Intro request: review-ready</p>
                <p>Listing request: evidence needed</p>
                <p>Source review: public-safe pending</p>
              </div>
              <Link href="/contact" className="mt-4 inline-block text-sm text-[#f0d39a]">Request Harbourview review</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c6a55a]/20 bg-[#07101d] p-4">
            <h3 className="text-lg font-semibold text-[#f0d39a]">Recommended next actions</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link href="/marketplace" className="rounded-xl border border-white/10 p-3 text-sm text-white/70">Review marketplace matches</Link>
              <Link href="/education" className="rounded-xl border border-white/10 p-3 text-sm text-white/70">Complete role education</Link>
              <Link href="/contact" className="rounded-xl border border-white/10 p-3 text-sm text-white/70">Submit request for review</Link>
            </div>
          </section>
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setPanelOpen(false)}>
          <aside className="ml-auto h-full w-full max-w-sm border-l border-[#c6a55a]/20 bg-[#07101d] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#f0d39a]">Notifications</h2>
              <button type="button" onClick={markNotificationsRead} className="text-xs text-white/55">Mark read</button>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <article key={notification.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                    {notification.unread && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Unread</span>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/55">{notification.detail}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
