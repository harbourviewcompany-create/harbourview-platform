import Link from 'next/link'
import type { CountryDashboardSummary, DashboardSectionSlug } from '@/lib/dashboard/contracts'
import { countries, dashboardSections, getDashboardSectionHref } from '@/lib/dashboard/countries'
import { serializeCountryDashboardPublicDto } from '@/lib/dashboard/publicDto'
import { CountrySwitcher } from './CountrySwitcher'

const sectionLabels: Record<DashboardSectionSlug, string> = {
  market: 'Market',
  education: 'Education',
  compliance: 'Compliance',
  signals: 'Signals',
  opportunities: 'Opportunities',
  intelligence: 'Intelligence',
  connections: 'Reviewed Connections',
}

export function CountryDashboardShell({ country, section = 'market' }: { country: CountryDashboardSummary; section?: DashboardSectionSlug }) {
  const dto = serializeCountryDashboardPublicDto(country)
  const selectedPanel = dto.panels[section]
  const regionCountries = countries.filter((item) => item.region === country.region).slice(0, 8)

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
              <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Selected country intelligence console</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{dto.displayName}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72 md:text-base">{dto.publicSummary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.iso2} / {dto.iso3}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.region}</span>
                <span className="rounded-full border border-white/15 px-3 py-1">{dto.subregion}</span>
                <span className="rounded-full border border-[#c6a55a]/35 bg-[#c6a55a]/10 px-3 py-1 text-[#f4d27a]">{dto.statusBadge.label}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-64">
              <Link href={`/contact?intent=dashboard-review&country=${dto.slug}`} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-center text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">Request Harbourview review</Link>
              <Link href="/" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Back to globe</Link>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4" aria-label="Dashboard country navigation">
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
            <nav aria-label="Dashboard section navigation" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
              {dashboardSections.map((item) => {
                const selected = item === section
                return <Link key={item} href={getDashboardSectionHref(dto.slug, item)} aria-current={selected ? 'page' : undefined} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${selected ? 'border-[#c6a55a] bg-[#c6a55a]/15 text-[#f4d27a]' : 'border-white/15 text-white/75 hover:border-[#c6a55a]/40'}`}>{sectionLabels[item]}</Link>
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
                {selectedPanel.actions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className="rounded-xl border border-[#c6a55a]/30 px-4 py-3 text-sm text-[#f4d27a] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">{action.label}</Link>)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
