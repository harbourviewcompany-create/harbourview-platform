import type { Metadata } from 'next'
import Link from 'next/link'
import { serviceListings } from '@/lib/fixtures/services'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'Services | Harbourview Network',
  description:
    'Service providers for regulated cannabis and adjacent supply-chain operators. Introduction requests are reviewed through Harbourview Network.',
}

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
          <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Services</h1>
          <p className="text-gray-300 max-w-xl">
            Professional services for regulated cannabis and adjacent supply-chain
            operators, including compliance support, design, finance, logistics,
            QA and licensing-adjacent services. Harbourview routes introduction requests
            through review and does not provide legal advice.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Reviewed service introductions</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Public service summaries do not guarantee provider availability, licensing,
              scope fit, pricing or engagement terms. Harbourview reviews inquiries before routing.
            </p>
          </div>

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
              Offering services to regulated operators?{' '}
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
