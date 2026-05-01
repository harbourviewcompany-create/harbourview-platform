import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InquiryForm } from '@/components/marketplace/InquiryForm';
import { getMarketplaceListing, marketplaceListings } from '@/lib/marketplace/listings';

const verificationLabels = {
  source_verified: 'Source verified',
  availability_unverified: 'Availability unverified',
  seller_contact_required: 'Seller contact required',
  sold_or_expired_source: 'Sold / source lead only'
};

const availabilityLabels = {
  available_on_source: 'Available on source',
  availability_unconfirmed: 'Availability unconfirmed',
  auction_dependent: 'Auction dependent',
  catalog_or_quote_based: 'Catalog or quote based',
  source_lead_only: 'Source lead only',
  sold_or_expired: 'Sold or expired'
};

const authorizationLabels = {
  not_contacted: 'Seller not contacted',
  contact_required: 'Seller contact required',
  authorization_requested: 'Authorization requested',
  authorized: 'Seller authorized',
  declined: 'Seller declined',
  not_applicable: 'Authorization not applicable'
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

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

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          Back to source-backed listings
        </Link>

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

          <section className="mt-8 rounded-2xl border border-[#C6A55A]/25 bg-[#081423]/80 p-5">
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Provenance and review</h2>
            <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/75">{listing.provenanceSummary}</p>

            <div className="mt-5 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Verification</span>
                {verificationLabels[listing.verificationStatus]}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Availability</span>
                {availabilityLabels[listing.availabilityStatus]}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Seller status</span>
                {authorizationLabels[listing.sellerAuthorizationStatus]}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Last reviewed</span>
                {formatDate(listing.lastReviewedAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Next review due</span>
                {formatDate(listing.nextReviewDueAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Confidence</span>
                {listing.confidenceScore}/100
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Evidence captured</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#F5F1E8]/75">
                {listing.sourceEvidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#inquiry"
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

          <InquiryForm listingSlug={listing.slug} listingTitle={listing.title} ctaLabel={listing.ctaLabel} />
        </div>
      </article>
    </main>
  );
}
