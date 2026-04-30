import { notFound } from 'next/navigation';
import { getMarketplaceListing, marketplaceListings } from '@/lib/marketplace/listings';

export function generateStaticParams() {
  return marketplaceListings.map((listing) => ({ slug: listing.slug }));
}

export default async function MarketplaceListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = getMarketplaceListing(slug);

  if (!listing) notFound();

  const emailSubject = encodeURIComponent('Marketplace verification request: ' + listing.title);

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <a href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          Back to source-backed listings
        </a>

        <div className="mt-8 rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-[#C6A55A]">{listing.section}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{listing.title}</h1>

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Category</span>
              {listing.category}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Type</span>
              {listing.listingType}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Price</span>
              {listing.price || 'Verify with seller'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Location</span>
              {listing.location || 'Not published'}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#F5F1E8]/82">{listing.summary}</p>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Buyer fit</h2>
              <ul className="mt-4 space-y-2 text-sm text-[#F5F1E8]/75">
                {listing.buyerFit.map((fit) => (
                  <li key={fit}>{fit}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Verification position</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">{listing.verificationNote}</p>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">{listing.complianceNote}</p>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={'mailto:harbourviewcompany@gmail.com?subject=' + emailSubject}
              className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
            >
              {listing.ctaLabel}
            </a>
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#C6A55A]/50 px-5 py-3 text-center text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/10"
            >
              View source listing
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
