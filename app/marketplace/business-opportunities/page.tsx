import type { Metadata } from 'next'
import Link from 'next/link'
import { businessOpportunities } from '@/lib/fixtures/business-opportunities'
import { getLiveBusinessOpportunities } from '@/lib/marketplace/liveOpportunities'

export const metadata: Metadata = {
  title: 'Business Opportunities | Harbourview Network',
  description: 'Licensed facility acquisitions, brand acquisitions, equity opportunities and strategic commercial pathways for regulated cannabis operators.',
}

export default async function BusinessOpportunitiesPage() {
  const { listings } = await getLiveBusinessOpportunities(businessOpportunities)

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
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-lg border border-gray-200 bg-white p-6 flex flex-col gap-4 hover:border-gold/50 transition-colors">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{listing.opportunityType.replace(/-/g, ' ')}</p>
                    <h3 className="font-semibold text-navy text-lg leading-snug">{listing.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{listing.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <p className="font-semibold text-navy">Region</p>
                      <p>{listing.location}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-navy">Structure</p>
                      <p>{listing.price ?? 'On request'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/contact?ref=${listing.id}&type=business_opportunity`}
                    className="mt-auto inline-block text-center bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy/80 transition-colors"
                  >
                    Request qualification
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
