import type { Metadata } from 'next'
import Link from 'next/link'
import { businessOpportunities } from '@/lib/fixtures/business-opportunities'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Business Opportunities | Harbourview Network',
  description:
    'Facilities, partnerships, acquisitions, licence-linked opportunities and structured commercial routes subject to legal, regulatory and commercial diligence.',
}

export default function BusinessOpportunitiesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
          <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Business Opportunities</h1>
          <p className="text-gray-300 max-w-xl">
            Facilities, partnerships, acquisitions, licence-linked opportunities and
            structured commercial routes in regulated cannabis and adjacent supply chains.
            All opportunities remain subject to legal, regulatory and commercial diligence.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Diligence required</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Public summaries do not represent legal advice, verified licensing status,
              exclusivity, guaranteed availability or completed diligence. Harbourview reviews
              inquiries before routing and does not guarantee introductions or transaction outcomes.
            </p>
          </div>

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
              Have a business opportunity to submit?{' '}
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
