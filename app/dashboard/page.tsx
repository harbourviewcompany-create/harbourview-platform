import Link from 'next/link'
import { DashboardCountryDirectory } from './DashboardCountryDirectory'
import { countries, fixtureCountries, dashboardSections } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Dashboard | Harbourview',
  description: 'Harbourview country intelligence dashboard. Select a market to access pathway context, compliance orientation, signals and commercial routing.',
}


const TONE_BADGE: Record<string, string> = {
  green: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  blue:  'border-sky-500/30 text-sky-400 bg-sky-500/[0.06]',
  gold:  'border-[#c6a55a]/30 text-[#f4d27a] bg-[#c6a55a]/[0.06]',
  amber: 'border-amber-500/30 text-amber-400 bg-amber-500/[0.06]',
  slate: 'border-white/10 text-white/40 bg-white/[0.025]',
  red:   'border-red-500/30 text-red-400 bg-red-500/[0.06]',
}
const TONE_L: Record<string, string> = {
  green: '#5dcaa5', blue: '#7ec8f7', gold: '#f4d27a',
  amber: '#fbbf24', slate: 'rgba(255,255,255,0.15)', red: '#f87171',
}

const regionCount = new Set(countries.map((c) => c.region)).size
const liveCount   = countries.filter((c) => c.dashboardStatus === 'live' || c.dashboardStatus === 'partial').length

function GlobeDecoration() {
  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] opacity-[0.13]" style={{ color: '#c6a55a' }}>
      <circle cx="140" cy="140" r="130" stroke="currentColor" strokeWidth="1" fill="none" />
      <ellipse cx="140" cy="140" rx="130" ry="46" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="140" cy="93"  rx="104" ry="37" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <ellipse cx="140" cy="187" rx="104" ry="37" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <ellipse cx="140" cy="52"  rx="58"  ry="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <ellipse cx="140" cy="228" rx="58"  ry="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <ellipse cx="140" cy="140" rx="65"  ry="130" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="140" cy="140" rx="104" ry="130" stroke="currentColor" strokeWidth="0.5" fill="none" transform="rotate(45 140 140)" />
      <ellipse cx="140" cy="140" rx="104" ry="130" stroke="currentColor" strokeWidth="0.5" fill="none" transform="rotate(-45 140 140)" />
      <line x1="140" y1="10"  x2="140" y2="270" stroke="currentColor" strokeWidth="0.8" />
      <line x1="10"  y1="140" x2="270" y2="140" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="140" cy="140" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="140" cy="10"  r="2"   fill="currentColor" opacity="0.4" />
      <circle cx="140" cy="270" r="2"   fill="currentColor" opacity="0.4" />
    </svg>
  )
}

export default function DashboardHomePage() {
  const germany = fixtureCountries.find((c) => c.slug === 'germany') ?? fixtureCountries[0]

  return (
    <div className="min-h-screen bg-[#03070d] text-white">

      {/* ── Top nav ── */}
      <header
        className="sticky top-0 z-40 flex h-12 items-center justify-between px-5 md:px-8"
        style={{
          background: 'rgba(3,7,13,0.95)',
          borderBottom: '1px solid rgba(198,165,90,0.12)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span className="font-serif text-[13px] uppercase tracking-[0.22em]" style={{ color: '#f0d39a' }}>
          Harbourview
        </span>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: 'rgba(198,165,90,0.5)' }}>
          <Link href="/" className="transition-opacity hover:opacity-80">← Globe</Link>
          <Link
            href={germany?.dashboardPath ?? '/dashboard/country/germany'}
            className="rounded-full border px-3 py-1 transition-all hover:opacity-90"
            style={{ borderColor: 'rgba(198,165,90,0.25)', background: 'rgba(198,165,90,0.08)', color: '#f0d39a' }}
          >
            Open console
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section
          className="relative mb-8 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(11,26,47,0.98) 0%, rgba(6,14,28,0.99) 60%, rgba(3,7,13,1) 100%)',
            border: '1px solid rgba(198,165,90,0.18)',
          }}
        >
          {/* Dot-grid texture */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(198,165,90,0.18) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 40%, transparent 100%)',
            }}
          />

          <div className="relative flex flex-col gap-8 p-6 md:flex-row md:items-center md:p-10 lg:p-12">
            {/* Left: text */}
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: 'rgba(198,165,90,0.7)' }}>
                Harbourview Intelligence Platform
              </p>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-[2.6rem]">
                Market intelligence for enterprise cannabis operators.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7" style={{ color: 'rgba(243,240,234,0.55)' }}>
                Track regulatory posture, import frameworks, compliance requirements, and curated market signals across every active jurisdiction — from a single console.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={germany?.dashboardPath ?? '/dashboard/country/germany'}
                  className="rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#c6a55a', color: '#07111f' }}
                >
                  Open Germany console
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border px-5 py-3 text-sm transition-colors hover:border-white/30"
                  style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)' }}
                >
                  Return to globe
                </Link>
              </div>

              {/* Inline stats */}
              <div className="mt-8 flex flex-wrap gap-0" style={{ borderTop: '1px solid rgba(198,165,90,0.12)' }}>
                {[
                  { value: countries.length.toString(),         label: 'Jurisdictions' },
                  { value: regionCount.toString(),              label: 'Regions' },
                  { value: liveCount.toString(),                label: 'Active consoles' },
                  { value: dashboardSections.length.toString(), label: 'Intel sections' },
                ].map(({ value, label }, i) => (
                  <div
                    key={label}
                    className="px-5 pt-5 first:pl-0"
                    style={{ borderLeft: i > 0 ? '1px solid rgba(198,165,90,0.1)' : 'none' }}
                  >
                    <p className="font-serif text-2xl font-semibold leading-none" style={{ color: '#f0d39a' }}>{value}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(198,165,90,0.45)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: globe */}
            <div className="hidden shrink-0 items-center justify-center md:flex md:w-52 lg:w-64">
              <GlobeDecoration />
            </div>
          </div>
        </section>

        {/* ── Active market consoles ── */}
        <section className="mb-8" aria-labelledby="active-markets-heading">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 id="active-markets-heading" className="text-base font-semibold text-white">Active market consoles</h2>
              <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(243,240,234,0.35)' }}>
                Fixture markets with assigned intelligence status
              </p>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.1em]"
              style={{ borderColor: 'rgba(198,165,90,0.2)', color: 'rgba(198,165,90,0.55)' }}
            >
              {fixtureCountries.length} markets
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {fixtureCountries.map((country) => {
              const badge  = getDashboardStatusBadge(country.dashboardStatus)
              const lColor = TONE_L[badge.tone] ?? TONE_L.slate
              const bClass = TONE_BADGE[badge.tone] ?? TONE_BADGE.slate

              return (
                <Link
                  key={country.slug}
                  href={country.dashboardPath}
                  className="group flex flex-col rounded-2xl p-4 transition-all focus:outline-none focus:ring-2 focus:ring-[rgba(198,165,90,0.4)]"
                  style={{
                    background: 'rgba(7,15,30,0.7)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: `2px solid ${lColor}`,
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white transition-colors group-hover:text-[#f0d39a]">
                        {country.displayName}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(243,240,234,0.3)' }}>
                        {country.iso2} · {country.region}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] ${bClass}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="flex-1 line-clamp-2 text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
                    {country.publicSummary}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] transition-colors group-hover:opacity-80" style={{ color: 'rgba(198,165,90,0.45)' }}>
                      Open console
                    </span>
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3 translate-x-0 transition-transform group-hover:translate-x-0.5"
                      stroke="currentColor" strokeWidth="1.5" fill="none"
                      style={{ color: 'rgba(198,165,90,0.4)' }}
                    >
                      <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Full directory ── */}
        <DashboardCountryDirectory countries={countries} heading="All tracked jurisdictions" />

      </div>
    </div>
  )
}
