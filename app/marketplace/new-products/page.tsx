import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import { newProducts } from '@/lib/fixtures/new-products'
import ListingCard from '@/components/ListingCard'

export const metadata: Metadata = {
  title: 'New Products | Harbourview Network',
  description: 'New commercial equipment, packaging and operating supplies relevant to regulated cannabis and adjacent supply chains.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America', europe: 'Europe',
  asia_pacific: 'Asia Pacific', latin_america: 'Latin America',
  global: 'Global',
}

export default async function NewProductsPage() {
  const liveListings = await getPublicListingsByCategory('new_products')

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">New Products</h1>
          <p className="text-gray-300 max-w-xl">
            New commercial equipment, packaging and operating supplies for regulated cannabis operators.
            Availability, pricing and terms are confirmed through Harbourview review.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Reviewed inquiry path</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              All product listings are public summaries only. Pricing, availability, supplier authority and
              transaction terms require Harbourview review before any introduction.
            </p>
          </div>

          {liveListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {liveListings.map((listing) => {
                const specs = listing.high_level_specs as Record<string, unknown>
                return (
                  <div key={listing.id} className="rounded-lg border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-gold/50 transition-colors">
                    {listing.is_featured && <span className="text-xs font-semibold text-gold uppercase tracking-wide">Featured</span>}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{listing.product_type}</p>
                      <h3 className="font-semibold text-navy text-lg leading-snug">{listing.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{listing.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {listing.region && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{REGION_LABELS[listing.region] ?? listing.region}</span>}
                    </div>
                    <Link href={`/contact?ref=${listing.slug ?? listing.id}&type=new_products`}
                      className="mt-auto inline-block text-center bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/80 transition-colors">
                      {(specs?.cta_label as string) ?? 'Request qualification'}
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : null}

          {newProducts.length > 0 && (
            <>
              {liveListings.length > 0 && <h2 className="text-lg font-semibold text-navy mb-4">More listings</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {newProducts.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
