import type { Metadata } from 'next'

import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'
import { CountryIntelligenceMap } from '@/components/intelligence/CountryIntelligenceMap'
import { getCountriesAsMapRecords } from '@/lib/server/countriesQuery'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'


export const metadata: Metadata = {
  title: 'Cannabis Market Intelligence — Country Pathways & Regulatory Signals',
  description:
    'Reviewed alpha intelligence for repository-backed priority jurisdictions. Country pathway context, regulatory signals and controlled market-access requests.',
  openGraph: {
    title: 'Cannabis Market Intelligence — Country Pathways & Signals | Harbourview',
    description:
      'Reviewed alpha intelligence for repository-backed priority jurisdictions. Country pathway context, regulatory signals and controlled market-access requests.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview Intelligence — Cannabis Markets & Pathways',
    description:
      'Country-level cannabis market intelligence for repository-backed alpha coverage. Reviewed pathway context for represented jurisdictions only.',
  },
}

const workflowRoutes = [
  {
    title: 'Country Briefs',
    href: '/intelligence/country-briefs',
    body: 'Jurisdiction-level regulatory orientation briefs covering access pathway status, licensing structure and commercial route context.',
  },
  {
    title: 'Regulatory Pathways',
    href: '/intelligence/regulatory-pathways',
    body: 'Access model mapping, competent authority roles and pathway framework orientation across medical, pharmaceutical and adult-use markets.',
  },
  {
    title: 'Licensing Pathways',
    href: '/intelligence/licensing-pathways',
    body: 'Licence categories, authorisation requirements and pathway questions across cultivation, processing, import, export and distribution.',
  },
  {
    title: 'Logistics & Trade Routes',
    href: '/intelligence/logistics-trade-routes',
    body: 'Trade corridor orientation, documentation frameworks, cold chain requirements and qualified operator categories for regulated cannabis corridors.',
  },
  {
    title: 'Counterparty Intelligence',
    href: '/intelligence/counterparty-intelligence',
    body: 'Reviewed operator role context, importer/distributor alignment and due diligence orientation without publishing private identities or dossiers.',
  },
  {
    title: 'Signals',
    href: '/signals',
    body: 'Regulatory signal monitoring, policy development and route-condition tracking for priority jurisdictions.',
  },
  {
    title: 'Watchlists',
    href: '/intelligence/watchlists',
    body: 'Controlled tracking of markets, counterparties, categories and routes without turning the public site into a live dossier.',
  },
  {
    title: 'Source Engine',
    href: '/intelligence/source-engine',
    body: 'Submit market, company, policy, counterparty and route questions into a reviewed public-safe workflow without exposing analyst evidence.',
  },
] as const

export default async function IntelligencePage() {
  const [mapRecords, signals] = await Promise.all([
    getCountriesAsMapRecords(),
    getPublicRegulatorySignals(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countries: any[] = mapRecords.length > 0 ? mapRecords : publicCountryIntelligenceFixtures

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
              Intelligence summaries are reviewed for public-safe publication. Detailed evidence, non-public contact paths,
              and analyst notes are handled through controlled private requests.
            </p>
          </PublicCard>
        }
      >
        Harbourview Intelligence covers country pathway status, regulatory signals, import and export conditions,
        and commercial timing context across tracked alpha jurisdictions represented in repository data. Coverage is public-safe, partial and reviewed —
        it provides commercial orientation, not legal advice or guaranteed access.
      </PublicHero>

      {countries.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Market map" title={`${countries.length} jurisdictions tracked`}>
            Select a represented jurisdiction to view pathway status, regulatory framework and opportunity orientation. This map is an alpha coverage view, not a claim of complete global country coverage.
          </SectionHeader>
          <CountryIntelligenceMap countries={countries} />
        </PublicSection>
      )}

      {signals.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Recent signals" title="Policy and regulatory signals — what&apos;s moving and where.">
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
        <SectionHeader eyebrow="Intelligence modules" title="Reviewed access without public exposure.">
          Intelligence surfaces are designed to support commercial decision-making without publishing sensitive material.
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowRoutes.map((route) => (
            <PublicLinkCard key={route.href} title={route.title} href={route.href}>
              {route.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Intelligence access"
        title="Need to know if a market is worth pursuing?"
        actions={[{ label: 'Request a country brief', href: '/contact' }]}
      >
        Harbourview reviews route viability, counterparty fit and country-specific access constraints before you commit to outreach, listing or engagement.
      </FooterCta>
    </main>
  )
}
