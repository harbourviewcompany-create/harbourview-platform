import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview Network',
  description:
    'Create a wanted request through Harbourview Network. Describe buyer or operator demand and Harbourview will review before routing supplier responses privately.',
  openGraph: {
    title: 'Wanted Requests | Harbourview Network',
    description:
      'Create a wanted request and Harbourview will review before routing supplier responses privately.',
  },
}

export default function WantedPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Wanted Requests</h1>
          <p className="text-gray-300 max-w-2xl mb-6">
            Describe buyer or operator demand for equipment, inventory, inputs, services
            or market-specific requirements. Harbourview reviews wanted requests before
            any supplier routing. Your contact details are not shared before Harbourview
            coordinates a response.
          </p>
          <Link href="/marketplace/sell?type=wanted" className="btn-primary inline-flex">
            Create Wanted Request
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Describe the requirement</h3>
              <p className="text-gray-500 text-sm">
                Submit category, quantity, target market, timing, budget range and any licence, documentation or compliance requirements.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Harbourview reviews</h3>
              <p className="text-gray-500 text-sm">
                Wanted requests are reviewed for fit, commercial relevance and routing context before any supplier response is coordinated.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Private supplier routing</h3>
              <p className="text-gray-500 text-sm">
                Harbourview may route requests to relevant suppliers privately. Submission does not guarantee supplier response, availability, pricing or transaction terms.
              </p>
            </div>
          </div>

          {wantedRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No wanted requests are currently listed.</p>
              <Link href="/marketplace/sell?type=wanted" className="btn-primary">
                Create Wanted Request
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-navy mb-6">Current Wanted Requests</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wantedRequests.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}

          <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Have supply that may fit a request?{' '}
              <Link href="/marketplace/sell" className="text-navy underline hover:text-gold">
                Submit the opportunity
              </Link>
              {' '}or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request confidential support
              </Link>
              .
            </p>
            <Link href="/marketplace/sell?type=wanted" className="btn-primary text-sm shrink-0">
              Create Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
