import Link from 'next/link';
import type { PublicMarketplaceListing } from '@/lib/marketplace/publicListings';
import { resolveMarketTier } from '@/components/dashboard/market/marketTypes';

const OPEN_SECTION_HINTS = new Set([
  'supply',
  'equipment',
  'used_surplus',
  'services',
  'consumables',
  'packaging',
]);

function isOpenCommercial(listing: PublicMarketplaceListing): boolean {
  const section = (listing.section || '').toLowerCase().replace(/\s+/g, '_');
  const category = (listing.category || '').toLowerCase().replace(/\s+/g, '_');
  if (OPEN_SECTION_HINTS.has(section)) return true;
  return resolveMarketTier(category) === 'A';
}

export function MarketplaceListingCard({ listing }: { listing: PublicMarketplaceListing }) {
  const open = isOpenCommercial(listing);
  const cta = listing.ctaLabel || (open ? 'Contact seller' : 'Request review');

  return (
    <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
        <span>{listing.section}</span>
        <span className="text-[#F5F1E8]/35">/</span>
        <span>{listing.category}</span>
      </div>

      <h2 className="text-xl font-semibold leading-tight text-[#F5F1E8]">{listing.title}</h2>

      <div className="mt-4 space-y-2 text-sm text-[#F5F1E8]/68">
        <p>{listing.publicSummary}</p>
        <p>
          <span className="text-[#C6A55A]">Price:</span>{' '}
          {listing.price || (open ? 'Request quote' : 'Confirm through Harbourview')}
        </p>
        {listing.location ? (
          <p>
            <span className="text-[#C6A55A]">Location:</span> {listing.location}
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[#F5F1E8]/70">
        {open ? (
          <>
            <p className="font-medium text-[#C6A55A]">Contact via Harbourview</p>
            <p>
              Reach the seller through a structured inquiry. Your message is delivered to the
              listing owner; contact details stay private until they respond.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-[#C6A55A]">Harbourview qualification required</p>
            <p>
              Introduction requests are handled through Harbourview review before counterparty
              contact or commercial handoff.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {listing.buyerFit.slice(0, 3).map(fit => (
          <span
            key={fit}
            className="rounded-full border border-[#C6A55A]/25 px-3 py-1 text-xs text-[#F5F1E8]/70"
          >
            {fit}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/marketplace/listings/${listing.slug}`}
          className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
