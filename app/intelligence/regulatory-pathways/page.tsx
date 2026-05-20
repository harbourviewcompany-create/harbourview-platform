import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Regulatory Pathways | Harbourview Intelligence',
  description: 'Regulatory access pathway mapping across medical, pharmaceutical, research and adult-use frameworks.',
}

export default function RegulatoryPathwaysPage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Regulatory Pathways"
        actions={[{ label: 'Request Regulatory Pathway Intelligence', href: '/contact' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Regulatory pathway content is orientation and context only. Not legal advice.</p>
          </PublicCard>
        }
      >
        Regulatory access pathway mapping across medical, pharmaceutical, research and adult-use frameworks in priority markets.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Framework mapping" title="Public-safe orientation across regulated access models.">
          Harbourview organizes regulatory pathway context so operators can understand medical, pharmaceutical, research and adult-use framework questions before deeper review.
        </SectionHeader>
        <PublicCard muted className="p-6 text-sm leading-7 text-white/62">
          Public pathway summaries do not represent approvals, route guarantees, legal opinions, commercial clearance or regulatory authorization.
        </PublicCard>
      </PublicSection>

      <FooterCta eyebrow="Regulatory intelligence" title="Need regulatory pathway context before entering a market?" actions={[{ label: 'Request Regulatory Pathway Intelligence', href: '/contact' }]}>Harbourview can review pathway questions through controlled workflows and keep sensitive route analysis private.</FooterCta>
    </main>
  )
}
