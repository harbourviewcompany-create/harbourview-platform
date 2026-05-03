import type { Metadata } from 'next'
import Link from 'next/link'
import { usedSurplusListings } from '@/lib/fixtures/used-surplus'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Used & Surplus',
  description:
    'Pre-owned cannabis equipment and surplus inventory at competitive prices.',
}

export default function UsedSurplusPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Used &amp; Surplus</h1>
          <p className="text-gray-300 max-w-xl">
            Pre-owned equipment and surplus inventory from licensed operators. Inspect
            before purchase where applicable.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {usedSurplusListings.length === 0 ? (
            <EmptyState category="Used & Surplus" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {usedSurplusListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Selling used or surplus equipment?{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                Submit via Intake
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
