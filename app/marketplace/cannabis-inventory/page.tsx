import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Cannabis Inventory | Harbourview Network',
  description: 'Bulk cannabis, biomass, extract and regulated product supply for licensed operators. All inventory subject to Harbourview qualification.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America', europe: 'Europe',
  asia_pacific: 'Asia Pacific', latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa', global: 'Global',
}

export default async function CannabisInventoryPage() {
  const listings = await getPublicListingsByCategory('cannabis_inventory')

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Cannabis Inventory</h1>
          <p className="text-gray-300 max-w-xl">
            Bulk cannabis, biomass, extract and regulated product supply for licensed operators.
            Compliance documentation, counterparty credentials and availability require Harbourview qualification.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Controlled access only</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Cannabis supply introductions require regulatory compliance verification, INCB quota confirmation where applicable,
              and Harbourview counterparty qualification before any introduction.
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium mb-2">No inventory listed</p>
              <p className="text-sm">
                Have supply to offer?{' '}
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
                    <div className="flex flex-wrap gap-2 text-xs">
                      {listing.region && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {REGION_LABELS[listing.region] ?? listing.region}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/contact?ref=${listing.slug ?? listing.id}&type=cannabis_inventory`}
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
