import Link from 'next/link'
import type { CountryDashboardRole, CountryDashboardSummary, CountryHeatmapLayer } from '@/lib/dashboard/contracts'
import { countries } from '@/lib/dashboard/countries'
import {
  countryDashboardRoleLabels,
  countryDashboardRoles,
  countryHeatmapLayerLabels,
  countryHeatmapLayers,
  serializeCountryCommercialDashboardPublicDto,
  normalizeCountryDashboardRole,
} from '@/lib/dashboard/commercial'
import { serializeCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import { CountrySwitcher } from './CountrySwitcher'

const pillarTones = {
  Marketplace: 'border-[#c6a55a]/40 bg-[#c6a55a]/10 text-[#f4d27a]',
  'Trade Access': 'border-[#77d8ff]/35 bg-[#77d8ff]/10 text-[#a7e8ff]',
  Education: 'border-[#9fd7ff]/35 bg-[#9fd7ff]/10 text-[#c7e8ff]',
  Readiness: 'border-[#7ef0b8]/35 bg-[#7ef0b8]/10 text-[#b7ffd8]',
  Movement: 'border-white/20 bg-white/[0.04] text-white/72',
} as const

function normalizeLayer(value?: string | null): CountryHeatmapLayer {
  return countryHeatmapLayers.includes(value as CountryHeatmapLayer) ? value as CountryHeatmapLayer : 'marketplace_activity'
}

function scoreTone(score: number) {
  if (score >= 80) return 'from-[#f4d27a] to-[#2de38f]'
  if (score >= 62) return 'from-[#c6a55a] to-[#77d8ff]'
  if (score >= 45) return 'from-[#7d6735] to-[#345d7a]'
  return 'from-[#3c4455] to-[#111827]'
}

export function CountryDashboardShell({
  country,
  dashboardRole = 'buyer',
  roleLabel,
  selectedLayer,
}: {
  country: CountryDashboardSummary
  section?: string
  dashboardRole?: CountryDashboardRole | string
  roleLabel?: string
  selectedLayer?: string
}) {
  const dto = serializeCountryDashboardPublicDto(country)
  const commercial = serializeCountryCommercialDashboardPublicDto(country)
  const role = normalizeCountryDashboardRole(dashboardRole)
  const roleView = commercial.roleViews[role]
  const currentRoleLabel = roleLabel ?? countryDashboardRoleLabels[role]
  const activeLayer = normalizeLayer(selectedLayer)
  const selectedMetric = commercial.heatmapMetrics.find((item) => item.countrySlug === dto.slug && item.layer === activeLayer) ?? commercial.heatmapMetrics[0]
  const comparisonMetrics = commercial.heatmapMetrics.filter((item) => item.layer === activeLayer).slice(0, 11)
  const regionCountries = countries.filter((item) => item.region === country.region).slice(0, 8)
  const commercialRole = !['doctor', 'pharmacist', 'general_research'].includes(role)

  const kpis = [
    { label: 'Marketplace Activity', score: commercial.marketplace.activityScore, body: commercial.marketplace.quoteFlowLabel },
    { label: 'Trade Access', score: commercial.tradeAccess.score, body: 'Buy, sell, import/export, distribute, supply, prescribe/dispense, invest or operate fit.' },
    { label: 'Education Demand / Professional Readiness', score: commercial.education.demandScore, body: 'Professional education for doctors, pharmacists, clinics, and prescribers.' },
    { label: 'Transaction Readiness', score: commercial.readiness.score, body: 'Licences, documents, testing, labelling, counterparty and compliance gates.' },
    { label: 'Movement', score: commercial.movement.score, body: 'Supporting policy, procurement, supply/demand, corridor, and distressed-asset context.' },
  ]

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/">Globe</Link>
          <span>/</span>
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/dashboard">Commercial dashboard</Link>
          <span>/</span>
          <span className="text-[#f4d27a]">{dto.displayName}</span>
        </nav>

        <section className="rounded-3xl border border-[#c6a55a]/25 bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,0.18),transparent_28%),linear-gradient(135deg,rgba(11,26,47,0.98),rgba(3,7,13,0.98))] p-5 shadow-2xl md:p-7">
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_320px]">
            <label className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Search country, category, role, corridor</span>
              <input className="w-full bg-transparent text-white outline-none placeholder:text-white/35" placeholder="Brazil consumables importer review" aria-label="Dashboard search" />
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70">Filter: Commercial role</span>
              <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-white/70">Filter: Review-gated</span>
            </div>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Role-aware commercial operating dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{dto.displayName}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72 md:text-base">Harbourview prioritizes marketplace and transaction workflows: listings, wanted requests, quote flow, reviewed counterparties, lawful trade access, professional education, readiness gates, and supporting movement.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.iso2} / {dto.iso3}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.region}</span>
                <span className="rounded-full border border-[#c6a55a]/35 bg-[#c6a55a]/10 px-3 py-1 text-[#f4d27a]">{currentRoleLabel}</span>
                <span className="rounded-full border border-[#c6a55a]/35 bg-[#c6a55a]/10 px-3 py-1 text-[#f4d27a]">{countryHeatmapLayerLabels[activeLayer]}: {selectedMetric.score}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-64">
              <Link href="/marketplace/quote" className="rounded-xl bg-[#c6a55a] px-4 py-3 text-center text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">Request quote</Link>
              <Link href="/marketplace/sell" className="rounded-xl border border-[#c6a55a]/40 px-4 py-3 text-center text-sm text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Submit listing</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[285px_1fr_230px]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4" aria-label="Country index and role navigation">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Country index</p>
            <div className="mt-3 rounded-2xl border border-[#c6a55a]/25 bg-[#07111f] p-4">
              <div className="text-4xl font-semibold text-[#f4d27a]">{selectedMetric.score}</div>
              <div className="mt-1 text-sm text-white/70">{selectedMetric.badge} · {countryHeatmapLayerLabels[activeLayer]}</div>
              <p className="mt-3 text-xs leading-5 text-white/55">{selectedMetric.tooltip}. The mini globe is a navigation and comparison tool, not the product.</p>
            </div>
            <label className="mt-5 block text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="country-switcher">Country switcher</label>
            <CountrySwitcher currentSlug={dto.slug} countries={countries.map((item) => ({ slug: item.slug, displayName: item.displayName, dashboardPath: item.dashboardPath }))} />
            <div className="mt-5 grid gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Role view</p>
              {countryDashboardRoles.map((item) => (
                <Link key={item} href={`${dto.dashboardPath}?role=${item}&layer=${activeLayer}`} className={`rounded-lg border px-3 py-2 text-sm ${item === role ? 'border-[#c6a55a]/60 bg-[#c6a55a]/10 text-[#f4d27a]' : 'border-white/10 text-white/70 hover:border-[#c6a55a]/40'}`}>{countryDashboardRoleLabels[item]}</Link>
              ))}
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              {kpis.map((kpi) => (
                <article key={kpi.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-2xl font-semibold text-[#f4d27a]">{kpi.score}</div>
                  <h2 className="mt-2 text-sm font-semibold">{kpi.label}</h2>
                  <p className="mt-2 text-xs leading-5 text-white/58">{kpi.body}</p>
                </article>
              ))}
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Mini globe heatmap and layer selector</p>
                  <h2 className="mt-2 text-2xl font-semibold">{countryHeatmapLayerLabels[activeLayer]}</h2>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {countryHeatmapLayers.map((layer) => (
                      <Link key={layer} href={`${dto.dashboardPath}?role=${role}&layer=${layer}`} className={`rounded-xl border px-3 py-2 text-xs ${layer === activeLayer ? 'border-[#c6a55a]/70 bg-[#c6a55a]/15 text-[#f4d27a]' : 'border-white/10 text-white/65 hover:border-[#c6a55a]/40'}`}>{countryHeatmapLayerLabels[layer]}</Link>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2">
                    {comparisonMetrics.map((item) => (
                      <div key={`${item.countrySlug}-${item.layer}`} className="grid grid-cols-[120px_1fr_48px] items-center gap-3 text-xs">
                        <span className="truncate text-white/70">{item.countryName}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-white/10"><span className={`block h-full rounded-full bg-gradient-to-r ${scoreTone(item.score)}`} style={{ width: `${item.score}%` }} /></span>
                        <span className="text-right text-[#f4d27a]">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative min-h-72 rounded-full border border-[#c6a55a]/25 bg-[radial-gradient(circle_at_35%_30%,rgba(244,210,122,0.32),transparent_12%),radial-gradient(circle_at_58%_52%,rgba(119,216,255,0.26),transparent_18%),radial-gradient(circle_at_50%_50%,#0b1a2f,#03070d_68%)] p-6 shadow-[inset_0_0_40px_rgba(198,165,90,0.13)]" aria-label="Mini globe heatmap">
                  <div className="absolute left-[24%] top-[32%] h-4 w-4 rounded-full bg-[#f4d27a] shadow-[0_0_18px_rgba(244,210,122,0.8)]" title={selectedMetric.tooltip} />
                  <div className="absolute right-[26%] top-[48%] h-3 w-3 rounded-full bg-[#77d8ff]" />
                  <div className="absolute bottom-[28%] left-[45%] h-3 w-3 rounded-full bg-[#7ef0b8]" />
                  <div className="flex h-full items-center justify-center text-center text-xs uppercase tracking-[0.2em] text-white/50">Comparison globe<br />navigation layer</div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#c6a55a]/20 bg-[#07111f]/86 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{currentRoleLabel} operating view</p>
              <h2 className="mt-2 text-2xl font-semibold">{roleView.summary}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {roleView.primaryCards.map((card) => (
                  <article key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${pillarTones[card.pillar]}`}>{card.pillar}</span>
                    <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{card.body}</p>
                    <Link href={card.href} className="mt-4 inline-flex rounded-xl border border-[#c6a55a]/35 px-3 py-2 text-sm text-[#f4d27a]">{card.ctaLabel}</Link>
                  </article>
                ))}
              </div>
            </section>

            {commercialRole ? (
              <section className="grid gap-4 md:grid-cols-2" aria-label="Marketplace first-screen cards">
                {commercial.marketplace.listings.map((listing) => (
                  <article key={listing.id} className="rounded-2xl border border-[#c6a55a]/20 bg-white/[0.035] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#c6a55a]">Marketplace</p>
                    <h3 className="mt-2 text-lg font-semibold">{listing.title}</h3>
                    <p className="mt-2 text-sm text-white/62">{listing.category} · {listing.locationLabel} · {listing.availabilityLabel}</p>
                    <Link href={listing.href} className="mt-4 inline-flex rounded-xl bg-[#c6a55a] px-3 py-2 text-sm font-semibold text-[#07111f]">{listing.ctaLabel}</Link>
                  </article>
                ))}
              </section>
            ) : (
              <section className="grid gap-4 md:grid-cols-3" aria-label="Professional education first-screen cards">
                {commercial.education.modules.map((module) => (
                  <article key={module.id} className="rounded-2xl border border-[#9fd7ff]/25 bg-white/[0.035] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9fd7ff]">Education · {module.audience}</p>
                    <h3 className="mt-2 text-lg font-semibold">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/62">{module.summary}</p>
                    <Link href={module.href} className="mt-4 inline-flex rounded-xl border border-[#9fd7ff]/35 px-3 py-2 text-sm text-[#c7e8ff]">Open module</Link>
                  </article>
                ))}
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-semibold">Trade Access</h3><p className="mt-2 text-sm leading-6 text-white/62">{commercial.tradeAccess.summary}</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-semibold">Education</h3><p className="mt-2 text-sm leading-6 text-white/62">{commercial.education.summary}</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-semibold">Readiness</h3><p className="mt-2 text-sm leading-6 text-white/62">{commercial.readiness.summary}</p></article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="font-semibold">Movement</h3><p className="mt-2 text-sm leading-6 text-white/62">{commercial.movement.summary}</p></article>
            </section>
          </section>

          <aside className="rounded-3xl border border-[#c6a55a]/20 bg-[#07111f]/84 p-4" aria-label="Harbourview action rail">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Harbourview action rail</p>
            <div className="mt-4 grid gap-2">
              {commercial.actions.map((action) => (
                <Link key={action.intent} href={action.href} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/78 hover:border-[#c6a55a]/45 hover:text-[#f4d27a]">{action.label}</Link>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 p-3 text-xs leading-5 text-white/55">
              <strong className="block text-white/75">{commercial.coverage.label}</strong>
              {commercial.quickFacts.reviewBoundaryLabel}. {commercial.coverage.publicSourcesLabel}.
            </div>
            <div className="mt-5 hidden lg:block">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/50">Region browse</p>
              <div className="grid gap-2">
                {regionCountries.map((item) => <Link key={item.slug} href={item.dashboardPath} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/65 hover:border-[#c6a55a]/50">{item.displayName}</Link>)}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
