import Link from 'next/link'
import { DashboardCountryDirectory } from '../../DashboardCountryDirectory'
import { countries } from '@/lib/dashboard/countries'

export default function DashboardCountryNotFound() {
  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-red-400/25 bg-red-950/20 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-red-200">Country route not found</p>
          <h1 className="mt-3 text-3xl font-semibold">Choose a supported dashboard country</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">The requested country route did not resolve to a canonical Harbourview country record. Search the directory, browse by region, or return to the globe.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl border border-white/15 px-4 py-3 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Return to globe</Link>
        </section>
        <DashboardCountryDirectory countries={countries} heading="Find another country" />
      </div>
    </main>
  )
}
