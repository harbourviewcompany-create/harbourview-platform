import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
export const dynamic = 'force-dynamic'
export const revalidate = 0


export const metadata: Metadata = {
  title: 'New Products | Harbourview',
  description:
    'New commercial equipment, packaging and operating supplies for regulated cannabis operators. Availability and terms confirmed through Harbourview review.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

const productSegments = [
  {
    title: 'Equipment & machinery',
    body: 'New cultivation, extraction, processing, packaging and post-harvest equipment for regulated facilities.',
  },
  {
    title: 'Packaging & compliance',
    body: 'Child-resistant, tamper-evident and regulatory-compliant packaging for licensed cannabis product formats.',
  },
  {
    title: 'Lab & testing supplies',
    body: 'Analytical supplies, reagents and testing consumables for quality assurance and compliance programs.',
  },
  {
    title: 'Operating supplies',
    body: 'Cultivation inputs, sanitation products, logistics consumables and facility operating supply.',
  },
]

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
        {listing.region && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
            {REGION_LABELS[listing.region] ?? listing.region}
          </span>
        )}
      </div>
      <Link
        href={getPublicListingHref(listing, 'new_products')}
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
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No products listed</p>
      <p className="mb-6 text-sm leading-7 text-white/54">
        New product listings are added through Harbourview review. Submit a product or speak
        confidentially about sourcing requirements.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace/sell" className="btn-marketplace text-sm">
          Submit a product
        </Link>
        <Link href="/intake" className="btn-intelligence text-sm">
          Speak confidentially
        </Link>
      </div>
    </div>
  )
}

export default async function NewProductsPage() {
  const listings = await getPublicListingsByCategory('new_products')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
            {' '}/ New Products
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            New commercial products for regulated cannabis operators.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>
              New equipment, packaging, lab supplies and operating products for licensed cannabis
              facilities. Pricing, availability and supplier terms are confirmed through Harbourview
              review before any introduction.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
              Submit a product
            </Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
              Request sourcing
            </Link>
          </div>
        </div>
      </section>

      {/* Product segments */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-14">
        <div className="page-container">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Product categories
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
              Reviewed inquiry only.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {productSegments.map((item) => (
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
              Reviewed inquiry path
            </p>
            <p className="text-sm leading-7 text-white/62">
              All product listings are public-safe summaries only. Pricing, availability, minimum
              order quantities, delivery timelines and supplier authority require Harbourview review
              before any introduction or commercial disclosure.
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
              <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                    Reviewed products
                  </p>
                  <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                    Current approved listings.
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
      <section className="border-t border-gold/10 bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Supplying regulated operators?
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                Submit a product for Harbourview review.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Equipment, packaging, lab supplies and operating products relevant to licensed cannabis
                production. Review and qualification before any introduction pathway.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                Submit a product
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
