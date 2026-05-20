import type { Metadata } from 'next'
import Link from 'next/link'
import { FormShell, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import { GENERIC_PUBLIC_DISCLAIMER, INTAKE_REVIEW_GATING_COPY } from '@/lib/content/complianceCopy'
import ConfidentialIntakeForm from './ConfidentialIntakeForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Confidential Intake',
  description:
    'Submit a confidential Harbourview inquiry for market access, commercial intelligence, and qualified introductions.',
}

export default function IntakePage() {
  return (
    <>
      <PublicHero
        eyebrow="Confidential intake"
        title="Route sensitive commercial and market-access requests for review."
        compact
        aside={
          <PublicCard className="p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
              Reviewed handling
            </p>
            <p className="text-sm leading-7 text-white/58">
              {INTAKE_REVIEW_GATING_COPY}
            </p>
          </PublicCard>
        }
      >
        <p>
          Share qualified opportunities, commercial requirements, intelligence questions or confidential market-access inquiries without exposing sensitive details on public pages.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Harbourview does not publish intake details, private counterparties, document materials or route-sensitive context.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <FormShell>
            <ConfidentialIntakeForm />
          </FormShell>

          <aside className="space-y-6">
            <PublicCard className="p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Routing paths
              </p>
              <ul className="space-y-3 text-sm leading-6 text-white/60">
                <li className="border-l border-gold/30 pl-4">Buyer demand, wanted requests and qualified supply discovery.</li>
                <li className="border-l border-gold/30 pl-4">Seller, exporter, equipment, services or distressed-asset submissions.</li>
                <li className="border-l border-gold/30 pl-4">Market, company, route, policy or counterparty intelligence requests.</li>
                <li className="border-l border-gold/30 pl-4">Institutional, professional, education or association collaboration.</li>
              </ul>
            </PublicCard>

            <PublicCard muted className="p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Public boundary
              </p>
              <p className="text-sm leading-7 text-white/56">
                {`Submission does not guarantee a response, buyer, seller, route, transaction or introduction. ${GENERIC_PUBLIC_DISCLAIMER} For non-sensitive questions, use the contact page.`}
              </p>
              <Link href="/contact" className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:text-gold-light">
                Contact Harbourview
              </Link>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>
    </>
  )
}
