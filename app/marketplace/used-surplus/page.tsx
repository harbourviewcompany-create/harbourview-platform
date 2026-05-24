import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Used & Surplus | Harbourview',
  description:
    'Used equipment, surplus assets, liquidations and closure-related supply for regulated cannabis operators. Inquiries are reviewed through Harbourview.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  parts: 'Parts / salvage',
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = (specs?.cta_label as string) ?? 'Request qualification'

  return (
    <div className="group flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      {listing.is_featured && (
        <span className="mb-3 inline-flex w-fit rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
          Featured
        </span>
      )}
      {listing.product_type && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {listing.product_type}
        </p>
      )}
      <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {listing.condition && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        )}
        {listing.region && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
            {REGION_LABELS[listing.region] ?? listing.region}
          </span>
        )}
      </div>
      <Link
        href={`/contact?ref=${listing.slug ?? listing.id}&type=used_surplus`}
        className="btn-marketplace mt-6 justify-center text-center text-sm"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" />
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No listings available</p>
      <p className="mb-6 text-sm leading-7 text-white/54">
        Equipment and surplus assets are sourced through Harbourview review. Check back or submit an opportunity.
      </p>
      <Link href="/marketplace/sell" className="btn-marketplace text-sm">
        Submit an opportunity
      </Link>
    </div>
  )
}

export default async function UsedSurplusPage() {
  const listings = await getPublicListingsByCategory('used_surplus')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
            {' '}/ Used &amp; Surplus
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Used equipment and surplus assets for regulated operators.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>
              Used cannabis production equipment, surplus inventory, liquidations and closure-related supply.
              Seller authority, condition, availability and terms are confirmed through Harbourview review
              before any introduction.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
              Submit an asset
            </Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
              Request sourcing
            </Link>
          </div>
        </div>
      </section>

      {/* Control notice */}
      <section className="border-b border-gold/10 bg-[#020814] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">
              Public summaries only
            </p>
            <p className="text-sm leading-7 text-white/62">
              Listings do not guarantee availability, condition, seller authority, pricing or transaction
              completion. Harbourview reviews all inquiries before routing. Diligence materials, counterparty
              identity and commercial terms remain private until qualification.
            </p>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="bg-[#030b16] py-12 sm:py-16 lg:py-18">
        <div className="page-container">
          {listings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                    Reviewed listings
                  </p>
                  <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                    Current approved assets.
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Selling used or surplus equipment?
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                Submit assets for Harbourview review.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Extraction systems, cultivation equipment, processing lines, packaging assets and
                closure-related inventory. Review and qualification before any introduction pathway.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                Submit asset
              </Link>
              <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
                Speak confidentially
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
