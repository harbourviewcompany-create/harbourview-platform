import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from '@/lib/contact'
import ConfidentialIntakeForm from './ConfidentialIntakeForm'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

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
        eyebrow="Harbourview Intake"
        title="Confidential intake for introductions, intelligence and controlled market access requests."
        actions={[
          { label: 'Submit Intake', href: '#intake-form' },
          { label: 'Explore Marketplace', href: '/marketplace', variant: 'secondary' },
        ]}
      >
        <p>
          Use this route to submit commercial requirements, market-entry mandates, opportunity briefs, and institutional requests requiring discreet Harbourview review.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Public pages provide orientation only. Contact details and request specifics remain private unless routing is approved.
        </p>
      </PublicHero>

      <PublicSection tone="panel" id="intake-form">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <PublicCard className="p-6 sm:p-8">
            <ConfidentialIntakeForm />
          </PublicCard>

          <aside className="space-y-6">
            <PublicCard className="p-6">
              <h2 className="mb-3 text-base font-semibold text-[#f4f1eb]">Direct Contact</h2>
              <p className="mb-3 text-sm text-white/60">
                For confidential institutional inquiries and qualified opportunities:
              </p>
              <a
                href={CONTACT_MAILTO_HREF}
                className="text-sm text-gold underline hover:text-gold-light"
              >
                {CONTACT_EMAIL}
              </a>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>
    </>
  )
}
