'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

export function DashboardCountryDirectory({ countries, heading = 'Country directory' }: { countries: CountryDashboardSummary[]; heading?: string }) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const regions = useMemo(() => ['all', ...Array.from(new Set(countries.map((country) => country.region))).sort()], [countries])
  const filtered = countries.filter((country) => {
    const matchesQuery = [country.displayName, country.iso2, country.iso3, ...country.aliases].join(' ').toLowerCase().includes(query.toLowerCase())
    const matchesRegion = region === 'all' || country.region === region
    return matchesQuery && matchesRegion
  })

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="country-directory-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="country-directory-heading" className="text-2xl font-semibold text-white">{heading}</h2>
          <p className="mt-2 text-sm text-white/60">Search or browse by region when WebGL is unavailable, reduced motion is preferred, or list mode is selected.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="sr-only" htmlFor="dashboard-country-search">Search countries</label>
          <input id="dashboard-country-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country" className="min-h-11 rounded-xl border border-white/15 bg-[#07111f] px-3 py-2 text-sm text-white" />
          <label className="sr-only" htmlFor="dashboard-region-filter">Region filter</label>
          <select id="dashboard-region-filter" value={region} onChange={(event) => setRegion(event.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#07111f] px-3 py-2 text-sm text-white">
            {regions.map((item) => <option key={item} value={item}>{item === 'all' ? 'All regions' : item}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((country) => {
          const badge = getDashboardStatusBadge(country.dashboardStatus)
          return (
            <Link key={country.slug} href={country.dashboardPath} className="min-h-32 rounded-2xl border border-white/10 bg-[#07111f]/70 p-4 transition hover:border-[#c6a55a]/50 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{country.displayName}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{country.iso2} · {country.region}</p>
                </div>
                <span className="rounded-full border border-[#c6a55a]/25 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#f4d27a]">{badge.label}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/65">{country.publicSummary}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
