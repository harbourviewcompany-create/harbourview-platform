import type { Metadata } from 'next'

import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { CountryIntelligenceMap } from '@/components/intelligence/CountryIntelligenceMap'
import { getCountriesAsMapRecords } from '@/lib/server/countriesQuery'
import { countryIntelligenceFixtures } from '@/lib/intelligence/fixtures'

export const metadata: Metadata = {
  title: 'Intelligence | Harbourview',
  description: 'Country and regional intelligence for reviewed commercial pathways, opportunity categories and controlled market access requests.',
}

const workflowRoutes = [
  {
    title: 'Source Engine',
    href: '/intelligence/source-engine',
    body: 'Submit market, company, policy, counterparty and route questions into a reviewed public-safe workflow without exposing analyst evidence.',
  },
  {
    title: 'Country Briefs',
    href: '/intelligence/country-briefs',
    body: 'Jurisdiction-level regulatory orientation briefs covering access pathway status, licensing structure and commercial route context.',
  },
  {
    title: 'Signals',
    href: '/contact',
    body: 'Regulatory signal monitoring, policy development, counterparty intelligence and route-condition tracking for priority jurisdictions.',
  },
] as const

export default async function IntelligencePage() {
  const [mapRecords, signals] = await Promise.all([
    getCountriesAsMapRecords(),
    getPublicRegulatorySignals(),
  ])

  const countries = mapRecords.length > 0 ? mapRecords : countryIntelligenceFixtures

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Harbourview Intelligence"
        title="Country intelligence without public exposure of sensitive evidence."
        actions={[
          { label: 'Request Intelligence Review', href: '/contact' },
          { label: 'Speak Confidentially', href: '/intake', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>
              Public intelligence surfaces orientation material only. Route claims, counterparty details,
              source evidence and commercial specifics are handled through reviewed private workflows.
            </p>
          </PublicCard>
        }
      >
        Jurisdiction monitoring, pathway intelligence and regulated market orientation
        for operators building in controlled cannabis markets globally.
      </PublicHero>

      {countries.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Market map" title={`${countries.length} jurisdictions tracked`}>
            Select a country to view pathway status, regulatory framework and opportunity orientation.
          </SectionHeader>
          <CountryIntelligenceMap countries={countries} />
        </PublicSection>
      )}

      {signals.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Recent signals" title="Regulatory signal activity">
            Public-safe summaries of recent regulatory and market developments across priority jurisdictions.
          </SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.slice(0, 6).map((signal) => (
              <PublicCard key={signal.id} className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold/70">{signal.country_name}</span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/40">{signal.signal_date}</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{signal.headline}</p>
                {signal.public_implication && (
                  <p className="text-xs text-white/50 leading-relaxed border-t border-white/10 pt-3">{signal.public_implication}</p>
                )}
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Intelligence workflows" title="Reviewed access without public exposure.">
          Intelligence surfaces are designed to support commercial decision-making without publishing sensitive material.
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowRoutes.map((route) => (
            <PublicLinkCard key={route.href} title={route.title} href={route.href} body={route.body} />
          ))}
        </div>
      </PublicSection>

      <FooterCta
        title="Need jurisdiction-specific intelligence?"
        actions={[{ label: 'Request Intelligence Review', href: '/contact' }]}
      >
        Submit a private request. Harbourview reviews context before responding with any market, counterparty or route intelligence.
      </FooterCta>
    </main>
  )
}
