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
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
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
