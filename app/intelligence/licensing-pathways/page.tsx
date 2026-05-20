import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Licensing Pathways | Harbourview Intelligence',
  description: 'Regulatory licensing pathway context for import, export, cultivation, processing and distribution.',
}

export default function LicensingPathwaysPage() {
  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Intelligence"
        title="Licensing Pathways"
        actions={[{ label: 'Request Licensing Pathway Intelligence', href: '/contact' }]}
        aside={
          <PublicCard className="p-6 text-sm leading-7 text-white/62">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">Trust boundary</p>
            <p>Licensing pathway information is orientation-level. Harbourview does not provide legal advice. Operators should verify requirements with qualified local advisors.</p>
          </PublicCard>
        }
      >
        Regulatory licensing pathway context for import, export, cultivation, processing and distribution across priority jurisdictions.
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Pathway context" title="Licensing orientation for regulated-market planning.">
          This page orients users around licence categories, pathway questions, route readiness and jurisdiction-specific review needs without publishing private route analysis.
        </SectionHeader>
        <PublicCard muted className="p-6 text-sm leading-7 text-white/62">
          Licensing content is a starting point for structured review. It does not confirm eligibility, authorization, approval, route viability or legal sufficiency.
        </PublicCard>
      </PublicSection>

      <FooterCta eyebrow="Licensing intelligence" title="Need licensing pathway context for a priority market?" actions={[{ label: 'Request Licensing Pathway Intelligence', href: '/contact' }]}>Harbourview can route licensing questions into reviewed workflows before commercial action or counterparty engagement.</FooterCta>
    </main>
  )
}
