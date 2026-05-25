import type { Metadata } from 'next'
import Link from 'next/link'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence',
  description:
    'Harbourview provides market access backed by intelligence and relationships across controlled-market pathways.',
}

const pathwayCards = [
  {
    title: 'Marketplace pathways',
    body: 'Reviewed opportunities and wanted requests designed for controlled introductions, not open listing exposure.',
    href: '/marketplace',
    cta: 'Open marketplace',
  },
  {
    title: 'Intelligence pathways',
    body: 'Country, route and commercial context framed for institutional decisions and discreet market timing.',
    href: '/intelligence',
    cta: 'Open intelligence',
  },
  {
    title: 'Confidential intake',
    body: 'Route sensitive requests through a private review process before introductions or commercial follow-up.',
    href: '/intake',
    cta: 'Start intake',
  },
]

export default function HomePage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Harbourview"
        title="Market access backed by intelligence and relationships."
        actions={[
          { label: 'Enter Marketplace', href: '/marketplace' },
          { label: 'View Signals', href: '/signals', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview supports commercial participants with controlled marketplace access, country intelligence and confidential routing for buyer and seller pathways.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Public pages provide reviewed summaries only. Counterparties, source-sensitive context and private workflow details remain gated through confidential review.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Core pathways" title="Built for commercial action without public oversharing." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pathwayCards.map((card) => (
            <PublicCard key={card.title} className="flex min-h-[230px] flex-col rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold/70">Reviewed marketplace pathway</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-100">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">{card.body}</p>
              <Link href={card.href} className="mt-auto pt-5 text-sm font-semibold text-gold hover:text-gold-light">
                {card.cta} →
              </Link>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Commercial next step"
        title="Ready for a controlled market access discussion?"
        actions={[
          { label: 'Request an Introduction', href: '/intake' },
          { label: 'Submit Matching Supply', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        Harbourview coordinates confidential commercial inquiry flows with discreet buyer-seller routing and relationship-led market access.
      </FooterCta>
    </main>
  )
}
