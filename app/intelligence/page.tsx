import Link from 'next/link'
import type { Metadata } from 'next'

import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { CountryIntelligenceMap } from '@/components/intelligence/CountryIntelligenceMap'
import { getCountriesAsMapRecords } from '@/lib/server/countriesQuery'
import { countryIntelligenceFixtures } from '@/lib/intelligence/fixtures'

export const metadata: Metadata = {
  title: 'Cannabis Market Intelligence — Country Pathways & Regulatory Signals',
  description:
    'Reviewed regional intelligence covering Europe, APAC, MENA, Americas and Africa. Country pathway context, regulatory signals and controlled market-access requests.',
  openGraph: {
    title: 'Cannabis Market Intelligence — Country Pathways & Signals | Harbourview',
    description:
      'Reviewed regional intelligence covering Europe, APAC, MENA, Americas and Africa. Country pathway context, regulatory signals and controlled market-access requests.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview Intelligence — Cannabis Markets & Pathways',
    description:
      'Country-level cannabis market intelligence. Reviewed pathway context for Europe, APAC, Americas, MENA and Africa.',
  },
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
        title="Where is the market today — and what does it take to enter?"
        actions={[
          { label: 'Request a country brief', href: '/contact' },
          { label: 'Start confidential intake', href: '/intake', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>
              Intelligence summaries are reviewed for public-safe publication. Detailed evidence, private contacts,
              and analyst notes are handled through controlled private requests.
            </p>
          </PublicCard>
        }
      >
        Harbourview Intelligence covers country pathway status, regulatory signals, import and export conditions,
        and commercial timing context across global regulated cannabis markets. Coverage is public-safe and reviewed —
        it provides commercial orientation, not legal advice or guaranteed access.
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
          <SectionHeader eyebrow="Recent signals" title="Policy and regulatory signals — what's moving and where.">
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
        <SectionHeader eyebrow="How intelligence requests work" title="Reviewed access without public exposure.">
          Intelligence surfaces are designed to support commercial decision-making without publishing sensitive material.
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowRoutes.map((route) => (
            <PublicLinkCard key={route.href} title={route.title} href={route.href} body={route.body} />
          ))}
        </div>
      </PublicSection>

      <FooterCta
        title="Need to know if a market is worth pursuing before committing resources?"
        body="Harbourview can review route viability, assess counterparty fit, and map country-specific access constraints before you commit to outreach, listing, or engagement."
        actions={[{ label: 'Request a country brief', href: '/contact' }]}
      />
    </main>
  )
}
