import Link from 'next/link'
import { notFound } from 'next/navigation'
import { dashboardSections, resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

export default async function CountryIntelligenceDrilldownPage({ params }: { params: Promise<{ country: string }> | { country: string } }) {
  const { country: countryParam } = await params
  const country = resolveCountryRouteParam(countryParam)
  if (!country) notFound()
  const badge = getDashboardStatusBadge(country.dashboardStatus)

  return (
    <main className="min-h-screen bg-[#03070d] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-xs uppercase tracking-[0.2em] text-[#c6a55a] hover:underline">← Dashboard control center</Link>
        <section className="mt-6 rounded-3xl border border-[#c6a55a]/20 bg-[#07101f] p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c6a55a]/70">Country Intelligence drill-down</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{country.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">{country.publicSummary}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{country.iso2} · {country.region}</span>
            <span className="rounded-full border border-[#c6a55a]/20 bg-[#c6a55a]/10 px-3 py-1 text-[#f0d39a]">{badge.label}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Secondary drill-down, not the dashboard</span>
          </div>
        </section>
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {dashboardSections.map((section) => {
            const panel = country.panels[section]
            return (
              <article key={section} className="rounded-2xl border border-white/10 bg-[#07101f] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a55a]/60">{section}</p>
                <h2 className="mt-2 text-sm font-semibold">{panel.stateCopy.label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/50">{panel.publicSummary}</p>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
