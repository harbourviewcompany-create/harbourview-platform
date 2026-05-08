import type { Metadata } from 'next'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'
import { getLiveServiceListings } from '@/lib/marketplace/liveServices'

export const metadata: Metadata = {
  title: 'Services | Harbourview Network',
  description:
    'Service providers for regulated cannabis and adjacent supply-chain operators. Introduction requests are reviewed through Harbourview Network.',
}

export default async function ServicesPage() {
  const serviceListings = await getLiveServiceListings()

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Services</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {serviceListings.length === 0 ? (
            <EmptyState category="Services" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
