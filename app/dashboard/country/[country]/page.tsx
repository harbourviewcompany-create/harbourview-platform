import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardSectionSlug } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT, SECTION_LABELS } from './_components'

const SECTION_ICONS: Record<DashboardSectionSlug, string> = {
  market:        '📊',
  education:     '📚',
  compliance:    '⚖️',
  signals:       '📡',
  opportunities: '💡',
  intelligence:  '🔍',
  connections:   '🤝',
}

type Props = { params: Promise<{ country: string }> }

export default async function CountryConsolePage({ params }: Props) {
  const { country: slug } = await params
  const country = resolveCountryRouteParam(slug)
  if (!country) notFound()

  const overallBadge = getDashboardStatusBadge(country.dashboardStatus)
  const sections = Object.keys(country.panels) as DashboardSectionSlug[]
  const availableCount = sections.filter((s) => country.routeAvailability[s]).length

  return (
    <div className="min-h-full p-5">
      {/* Country header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[9px] uppercase tracking-[0.22em]" style={{ color: 'rgba(198,165,90,0.5)' }}>
              {country.region} · {country.subregion}
            </p>
            <h1 className="font-serif text-3xl font-semibold text-white">{country.displayName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
              {country.publicSummary}
            </p>
          </div>
          <span
            className="flex-shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]"
            style={{
              background: TONE_BG[overallBadge.tone],
              borderColor: TONE_BORDER[overallBadge.tone],
              color: TONE_TEXT[overallBadge.tone],
            }}
          >
            {overallBadge.label}
          </span>
        </div>

        {/* Meta */}
        <div
          className="mt-3 flex flex-wrap items-center gap-3 text-[10px]"
          style={{ color: 'rgba(243,240,234,0.35)' }}
        >
          <span>ISO {country.iso2} · {country.iso3}</span>
          <span className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span>Updated {country.lastUpdated}</span>
          <span className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span>{availableCount} of {sections.length} sections available</span>
        </div>
      </div>

      {/* Panel grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sections.map((section) => {
          const panel     = country.panels[section]
          const badge     = getDashboardStatusBadge(panel.state)
          const available = country.routeAvailability[section]
          const href      = `${country.dashboardPath}/${section}`
          const action    = panel.actions[0]

          return (
            <div
              key={section}
              className="flex flex-col rounded-2xl p-4"
              style={{
                background: TONE_BG[badge.tone],
                border: `1px solid ${TONE_BORDER[badge.tone]}`,
              }}
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{SECTION_ICONS[section]}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'rgba(198,165,90,0.55)' }}>
                      {section}
                    </p>
                    <h3 className="text-sm font-semibold text-white">{SECTION_LABELS[section]}</h3>
                  </div>
                </div>
                <span
                  className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.1em]"
                  style={{
                    background: TONE_BG[badge.tone],
                    borderColor: TONE_BORDER[badge.tone],
                    color: TONE_TEXT[badge.tone],
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Summary */}
              <p className="flex-1 text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.55)' }}>
                {panel.publicSummary}
              </p>

              {/* CTA */}
              <div className="mt-3">
                {available ? (
                  <Link
                    href={href}
                    className="block w-full rounded-xl py-2 text-center text-[11px] font-medium transition-all hover:opacity-90"
                    style={{
                      background: 'rgba(198,165,90,0.1)',
                      border: '1px solid rgba(198,165,90,0.25)',
                      color: '#F0D39A',
                    }}
                  >
                    {action?.label ?? 'Open panel'}
                  </Link>
                ) : (
                  <span
                    className="block w-full rounded-xl py-2 text-center text-[11px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(243,240,234,0.2)',
                    }}
                  >
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Review CTA */}
      <div
        className="mt-6 rounded-2xl p-4 text-center"
        style={{ background: 'rgba(198,165,90,0.04)', border: '1px solid rgba(198,165,90,0.12)' }}
      >
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.4)' }}>
          Need deeper intelligence routing for {country.displayName}?
        </p>
        <Link
          href={`/contact?intent=dashboard-review&country=${country.slug}`}
          className="mt-1.5 inline-block text-[11px] transition-opacity hover:opacity-70"
          style={{ color: 'rgba(198,165,90,0.55)' }}
        >
          Request Harbourview review →
        </Link>
      </div>
    </div>
  )
}
