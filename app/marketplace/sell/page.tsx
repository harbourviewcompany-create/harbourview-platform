import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'
import { FormShell, PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Submit Listing | Harbourview',
  description:
    'Submit supply, services, wanted requests or commercial opportunities through Harbourview Network. Contact details are not public and Harbourview reviews submissions before routing.',
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
      <PublicHero
        eyebrow={isWanted ? 'Wanted Request Intake' : 'Exchange — Submit Listing'}
        title={isWanted ? 'Create a private buyer requirement.' : 'Submit an opportunity for controlled review.'}
        compact
      >
        <p>
          {isWanted
            ? 'You are creating a wanted request. Describe what you want to buy or source, where it is needed, expected volume or budget, timing and any licence, documentation or compliance requirements.'
            : 'Submit supply, services, surplus assets or market-specific opportunities for Harbourview Network review. Public visibility and buyer introductions are not automatic.'}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Harbourview reviews category fit, authority, commercial relevance and routing context before coordinating qualified inquiries.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-3xl">
          {isWanted ? (
            <PublicCard className="mb-7 p-5 text-sm leading-7 text-white/62">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Wanted request mode active
              </p>
              <p>
                Use <strong className="text-white">Wanted Request</strong> as the listing type in the form below. Include requirement, target market, timing, budget range and any licence, documentation or compliance requirements. Supplier response, availability, pricing, introductions and transaction terms are not guaranteed.
              </p>
            </PublicCard>
          ) : (
            <>
              <PublicCard className="mb-7 p-5 text-sm leading-7 text-white/62">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                  Submission disclosure - Harbourview Network fees
                </p>
                <p>
                  Harbourview Network is a controlled commercial network. If Harbourview brings, routes or supports a qualified buyer, supplier response, introduction or transaction from your submission, Harbourview may earn a commission, referral fee, success fee, margin or other transaction-based compensation. The applicable fee structure is reviewed before introductions or transaction support begin.
                </p>
              </PublicCard>

              <PublicCard muted className="mb-7 p-5 text-sm leading-7 text-white/58">
                <strong className="text-[#f4f1eb]">What to include in your submission:</strong>
                <ul className="mt-3 list-inside list-disc space-y-1">
                  <li>Asking price, price range or expected commercial terms where relevant</li>
                  <li>Estimated transaction value where relevant</li>
                  <li>Quantity and unit of measure</li>
                  <li>Location and whether shipping, export or market-specific routing is available</li>
                  <li>Timing — available now, future or upon negotiation</li>
                  <li>Condition — new, used, refurbished, surplus or confidential opportunity</li>
                  <li>Your authority to sell, represent or submit the opportunity</li>
                  <li>Whether you accept Harbourview-coordinated introductions</li>
                </ul>
              </PublicCard>

              <p className="mb-7 text-xs leading-6 text-white/44">
                By submitting, you acknowledge: <em>I understand Harbourview may be compensated if it introduces, routes or supports a buyer, supplier response, introduction or transaction related to my submission. Submission does not guarantee publication, availability, introduction, transaction completion or legal/regulatory outcome.</em>
              </p>
            </>
          )}
          <FormShell>
            <IntakeForm />
          </FormShell>
        </div>
      </PublicSection>
    </>
  )
}
