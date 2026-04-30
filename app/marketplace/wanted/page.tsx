import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Buyer Wanted Requests',
  description:
    'Browse active buy-side requests from operators seeking equipment, inventory, and services. Post your own wanted request through the Harbourview marketplace.',
}

export default function WantedPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Buyer Wanted Requests</h1>
          <p className="text-gray-300 max-w-2xl">
            Active buy-side requests from operators seeking specific equipment,
            inventory, and services. Browse existing requests or post your own
            through the seller intake form.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Browse Requests</h3>
              <p className="text-gray-500 text-sm">
                Review active buy-side requests from operators. If you can supply
                what a buyer needs, submit a listing referencing the request.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Post a Request</h3>
              <p className="text-gray-500 text-sm">
                Looking for specific equipment, inventory, or services? Submit a
                wanted request through the seller intake form — select &quot;Wanted
                Request&quot; as the listing type.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Managed Introductions</h3>
              <p className="text-gray-500 text-sm">
                Harbourview facilitates introductions between screened buyers and
                sellers. Confidentiality is maintained throughout.
              </p>
            </div>
          </div>

          {/* Active requests */}
          {wantedRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No active wanted requests.</p>
              <Link href="/marketplace/sell" className="btn-primary">
                Post a Wanted Request
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-navy mb-6">Active Requests</h2>
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
                Submit a listing
              </Link>{' '}
              or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request a confidential introduction
              </Link>
              .
            </p>
            <Link href="/marketplace/sell" className="btn-primary text-sm shrink-0">
              Post a Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
