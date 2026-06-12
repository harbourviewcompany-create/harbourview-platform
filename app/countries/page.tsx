import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicCountryProfiles } from '@/lib/country-data/server'

export const metadata: Metadata = {
  title: 'Country Coverage | Harbourview',
  description: 'Identity-only Harbourview country and territory coverage. Regulated-market details remain review-gated.',
}

export default async function CountriesIndexPage() {
  const countries = await listPublicCountryProfiles()
  const regions = new Map<string, typeof countries>()

  for (const country of countries) {
    const key = country.public_region ?? 'M49 cleanup'
    regions.set(key, [...(regions.get(key) ?? []), country])
  }

  return (
    <main className="min-h-screen bg-[#05070c] px-5 py-12 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#c6a55a]">Harbourview country coverage</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold md:text-6xl">Identity-only country and area profiles</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
          This surface lists canonical country and area records initialized from global reference identifiers. Regulatory, import/export,
          licensing, and market-access details remain review-pending until primary-source evidence is captured and approved.
        </p>

        <div className="mt-10 grid gap-5">
          {[...regions.entries()].map(([region, records]) => (
            <section key={region} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="font-serif text-2xl text-white">{region}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-white/45">{records.length} records</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {records.map((country) => (
                  <Link
                    key={country.jurisdiction_id}
                    href={`/countries/${country.slug}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#c6a55a]/60"
                  >
                    <span className="block font-medium text-white">{country.public_display_name}</span>
                    <span className="mt-1 block text-xs text-white/50">{country.public_subregion ?? 'No subregion'} · identity-only</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
