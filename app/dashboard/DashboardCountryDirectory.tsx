'use client'

import Link from 'next/link'
import { useMemo, useState, useRef } from 'react'
import type { CountryDashboardSummary, DashboardPanelState } from '@/lib/dashboard/contracts'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

const TONE_L: Record<string, string> = {
  green: '#5dcaa5', blue: '#7ec8f7', gold: '#f4d27a',
  amber: '#fbbf24', slate: 'rgba(255,255,255,0.15)', red: '#f87171',
}
const TONE_BADGE: Record<string, string> = {
  green: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  blue:  'border-sky-500/30 text-sky-400 bg-sky-500/[0.06]',
  gold:  'border-[#c6a55a]/30 text-[#f4d27a] bg-[#c6a55a]/[0.06]',
  amber: 'border-amber-500/30 text-amber-400 bg-amber-500/[0.06]',
  slate: 'border-white/10 text-white/40 bg-white/[0.025]',
  red:   'border-red-500/30 text-red-400 bg-red-500/[0.06]',
}

const STATUS_GROUPS: { label: string; states: DashboardPanelState[]; dot: string }[] = [
  { label: 'Live / Partial',   states: ['live', 'partial'],                       dot: '#5dcaa5' },
  { label: 'Orientation',      states: ['static-orientation', 'fallback-backed'], dot: '#7ec8f7' },
  { label: 'Request / Review', states: ['request-only', 'review-required'],       dot: '#fbbf24' },
  { label: 'Unavailable',      states: ['unavailable'],                           dot: '#f87171' },
]

type ViewMode = 'grid' | 'list'

export function DashboardCountryDirectory({
  countries,
  heading = 'Country directory',
}: {
  countries: CountryDashboardSummary[]
  heading?: string
}) {
  const [query,    setQuery]    = useState('')
  const [region,   setRegion]   = useState('all')
  const [status,   setStatus]   = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const searchRef = useRef<HTMLInputElement>(null)

  const regionList = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of countries) map.set(c.region, (map.get(c.region) ?? 0) + 1)
    return [
      ['all', countries.length] as [string, number],
      ...[...map.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    ]
  }, [countries])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return countries.filter((c) => {
      const matchQ = !q || [c.displayName, c.iso2, c.iso3, ...(c.aliases ?? [])].join(' ').toLowerCase().includes(q)
      const matchR = region === 'all' || c.region === region
      const matchS = status === 'all' || STATUS_GROUPS.find((g) => g.label === status)?.states.includes(c.dashboardStatus)
      return matchQ && matchR && matchS
    })
  }, [countries, query, region, status])

  const hasFilters = query !== '' || region !== 'all' || status !== 'all'

  function clearAll() { setQuery(''); setRegion('all'); setStatus('all') }

  return (
    <section
      className="rounded-3xl"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      aria-labelledby="country-directory-heading"
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col gap-3 px-5 pt-5 pb-4 md:flex-row md:items-center md:justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-baseline gap-3">
          <h2 id="country-directory-heading" className="text-base font-semibold text-white">{heading}</h2>
          <span className="text-[11px]" style={{ color: 'rgba(243,240,234,0.3)' }}>
            {filtered.length}{filtered.length !== countries.length ? ` of ${countries.length}` : ''} jurisdictions
          </span>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-[10px] underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'rgba(198,165,90,0.5)' }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg
              viewBox="0 0 16 16" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="M10.5 10.5l3 3" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              id="dashboard-country-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Country, ISO…"
              className="h-9 w-48 rounded-xl pl-8 pr-3 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.4)]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grid / List toggle */}
          <div
            className="flex items-center rounded-xl p-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['grid', 'list'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="rounded-lg px-2.5 py-1.5 transition-all"
                style={viewMode === m
                  ? { background: 'rgba(198,165,90,0.12)', color: '#f0d39a' }
                  : { color: 'rgba(255,255,255,0.3)' }
                }
                aria-label={m === 'grid' ? 'Grid view' : 'List view'}
              >
                {m === 'grid' ? (
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="currentColor">
                    <rect x="0" y="0" width="6" height="6" rx="1" />
                    <rect x="8" y="0" width="6" height="6" rx="1" />
                    <rect x="0" y="8" width="6" height="6" rx="1" />
                    <rect x="8" y="8" width="6" height="6" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="currentColor">
                    <rect x="0" y="1" width="14" height="2" rx="1" />
                    <rect x="0" y="6" width="14" height="2" rx="1" />
                    <rect x="0" y="11" width="14" height="2" rx="1" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-2 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Region */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by region">
          <span className="mr-0.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.2)' }}>Region</span>
          {regionList.map(([r, count]) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="rounded-full px-2.5 py-1 text-[10px] transition-all focus:outline-none"
              style={region === r
                ? { background: 'rgba(198,165,90,0.12)', border: '1px solid rgba(198,165,90,0.35)', color: '#f4d27a' }
                : { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
              }
            >
              {r === 'all' ? 'All' : r}
              <span className="ml-1 opacity-55">{count}</span>
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          <span className="mr-0.5 text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.2)' }}>Status</span>
          <button
            onClick={() => setStatus('all')}
            className="rounded-full px-2.5 py-1 text-[10px] transition-all focus:outline-none"
            style={status === 'all'
              ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }
              : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
            }
          >
            All
          </button>
          {STATUS_GROUPS.map((g) => (
            <button
              key={g.label}
              onClick={() => setStatus(g.label)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] transition-all focus:outline-none"
              style={status === g.label
                ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }
                : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
              }
            >
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: g.dot }} />
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-4xl opacity-20">🌐</span>
            <p className="text-sm" style={{ color: 'rgba(243,240,234,0.35)' }}>No jurisdictions match your filters.</p>
            <button
              onClick={clearAll}
              className="rounded-xl border px-5 py-2 text-[12px] transition-all hover:opacity-80"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((country) => {
              const badge  = getDashboardStatusBadge(country.dashboardStatus)
              const lColor = TONE_L[badge.tone] ?? TONE_L.slate
              const bClass = TONE_BADGE[badge.tone] ?? TONE_BADGE.slate
              return (
                <Link
                  key={country.slug}
                  href={country.dashboardPath}
                  className="group flex min-h-[6.5rem] flex-col rounded-xl p-3.5 transition-all focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.5)]"
                  style={{ background: 'rgba(7,15,30,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `2px solid ${lColor}` }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-semibold text-white transition-colors group-hover:text-[#f0d39a]">
                        {country.displayName}
                      </h3>
                      <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(243,240,234,0.28)' }}>
                        {country.iso2} · {country.region}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] ${bClass}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="flex-1 line-clamp-2 text-[10px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.4)' }}>
                    {country.publicSummary}
                  </p>
                </Link>
              )
            })}
          </div>
        ) : (
          /* List view */
          <div>
            <div
              className="grid grid-cols-[1fr_110px_110px_60px] items-center px-3 pb-2 text-[9px] uppercase tracking-[0.14em]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <span>Country</span>
              <span>Region</span>
              <span>Status</span>
              <span className="text-right">ISO</span>
            </div>
            {filtered.map((country) => {
              const badge  = getDashboardStatusBadge(country.dashboardStatus)
              const lColor = TONE_L[badge.tone] ?? TONE_L.slate
              const bClass = TONE_BADGE[badge.tone] ?? TONE_BADGE.slate
              return (
                <Link
                  key={country.slug}
                  href={country.dashboardPath}
                  className="group grid grid-cols-[1fr_110px_110px_60px] items-center gap-2 rounded-lg px-3 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.4)]"
                  style={{ borderLeft: `2px solid ${lColor}` }}
                >
                  <span className="text-[13px] font-medium text-white transition-colors group-hover:text-[#f0d39a]">
                    {country.displayName}
                  </span>
                  <span className="text-[11px]" style={{ color: 'rgba(243,240,234,0.35)' }}>{country.region}</span>
                  <span className={`inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] ${bClass}`}>
                    {badge.label}
                  </span>
                  <span className="text-right font-mono text-[10px]" style={{ color: 'rgba(198,165,90,0.4)' }}>
                    {country.iso2}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
