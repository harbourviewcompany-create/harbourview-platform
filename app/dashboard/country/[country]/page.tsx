import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge }  from '@/lib/dashboard/statusBadges'
import type { DashboardSectionSlug } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT, SECTION_LABELS, SECTION_ICONS } from './_components'
import { countIaSignalsByMarket } from '@/lib/intelligence-automation/db'
import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'

export const dynamic = 'force-dynamic'

// Section-level one-liners shown on panel cards
const SECTION_SUBLABEL: Record<DashboardSectionSlug, string> = {
  market:        'Posture · Framework · Operators',
  education:     'Prescriber · Patient · Operator',
  compliance:    'GMP · Packaging · Import',
  signals:       'Regulatory · Market · Trade',
  opportunities: 'Routing · Intake · Review',
  intelligence:  'Briefs · Sources · Methodology',
  connections:   'Counterparties · Routing · Intake',
}

type Props = { params: Promise<{ country: string }> }

export default async function CountryConsolePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const overallBadge   = getDashboardStatusBadge(country.dashboardStatus)
  const sections       = Object.keys(country.panels) as DashboardSectionSlug[]
  const availableCount = sections.filter((s) => country.routeAvailability[s]).length

  // Live signal count + jurisdiction briefing (parallel fetch)
  const [signalCount, liveProfile] = await Promise.all([
    countIaSignalsByMarket(country.displayName),
    getCountryIntelProfile(country.iso2),
  ])

  const publicSummary = liveProfile?.public_summary ?? country.publicSummary

  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* ── Country header ── */}
      <div
        className="mb-6 rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(11,26,47,0.9) 0%, rgba(6,14,28,0.85) 100%)',
          border: '1px solid rgba(198,165,90,0.15)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Region breadcrumb */}
            <p className="mb-1.5 text-[9px] uppercase tracking-[0.22em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              {country.region}{country.subregion ? ` · ${country.subregion}` : ''}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-white md:text-3xl">
              {country.displayName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.5)' }}>
              {publicSummary}
            </p>
          </div>

          {/* Status badge */}
          <span
            className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
            style={{
              background:   TONE_BG[overallBadge.tone],
              borderColor:  TONE_BORDER[overallBadge.tone],
              color:        TONE_TEXT[overallBadge.tone],
            }}
          >
            {overallBadge.label}
          </span>
        </div>

        {/* Meta row */}
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[10px]"
          style={{ borderTop: '1px solid rgba(198,165,90,0.1)', color: 'rgba(243,240,234,0.3)' }}
        >
          <span className="font-mono">{country.iso2} · {country.iso3}</span>
          <span className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span>Updated {country.lastUpdated}</span>
          <span className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span
            style={{ color: availableCount > 0 ? 'rgba(93,202,165,0.7)' : 'rgba(243,240,234,0.3)' }}
          >
            {availableCount} of {sections.length} sections available
          </span>
        </div>
      </div>

      {/* ── Section panel grid ── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sections.map((section) => {
          const panel     = country.panels[section]
          const badge     = getDashboardStatusBadge(panel.state)
          const available = country.routeAvailability[section]
          const href      = `${country.dashboardPath}/${section}`
          const firstAction = panel.actions[0]

          return (
            <div
              key={section}
              className="group flex flex-col rounded-2xl p-4 transition-all"
              style={{
                background:  TONE_BG[badge.tone],
                border:      `1px solid ${TONE_BORDER[badge.tone]}`,
                borderLeft:  `3px solid ${TONE_TEXT[badge.tone]}`,
                opacity:     available ? 1 : 0.65,
              }}
            >
              {/* Card header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{SECTION_ICONS[section]}</span>
                  <div>
                    <h3 className="text-[13px] font-semibold text-white leading-snug">
                      {SECTION_LABELS[section]}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
                      {SECTION_SUBLABEL[section]}
                    </p>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.08em]"
                  style={{
                    background:  TONE_BG[badge.tone],
                    borderColor: TONE_BORDER[badge.tone],
                    color:       TONE_TEXT[badge.tone],
                  }}
                >
                  {badge.label}
                </span>
              </div>
              {/* Live signal count badge for intelligence + signals panels */}
              {signalCount > 0 && (section === 'intelligence' || section === 'signals') && (
                <div className="mb-2 -mt-1">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[8px] uppercase tracking-[0.08em] text-emerald-400">
                    {signalCount} live signal{signalCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* State summary */}
              <p
                className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em]"
                style={{ color: TONE_TEXT[badge.tone] }}
              >
                {panel.stateCopy.label}
              </p>

              {/* Public summary */}
              <p className="flex-1 line-clamp-3 text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.52)' }}>
                {panel.publicSummary}
              </p>

              {/* CTA */}
              <div className="mt-3.5">
                {available ? (
                  <Link
                    href={href}
                    className="block w-full rounded-xl py-2 text-center text-[11px] font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.4)]"
                    style={{
                      background: 'rgba(198,165,90,0.1)',
                      border:     '1px solid rgba(198,165,90,0.28)',
                      color:      '#F0D39A',
                    }}
                  >
                    {firstAction?.label ?? `Open ${SECTION_LABELS[section]}`}
                  </Link>
                ) : (
                  <div
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border:     '1px solid rgba(255,255,255,0.07)',
                      color:      'rgba(243,240,234,0.2)',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: TONE_TEXT[badge.tone], opacity: 0.5 }}
                    />
                    {panel.stateCopy.ctaLabel ?? 'Not available'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Review CTA ── */}
      <div
        className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(198,165,90,0.06) 0%, rgba(198,165,90,0.03) 100%)',
          border:     '1px solid rgba(198,165,90,0.15)',
        }}
      >
        <div>
          <p className="text-[12px] font-medium" style={{ color: 'rgba(243,240,234,0.65)' }}>
            Need deeper intelligence routing for {country.displayName}?
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(243,240,234,0.35)' }}>
            Harbourview analysts can provide reviewed country briefs, compliance frameworks, and connection routing.
          </p>
        </div>
        <Link
          href={`/contact?intent=dashboard-review&country=${country.slug}`}
          className="shrink-0 rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[rgba(198,165,90,0.4)]"
          style={{
            background: 'rgba(198,165,90,0.1)',
            border:     '1px solid rgba(198,165,90,0.3)',
            color:      '#f0d39a',
          }}
        >
          Request Harbourview review →
        </Link>
      </div>

    </div>
  )
}
