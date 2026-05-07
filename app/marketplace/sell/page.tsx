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
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isWanted ? 'Create Wanted Request' : 'Submit Opportunity'}
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isWanted
              ? 'Describe buyer or operator demand for equipment, inventory, inputs, services or market-specific requirements. Include quantity, location, timing, budget range and any licence, documentation or compliance requirements where relevant. Harbourview reviews wanted requests before supplier routing and may keep requests confidential.'
              : 'Submit supply, services, surplus assets, supplier profiles or market-specific opportunities for Harbourview Network review. Public visibility and buyer introductions are not automatic. Harbourview reviews category fit, authority, commercial relevance and routing context before coordinating qualified inquiries.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          {isWanted ? (
            <>
              <div className="mb-6 rounded border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy">
                <strong>Creating a Wanted Request:</strong> Describe what you want to buy, where it is needed, expected volume or budget, timing and any licence, documentation or compliance requirements. Harbourview reviews wanted requests before routing supplier responses or keeping the request confidential.
                <p className="mt-2 text-gray-500">
                  Submission does not guarantee supplier response, availability, pricing, introductions or transaction terms. If you request active sourcing beyond standard Network inquiry handling, separate commercial terms may apply.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 rounded border border-gold/30 bg-gold-pale px-5 py-4 text-sm text-navy">
                <p className="font-semibold mb-2">Submission disclosure - Harbourview Network fees</p>
                <p className="text-gray-700 leading-relaxed">
                  Harbourview Network is a controlled commercial network. If Harbourview brings, routes or supports a qualified buyer, supplier response, introduction or transaction from your submission, Harbourview may earn a commission, referral fee, success fee, margin or other transaction-based compensation. The applicable fee structure is reviewed before introductions or transaction support begin.
                </p>
              </div>
              <div className="mb-6 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <strong className="text-navy">What to include in your submission:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Asking price, price range or expected commercial terms where relevant</li>
                  <li>Estimated transaction value where relevant</li>
                  <li>Quantity and unit of measure</li>
                  <li>Location and whether shipping, export or market-specific routing is available</li>
                  <li>Timing — available now, future, or upon negotiation</li>
                  <li>Condition — new, used, refurbished, surplus or confidential opportunity</li>
                  <li>Your authority to sell, represent or submit the opportunity</li>
                  <li>Whether you accept Harbourview-coordinated introductions</li>
                </ul>
              </div>
              <p className="mb-6 text-xs text-gray-400">
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
