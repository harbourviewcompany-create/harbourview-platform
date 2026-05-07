import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'

export const metadata: Metadata = {
  title: 'Submit Opportunity | Harbourview Network',
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
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              {isWanted ? 'Wanted Request Intake' : 'Harbourview Network Submission'}
            </p>
            <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              {isWanted ? 'Create a private buyer requirement.' : 'Submit an opportunity for controlled review.'}
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              {isWanted
                ? 'You are creating a wanted request. Describe what you want to buy or source, where it is needed, expected volume or budget, timing and any licence, documentation or compliance requirements. Harbourview reviews wanted requests before supplier routing and may keep requests confidential.'
                : 'Submit supply, services, surplus assets, supplier profiles or market-specific opportunities for Harbourview Network review. Public visibility and buyer introductions are not automatic. Harbourview reviews category fit, authority, commercial relevance and routing context before coordinating qualified inquiries.'}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-12 sm:py-16">
        <div className="page-container max-w-3xl">
          {isWanted ? (
            <div className="mb-7 rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] px-5 py-5 text-sm leading-7 text-white/62 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Wanted request mode active
              </p>
              <p>
                Use <strong className="text-white">Wanted Request</strong> as the listing type in the form below. Include requirement, target market, timing, budget range and any licence, documentation or compliance requirements. Supplier response, availability, pricing, introductions and transaction terms are not guaranteed.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7 rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] px-5 py-5 text-sm leading-7 text-white/62 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                  Submission disclosure - Harbourview Network fees
                </p>
                <p>
                  Harbourview Network is a controlled commercial network. If Harbourview brings, routes or supports a qualified buyer, supplier response, introduction or transaction from your submission, Harbourview may earn a commission, referral fee, success fee, margin or other transaction-based compensation. The applicable fee structure is reviewed before introductions or transaction support begin.
                </p>
              </div>
              <div className="mb-7 rounded-sm border border-gold/10 bg-[#071425] px-5 py-5 text-sm leading-7 text-white/58">
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
              </div>
              <p className="mb-7 text-xs leading-6 text-white/44">
                By submitting, you acknowledge: <em>I understand Harbourview may be compensated if it introduces, routes or supports a buyer, supplier response, introduction or transaction related to my submission. Submission does not guarantee publication, availability, introduction, transaction completion or legal/regulatory outcome.</em>
              </p>
            </>
          )}
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
