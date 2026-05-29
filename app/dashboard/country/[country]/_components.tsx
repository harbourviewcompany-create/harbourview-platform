import Link from 'next/link'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'
import { countries } from '@/lib/dashboard/countries'
import { serializeCommercialCountryDashboardPublicDto, serializeCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import {
  countryDashboardRoles,
  countryHeatmapLayers,
  getCommercialCountryDashboardRecord,
  type CountryDashboardRole,
  type CountryHeatmapLayer,
} from '@/lib/dashboard/commercialDashboard'
import { CountrySwitcher } from './CountrySwitcher'

const layerTone = (score: number) => {
  if (score >= 75) return 'bg-[#f4d27a] text-[#07111f] border-[#f4d27a]'
  if (score >= 55) return 'bg-[#c6a55a]/50 text-white border-[#c6a55a]/70'
  if (score >= 40) return 'bg-[#6bbfff]/20 text-[#bfe5ff] border-[#6bbfff]/35'
  return 'bg-white/10 text-white/65 border-white/15'
}

function roleHref(slug: string, role: CountryDashboardRole, layer: CountryHeatmapLayer) {
  return `/dashboard/country/${slug}?role=${role}&layer=${layer}`
}

function layerHref(slug: string, role: CountryDashboardRole, layer: CountryHeatmapLayer) {
  return `/dashboard/country/${slug}?role=${role}&layer=${layer}`
}

export function CountryDashboardShell({
  country,
  selectedRole = 'buyer',
  selectedLayer = 'marketplace_activity',
}: {
  country: CountryDashboardSummary
  selectedRole?: CountryDashboardRole
  selectedLayer?: CountryHeatmapLayer
  section?: unknown
  dashboardRole?: unknown
  roleLabel?: string
}) {
  const legacyDto = serializeCountryDashboardPublicDto(country)
  const record = serializeCommercialCountryDashboardPublicDto(getCommercialCountryDashboardRecord(country, selectedLayer))
  const roleView = record.roleViews[selectedRole]
  const regionCountries = countries.filter((item) => item.region === country.region).slice(0, 8)
  const layerMetric = record.selectedLayerMetric
  const commercialRole = !['doctor', 'pharmacist', 'general_research'].includes(selectedRole)
  const topCards = [
    { label: 'Marketplace Activity', value: record.marketplace.activityScore, body: record.marketplace.summary },
    { label: 'Trade Access', value: record.tradeAccess.accessScore, body: record.tradeAccess.summary },
    { label: 'Education Demand / Professional Readiness', value: record.education.demandScore, body: record.education.professionalReadiness },
    { label: 'Transaction Readiness', value: record.readiness.readinessScore, body: record.readiness.summary },
    { label: 'Movement', value: record.movement.movementScore, body: record.movement.summary },
  ]

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/">Globe</Link>
          <span>/</span>
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span className="text-[#f4d27a]">{record.displayName}</span>
        </nav>

        <section className="rounded-3xl border border-[#c6a55a]/25 bg-[linear-gradient(135deg,rgba(11,26,47,0.97),rgba(3,7,13,0.99))] p-4 shadow-2xl md:p-5" aria-label="Search and filters">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_2fr] lg:items-center">
            <div>
              <label htmlFor="country-search" className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Search country, category, corridor</label>
              <input id="country-search" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#c6a55a] focus:outline-none" placeholder="Brazil, consumables, import pathway, pharmacy education" />
            </div>
            <div className="flex flex-wrap gap-2">
              {countryDashboardRoles.map((role) => {
                const active = role.id === selectedRole
                return <Link key={role.id} href={roleHref(record.slug, role.id, selectedLayer)} className={`rounded-full border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${active ? 'border-[#f4d27a] bg-[#f4d27a] text-[#07111f]' : 'border-white/15 bg-white/[0.03] text-white/72 hover:border-[#c6a55a]/60'}`}>{role.label}</Link>
              })}
            </div>
          </div>
        </section>

        <header className="rounded-3xl border border-[#c6a55a]/25 bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,0.18),transparent_35%),linear-gradient(135deg,rgba(11,26,47,0.96),rgba(3,7,13,0.98))] p-5 shadow-2xl md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Commercial operating dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{record.displayName} · {roleView.label}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-white/75 md:text-base">{record.publicSummary}</p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#f4d27a]">{roleView.headline}: {roleView.emphasis.join(' · ')}.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/15 px-3 py-1">{record.iso2} / {record.iso3}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{legacyDto.region}</span>
                <span className="rounded-full border border-[#c6a55a]/35 bg-[#c6a55a]/10 px-3 py-1 text-[#f4d27a]">{layerMetric.badge} · {layerMetric.score}/100 {countryHeatmapLayers.find((layer) => layer.id === selectedLayer)?.label}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-72">
              <Link href={`/contact?intent=request-quote&country=${record.slug}`} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-center text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">Request quote</Link>
              <Link href={`/contact?intent=buyer-seller-match&country=${record.slug}`} className="rounded-xl border border-[#c6a55a]/35 px-4 py-3 text-center text-sm text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Request buyer/seller match</Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="Commercial KPI cards">
          {topCards.map((card) => <article key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#f4d27a]">{card.value}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/65">{card.body}</p>
          </article>)}
        </section>

        <div className="grid gap-5 xl:grid-cols-[300px_1fr_250px]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4" aria-label="Country index and heatmap score">
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="country-switcher">Country index</label>
            <CountrySwitcher currentSlug={record.slug} countries={countries.map((item) => ({ slug: item.slug, displayName: item.displayName, dashboardPath: item.dashboardPath }))} />
            <div className="mt-5 rounded-2xl border border-[#c6a55a]/20 bg-[#07111f]/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Selected layer score</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-semibold text-[#f4d27a]">{layerMetric.score}</span>
                <span className="pb-2 text-sm text-white/60">/100</span>
              </div>
              <p className="mt-2 text-sm text-white/70">{layerMetric.summary}</p>
            </div>
            <div className="mt-5 hidden xl:block">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/50">Region browse</p>
              <div className="grid gap-2">
                {regionCountries.map((item) => <Link key={item.slug} href={item.dashboardPath} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75 hover:border-[#c6a55a]/50 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{item.displayName}</Link>)}
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-3xl border border-[#c6a55a]/20 bg-[#07111f]/90 p-5" aria-label="Mini globe heatmap">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Mini globe heatmap</p>
                    <h2 className="mt-2 text-xl font-semibold">Navigation and comparison tool</h2>
                    <p className="mt-2 text-sm leading-6 text-white/65">The globe changes color by selected commercial layer; it supports navigation and comparison, not the primary product.</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/65">{layerMetric.tooltip}</span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-[190px_1fr] md:items-center">
                  <div className="relative mx-auto h-44 w-44 rounded-full border border-[#c6a55a]/40 bg-[radial-gradient(circle_at_30%_25%,rgba(244,210,122,0.8),rgba(198,165,90,0.22)_18%,rgba(11,26,47,0.95)_45%,rgba(3,7,13,1)_80%)] shadow-[0_0_60px_rgba(198,165,90,0.2)]" role="img" aria-label={`Mini globe colored by ${layerMetric.tooltip}`}>
                    {record.comparisonMetrics.slice(0, 6).map((metricItem, index) => <span key={metricItem.countrySlug} title={metricItem.tooltip} className={`absolute h-4 w-4 rounded-full border ${layerTone(metricItem.score)}`} style={{ left: `${24 + (index % 3) * 28}%`, top: `${22 + Math.floor(index / 3) * 32}%` }} />)}
                    <span className="absolute left-[55%] top-[54%] h-6 w-6 rounded-full border-2 border-[#f4d27a] bg-[#f4d27a] text-center text-[10px] font-bold leading-5 text-[#07111f]" title={layerMetric.tooltip}>{record.iso2}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {countryHeatmapLayers.map((layer) => <Link key={layer.id} href={layerHref(record.slug, selectedRole, layer.id)} className={`rounded-full border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${layer.id === selectedLayer ? 'border-[#f4d27a] bg-[#f4d27a] text-[#07111f]' : 'border-white/15 text-white/70 hover:border-[#c6a55a]/50'}`}>{layer.label}</Link>)}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="First-screen role content">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{roleView.firstScreenPillar} first</p>
                <h2 className="mt-2 text-2xl font-semibold">{commercialRole ? 'Marketplace and transaction workflows' : 'Professional education and readiness'}</h2>
                <div className="mt-4 grid gap-3">
                  {roleView.primaryCards.map((card) => <div key={card.title} className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">{card.pillar}</p>
                        <h3 className="mt-1 font-semibold text-white">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/68">{card.body}</p>
                      </div>
                      <Link href={card.href} className="shrink-0 rounded-xl border border-[#c6a55a]/35 px-3 py-2 text-center text-xs font-semibold text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{card.ctaLabel}</Link>
                    </div>
                  </div>)}
                </div>
              </article>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Marketplace cards">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Marketplace</p>
                <h2 className="mt-2 text-2xl font-semibold">Listings, wanted requests and quote flows</h2>
                <div className="mt-4 grid gap-3">
                  {record.marketplace.listingSummaries.map((listing) => <div key={listing.id} className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">{listing.category} · {listing.commercialStatus}</p>
                    <h3 className="mt-1 font-semibold">{listing.title}</h3>
                    <p className="mt-2 text-sm text-white/62">{listing.geography}</p>
                    <Link href={listing.href} className="mt-3 inline-flex rounded-xl bg-[#c6a55a] px-3 py-2 text-xs font-semibold text-[#07111f]">{listing.ctaLabel}</Link>
                  </div>)}
                  {record.marketplace.wantedRequests.map((wanted) => <div key={wanted.id} className="rounded-2xl border border-[#c6a55a]/20 bg-[#c6a55a]/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#f4d27a]">Wanted request · {wanted.category}</p>
                    <h3 className="mt-1 font-semibold">{wanted.title}</h3>
                    <Link href={wanted.href} className="mt-3 inline-flex rounded-xl border border-[#c6a55a]/35 px-3 py-2 text-xs font-semibold text-[#f4d27a]">{wanted.ctaLabel}</Link>
                  </div>)}
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Trade access education readiness movement">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Pillars</p>
                <h2 className="mt-2 text-2xl font-semibold">Trade Access · Education · Readiness · Movement</h2>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-white/70">
                  <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4"><strong className="text-white">Trade Access:</strong> {record.tradeAccess.routeFit}. {record.tradeAccess.rolePermissions.join(' · ')}.</div>
                  <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4"><strong className="text-white">Education:</strong> {record.education.summary}</div>
                  <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4"><strong className="text-white">Readiness:</strong> {record.readiness.gates.join(' · ')}.</div>
                  <div className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-4"><strong className="text-white">Movement:</strong> {record.movement.summary}</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {record.education.modules.map((module) => <div key={module.id} className="rounded-2xl border border-[#6bbfff]/20 bg-[#6bbfff]/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#bfe5ff]">{module.audience} education · {module.status}</p>
                    <h3 className="mt-1 font-semibold">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/68">{module.summary}</p>
                  </div>)}
                </div>
              </article>
            </div>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Comparison legend">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Comparison legend</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {record.comparisonMetrics.map((metricItem) => <Link key={metricItem.countrySlug} href={`/dashboard/country/${metricItem.countrySlug}?role=${selectedRole}&layer=${selectedLayer}`} className={`rounded-2xl border p-3 text-sm ${layerTone(metricItem.score)}`} title={metricItem.tooltip}>
                  <span className="block text-xs uppercase tracking-[0.16em] opacity-70">{metricItem.iso2}</span>
                  <span className="block font-semibold">{metricItem.countryName}</span>
                  <span className="block text-xs">{metricItem.score}/100 · {metricItem.badge}</span>
                </Link>)}
              </div>
            </article>
          </section>

          <aside className="rounded-3xl border border-[#c6a55a]/25 bg-[#07111f]/90 p-4" aria-label="Harbourview action rail">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Harbourview action rail</p>
            <div className="mt-4 grid gap-2">
              {record.reviewActions.map((action) => <Link key={action.id} href={action.href} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/82 hover:border-[#c6a55a]/50 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">
                <span className="block font-semibold text-[#f4d27a]">{action.label}</span>
                <span className="mt-1 block text-xs leading-5 text-white/55">{action.description}</span>
              </Link>)}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
