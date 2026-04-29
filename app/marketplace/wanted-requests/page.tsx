import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Wanted Requests',
  description:
    'Active buy-side requests from cannabis operators seeking equipment, inventory, and services.',
}

export default function WantedRequestsPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Wanted Requests</h1>
          <p className="text-gray-300 max-w-xl">
            Active buy-side requests from licensed operators. If you can supply what
            they&apos;re looking for, send a direct inquiry.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {wantedRequests.length === 0 ? (
            <EmptyState category="Wanted Requests" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wantedRequests.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Looking for something specific?{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                Post a Wanted Request via Intake
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
