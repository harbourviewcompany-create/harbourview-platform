import type { Metadata } from 'next'
import Link from 'next/link'
import { businessOpportunities } from '@/lib/fixtures/business-opportunities'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Business Opportunities',
  description:
    'Cannabis license transfers, facility leases, acquisitions, and partnership opportunities.',
}

export default function BusinessOpportunitiesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Business Opportunities</h1>
          <p className="text-gray-300 max-w-xl">
            License transfers, facility leases, acquisitions, and partnership
            structures in the regulated cannabis industry.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {businessOpportunities.length === 0 ? (
            <EmptyState category="Business Opportunities" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessOpportunities.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Have a business opportunity to list?{' '}
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
