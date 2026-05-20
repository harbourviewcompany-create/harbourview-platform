import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Counterparty Intelligence | Harbourview Intelligence',
  description: 'Reviewed counterparty context for regulated-market importers, distributors, licensed producers, procurement bodies and institutional buyers.',
}

export default function CounterpartyIntelligencePage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Counterparty Intelligence"
        actions={[{ label: 'Request Counterparty Intelligence', href: '/intake' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Counterparty intelligence is handled through reviewed private workflows. No counterparty is publicly identified without consent.</p>
          </PublicCard>
        }
      >
        Reviewed counterparty context for importers, distributors, licensed producers, procurement bodies and institutional buyers in regulated markets.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Private workflow" title="Counterparty context belongs behind review controls.">
          Public pages explain the workflow. Sensitive company names, contact paths, route evidence, diligence findings and commercial context are handled privately.
        </SectionHeader>
        <PublicCard muted className="p-6 text-sm leading-7 text-white/62">
          Harbourview uses controlled intake for counterparty intelligence to preserve confidentiality, consent boundaries and review discipline.
        </PublicCard>
      </PublicSection>

      <FooterCta eyebrow="Counterparty review" title="Need reviewed counterparty intelligence?" actions={[{ label: 'Request Counterparty Intelligence', href: '/intake' }]}>Use confidential intake when the request involves counterparties, routes, commercial context, sensitive diligence or protected introductions.</FooterCta>
    </main>
  )
}
