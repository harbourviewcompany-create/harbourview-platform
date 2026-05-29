import Link from 'next/link'
import type { CountryDashboardSummary, DashboardSectionSlug } from '@/lib/dashboard/contracts'
import {
  countryDashboardRoles,
  countryHeatmapLayers,
  getComparisonHeatmapMetrics,
  getCountryDashboardRecord,
  getCountryDashboardRoleLabel,
  getMetricForLayer,
  type CountryDashboardRole,
  type CountryHeatmapLayer,
} from '@/lib/dashboard/commercial'
import { countries, dashboardSections, getDashboardSectionHref } from '@/lib/dashboard/countries'
import { serializeCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import { CountrySwitcher } from './CountrySwitcher'
import type { DashboardRole } from '@/lib/dashboard/globeRouteContext'

const sectionLabels: Record<DashboardSectionSlug, string> = {
  market: 'Market',
  education: 'Education',
  compliance: 'Compliance',
  signals: 'Signals',
  opportunities: 'Opportunities',
  intelligence: 'Intelligence',
  connections: 'Reviewed Connections',
}

// Sections surfaced first for each role — shown highlighted in the nav.
const rolePrioritySections: Record<DashboardRole, DashboardSectionSlug[]> = {
  medical_professional: ['education', 'compliance', 'market'],
  regulatory_legal: ['compliance', 'intelligence', 'signals'],
  commercial_operator: ['market', 'opportunities', 'signals'],
}

const roleAccentColor: Record<DashboardRole, string> = {
  medical_professional: 'text-[#6bbfff] border-[#6bbfff]/30 bg-[#6bbfff]/10',
  regulatory_legal: 'text-[#b8a5ff] border-[#b8a5ff]/30 bg-[#b8a5ff]/10',
  commercial_operator: 'text-[#f4d27a] border-[#c6a55a]/35 bg-[#c6a55a]/10',
}

export function CountryDashboardShell({
  country,
  section = 'market',
  dashboardRole = 'commercial_operator',
  roleLabel = 'Commercial Operator',
  commercialRole = 'buyer',
  selectedLayer = 'Marketplace Activity',
}: {
  country: CountryDashboardSummary
  section?: DashboardSectionSlug
  dashboardRole?: DashboardRole
  roleLabel?: string
  commercialRole?: CountryDashboardRole
  selectedLayer?: CountryHeatmapLayer
}) {
  const dto = serializeCountryDashboardPublicDto(country)
  const commercialRecord = getCountryDashboardRecord(country)
  const roleView = commercialRecord.roleViews[commercialRole]
  const selectedMetric = getMetricForLayer(commercialRecord, selectedLayer)
  const comparisonMetrics = getComparisonHeatmapMetrics().filter((item) => item.layer === selectedLayer)
  const selectedPanel = dto.panels[section]
  const regionCountries = countries.filter((item) => item.region === country.region).slice(0, 8)
  const prioritySections = rolePrioritySections[dashboardRole]

  // Sort section tabs so role-priority sections appear first.
  const sortedSections = [...dashboardSections].sort((a, b) => {
    const ai = prioritySections.indexOf(a)
    const bi = prioritySections.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return 0
  })

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/">Globe</Link>
          <span>/</span>
          <Link className="rounded focus:outline-none focus:ring-2 focus:ring-[#c6a55a]" href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span className="text-[#f4d27a]">{dto.displayName}</span>
        </nav>

        <header className="rounded-3xl border border-[#c6a55a]/25 bg-[linear-gradient(135deg,rgba(11,26,47,0.96),rgba(3,7,13,0.98))] p-5 shadow-2xl md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Role-aware commercial operating dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{dto.displayName}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72 md:text-base">{roleView.headline}. {roleView.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.iso2} / {dto.iso3}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.region}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.subregion}</span>
                <span className="rounded-full border border-[#c6a55a]/35 bg-[#c6a55a]/10 px-3 py-1 text-[#f4d27a]">{dto.statusBadge.label}</span>
                {/* Role identity badge — set by the globe router when navigating from a role selection */}
                <span className={`rounded-full border px-3 py-1 font-semibold ${roleAccentColor[dashboardRole]}`}>
                  {getCountryDashboardRoleLabel(commercialRole)} · {roleLabel}
                </span>
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-64">
              <Link href={'/marketplace/quote?country=' + dto.slug} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-center text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">Request quote</Link>
              <Link href={'/marketplace/sell?country=' + dto.slug} className="rounded-xl border border-[#c6a55a]/35 px-4 py-3 text-center text-sm font-semibold text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-white">Submit listing</Link>
              <Link href="/" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Back to globe</Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto_auto]" aria-label="Country dashboard search and filters">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="dashboard-search">Search marketplace, routes, education, readiness</label>
            <input id="dashboard-search" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#c6a55a] focus:outline-none" placeholder="Search quote lanes, listings, countries, documents, education modules" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="role-filter">Role</label>
            <select id="role-filter" defaultValue={commercialRole} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white focus:border-[#c6a55a] focus:outline-none">
              {countryDashboardRoles.map((role) => <option key={role} value={role}>{getCountryDashboardRoleLabel(role)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="layer-filter">Heatmap layer</label>
            <select id="layer-filter" defaultValue={selectedLayer} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-white focus:border-[#c6a55a] focus:outline-none">
              {countryHeatmapLayers.map((layer) => <option key={layer} value={layer}>{layer}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5" aria-label="Commercial KPI cards">
          {[
            ['Marketplace Activity', commercialRecord.marketplace.activityScore, commercialRecord.marketplace.commercialSummary],
            ['Trade Access', commercialRecord.tradeAccess.accessScore, commercialRecord.tradeAccess.routeFit],
            ['Education Demand / Professional Readiness', commercialRecord.education.demandScore, commercialRecord.education.summary],
            ['Transaction Readiness', commercialRecord.readiness.readinessScore, commercialRecord.readiness.summary],
            ['Movement', commercialRecord.movement.movementScore, commercialRecord.movement.summary],
          ].map(([label, score, summary]) => (
            <article key={String(label)} className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">{String(label)}</p>
              <p className="mt-3 text-3xl font-semibold text-[#f4d27a]">{String(score)}</p>
              <p className="mt-2 line-clamp-4 text-xs leading-5 text-white/60">{String(summary)}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr_230px]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4" aria-label="Country index and navigation">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Selected {selectedLayer} score</p>
            <div className="my-4 rounded-2xl border border-[#c6a55a]/25 bg-[#c6a55a]/10 p-4">
              <p className="text-4xl font-semibold text-[#f4d27a]">{selectedMetric.score}</p>
              <p className="mt-1 text-sm text-white/75">{selectedMetric.badge} · {selectedMetric.layer}</p>
              <p className="mt-3 text-xs leading-5 text-white/60">{selectedMetric.summary}</p>
            </div>
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="country-switcher">Country switcher</label>
            <CountrySwitcher currentSlug={dto.slug} countries={countries.map((item) => ({ slug: item.slug, displayName: item.displayName, dashboardPath: item.dashboardPath }))} />
            <div className="mt-5 hidden lg:block">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/50">Region browse</p>
              <div className="grid gap-2">
                {regionCountries.map((item) => <Link key={item.slug} href={item.dashboardPath} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75 hover:border-[#c6a55a]/50 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{item.displayName}</Link>)}
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
              <MiniCommercialGlobe metric={selectedMetric} comparisonMetrics={comparisonMetrics} />
              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#c6a55a]/20 bg-[#07111f]/80 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{roleView.label} first-screen workflow</p>
                  <h2 className="mt-2 text-2xl font-semibold">{roleView.headline}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/70">{roleView.summary}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {roleView.primaryCards.map((card) => (
                    <article key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#f4d27a]">{card.eyebrow}</p>
                      <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/68">{card.body}</p>
                      <Link href={card.href} className="mt-4 inline-flex rounded-xl border border-[#c6a55a]/35 px-4 py-2 text-sm font-semibold text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{card.ctaLabel}</Link>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <CommercialPanel title="Marketplace" body={commercialRecord.marketplace.commercialSummary} items={[commercialRecord.marketplace.quoteFlowLabel, commercialRecord.marketplace.reviewedCounterpartyLabel, ...commercialRecord.marketplace.listings.map((listing) => `${listing.title}: ${listing.availabilityLabel}`)]} />
              <CommercialPanel title="Trade Access" body={commercialRecord.tradeAccess.roleRelevance} items={[commercialRecord.tradeAccess.routeFit, commercialRecord.tradeAccess.corridorSummary, ...commercialRecord.tradeAccess.pathways]} />
              <CommercialPanel title="Readiness" body={commercialRecord.readiness.summary} items={commercialRecord.readiness.gates} />
              <CommercialPanel title="Education" body={commercialRecord.education.summary} items={commercialRecord.education.modules.map((module) => module.title)} />
              <CommercialPanel title="Movement" body={commercialRecord.movement.summary} items={commercialRecord.movement.updates} />
              <CommercialPanel title="Public boundary" body={commercialRecord.coverage.publicBoundary} items={[commercialRecord.quickFacts.reviewBoundary, commercialRecord.coverage.summary]} />
            </div>

            <nav aria-label="Dashboard section navigation" className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-3">
              {sortedSections.map((item) => {
                const selected = item === section
                const isPriority = prioritySections.includes(item)
                return (
                  <Link
                    key={item}
                    href={getDashboardSectionHref(dto.slug, item)}
                    aria-current={selected ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${
                      selected
                        ? 'border-[#c6a55a] bg-[#c6a55a]/15 text-[#f4d27a]'
                        : isPriority
                          ? 'border-white/25 text-white/90 hover:border-[#c6a55a]/40'
                          : 'border-white/15 text-white/75 hover:border-[#c6a55a]/40'
                    }`}
                  >
                    {sectionLabels[item]}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-4 rounded-2xl border border-[#c6a55a]/15 bg-[#07111f]/80 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{selectedPanel.stateCopy.label}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{sectionLabels[section]}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">{selectedPanel.publicSummary}</p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/70">{selectedPanel.state}</span>
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/70">
                {selectedPanel.stateCopy.emptyState}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {selectedPanel.actions.map((action) => <Link key={action.href + '-' + action.label} href={action.href} className="rounded-xl border border-[#c6a55a]/30 px-4 py-3 text-sm text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{action.label}</Link>)}
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-[#c6a55a]/20 bg-[#07111f]/85 p-4" aria-label="Harbourview action rail">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Harbourview action rail</p>
            <div className="mt-4 grid gap-2">
              {commercialRecord.reviewActions.map((item) => (
                <Link key={item.id} href={item.href} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/82 hover:border-[#c6a55a]/45 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{item.label}</Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function CommercialPanel({ title, body, items }: { title: string; body: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#07111f]/70 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/68">
        {items.slice(0, 5).map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6a55a]" />{item}</li>)}
      </ul>
    </article>
  )
}

function MiniCommercialGlobe({ metric, comparisonMetrics }: { metric: ReturnType<typeof getMetricForLayer>; comparisonMetrics: ReturnType<typeof getComparisonHeatmapMetrics> }) {
  const topComparisons = [...comparisonMetrics].sort((a, b) => b.score - a.score).slice(0, 6)
  return (
    <article className="rounded-3xl border border-[#c6a55a]/20 bg-[radial-gradient(circle_at_50%_35%,rgba(198,165,90,0.22),rgba(7,17,31,0.94)_46%,rgba(3,7,13,0.98)_72%)] p-5" aria-label="Mini globe heatmap navigation">
      <div className="mx-auto grid h-52 w-52 place-items-center rounded-full border border-[#c6a55a]/30 bg-[radial-gradient(circle_at_35%_30%,rgba(244,210,122,0.42),rgba(21,62,98,0.65)_28%,rgba(3,7,13,0.9)_68%)] shadow-2xl">
        <div className="h-32 w-32 rounded-full border border-white/10 bg-[conic-gradient(from_45deg,rgba(198,165,90,0.68),rgba(23,86,122,0.34),rgba(198,165,90,0.16),rgba(23,86,122,0.48),rgba(198,165,90,0.68))]" title={metric.tooltip} />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#c6a55a]">Mini globe layer</p>
      <h3 className="mt-2 text-xl font-semibold">{metric.layer}</h3>
      <p className="mt-2 text-sm leading-6 text-white/68">{metric.tooltip}. {metric.summary}</p>
      <div className="mt-4 space-y-2">
        {topComparisons.map((item) => (
          <div key={item.countrySlug} className="grid grid-cols-[88px_1fr_36px] items-center gap-2 text-xs text-white/70">
            <span>{item.countryName}</span>
            <span className="h-2 rounded-full bg-white/10"><span className="block h-2 rounded-full bg-[#c6a55a]" style={{ width: `${item.score}%` }} /></span>
            <span className="text-right text-[#f4d27a]">{item.score}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

