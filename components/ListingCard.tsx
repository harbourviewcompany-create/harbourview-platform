import type { Listing } from '@/lib/fixtures/types'
import InquiryLink from './InquiryLink'

interface ListingImage {
  src?: string
  alt: string
  status?: 'category-placeholder' | 'supplier-provided' | 'verified'
}

type ListingWithImage = Listing & {
  image?: ListingImage
}

interface ListingCardProps {
  listing: ListingWithImage
}

const visualRules = [
  { terms: ['pre-roll tubes', 'tube'], label: 'Pre-roll tubes', shape: 'rounded tubes' },
  { terms: ['mylar', 'pouch'], label: 'Mylar pouches', shape: 'pouches' },
  { terms: ['glass jars', 'concentrate jars', 'jar'], label: 'Glass jars', shape: 'jars' },
  { terms: ['tincture', 'bottle'], label: 'Tincture bottles', shape: 'bottles' },
  { terms: ['cones', 'pre-rolled cones'], label: 'Pre-rolled cones', shape: 'cones' },
  { terms: ['humidity'], label: 'Humidity packs', shape: 'packets' },
  { terms: ['labels', 'tamper', 'shrink'], label: 'Labels & seals', shape: 'labels' },
  { terms: ['gloves', 'sanitation'], label: 'Facility supplies', shape: 'supply boxes' },
  { terms: ['cartons', 'shipping'], label: 'Shipping cartons', shape: 'cartons' },
  { terms: ['bundle', 'bulk procurement'], label: 'Consumables bundle', shape: 'assorted supplies' },
]

function getVisual(listing: ListingWithImage) {
  const haystack = `${listing.title} ${listing.tags.join(' ')}`.toLowerCase()
  return visualRules.find((rule) => rule.terms.some((term) => haystack.includes(term))) || {
    label: 'Marketplace listing',
    shape: 'product category',
  }
}

function ListingVisual({ listing }: { listing: ListingWithImage }) {
  const visual = getVisual(listing)
  const imageStatus = listing.image?.status || 'category-placeholder'
  const badge = imageStatus === 'verified' ? 'Verified image' : imageStatus === 'supplier-provided' ? 'Supplier image' : 'Category image'

  if (listing.image?.src) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
        <img src={listing.image.src} alt={listing.image.alt} className="h-36 w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
          {badge}
        </span>
      </div>
    )
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gold-pale via-white to-gray-100 p-4">
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
        {badge}
      </span>
      <div className="flex h-full items-end justify-between gap-3 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">Harbourview</p>
          <p className="mt-1 text-sm font-semibold text-navy">{visual.label}</p>
          <p className="text-xs text-gray-500">{visual.shape}</p>
        </div>
        <div className="flex items-end gap-1.5 opacity-80" aria-hidden="true">
          <div className="h-10 w-5 rounded-t-full rounded-b-sm border border-gold/50 bg-white/80" />
          <div className="h-14 w-7 rounded-t-full rounded-b-sm border border-gold/50 bg-white/90" />
          <div className="h-8 w-5 rounded-t-full rounded-b-sm border border-gold/50 bg-white/75" />
        </div>
      </div>
    </div>
  )
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="card p-5 flex h-full flex-col gap-4">
      <ListingVisual listing={listing} />

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
