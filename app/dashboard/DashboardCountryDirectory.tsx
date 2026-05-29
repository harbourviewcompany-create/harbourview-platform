'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CountryDashboardSummary, DashboardPanelState } from '@/lib/dashboard/contracts'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

// ── Tone maps ────────────────────────────────────────────────────────────────
const TONE_BADGE: Record<string, string> = {
  green: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  blue:  'border-sky-500/30 text-sky-400 bg-sky-500/[0.06]',
  gold:  'border-[#c6a55a]/30 text-[#f4d27a] bg-[#c6a55a]/[0.06]',
  amber: 'border-amber-500/30 text-amber-400 bg-amber-500/[0.06]',
  slate: 'border-white/10 text-white/40 bg-white/[0.025]',
  red:   'border-red-500/30 text-red-400 bg-red-500/[0.06]',
}

const TONE_BORDER_L: Record<string, string> = {
  green: 'border-l-emerald-500/50',
  blue:  'border-l-sky-500/50',
  gold:  'border-l-[#c6a55a]/50',
  amber: 'border-l-amber-500/50',
  slate: 'border-l-white/10',
  red:   'border-l-red-500/50',
}

// Status groups for filter pills
const STATUS_GROUPS: { label: string; states: DashboardPanelState[] }[] = [
  { label: 'Live / Partial',    states: ['live', 'partial'] },
  { label: 'Orientation',       states: ['static-orientation', 'fallback-backed'] },
  { label: 'Request / Review',  states: ['request-only', 'review-required'] },
  { label: 'Unavailable',       states: ['unavailable'] },
]

export function DashboardCountryDirectory({
  countries,
  heading = 'Country directory',
}: {
  countries: CountryDashboardSummary[]
  heading?: string
}) {
  const [query,  setQuery]  = useState('')
  const [region, setRegion] = useState('all')
  const [status, setStatus] = useState('all')

  // Build region list with counts
  const regionList = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of countries) {
      map.set(c.region, (map.get(c.region) ?? 0) + 1)
    }
    return [['all', countries.length] as [string, number], ...[...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))]
  }, [countries])

  // Filtered results
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return countries.filter((c) => {
      const matchQ = !q || [c.displayName, c.iso2, c.iso3, ...c.aliases].join(' ').toLowerCase().includes(q)
      const matchR = region === 'all' || c.region === region
      const matchS = status === 'all' || STATUS_GROUPS.find((g) => g.label === status)?.states.includes(c.dashboardStatus)
      return matchQ && matchR && matchS
    })
  }, [countries, query, region, status])

  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5" aria-labelledby="country-directory-heading">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 id="country-directory-heading" className="text-xl font-semibold text-white">{heading}</h2>
          <p className="mt-1 text-xs text-white/45">
            {filtered.length} of {countries.length} jurisdictions
          </p>
        </div>
        <label className="sr-only" htmlFor="dashboard-country-search">Search countries</label>
        <input
          id="dashboard-country-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country, ISO code…"
          className="h-10 w-full rounded-xl border border-white/12 bg-[#07111f] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#c6a55a]/40 focus:outline-none md:w-64"
        />
      </div>

      {/* ── Region pills ── */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by region">
        {regionList.map(([r, count]) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-all focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${
              region === r
                ? 'border-[#c6a55a]/50 bg-[#c6a55a]/10 text-[#f4d27a]'
                : 'border-white/10 bg-white/[0.025] text-white/50 hover:border-white/25 hover:text-white/75'
            }`}
          >
            {r === 'all' ? 'All regions' : r}
            <span className={`ml-1.5 ${region === r ? 'text-[#c6a55a]/70' : 'text-white/25'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Status filter pills ── */}
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <button
          onClick={() => setStatus('all')}
          className={`rounded-full border px-3 py-1 text-[11px] transition-all focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${
            status === 'all'
              ? 'border-white/30 bg-white/[0.06] text-white/80'
              : 'border-white/8 bg-transparent text-white/35 hover:border-white/20 hover:text-white/60'
          }`}
        >
          All statuses
        </button>
        {STATUS_GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => setStatus(g.label)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-all focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${
              status === g.label
                ? 'border-white/30 bg-white/[0.06] text-white/80'
                : 'border-white/8 bg-transparent text-white/35 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((country) => {
          const badge       = getDashboardStatusBadge(country.dashboardStatus)
          const badgeClass  = TONE_BADGE[badge.tone]   ?? TONE_BADGE.slate
          const borderClass = TONE_BORDER_L[badge.tone] ?? TONE_BORDER_L.slate

          return (
            <Link
              key={country.slug}
              href={country.dashboardPath}
              className={`group flex min-h-28 flex-col rounded-2xl border border-white/8 border-l-2 bg-[#07111f]/60 p-4 transition-all hover:border-[#c6a55a]/25 hover:bg-[#07111f] focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${borderClass}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white group-hover:text-[#f0d39a] transition-colors">
                    {country.displayName}
                  </h3>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
                    {country.iso2} · {country.region}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${badgeClass}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-2.5 flex-1 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                {country.publicSummary}
              </p>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-3xl opacity-30">🌐</span>
            <p className="text-sm text-white/40">No jurisdictions match your filters.</p>
            <button
              onClick={() => { setQuery(''); setRegion('all'); setStatus('all') }}
              className="rounded-lg border border-white/12 px-4 py-2 text-xs text-white/50 hover:border-white/25 hover:text-white/75 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

    </section>
  )
}
