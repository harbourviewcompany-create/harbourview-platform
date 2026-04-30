import type { Metadata } from 'next'
import Link from 'next/link'
import { consumables } from '@/lib/fixtures/consumables'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Consumables',
  description: 'Packaging, production and facility consumables available via Harbourview marketplace.',
}

export default function ConsumablesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Consumables</h1>
          <p className="text-gray-300 max-w-xl">
            Supplier-sourced consumables including packaging, production and facility supplies. All listings are verified before introduction or quote.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/quote?listing=Bulk%20Consumables%20Procurement%20Request" className="btn-primary">
              Request a Bulk Quote
            </Link>
            <Link href="/marketplace/wanted" className="btn-outline border-gold text-gold hover:bg-gold hover:text-navy">
              Post a Wanted Request
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Buying consumables at volume?</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Submit your volume, market, delivery timeline and requirements. Harbourview reviews the request, verifies supplier fit and routes qualified demand through broker review before quote or introduction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {consumables.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
