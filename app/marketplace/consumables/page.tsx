import type { Metadata } from 'next'
import Link from 'next/link'
import { consumables } from '@/lib/fixtures/consumables'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Consumables & Operating Supplies',
  description: 'Packaging, lab, facility, logistics and operating-supply categories available by inquiry through Harbourview Marketplace.',
}

export default function ConsumablesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Consumables & Operating Supplies</h1>
          <p className="text-gray-300 max-w-xl">
            Controlled operating-supply categories for packaging, lab, facility, logistics and recurring supply needs. Supplier qualification and specifications are handled by inquiry.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/quote?listing=Bulk%20Consumables%20Procurement%20Request" className="btn-primary">
              Request Supply Information
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
            <h2 className="text-navy font-semibold text-lg mb-2">Sourcing operating supplies at volume?</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Submit volume, region, timing and specification requirements. Harbourview reviews the request and routes qualified demand through private supplier qualification before quote or introduction.
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
