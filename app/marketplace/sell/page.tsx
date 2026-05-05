import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'

export const metadata: Metadata = {
  title: 'Submit Opportunity | Harbourview Network',
  description:
    'Submit equipment, supplies, services or commercial opportunities through Harbourview Network. Seller contact details are not public. Harbourview reviews all submissions.',
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
            {isWanted ? 'Post What You Want to Buy' : 'Submit Opportunity'}
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isWanted
              ? 'Describe what you want to buy — equipment, inventory, inputs or services. Include quantity, location, timing and budget if you can. Harbourview reviews wanted requests before routing supplier responses or keeping the request confidential.'
              : 'Submit equipment, supplies, services, surplus assets or market-specific opportunities for Harbourview Network review. Public visibility and buyer introductions are not automatic. Harbourview reviews category fit, authority and commercial terms before coordinating qualified buyer inquiries.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          {isWanted ? (
            <>
              <div className="mb-6 rounded border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy">
                <strong>Posting a Wanted Request:</strong> Describe what you want to buy, where it is needed, expected volume or budget, timing and any compliance requirements. Harbourview reviews wanted requests before routing supplier responses or keeping the request confidential.
                <p className="mt-2 text-gray-500">
                  Harbourview reviews wanted requests and may route them to relevant suppliers or handle them confidentially. If you request active sourcing support beyond standard Network inquiry handling, separate commercial terms may apply.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 rounded border border-gold/30 bg-gold-pale px-5 py-4 text-sm text-navy">
                <p className="font-semibold mb-2">Seller disclosure - Harbourview Network fees</p>
                <p className="text-gray-700 leading-relaxed">
                  Harbourview Network is a controlled commercial network. If Harbourview brings, routes or supports a qualified buyer or transaction from your submission, Harbourview may earn a commission, referral fee, success fee, margin or other transaction-based compensation. The applicable fee structure is reviewed before introductions or transaction support begin.
                </p>
              </div>
              <div className="mb-6 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <strong className="text-navy">What to include in your listing:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Asking price or price range</li>
                  <li>Estimated transaction value where relevant</li>
                  <li>Quantity and unit of measure</li>
                  <li>Location and whether shipping is available</li>
                  <li>Timing — available now, future, or upon negotiation</li>
                  <li>Condition — new, used, refurbished, surplus</li>
                  <li>Your authority to sell (owner, authorised agent, broker)</li>
                  <li>Whether you accept Harbourview-coordinated introductions</li>
                </ul>
              </div>
              <p className="mb-6 text-xs text-gray-400">
                By submitting, you acknowledge: <em>I understand Harbourview may be compensated if it introduces, routes or supports a buyer or transaction related to my submission.</em>
              </p>
            </>
          )}
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
