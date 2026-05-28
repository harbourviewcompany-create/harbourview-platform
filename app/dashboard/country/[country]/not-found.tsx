import Link from 'next/link'
import { countries } from '@/lib/dashboard/countries'

const regions = Array.from(new Set(countries.map((country) => country.region))).sort()

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#06101d] px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-5xl rounded-3xl border border-[#c6a55a]/30 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Country route not found</p>
        <h1 className="mt-3 text-3xl font-semibold">We could not resolve that country dashboard.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          Browse the dashboard-safe country directory, search for a canonical country record, or return to the globe and choose a highlighted country.
        </p>
        <label htmlFor="country-not-found-search" className="mt-6 block text-sm font-medium text-slate-200">Search countries</label>
        <input id="country-not-found-search" aria-label="Country search" className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-white" placeholder="Search country, ISO code, or alias" />
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Browse by region">
          {regions.map((region) => <Link key={region} href={`/dashboard#region-${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="rounded-full border border-[#c6a55a]/40 px-3 py-2 text-sm text-[#f2d58b]">{region}</Link>)}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.slice(0, 12).map((country) => <Link key={country.slug} href={`/dashboard/country/${country.slug}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm hover:border-[#c6a55a]">{country.displayName}<span className="mt-1 block text-xs text-slate-400">{country.statusBadge.label}</span></Link>)}
        </div>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#c6a55a] px-5 font-semibold text-[#06101d]">Return to globe</Link>
      </section>
    </main>
  )
}
