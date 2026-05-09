'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { PublicCountryMapRecord } from '@/lib/intelligence/public-country-map'

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

  return 'Prototype extracted'
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
      <div className="rounded-sm border border-gold/10 bg-[#071425] p-6 text-sm leading-7 text-white/62">
        Country intelligence has not been published yet. Harbourview can assess a market on request.
      </div>
    )
  }

  return (
    <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16">
      <div className="page-container">
        <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.52fr)] lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/74">
              Map-based intelligence
            </p>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#f4f1eb] sm:text-5xl">
              Select a country to review public pathway context.
            </h2>
          </div>
          <p className="text-sm leading-7 text-white/58">
            Signals remain part of the wider Intelligence system, but the front-facing Intelligence direction now centers on country-level access context, reviewed status and commercial route categories.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(8,20,36,0.94),rgba(2,8,20,0.98))] p-3 shadow-[0_26px_80px_rgba(0,0,0,0.34)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-white/50">
              <span>Clickable country map</span>
              <span className="uppercase tracking-[0.2em] text-gold/60">Public projection only</span>
            </div>

            <div className="relative overflow-hidden rounded-sm border border-gold/10 bg-[radial-gradient(circle_at_50%_48%,rgba(198,165,90,0.1),transparent_31%),linear-gradient(180deg,#06182d_0%,#020814_100%)]">
              <svg
                viewBox="0 0 800 460"
                role="img"
                aria-label="Harbourview clickable country intelligence map"
                className="h-[330px] w-full sm:h-[460px]"
              >
                <defs>
                  <radialGradient id="hvMapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#C6A55A" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#C6A55A" stopOpacity="0" />
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
                      stroke="#C6A55A"
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
                      stroke="#C6A55A"
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
                      fill="#132844"
                      stroke="#C6A55A"
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
                            stroke="#D8BE76"
                            strokeOpacity="0.5"
                            strokeWidth="1.4"
                          />
                        ) : null}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={selected ? 7.5 : 5.5}
                          fill={selected ? '#D8BE76' : '#C6A55A'}
                          stroke="#020814"
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
                      className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/0 bg-transparent text-[0] outline-none transition focus-visible:border-gold focus-visible:bg-gold/10"
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
                        ? 'border-gold/55 bg-gold/12 text-[#f4f1eb]'
                        : 'border-gold/10 bg-black/16 text-white/56 hover:border-gold/30 hover:text-white/78'
                    }`}
                  >
                    <span className="block font-semibold">{country.country}</span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-gold/54">
                      {getReviewTone(country.reviewStatus)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="rounded-sm border border-gold/14 bg-[linear-gradient(180deg,rgba(10,20,35,0.97),rgba(3,10,20,0.99))] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gold/62">
                  {selectedCountry.region}
                </p>
                <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[#f4f1eb]">
                  {selectedCountry.country}
                </h3>
              </div>
              <span className="rounded-full border border-gold/22 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold/72">
                {selectedCountry.reviewLabel}
              </span>
            </div>

            <div className="space-y-5">
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                  Market pathway summary
                </p>
                <p className="text-sm leading-7 text-white/68">{selectedCountry.publicSummary}</p>
                <p className="mt-3 text-sm leading-7 text-white/56">{selectedCountry.pathwaySummary}</p>
              </section>

              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                  Pathway status
                </p>
                <div className="rounded-sm border border-gold/10 bg-black/18 p-4 text-sm leading-7 text-white/62">
                  {selectedCountry.statusLabel}
                  {selectedCountry.regulatorLabel ? (
                    <span className="mt-2 block text-xs text-white/42">
                      Regulator reference: {selectedCountry.regulatorLabel}
                    </span>
                  ) : null}
                </div>
              </section>

              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                  Opportunity categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.opportunityCategories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-gold/14 bg-gold/8 px-3 py-1 text-xs leading-6 text-white/62"
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

            <p className="mt-6 border-t border-gold/10 pt-4 text-xs leading-6 text-white/42">
              Public intelligence panels exclude private counterparties, raw evidence, unpublished analyst work and direct contact information. Country assessment is reviewed, not represented as live demand or guaranteed access.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
