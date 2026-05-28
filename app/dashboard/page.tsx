import Link from 'next/link'
import { DashboardCountryDirectory } from './DashboardCountryDirectory'
import { countries, fixtureCountries } from '@/lib/dashboard/countries'

export default function DashboardHomePage() {
  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#c6a55a]/25 bg-[linear-gradient(135deg,rgba(11,26,47,0.96),rgba(3,7,13,0.98))] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-[#c6a55a]">Harbourview country dashboard</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">Country-aware routing spine for market, education, compliance, signals, opportunities, intelligence, and reviewed connections.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70 md:text-base">Use the directory as the non-WebGL fallback path. Globe selections and direct links resolve to the same canonical dashboard route contract.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">Return to globe</Link>
            <Link href={fixtureCountries[0]?.dashboardPath ?? '/dashboard/country/germany'} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-sm font-semibold text-[#07111f] focus:outline-none focus:ring-2 focus:ring-white">Open sample country</Link>
          </div>
        </section>
        <DashboardCountryDirectory countries={countries} heading="Fallback country directory" />
      </div>
    </main>
  )
}
