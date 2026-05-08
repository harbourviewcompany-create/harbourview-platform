import type { Metadata } from 'next'
import Link from 'next/link'
import { usedSurplusListings } from '@/lib/fixtures/used-surplus'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Used & Surplus | Harbourview Network',
  description:
    'Used equipment, surplus assets, liquidations and closure-related supply relevant to regulated operators. Inquiries are reviewed through Harbourview Network.',
}

export default function UsedSurplusPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
          <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Used &amp; Surplus</h1>
          <p className="text-gray-300 max-w-xl">
            Used equipment, surplus assets and closure-related supply relevant to
            regulated operators. Seller authority, condition, availability and terms
            require confirmation before any introduction or transaction follow-up.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Public summaries only</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Listings do not guarantee availability, condition, pricing, seller authority,
              introduction or transaction completion. Harbourview reviews inquiries before routing.
            </p>
          </div>

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
