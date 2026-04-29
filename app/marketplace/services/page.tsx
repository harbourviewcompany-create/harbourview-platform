import type { Metadata } from 'next'
import Link from 'next/link'
import { serviceListings } from '@/lib/fixtures/services'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Cannabis industry services: compliance consulting, facility design, accounting, logistics, and more.',
}

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Services</h1>
          <p className="text-gray-300 max-w-xl">
            Professional services for cannabis operators. Compliance, design,
            finance, logistics, and licensing support.
          </p>
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

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Offering services to cannabis operators?{' '}
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
