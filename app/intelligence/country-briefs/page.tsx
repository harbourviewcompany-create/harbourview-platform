import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Country Briefs | Harbourview Intelligence',
  description: 'Jurisdiction-level regulatory and market orientation for priority cannabis markets.',
}

export default function CountryBriefsPage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Country Briefs"
        actions={[{ label: 'Request a Country Brief', href: '/contact' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Country brief content is orientation-level only. Route claims, counterparty details and commercial specifics are handled through reviewed private workflows.</p>
          </PublicCard>
        }
      >
        Jurisdiction-level regulatory and market orientation for priority cannabis markets. Briefs cover access pathway status, regulatory framework, licensing structure and commercial route context.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Coverage" title="Jurisdiction context without public exposure of sensitive evidence.">
          Country briefs organize public-safe orientation across market access, licensing posture, regulatory framework and route context before deeper private review.
        </SectionHeader>
        <PublicCard muted className="p-6 text-sm leading-7 text-white/62">
          Public country intelligence is designed to help operators understand what to ask next, not to replace legal, regulatory, logistics or counterparty diligence.
        </PublicCard>
      </PublicSection>

      <FooterCta eyebrow="Country intelligence" title="Need a country brief before entering a market?" actions={[{ label: 'Request a Country Brief', href: '/contact' }]}>Harbourview can review country context and route questions through controlled workflows before public listing, outreach or commercial activation.</FooterCta>
    </main>
  )
}
