import type { Metadata } from 'next'

import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import { getPublicRegulatorySignals, getPublicRegulatorySignalCountries } from '@/lib/regulatory-signals/public'

export const metadata: Metadata = {
  title: 'Intelligence Globe',
  description:
    'Country-reviewed commercial intelligence, regulatory monitoring and controlled-access market pathway analysis.',
}

export default async function IntelligencePage() {
  const [signals, countries] = await Promise.all([
    getPublicRegulatorySignals(),
    getPublicRegulatorySignalCountries(),
  ])

  const featuredSignals = signals.slice(0, 6)
  const featuredCountries = countries.slice(0, 12)

  return (
    <main className="bg-[#020814] text-white">
      <section className="hero-shell relative overflow-hidden border-b border-gold/10 py-16 sm:py-20">
        <div className="hero-gradient-shield"></div>

        <HarbourviewGlobeClientLoader />

        <div className="page-container relative z-10">
          <div className="max-w-3xl">
            <p className="hero-eyebrow">
              Harbourview Intelligence Globe
            </p>

            <h1 className="hero-title max-w-4xl">
              <span className="hero-title-gold">Country-reviewed</span>
              <br />
              <span className="hero-title-white">commercial intelligence</span>
              <br />
              <span className="hero-title-gold">without fake live claims.</span>
            </h1>

            <p className="hero-body max-w-2xl">
              Review country-specific regulatory movement, commercial-access signals,
              route viability considerations and public-safe intelligence summaries
              prepared for controlled market engagement.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#reviewed-signals" className="btn-marketplace">
                <span>Recent Reviewed Signals</span>
                <span>→</span>
              </a>

              <a href="#country-panels" className="btn-intelligence">
                <span>Explore Countries</span>
                <span>→</span>
              </a>
            </div>

            <div className="mt-10 max-w-3xl rounded-sm border border-gold/10 bg-[rgba(3,10,20,0.72)] p-5 text-sm leading-7 text-white/58 backdrop-blur-sm">
              Intelligence content is reviewed and publication-controlled. Public
              panels do not represent real-time monitoring, legal advice,
              guaranteed access, confirmed counterparties or live transaction flow.
            </div>
          </div>
        </div>
      </section>

      <section id="reviewed-signals" className="border-b border-gold/10 py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                Recent Reviewed Signals
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#f4f1eb]">
                Published intelligence summaries
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {featuredSignals.map((signal) => (
              <article
                key={signal.id}
                className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6"
              >
                <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-gold/72">
                  <span>{signal.country_name}</span>
                  <span>•</span>
                  <span>{signal.signal_type.replace(/_/g, ' ')}</span>
                </div>

                <h3 className="text-xl font-semibold text-[#f4f1eb]">
                  {signal.headline}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/62">
                  {signal.public_summary}
                </p>

                <div className="mt-5 rounded-sm border border-gold/10 bg-black/20 p-4 text-xs leading-6 text-white/52">
                  {signal.public_implication}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="country-panels" className="py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
              Country Intelligence Panels
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#f4f1eb]">
              Reviewed market pathways by country
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featuredCountries.map((country) => (
              <div
                key={country.countryName}
                className="rounded-sm border border-gold/10 bg-[#071425] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#f4f1eb]">
                    {country.countryName}
                  </h3>

                  <span className="rounded-full border border-gold/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold/70">
                    Reviewed
                  </span>
                </div>

                <div className="space-y-3 text-sm leading-7 text-white/58">
                  <p>
                    Public-safe country overview and reviewed commercial pathway
                    context.
                  </p>

                  <p>
                    Region: {country.region || 'International'}
                  </p>

                  <p>
                    Published signals: {country.count}
                  </p>
                </div>

                <div className="mt-6 border-t border-gold/10 pt-4 text-xs leading-6 text-white/44">
                  Country intelligence visibility is controlled and may not reflect
                  unpublished reviews, private assessments or pending analyst work.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
