import type { Metadata } from 'next'
import Link from 'next/link'
import { newProducts } from '@/lib/fixtures/new-products'
import { getApprovedEquipmentListings } from '@/lib/marketplace/newProductsPublic'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'

export const metadata: Metadata = {
  title: 'New Products | Harbourview Network',
  description:
    'New commercial equipment, packaging and operating supplies relevant to regulated cannabis and adjacent supply chains. Inquiries are reviewed through Harbourview Network.',
}

export default async function NewProductsPage() {
  const approvedEquipment = await getApprovedEquipmentListings()
  const listings = approvedEquipment.length > 0
    ? [...approvedEquipment, ...newProducts]
    : newProducts

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">New Products</h1>
          <p className="text-gray-300 max-w-xl">
            New commercial equipment, packaging and operating supplies relevant to
            regulated cannabis and adjacent supply chains. Availability, pricing,
            supplier authority and transaction terms are confirmed through review.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Reviewed inquiry path</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Public summaries do not guarantee availability, vendor status, pricing,
              introduction or transaction completion. Harbourview reviews inquiries before routing.
            </p>
          </div>

          {listings.length === 0 ? (
            <EmptyState category="New Products" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Have new products to submit?{' '}
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
