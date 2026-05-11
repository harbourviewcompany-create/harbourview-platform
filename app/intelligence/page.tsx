import Link from 'next/link'
import type { Metadata } from 'next'

import { PublicCard, PublicHero, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
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
      <PublicHero
        eyebrow="Harbourview Intelligence"
        title="Country intelligence built around reviewed market pathways."
        actions={[
          { label: 'Explore Country Map', href: '#country-map' },
          { label: 'View Signals', href: '/signals', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-5 text-sm leading-7 text-white/58 backdrop-blur-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
              Public intelligence controls
            </p>
            <p>
              Public panels use typed fixtures and a public projection layer. They exclude raw evidence, private contacts, unpublished analyst notes and direct counterparty information.
            </p>
          </PublicCard>
        }
      >
        <p>
          Explore public-safe country panels for market pathway context, review status, opportunity categories and controlled next actions.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Intelligence is presented as reviewed commercial context, not as legal advice, guaranteed access, confirmed counterparties, guaranteed route certainty or live buyer demand.
        </p>
      </PublicHero>

      <div id="country-map">
        <CountryIntelligenceMap countries={countryMapRecords} />
      </div>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.4fr)] lg:items-end">
          <SectionHeader
            eyebrow="Signals inside Intelligence"
            title="Regulatory signals remain available as a focused subcategory."
            className="mb-0"
          />
          <p className="text-sm leading-7 text-white/56">
            The existing Signals route stays intact. Intelligence now uses the country map as the front-facing navigation layer while Signals continues to handle policy and regulatory change monitoring.
          </p>
        </div>

        {featuredSignals.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {featuredSignals.map((signal) => (
              <PublicCard key={signal.id} className="p-6">
                <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-gold/72">
                  <span>{signal.country_name}</span>
                  <span>•</span>
                  <span>{signal.signal_type.replace(/_/g, ' ')}</span>
                </div>

                <h3 className="text-xl font-semibold text-[#f4f1eb]">{signal.headline}</h3>

                <p className="mt-4 text-sm leading-7 text-white/62">{signal.public_summary}</p>

                <div className="mt-5 rounded-sm border border-gold/10 bg-black/20 p-4 text-xs leading-6 text-white/52">
                  {signal.public_implication}
                </div>
              </PublicCard>
            ))}
          </div>
        ) : (
          <PublicCard muted className="mt-8 p-6 text-sm leading-7 text-white/58">
            No public intelligence summaries are currently published. Harbourview can review country-specific regulatory movement, route viability and commercial-access signals on request before anything is made public.
          </PublicCard>
        )}

        <div className="mt-8">
          <Link href="/signals" className="btn-intelligence min-h-[56px] justify-center">
            <span>Open Signals</span>
            <span>→</span>
          </Link>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Controlled country assessment"
        title="Need a country brief before entering a market?"
        actions={[{ label: 'Request Intelligence', href: '/contact' }]}
      >
        Harbourview can assess route viability, counterparty fit, opportunity categories and country-specific commercial access constraints before public listing, buyer outreach or wanted-request activation.
      </FooterCta>
    </main>
  )
}
