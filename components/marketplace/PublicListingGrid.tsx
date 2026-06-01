import type { PublicListing } from '@/lib/server/listingsQuery'
import { PublicListingCard } from './PublicListingCard'

export function PublicListingGrid({ listings }: { listings: PublicListing[] }) {
  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-8 text-sm leading-6 text-[#F5F1E8]/58">
        This category is ready for controlled marketplace records, but no public listings are currently approved for display.
      </div>
    )
  }

  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <PublicListingCard key={listing.id} listing={listing} />)}</div>
}
