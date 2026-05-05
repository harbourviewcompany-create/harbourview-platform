import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Post What You Want to Buy | Harbourview Marketplace',
  description:
    'Post a wanted request on Harbourview Marketplace. Describe what you want to buy and Harbourview will review and route supplier responses privately.',
  openGraph: {
    title: 'Post What You Want to Buy | Harbourview Marketplace',
    description:
      'Post a wanted request and Harbourview will route supplier responses privately.',
  },
}

export default function WantedPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Post What You Want to Buy</h1>
          <p className="text-gray-300 max-w-2xl mb-6">
            Describe what you want to buy — equipment, inventory, inputs or services. Harbourview reviews wanted requests and routes them to relevant suppliers or handles them confidentially. Your contact details are not shared with suppliers before Harbourview coordinates a response.
          </p>
          <Link href="/marketplace/sell?type=wanted" className="btn-primary inline-flex">
            Post What You Want to Buy
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Describe what you need</h3>
              <p className="text-gray-500 text-sm">
                Submit what you want to buy — quantity, location, timing, budget and any compliance requirements. Be specific to improve supplier routing.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Harbourview reviews</h3>
              <p className="text-gray-500 text-sm">
                Wanted requests use the same reviewed intake form as seller listings. Harbourview screens for category fit and commercial relevance before routing.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Private supplier routing</h3>
              <p className="text-gray-500 text-sm">
                Harbourview routes requests to relevant suppliers privately. Your contact details are not shared before Harbourview coordinates a response. If you need active sourcing beyond standard routing, separate commercial terms may apply.
              </p>
            </div>
          </div>

          {wantedRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No wanted requests are currently listed.</p>
              <Link href="/marketplace/sell?type=wanted" className="btn-primary">
                Post What You Want to Buy
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
              Have supply that matches a request?{' '}
              <Link href="/marketplace/sell" className="text-navy underline hover:text-gold">
                List it for sale
              </Link>
              {' '}or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request confidential support
              </Link>
              .
            </p>
            <Link href="/marketplace/sell?type=wanted" className="btn-primary text-sm shrink-0">
              Post What You Want to Buy
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
