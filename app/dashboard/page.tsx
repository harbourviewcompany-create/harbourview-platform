import Link from 'next/link'
import { DashboardCountryDirectory } from './DashboardCountryDirectory'
import { countries, fixtureCountries } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'

const TONE_CLASSES: Record<string, string> = {
  green: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.06]',
  blue:  'border-sky-500/30 text-sky-400 bg-sky-500/[0.06]',
  gold:  'border-[#c6a55a]/30 text-[#f4d27a] bg-[#c6a55a]/[0.06]',
  amber: 'border-amber-500/30 text-amber-400 bg-amber-500/[0.06]',
  slate: 'border-white/15 text-white/50 bg-white/[0.03]',
  red:   'border-red-500/30 text-red-400 bg-red-500/[0.06]',
}

const TONE_BORDER: Record<string, string> = {
  green: 'border-l-emerald-500/60',
  blue:  'border-l-sky-500/60',
  gold:  'border-l-[#c6a55a]/60',
  amber: 'border-l-amber-500/60',
  slate: 'border-l-white/20',
  red:   'border-l-red-500/60',
}

const regionCount = new Set(countries.map((c) => c.region)).size
const liveCount   = countries.filter((c) => c.dashboardStatus === 'live' || c.dashboardStatus === 'partial').length

export default function DashboardHomePage() {
  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section className="rounded-3xl border border-[#c6a55a]/20 bg-[linear-gradient(135deg,rgba(11,26,47,0.97),rgba(3,7,13,0.99))] p-6 md:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c6a55a]">
            Harbourview Intelligence Platform
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Market intelligence for enterprise cannabis operators.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            Track regulatory posture, import frameworks, compliance requirements, and curated market signals across every active jurisdiction — from a single console.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={fixtureCountries[0]?.dashboardPath ?? '/dashboard/country/germany'}
              className="rounded-xl bg-[#c6a55a] px-5 py-3 text-sm font-semibold text-[#07111f] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Open Germany console
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm text-white/75 transition-colors hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-[#c6a55a]"
            >
              Return to globe
            </Link>
          </div>
        </section>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { value: countries.length.toString(), label: 'Countries tracked' },
            { value: regionCount.toString(),      label: 'Global regions' },
            { value: liveCount.toString(),        label: 'Active consoles' },
            { value: '7',                         label: 'Intelligence sections' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"
            >
              <p className="font-serif text-2xl font-semibold leading-none text-[#f0d39a]">{value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Featured markets ── */}
        <section aria-labelledby="featured-markets-heading">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="featured-markets-heading" className="text-lg font-semibold text-white">
                Active market consoles
              </h2>
              <p className="mt-1 text-xs text-white/40">Fixture markets with assigned intelligence status</p>
            </div>
            <span className="rounded-full border border-[#c6a55a]/20 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#c6a55a]/70">
              {fixtureCountries.length} markets
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {fixtureCountries.map((country) => {
              const badge = getDashboardStatusBadge(country.dashboardStatus)
              const borderClass = TONE_BORDER[badge.tone] ?? 'border-l-white/20'
              const badgeClass  = TONE_CLASSES[badge.tone] ?? TONE_CLASSES.slate
              return (
                <Link
                  key={country.slug}
                  href={country.dashboardPath}
                  className={`group flex flex-col rounded-2xl border border-white/10 border-l-2 bg-[#070f1e]/70 p-4 transition-all hover:border-[#c6a55a]/30 hover:bg-[#070f1e] focus:outline-none focus:ring-2 focus:ring-[#c6a55a] ${borderClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-snug text-white group-hover:text-[#f0d39a] transition-colors">
                        {country.displayName}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
                        {country.iso2} · {country.region}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                    {country.publicSummary}
                  </p>
                  <p className="mt-3 text-[10px] text-[#c6a55a]/50 transition-colors group-hover:text-[#c6a55a]/80">
                    Open console →
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Full directory ── */}
        <DashboardCountryDirectory countries={countries} heading="All tracked jurisdictions" />

      </div>
    </main>
  )
}
