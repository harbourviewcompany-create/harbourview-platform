import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'

export const metadata: Metadata = {
  title: 'Submit a Listing',
  description:
    'Submit equipment, inventory, cannabis inventory, services, or a business opportunity to the Harbourview marketplace for review.',
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
            {isWanted ? 'Post a Wanted Request' : 'Submit a Listing'}
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isWanted
              ? 'Describe what you need to source — equipment, inventory, inputs or services. Harbourview will review the request before routing it to relevant suppliers or keeping it confidential.'
              : 'Submit equipment, inventory, services, or a business opportunity for review. Listings are assessed before reaching the marketplace and introductions are made to qualified counterparties.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          {isWanted && (
            <div className="mb-6 rounded border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy">
              <strong>Posting a Wanted Request:</strong> Use this form to describe what you need to source. Harbourview will review the request before routing it to relevant suppliers or keeping it confidential. Select &ldquo;Wanted Request&rdquo; as the listing type below.
            </div>
          )}
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
