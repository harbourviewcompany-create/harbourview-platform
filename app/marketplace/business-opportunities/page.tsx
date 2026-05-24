import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Business Opportunities | Harbourview Network',
  description: 'Licensed facility acquisitions, brand acquisitions, equity opportunities and strategic commercial pathways for regulated cannabis operators.',
}

export default async function BusinessOpportunitiesPage() {
  const listings = await getPublicListingsByCategory('business_opportunities')

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Business Opportunities</h1>
          <p className="text-gray-300 max-w-xl">
            Licensed facility acquisitions, brand acquisitions, equity opportunities and strategic commercial pathways.
            All opportunities subject to Harbourview qualification before introduction.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium mb-2">No opportunities listed</p>
              <p className="text-sm">
                Have an opportunity to list?{' '}
                <Link href="/marketplace/sell" className="text-navy underline">Submit for review</Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const specs = listing.high_level_specs as Record<string, unknown>
                return (
                  <div key={listing.id} className="rounded-lg border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-gold/50 transition-colors">
                    {listing.is_featured && (
                      <span className="text-xs font-semibold text-gold uppercase tracking-wide">Featured</span>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{listing.product_type}</p>
                      <h3 className="font-semibold text-navy text-lg leading-snug">{listing.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{listing.description}</p>
                    <Link
                      href={`/contact?ref=${listing.slug ?? listing.id}&type=business_opportunity`}
                      className="mt-auto inline-block text-center bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/80 transition-colors"
                    >
                      {(specs?.cta_label as string) ?? 'Request qualification'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
