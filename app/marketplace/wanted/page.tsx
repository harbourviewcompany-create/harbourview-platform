import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview Marketplace',
  description:
    'Post wanted requests for reviewed, inquiry-first sourcing across equipment, consumables, inventory and services through Harbourview Marketplace.',
  openGraph: {
    title: 'Wanted Requests | Harbourview Marketplace',
    description:
      'Post wanted requests for reviewed, inquiry-first sourcing across equipment, consumables, inventory and services through Harbourview Marketplace.',
  },
}

export default function WantedPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Buyer Wanted Requests</h1>
          <p className="text-gray-300 max-w-2xl">
            Operators can post wanted requests for equipment, consumables,
            inventory, services or operating support. Wanted requests use the
            same reviewed intake form, with the submission positioned around
            buyer demand and sourcing requirements.
          </p>
          <div className="mt-6">
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-primary inline-flex"
              data-testid="wanted-post-request"
            >
              Post a Wanted Request
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Browse Requests</h3>
              <p className="text-gray-500 text-sm">
                Review current buy-side requests from operators. If you can supply
                what a buyer needs, submit a response or related supply listing.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Post a Request</h3>
              <p className="text-gray-500 text-sm">
                Looking for specific equipment, consumables, inventory or
                services? Use the wanted-request intake path and describe what
                you need to source.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Reviewed Routing</h3>
              <p className="text-gray-500 text-sm">
                Harbourview reviews wanted requests before inquiry-first routing,
                supplier follow-up or confidential handling where appropriate.
              </p>
            </div>
          </div>

          {wantedRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No wanted requests are currently listed.</p>
              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-primary"
                data-testid="wanted-post-request"
              >
                Post a Wanted Request
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-navy mb-6">Wanted Requests</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wantedRequests.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}

          <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Have something that matches a request?{' '}
              <Link href="/marketplace/sell" className="text-navy underline hover:text-gold">
                Submit supply for review
              </Link>{' '}
              or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request confidential support
              </Link>
              .
            </p>
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-primary text-sm shrink-0"
              data-testid="wanted-post-request"
            >
              Post a Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
