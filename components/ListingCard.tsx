import type { Listing } from '@/lib/fixtures/types'
import InquiryLink from './InquiryLink'

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="card p-5 flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy text-base leading-snug mb-1">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-400">{listing.location || 'Location available on request'}</p>
        </div>
        {listing.price && (
          <p className="shrink-0 rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-navy">
            {listing.price}
          </p>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-4">{listing.description}</p>

      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-gray-100 pt-4">
        <InquiryLink
          subject={`Harbourview Marketplace Inquiry: ${listing.title}`}
          email={listing.contactEmail}
          listingTitle={listing.title}
        />
      </div>
    </article>
  )
}
