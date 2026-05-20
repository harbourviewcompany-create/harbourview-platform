import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Logistics & Trade Routes | Harbourview Intelligence',
  description: 'Trade route context, logistics pathway orientation and documentation framework summaries for regulated cannabis corridors.',
}

export default function LogisticsTradeRoutesPage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Logistics & Trade Routes"
        actions={[{ label: 'Request Logistics Intelligence', href: '/contact' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Trade route information is orientation-level only. Customs, transport and documentation requirements must be verified with qualified operators and advisors.</p>
          </PublicCard>
        }
      >
        Trade route context, logistics pathway orientation and documentation framework summaries for regulated cannabis export and import corridors.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Route orientation" title="Trade-route context before route-specific diligence.">
          Harbourview frames logistics and trade-route questions across corridor feasibility, documentation expectations and qualified operator review without publishing sensitive route detail.
        </SectionHeader>
        <PublicCard muted className="p-6 text-sm leading-7 text-white/62">
          Public logistics intelligence does not confirm customs clearance, transport availability, documentation sufficiency or corridor viability.
        </PublicCard>
      </PublicSection>

      <FooterCta eyebrow="Logistics intelligence" title="Need logistics or trade-route context?" actions={[{ label: 'Request Logistics Intelligence', href: '/contact' }]}>Harbourview can route logistics questions into reviewed workflows before operational engagement or public commercial activity.</FooterCta>
    </main>
  )
}
