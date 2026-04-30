import Link from 'next/link';
import type { MarketplaceListing } from '@/lib/marketplace/listings';

const statusLabels: Record<MarketplaceListing['verificationStatus'], string> = {
  source_verified: 'Source verified',
  availability_unverified: 'Availability unverified',
  seller_contact_required: 'Seller contact required',
  sold_or_expired_source: 'Sold / source lead only'
};

export function MarketplaceListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
        <span>{listing.section}</span>
        <span className="text-[#F5F1E8]/35">/</span>
        <span>{listing.category}</span>
      </div>

      <h2 className="text-xl font-semibold leading-tight text-[#F5F1E8]">{listing.title}</h2>

      <div className="mt-4 space-y-2 text-sm text-[#F5F1E8]/68">
        <p>{listing.summary}</p>
        <p>
          <span className="text-[#C6A55A]">Price:</span> {listing.price || 'Verify with seller'}
        </p>
        <p>
          <span className="text-[#C6A55A]">Source:</span> {listing.sourceName}
        </p>
        {listing.location ? (
          <p>
            <span className="text-[#C6A55A]">Location:</span> {listing.location}
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[#F5F1E8]/70">
        <p className="font-medium text-[#C6A55A]">{statusLabels[listing.verificationStatus]}</p>
        <p>{listing.verificationNote}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {listing.buyerFit.slice(0, 3).map(fit => (
          <span key={fit} className="rounded-full border border-[#C6A55A]/25 px-3 py-1 text-xs text-[#F5F1E8]/70">
            {fit}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/marketplace/listings/${listing.slug}`}
          className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
        >
          {listing.ctaLabel}
        </Link>
        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#F5F1E8]/60 underline-offset-4 hover:text-[#F5F1E8] hover:underline"
        >
          Source
        </a>
      </div>
    </article>
  );
}
