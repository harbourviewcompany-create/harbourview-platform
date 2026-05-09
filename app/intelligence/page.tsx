import Link from 'next/link'
import type { Metadata } from 'next'

import { CountryIntelligenceMap } from '@/components/intelligence/CountryIntelligenceMap'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { projectPublicCountryMapRecords } from '@/lib/intelligence/public-country-map'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'

export const metadata: Metadata = {
  title: 'Intelligence | Harbourview',
  description:
    'Map-based country intelligence for reviewed commercial pathways, opportunity categories and controlled market access requests.',
}

export default async function IntelligencePage() {
  const [signals] = await Promise.all([getPublicRegulatorySignals()])
  const countryMapRecords = projectPublicCountryMapRecords(publicCountryIntelligenceFixtures)
  const featuredSignals = signals.slice(0, 3)

  return (
    <main className="bg-[#020814] text-white">
      <section className="relative overflow-hidden border-b border-gold/10 bg-[radial-gradient(circle_at_70%_18%,rgba(198,165,90,0.12),transparent_28%),linear-gradient(180deg,#030a14_0%,#061425_58%,#020814_100%)] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,6,15,0.98)_0%,rgba(1,6,15,0.84)_50%,rgba(1,6,15,0.44)_100%)]" />
        <div className="page-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,0.42fr)] lg:items-end">
            <div>
              <p className="hero-eyebrow">Harbourview Intelligence</p>
              <h1 className="hero-title max-w-5xl">
                <span className="hero-title-gold">Country intelligence</span>
                <br />
                <span className="hero-title-white">built around reviewed</span>
                <br />
                <span className="hero-title-gold">market pathways.</span>
              </h1>
              <p className="hero-body max-w-2xl">
                Explore public-safe country panels for market pathway context, review status, opportunity categories and controlled next actions. Intelligence is presented as reviewed commercial context, not as legal advice, guaranteed access or live buyer demand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#country-map" className="btn-marketplace">
                  <span>Explore Country Map</span>
                  <span>→</span>
                </a>
                <Link href="/signals" className="btn-intelligence">
                  <span>View Signals</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-sm border border-gold/12 bg-[rgba(3,10,20,0.72)] p-5 text-sm leading-7 text-white/58 backdrop-blur-sm">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
                Public intelligence controls
              </p>
              <p>
                Public panels use typed fixtures and a public projection layer. They exclude raw evidence, private contacts, unpublished analyst notes and direct counterparty information.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="country-map">
        <CountryIntelligenceMap countries={countryMapRecords} />
      </div>

      <section className="border-b border-gold/10 bg-[#030a14] py-14 sm:py-16">
        <div className="page-container">
          <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.4fr)] lg:items-end">
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                Signals inside Intelligence
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#f4f1eb]">
                Regulatory signals remain available as a focused subcategory.
              </h2>
            </div>
            <p className="text-sm leading-7 text-white/56">
              The existing Signals route stays intact. Intelligence now uses the country map as the front-facing navigation layer while Signals continues to handle policy and regulatory change monitoring.
            </p>
          </div>

          {featuredSignals.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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
                  <h3 className="text-lg font-semibold text-[#f4f1eb]">{signal.headline}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/62">{signal.public_summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-gold/10 bg-[#071425] p-6 text-sm leading-7 text-white/58">
              No public regulatory signals are published yet. Country intelligence can still be requested for a selected market.
            </div>
          )}

          <div className="mt-8">
            <Link href="/signals" className="btn-intelligence">
              <span>Open Signals</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#020814] py-14 sm:py-16">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(9,24,42,0.96),rgba(3,10,20,0.98))] p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_auto] lg:items-center">
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Controlled country assessment
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#f4f1eb]">
                  Need a country brief before entering a market?
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
                  Harbourview can assess route viability, counterparty fit, opportunity categories and country-specific commercial access constraints before public listing, buyer outreach or wanted-request activation.
                </p>
              </div>
              <Link href="/contact" className="btn-marketplace">
                <span>Request Intelligence</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
