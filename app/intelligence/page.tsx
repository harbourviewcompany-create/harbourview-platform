import type { Metadata } from 'next'

import {
  ButtonLink,
  IntelligenceSignalCard,
  PageHero,
  SectionFrame,
  SectionHeader,
  Surface,
  TrustBoundaryPanel,
} from '@/components/design-system/Institutional'
import { CountryIntelligenceMap } from '@/components/intelligence/CountryIntelligenceMap'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { projectPublicCountryMapRecords } from '@/lib/intelligence/public-country-map'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'

export const metadata: Metadata = {
  title: 'Intelligence | Harbourview',
  description:
    'Public-safe country intelligence for reviewed commercial pathways, opportunity categories and controlled market access requests.',
}

export default async function IntelligencePage() {
  const [signals] = await Promise.all([getPublicRegulatorySignals()])
  const countryMapRecords = projectPublicCountryMapRecords(publicCountryIntelligenceFixtures)
  const featuredSignals = signals.slice(0, 3)

  return (
    <main className="bg-[#020814] text-white">
      <PageHero
        eyebrow="Harbourview Intelligence"
        title="Country intelligence for reviewed market-access decisions."
        primary={{ label: 'Explore Country Map', href: '#country-map' }}
        secondary={{ label: 'View Signals', href: '/signals' }}
        tertiary={{ label: 'Request Intelligence', href: '/intake' }}
        aside={<TrustBoundaryPanel />}
        compact
      >
        <p>
          Intelligence is public-safe commercial context for jurisdiction, pathway and opportunity interpretation. It is not legal advice, guaranteed access or a public feed of private evidence.
        </p>
      </PageHero>

      <div id="country-map" className="border-y border-gold/10 bg-[#020814]">
        <CountryIntelligenceMap countries={countryMapRecords} />
      </div>

      <SectionFrame tone="deep">
        <SectionHeader eyebrow="Signals inside intelligence" title="Regulatory movement is presented as implication, not noise.">
          <p>
            Public signals should help operators understand what changed and what it may mean commercially, while source material, analyst notes and private counterparty context remain controlled.
          </p>
        </SectionHeader>

        {featuredSignals.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {featuredSignals.map((signal) => (
              <IntelligenceSignalCard
                key={signal.id}
                eyebrow={`${signal.country_name} / ${signal.signal_type.replace(/_/g, ' ')}`}
                title={signal.headline}
                meta="Public-safe"
                href="/signals"
              >
                <p>{signal.public_summary}</p>
                <div className="mt-4 rounded-2xl border border-gold/12 bg-black/20 p-4 text-xs leading-6 text-white/52">
                  {signal.public_implication}
                </div>
              </IntelligenceSignalCard>
            ))}
          </div>
        ) : (
          <Surface tone="panel" className="rounded-[1.75rem] p-8 text-center">
            <h2 className="font-serif text-2xl tracking-[-0.03em] text-white">No public intelligence summaries are currently published.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
              Harbourview can review country-specific regulatory movement, route viability and commercial-access signals privately before anything is made public.
            </p>
          </Surface>
        )}
      </SectionFrame>

      <SectionFrame tone="editorial">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <SectionHeader eyebrow="Controlled assessment" title="Need a country brief before entering a market?" className="mb-0">
            <p>
              Harbourview can assess route viability, counterparty fit, opportunity categories and country-specific access constraints before public listing, buyer outreach or wanted-request activation.
            </p>
          </SectionHeader>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/intake">Request Intelligence</ButtonLink>
            <ButtonLink href="/marketplace" variant="secondary">View Network</ButtonLink>
          </div>
        </div>
      </SectionFrame>
    </main>
  )
}
