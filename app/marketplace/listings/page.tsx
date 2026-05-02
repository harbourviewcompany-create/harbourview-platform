import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { marketplaceListings } from '@/lib/marketplace/listings';

export default function MarketplaceListingsPage() {
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview Marketplace</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Commercial listings, supplier leads and surplus opportunities.
            </h1>
          </div>
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]/70 p-5 text-sm leading-6 text-[#F5F1E8]/72">
            <p>
              These are Harbourview-reviewed marketplace candidates. Availability, seller engagement and commercial handoff are handled through controlled qualification before any introduction.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-2xl font-semibold text-[#C6A55A]">{marketplaceListings.length}</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">Initial listing candidates</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-2xl font-semibold text-[#C6A55A]">4</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">Marketplace sections represented</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-2xl font-semibold text-[#C6A55A]">Review first</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">Qualification required before introduction</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {marketplaceListings.map(listing => (
            <MarketplaceListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
