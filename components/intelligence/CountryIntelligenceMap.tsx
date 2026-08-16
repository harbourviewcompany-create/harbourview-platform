'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { PublicCountryMapRecord } from '@/lib/intelligence/public-country-map'
import { HarbourviewCard, hvPanelEyebrowClass } from '@/components/ui/HarbourviewPanel'

type CountryIntelligenceMapProps = {
  countries: PublicCountryMapRecord[]
}

type ProjectionPoint = {
  x: number
  y: number
}

const worldRegions = [
  { d: 'M97 106 L166 82 L220 112 L206 166 L152 184 L104 154 Z', label: 'North America' },
  { d: 'M212 220 L255 240 L276 315 L246 388 L214 340 L190 274 Z', label: 'South America' },
  { d: 'M370 98 L500 92 L585 132 L548 202 L430 210 L354 164 Z', label: 'Europe and Asia' },
  { d: 'M430 214 L506 238 L536 326 L492 420 L438 360 L408 278 Z', label: 'Africa' },
  { d: 'M610 292 L704 322 L724 378 L650 398 L590 356 Z', label: 'Oceania' },
]

/** SVG fills/strokes — keep hex so SVG stays self-contained; values match hvBrand. */
const MAP = {
  gold: '#C6A55A',
  goldLight: '#D8BE76',
  void: '#020814',
  land: '#132844',
} as const

function projectCoordinates(lat: number, lng: number): ProjectionPoint {
  const x = ((lng + 180) / 360) * 800
  const y = ((90 - lat) / 180) * 460

  return { x, y }
}

function getInitialCountry(countries: PublicCountryMapRecord[]) {
  return countries.find((country) => country.slug === 'germany') || countries[0]
}

function getReviewTone(reviewStatus: PublicCountryMapRecord['reviewStatus']) {
  if (reviewStatus === 'publicSafeSeed') return 'Public-safe'
  if (reviewStatus === 'needsAnalystReview') return 'Review required'

  return 'Alpha extraction pending review'
}

function safeHref(path: string, country: PublicCountryMapRecord) {
  return `${path}?country=${encodeURIComponent(country.slug)}`
}

export function CountryIntelligenceMap({ countries }: CountryIntelligenceMapProps) {
  const [selectedSlug, setSelectedSlug] = useState(() => getInitialCountry(countries)?.slug || '')

  const selectedCountry = useMemo(
    () => countries.find((country) => country.slug === selectedSlug) || getInitialCountry(countries),
    [countries, selectedSlug],
  )

  if (!selectedCountry) {
    return (
      <div className="rounded-sm border border-[color:var(--hv-gold)]/10 bg-[color:var(--hv-navy-deep)] p-6 text-sm leading-7 text-[color:var(--hv-text-secondary)]">
        Country intelligence has not been published yet. Harbourview can assess a market on request.
      </div>
    )
  }

  return (
    <section className="border-b border-[color:var(--hv-gold)]/10 bg-[color:var(--hv-black)] py-12 sm:py-16">
      <div className="page-container">
        <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.52fr)] lg:items-end">
          <div>
            <p className={`${hvPanelEyebrowClass} mb-3 tracking-[0.3em]`}>
              Map-based intelligence
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal tracking-[-0.04em] text-[color:var(--hv-ivory)] sm:text-5xl">
              Select a country to review public pathway context.
            </h2>
          </div>
          <p className="text-sm leading-7 text-[color:var(--hv-text-secondary)]">
            Signals remain part of the wider Intelligence system, but the front-facing Intelligence direction now centers on country-level access context, reviewed status and commercial route categories.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="rounded-sm border border-[color:var(--hv-gold)]/12 bg-[linear-gradient(180deg,rgba(8,20,36,0.94),rgba(2,8,20,0.98))] p-3 shadow-[0_26px_80px_rgba(0,0,0,0.34)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[color:var(--hv-text-muted)]">
              <span>Clickable country map</span>
              <span className="uppercase tracking-[0.2em] text-[color:var(--hv-gold)]/60">Public projection only</span>
            </div>

            <div
              className="relative overflow-hidden rounded-sm border border-[color:var(--hv-gold)]/10"
              style={{
                background:
                  'radial-gradient(circle at 50% 48%, rgba(198,165,90,0.1), transparent 31%), linear-gradient(180deg, var(--hv-ocean-navy) 0%, var(--hv-black) 100%)',
              }}
            >
              <svg
                viewBox="0 0 800 460"
                role="img"
                aria-label="Harbourview clickable country intelligence map"
                className="h-[330px] w-full sm:h-[460px]"
              >
                <defs>
                  <radialGradient id="hvMapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={MAP.gold} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={MAP.gold} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="800" height="460" fill="url(#hvMapGlow)" opacity="0.78" />
                <g opacity="0.42">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <line
                      key={`longitude-${index}`}
                      x1={80 + index * 80}
                      x2={80 + index * 80}
                      y1="34"
                      y2="426"
                      stroke={MAP.gold}
                      strokeOpacity="0.14"
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <line
                      key={`latitude-${index}`}
                      x1="42"
                      x2="758"
                      y1={76 + index * 76}
                      y2={76 + index * 76}
                      stroke={MAP.gold}
                      strokeOpacity="0.12"
                      strokeWidth="1"
                    />
                  ))}
                </g>
                <g>
                  {worldRegions.map((region) => (
                    <path
                      key={region.label}
                      d={region.d}
                      fill={MAP.land}
                      stroke={MAP.gold}
                      strokeOpacity="0.22"
                      strokeWidth="1.25"
                    />
                  ))}
                </g>
                <g>
                  {countries.map((country) => {
                    const point = country.coordinates
                      ? projectCoordinates(country.coordinates.lat, country.coordinates.lng)
                      : { x: 400, y: 230 }
                    const selected = country.slug === selectedCountry.slug

                    return (
                      <g key={country.slug}>
                        {selected ? (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="20"
                            fill="none"
                            stroke={MAP.goldLight}
                            strokeOpacity="0.5"
                            strokeWidth="1.4"
                          />
                        ) : null}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={selected ? 7.5 : 5.5}
                          fill={selected ? MAP.goldLight : MAP.gold}
                          stroke={MAP.void}
                          strokeWidth="2"
                        />
                      </g>
                    )
                  })}
                </g>
              </svg>

              <div className="absolute inset-0">
                {countries.map((country) => {
                  const point = country.coordinates
                    ? projectCoordinates(country.coordinates.lat, country.coordinates.lng)
                    : { x: 400, y: 230 }
                  const selected = country.slug === selectedCountry.slug

                  return (
                    <button
                      key={country.slug}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`Open ${country.country} intelligence panel`}
                      onClick={() => setSelectedSlug(country.slug)}
                      className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-transparent text-[0] outline-none transition focus-visible:border-[color:var(--hv-gold)] focus-visible:bg-[color:var(--hv-gold)]/10"
                      style={{ left: `${(point.x / 800) * 100}%`, top: `${(point.y / 460) * 100}%` }}
                    >
                      {country.country}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {countries.map((country) => {
                const selected = country.slug === selectedCountry.slug

                return (
                  <button
                    key={country.slug}
                    type="button"
                    onClick={() => setSelectedSlug(country.slug)}
                    className={`rounded-sm border px-3 py-3 text-left text-xs transition ${
                      selected
                        ? 'border-[color:var(--hv-gold)]/55 bg-[color:var(--hv-gold)]/12 text-[color:var(--hv-ivory)]'
                        : 'border-[color:var(--hv-gold)]/10 bg-black/16 text-[color:var(--hv-text-muted)] hover:border-[color:var(--hv-gold)]/30 hover:text-[color:var(--hv-text-secondary)]'
                    }`}
                  >
                    <span className="block font-semibold">{country.country}</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--hv-gold)]/54">
                      {getReviewTone(country.reviewStatus)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <HarbourviewCard className="rounded-sm border-[color:var(--hv-gold)]/14 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[color:var(--hv-gold)]/62">
                  {selectedCountry.region}
                </p>
                <h3 className="font-serif text-3xl font-normal tracking-[-0.04em] text-[color:var(--hv-ivory)]">
                  {selectedCountry.country}
                </h3>
              </div>
              <span className="rounded-full border border-[color:var(--hv-gold)]/22 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--hv-gold)]/72">
                {selectedCountry.reviewLabel}
              </span>
            </div>

            <div className="space-y-5">
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hv-text-muted)]">
                  Market pathway summary
                </p>
                <p className="text-sm leading-7 text-[color:var(--hv-text-secondary)]">{selectedCountry.publicSummary}</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--hv-text-muted)]">{selectedCountry.pathwaySummary}</p>
              </section>

              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hv-text-muted)]">
                  Pathway status
                </p>
                <div className="rounded-sm border border-[color:var(--hv-gold)]/10 bg-black/18 p-4 text-sm leading-7 text-[color:var(--hv-text-secondary)]">
                  {selectedCountry.statusLabel}
                  {selectedCountry.regulatorLabel ? (
                    <span className="mt-2 block text-xs text-[color:var(--hv-text-muted)]">
                      Regulator reference: {selectedCountry.regulatorLabel}
                    </span>
                  ) : null}
                </div>
              </section>

              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--hv-text-muted)]">
                  Opportunity categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.opportunityCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-[color:var(--hv-gold)]/14 bg-[color:var(--hv-gold)]/8 px-3 py-1 text-xs leading-6 text-[color:var(--hv-text-secondary)]"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-7 grid gap-3">
              <Link href={safeHref('/contact', selectedCountry)} className="btn-marketplace min-w-0 justify-between px-5 py-3 text-xs">
                <span>Request Country Brief</span>
                <span>→</span>
              </Link>
              <Link href={safeHref('/opportunities', selectedCountry)} className="btn-intelligence min-w-0 justify-between px-5 py-3 text-xs">
                <span>View Related Opportunities</span>
                <span>→</span>
              </Link>
              <Link href={safeHref('/marketplace/wanted', selectedCountry)} className="btn-intelligence min-w-0 justify-between px-5 py-3 text-xs">
                <span>Create Wanted Request</span>
                <span>→</span>
              </Link>
            </div>

            <p className="mt-6 border-t border-[color:var(--hv-gold)]/10 pt-4 text-xs leading-6 text-[color:var(--hv-text-muted)]">
              Public intelligence panels exclude private counterparties, raw evidence, unpublished analyst work and direct contact information. Country assessment is reviewed, not represented as live demand or guaranteed access.
            </p>
          </HarbourviewCard>
        </div>
      </div>
    </section>
  )
}
