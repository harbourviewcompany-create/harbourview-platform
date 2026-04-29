import type { Listing } from '@/lib/fixtures/types'
import InquiryLink from './InquiryLink'

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-navy text-base leading-snug mb-1">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-400 mb-2">{listing.location}</p>
        <p className="text-sm text-gray-600 line-clamp-3">{listing.description}</p>
      </div>

      {listing.price && (
        <p className="text-gold-dark font-semibold text-sm">{listing.price}</p>
      )}

      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {listing.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2">
        <InquiryLink
          subject={`Inquiry: ${listing.title}`}
          email={listing.contactEmail}
        />
      </div>
    </div>
  )
}
