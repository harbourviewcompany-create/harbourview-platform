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
              ? 'Looking for specific equipment, inventory, or services? Post a wanted request below — select "Wanted Request" as the listing type. Harbourview will match you with qualified suppliers.'
              : 'Submit equipment, inventory, services, or a business opportunity for review. Listings are assessed before reaching the marketplace and introductions are made to qualified counterparties.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          {isWanted && (
            <div className="mb-6 rounded border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy">
              <strong>Posting a Wanted Request:</strong> Select &ldquo;Wanted Request&rdquo; as the
              listing type below and describe what you are looking to source.
            </div>
          )}
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
