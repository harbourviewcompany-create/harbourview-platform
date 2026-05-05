import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview Marketplace',
  description:
    'Post a wanted request to surface supply through Harbourview. Browse screened buy-side requests from operators seeking equipment, inventory and services.',
}

export default function WantedPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Wanted Requests</h1>
          <p className="text-gray-300 max-w-2xl mb-6">
            Browse screened buy-side requests from operators seeking equipment, inventory and services — or post your own wanted request. Harbourview reviews each request and routes it through inquiry-first follow-up before any supplier contact.
          </p>
          <Link href="/marketplace/sell?type=wanted" className="btn-primary">
            Post a Wanted Request
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Post a Request</h3>
              <p className="text-gray-500 text-sm">
                Describe what you need to source — equipment, inventory, inputs or services. Use the wanted request form and Harbourview will review the submission before routing it to relevant suppliers.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Screened Intake</h3>
              <p className="text-gray-500 text-sm">
                Wanted requests use the same reviewed intake form as supply listings. Harbourview screens for category fit and commercial relevance before any supplier routing.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Managed Introductions</h3>
              <p className="text-gray-500 text-sm">
                Harbourview facilitates inquiry-first introductions between screened buyers and suppliers. Confidentiality is maintained throughout.
              </p>
            </div>
          </div>

          {/* Active requests */}
          {wantedRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No active wanted requests.</p>
              <Link href="/marketplace/sell?type=wanted" className="btn-primary">
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
              Have supply that matches a request?{' '}
              <Link href="/marketplace/sell" className="text-navy underline hover:text-gold">
                Submit a listing
              </Link>{' '}
              or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request a confidential introduction
              </Link>
              .
            </p>
            <Link href="/marketplace/sell?type=wanted" className="btn-primary text-sm shrink-0">
              Post a Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
