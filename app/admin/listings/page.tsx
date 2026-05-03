import Link from 'next/link';
import { marketplaceListings } from '@/lib/marketplace/listings';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

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

export default function AdminListingsPage() {
  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Listing provenance review</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Internal-only source, evidence and workflow view. Do not expose this material in public listing pages.
          </p>
        </div>
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          View public listings
        </Link>
      </div>

      <div className="space-y-6">
        {marketplaceListings.map((listing) => (
          <article key={listing.slug} className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#C6A55A]">{listing.section}</p>
                <h3 className="mt-2 text-2xl font-semibold">{listing.title}</h3>
                <p className="mt-2 text-sm text-[#F5F1E8]/65">{listing.summary}</p>
              </div>
              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#C6A55A]/50 px-4 py-2 text-center text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/10"
              >
                View source listing
              </a>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-[#F5F1E8]/75 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Source</span>{listing.sourceName}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Source type</span>{listing.sourceType.replaceAll('_', ' ')}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Verification</span>{verificationLabels[listing.verificationStatus]}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Availability</span>{availabilityLabels[listing.availabilityStatus]}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Seller status</span>{authorizationLabels[listing.sellerAuthorizationStatus]}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Last reviewed</span>{formatDate(listing.lastReviewedAt)}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Next review due</span>{formatDate(listing.nextReviewDueAt)}</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Confidence</span>{listing.confidenceScore}/100</div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Provenance summary</h4>
                <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/75">{listing.provenanceSummary}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Evidence captured</h4>
                <ul className="mt-3 space-y-2 text-sm text-[#F5F1E8]/75">
                  {listing.sourceEvidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Verification note</h4>
                <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/75">{listing.verificationNote}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Internal review notes</h4>
                <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/75">{listing.internalReviewNotes}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
