import type { Metadata } from 'next'
import IntakeForm from '@/app/intake/IntakeForm'

export const metadata: Metadata = {
  title: 'Submit Supply or Wanted Request | Harbourview Marketplace',
  description:
    'Submit supply, supplier opportunities or wanted requests to Harbourview Marketplace for reviewed, inquiry-first routing.',
  openGraph: {
    title: 'Submit Supply or Wanted Request | Harbourview Marketplace',
    description:
      'Submit supply, supplier opportunities or wanted requests to Harbourview Marketplace for reviewed, inquiry-first routing.',
  },
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
            {isWanted ? 'Post a Wanted Request' : 'Submit Supply for Review'}
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isWanted
              ? 'Use this form to describe what you need to source. Harbourview will review the request before routing it to relevant suppliers or keeping it confidential.'
              : 'Submit equipment, inventory, services or a business opportunity for review. Harbourview assesses category fit and routes appropriate opportunities through inquiry-first follow-up.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-2xl">
          {isWanted && (
            <div className="mb-6 rounded border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy">
              <strong>Posting a Wanted Request:</strong> Use this form to describe what you
              need to source. Harbourview will review the request before routing it to
              relevant suppliers or keeping it confidential.
            </div>
          )}
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
