import Link from 'next/link'
import { countries, dashboardSections, getDashboardSectionHref, resolveCountryRouteParam } from '@/lib/dashboard/countries'
import type { DashboardSection } from '@/lib/dashboard/contracts'

type CountryShellProps = {
  countryParam: string
  section?: Exclude<DashboardSection, 'overview'>
}

export function CountryShell({ countryParam, section }: CountryShellProps) {
  const country = resolveCountryRouteParam(countryParam)
  if (!country) return null

  const activePanel = section ? country.panels[section] : country.panels[country.defaultDashboardSection]

  return (
    <main className="min-h-screen bg-[#06101d] px-4 py-6 text-white md:px-8" aria-labelledby="dashboard-title">
      <nav aria-label="Dashboard breadcrumbs" className="mb-4 text-xs uppercase tracking-[0.2em] text-[#c6a55a]">
        <Link href="/dashboard" className="underline-offset-4 hover:underline">Dashboard</Link>
        <span aria-hidden="true"> / </span>
        <span>{country.displayName}</span>
        {section ? <><span aria-hidden="true"> / </span><span>{section}</span></> : null}
      </nav>

      <header className="mb-6 rounded-3xl border border-[#c6a55a]/30 bg-white/[0.04] p-5 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Selected country</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-semibold">{country.displayName}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{country.publicSummary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[#c6a55a]/40 px-3 py-1">{country.statusBadge.label}</span>
          <span className="rounded-full border border-white/15 px-3 py-1">{country.region} · {country.subregion}</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Updated {country.lastUpdated}</span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4" aria-label="Dashboard country navigation">
          <Link href="/" className="mb-4 block rounded-2xl border border-[#c6a55a]/40 px-4 py-3 text-center text-sm text-[#f2d58b]">Back to globe</Link>
          <label htmlFor="country-switcher" className="text-xs uppercase tracking-[0.2em] text-slate-400">Country switcher</label>
          <select id="country-switcher" className="mt-2 w-full rounded-xl bg-[#0c1828] p-3 text-sm" defaultValue={country.slug} aria-label="Switch dashboard country">
            {countries.slice(0, 40).map((candidate) => <option key={candidate.slug} value={candidate.slug}>{candidate.displayName}</option>)}
          </select>
          <div className="mt-5 flex flex-col gap-2" role="tablist" aria-label="Dashboard sections">
            {dashboardSections.map((item) => (
              <Link
                key={item}
                href={getDashboardSectionHref(country.slug, item)}
                className={`rounded-xl px-3 py-2 text-sm capitalize ${item === section ? 'bg-[#c6a55a] text-[#06101d]' : 'bg-white/[0.04] text-slate-200'}`}
              >
                {item}
              </Link>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Dashboard panel state">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{activePanel.statusLabel}</p>
          <h2 className="mt-2 text-2xl font-semibold">{activePanel.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">{activePanel.summary}</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">{activePanel.emptyState}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {activePanel.actions.map((action) => <Link key={`${action.label}-${action.href}`} href={action.href} className="rounded-full border border-[#c6a55a]/50 px-4 py-2 text-sm text-[#f2d58b]">{action.label}</Link>)}
          </div>
        </section>
      </div>
    </main>
  )
}
