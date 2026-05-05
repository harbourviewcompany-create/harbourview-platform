import type { Metadata } from 'next'
import Link from 'next/link'
import { consumables } from '@/lib/fixtures/consumables'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Consumables & Operating Supplies | Harbourview Marketplace',
  description:
    'Bulk and recurring packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance supply. Inquire to buy through Harbourview.',
  openGraph: {
    title: 'Consumables & Operating Supplies | Harbourview Marketplace',
    description:
      'Bulk and recurring consumables and operating supplies. Inquire to buy through Harbourview.',
  },
}

export default function ConsumablesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Consumables &amp; Operating Supplies</h1>
          <p className="text-gray-300 max-w-xl">
            Bulk and recurring packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance supply categories. Seller contact details are not public. Inquire to buy through Harbourview.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/marketplace/quote?listing=Consumables%20and%20Operating%20Supplies"
              className="btn-primary text-center"
            >
              Inquire to Buy
            </Link>
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy"
            >
              Post What You Want to Buy
            </Link>
            <Link
              href="/marketplace/sell"
              className="btn-outline border-white/40 text-center text-white hover:bg-white hover:text-navy"
            >
              List Supply for Sale
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Buying consumables at volume?</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Browse the categories below and inquire to buy. Seller contact details are not public. Harbourview reviews buyer inquiries and coordinates introductions privately. Submit volume, region, timing and specification requirements in your inquiry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {consumables.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              Have supply to sell?{' '}
              <Link href="/marketplace/sell" className="text-navy underline hover:text-gold">
                List it for sale
              </Link>
              {' '}or{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                request confidential support
              </Link>
              .
            </p>
            <Link href="/marketplace/sell?type=wanted" className="btn-primary text-sm shrink-0">
              Post What You Want to Buy
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
