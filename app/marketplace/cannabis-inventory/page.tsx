import type { Metadata } from 'next'
import Link from 'next/link'
import { cannabisInventoryListings } from '@/lib/fixtures/cannabis-inventory'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Cannabis Inventory | Harbourview Network',
  description:
    'Licensed-only cannabis inventory review and private inquiry routing for regulated operators. Public summaries are not offers to sell or distribute regulated product.',
}

export default function CannabisInventoryPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
          <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Cannabis Inventory</h1>
          <p className="text-gray-300 max-w-xl">
            Wholesale bulk flower, biomass, concentrates and genetics summaries for
            licensed operators only. Inquiries are subject to licence verification,
            jurisdictional review and private Harbourview routing.
          </p>
        </div>
      </section>

      <div className="bg-amber-50 border-b border-amber-200">
        <div className="page-container py-3">
          <p className="text-sm text-amber-800">
            <strong>For licensed operators only.</strong> Public summaries are not offers to sell,
            purchase or distribute regulated product. All activity requires appropriate
            licence documentation, jurisdictional review and direct agreement between parties.
            Harbourview facilitates reviewed introductions only and is not a party to any transaction.
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="page-container">
          {cannabisInventoryListings.length === 0 ? (
            <EmptyState category="Cannabis Inventory" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cannabisInventoryListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Submitting licensed inventory or genetics context?{' '}
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
