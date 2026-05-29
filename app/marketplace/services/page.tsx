import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Services | Harbourview',
  description:
    'Reviewed service providers for licensed cannabis operators. Readiness, logistics, operations and commercial advisory. Introduction requests reviewed through Harbourview.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

const serviceSegments = [
  {
    title: 'Readiness & support',
    body: 'Specialist providers supporting operating readiness, documentation, quality programs and market entry.',
  },
  {
    title: 'Logistics & access',
    body: 'Routing, distribution, warehousing, cross-border coordination and market-access support providers.',
  },
  {
    title: 'Operations & facilities',
    body: 'Facility support, engineering, sanitation, automation, security and operating-service providers.',
  },
  {
    title: 'Commercial advisory',
    body: 'Diligence, partnership development, buyer discovery and structured commercial routing support.',
  },
]

function ListingCard({ listing }: { listing: PublicListing }) {
  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = (specs?.cta_label as string) ?? 'Request introduction'

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
        {listing.region && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
            {REGION_LABELS[listing.region] ?? listing.region}
          </span>
        )}
      </div>
      <Link
        href={getPublicListingHref(listing, 'services')}
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
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No providers listed</p>
      <p className="mb-6 text-sm leading-7 text-white/54">
        Service providers are added through Harbourview review. Submit a provider or request
        confidential routing support.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace/sell" className="btn-marketplace text-sm">
          Submit a provider
        </Link>
        <Link href="/intake" className="btn-intelligence text-sm">
          Request introduction
        </Link>
      </div>
    </div>
  )
}

export default async function ServicesPage() {
  const listings = await getPublicListingsByCategory('services')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
            {' '}/ Services
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Reviewed service providers for licensed cannabis operators.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>
              Readiness, logistics, operations and commercial advisory providers reviewed
              for the Harbourview network. Introduction fit, timing, geography and commercial
              context are reviewed before any introduction is routed.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
              Request service introduction
            </Link>
            <Link href="/marketplace/sell" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
              Submit a provider
            </Link>
          </div>
        </div>
      </section>

      {/* Service segments */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-14">
        <div className="page-container">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Service categories
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
              Reviewed introductions only.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {serviceSegments.map((item) => (
              <div
                key={item.title}
                className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                <h3 className="mb-3 text-base font-semibold text-[#f4f1eb]">{item.title}</h3>
                <p className="text-sm leading-7 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Control notice */}
      <section className="border-b border-gold/10 bg-[#030b16] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">
              Reviewed introductions only
            </p>
            <p className="text-sm leading-7 text-white/62">
              Harbourview does not publish private contact details, guarantee provider availability
              or complete diligence on public pages. Fit, timing, geography and commercial context
              are reviewed before any introduction is routed.
            </p>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="bg-[#020814] py-12 sm:py-16 lg:py-18">
        <div className="page-container">
          {listings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="mb-8 sm:mb-10">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                  Reviewed providers
                </p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                  Current approved listings.
                </h2>
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
      <section className="border-t border-gold/10 bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Have a provider to submit?
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                Submit for Harbourview review.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Need a provider in a specific region, or want a service provider reviewed for
                inclusion? Submit context so routing can remain private and controlled.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                Submit provider
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
