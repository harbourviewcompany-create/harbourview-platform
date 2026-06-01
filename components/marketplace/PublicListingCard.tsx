import type { PublicListing } from '@/lib/server/listingsQuery'

export function PublicListingCard({ listing }: { listing: PublicListing }) {
  return (
    <article className="rounded-2xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5 text-[#F5F1E8]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#C6A55A]">{listing.category}</p>
          <h3 className="mt-2 text-lg font-semibold">{listing.title}</h3>
        </div>
        {listing.is_featured ? <span className="rounded-full border border-[#C6A55A]/25 px-3 py-1 text-xs text-[#C6A55A]">Featured</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">{listing.description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#F5F1E8]/55">
        <div><dt className="text-[#C6A55A]/80">Region</dt><dd>{listing.region || listing.location_country || 'Review required'}</dd></div>
        <div><dt className="text-[#C6A55A]/80">Condition</dt><dd>{listing.condition || 'Review required'}</dd></div>
        <div><dt className="text-[#C6A55A]/80">Price</dt><dd>{listing.price_display || 'Request qualification'}</dd></div>
        <div><dt className="text-[#C6A55A]/80">Seller type</dt><dd>{listing.seller_type || 'Controlled review'}</dd></div>
      </dl>
      <a href={listing.slug ? `/marketplace/listings/${listing.slug}` : '/marketplace/sell?type=Wanted%20Request'} className="mt-5 inline-flex rounded-full bg-[#C6A55A] px-4 py-2 text-xs font-semibold text-[#061322]">Request qualification</a>
    </article>
  )
}
