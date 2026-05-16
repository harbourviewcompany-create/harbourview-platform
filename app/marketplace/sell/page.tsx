import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'
import { PageHero, SectionFrame, SectionHeader, Surface, TrustBoundaryPanel } from '@/components/design-system/Institutional'

export const metadata: Metadata = {
  title: 'Submit Opportunity | Harbourview Network',
  description:
    'Submit supply, services, buyer demand or commercial opportunities through Harbourview Network. Contact details are not public and Harbourview reviews submissions before routing.',
}

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const isWanted = params.type === 'wanted'

  return (
    <>
      <PageHero
        eyebrow={isWanted ? 'Buyer demand review' : 'Opportunity review'}
        title={isWanted ? 'Submit a wanted request through controlled review.' : 'Submit a commercial opportunity for controlled review.'}
        primary={{ label: isWanted ? 'Complete Wanted Request' : 'Complete Opportunity Submission', href: '#submission' }}
        secondary={{ label: 'Confidential Intake', href: '/intake' }}
        aside={<TrustBoundaryPanel />}
        compact
      >
        <p>
          Contact details are not public. Harbourview reviews submissions before publication, routing or any counterparty follow-up.
        </p>
      </PageHero>

      <SectionFrame tone="editorial" id="submission">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeader eyebrow="Submission boundary" title="Provide only what is appropriate for first review." className="mb-0">
              <p>
                Use this form for public-safe opportunity or wanted-request intake. Highly sensitive details, exclusive terms, private counterparties and source evidence should move through confidential review.
              </p>
            </SectionHeader>
            <Surface tone="form" className="mt-6 rounded-[1.5rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f7130]">Before routing</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#435066]">
                <li>• Public display is not automatic.</li>
                <li>• Harbourview may request clarification before publication or introduction.</li>
                <li>• Private evidence and contact details must remain off public routes.</li>
              </ul>
            </Surface>
          </div>
          <IntakeForm defaultListingType={isWanted ? 'wanted' : undefined} />
        </div>
      </SectionFrame>
    </>
  )
}
