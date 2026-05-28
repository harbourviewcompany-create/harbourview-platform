import Link from 'next/link'
import { countries, getDashboardCountryHref } from '@/lib/dashboard/countries'

const regions = Array.from(new Set(countries.map((country) => country.region))).sort()

export default function DashboardHomePage() {
  return (
    <main className="min-h-screen bg-[#06101d] px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Non-WebGL fallback</p>
        <h1 className="mt-3 text-4xl font-semibold">Country Dashboard Directory</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">
          Searchable, region-browsable country routing for users who prefer list mode, use reduced motion, or cannot load the interactive globe.
        </p>
        <label htmlFor="country-directory-search" className="mt-6 block text-sm font-medium text-slate-200">Search country directory</label>
        <input id="country-directory-search" aria-label="Search country directory" className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-white" placeholder="Search by country, ISO, or region" />
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Region filters">
          {regions.map((region) => <a key={region} href={`#region-${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="rounded-full border border-[#c6a55a]/40 px-3 py-2 text-sm text-[#f2d58b]">{region}</a>)}
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Country status cards">
        {countries.map((country) => (
          <article key={country.slug} id={`region-${country.region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6a55a]">{country.region}</p>
            <h2 className="mt-2 text-xl font-semibold">{country.displayName}</h2>
            <p className="mt-2 text-sm text-slate-300">{country.statusBadge.label} · {country.subregion}</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{country.publicSummary}</p>
            <Link href={getDashboardCountryHref(country.slug)} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#c6a55a] px-4 text-sm font-semibold text-[#06101d]">
              View Country Dashboard
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}
