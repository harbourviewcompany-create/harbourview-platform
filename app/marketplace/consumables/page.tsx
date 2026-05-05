import type { Metadata } from 'next'
import Link from 'next/link'
import { consumables } from '@/lib/fixtures/consumables'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'Consumables & Operating Supplies | Harbourview Marketplace',
  description:
    'Inquiry-first sourcing for packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance operating supplies.',
  openGraph: {
    title: 'Consumables & Operating Supplies | Harbourview Marketplace',
    description:
      'Inquiry-first sourcing for packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance operating supplies.',
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
          <h1 className="text-3xl font-bold mb-2">Consumables & Operating Supplies</h1>
          <p className="text-gray-300 max-w-xl">
            Packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance supply categories handled through inquiry-first sourcing and supplier qualification.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/marketplace/quote?listing=Consumables%20and%20Operating%20Supplies"
              className="btn-primary text-center"
              data-testid="consumables-request-supply-info"
            >
              Request Supply Information
            </Link>
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy"
              data-testid="wanted-post-request"
            >
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
              Submit volume, region, timing and specification requirements. Harbourview reviews the request and routes qualified inquiries through private supplier qualification before quote or introduction.
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
