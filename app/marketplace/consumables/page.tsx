import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'
import { getPublicListingsByCategoryFiltered } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import { ConsumablesFilterBar } from '@/components/marketplace/ConsumablesFilterBar'
import { ListingNotifyWidget } from '@/components/marketplace/ListingNotifyWidget'
export const dynamic = 'force-dynamic'
export const revalidate = 0


export const metadata: Metadata = {
  title: 'Consumables & Operating Supplies | Harbourview',
  description:
    'Bulk and recurring packaging, lab, cultivation, processing, sanitation, logistics and maintenance supply for licensed cannabis operators. Inquiries reviewed through Harbourview.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

type RepresentativeImage = {
  src: string
  alt: string
  caption: string
}

const representativeCaption =
  'Representative category image. Supplier fit, specifications, region and terms are confirmed through Harbourview review.'

const imageCatalog = {
  packaging: {
    src: '/marketplace/images/packaging-pouches.webp',
    alt: 'Unbranded packaging pouches shown as representative consumables category imagery',
    caption: representativeCaption,
  },
  labQa: {
    src: '/marketplace/images/lab-qa-consumables.webp',
    alt: 'Unbranded lab and quality assurance supplies shown as representative consumables category imagery',
    caption: representativeCaption,
  },
  cultivation: {
    src: '/marketplace/images/cultivation-inputs.webp',
    alt: 'Unbranded cultivation inputs shown as representative consumables category imagery',
    caption: representativeCaption,
  },
  facility: {
    src: '/marketplace/images/facility-supplies.webp',
    alt: 'Unbranded facility supplies shown as representative consumables category imagery',
    caption: representativeCaption,
  },
  warehouse: {
    src: '/marketplace/images/warehouse-logistics.webp',
    alt: 'Unbranded warehouse and logistics supplies shown as representative consumables category imagery',
    caption: representativeCaption,
  },
} satisfies Record<string, RepresentativeImage>

const heroImage: RepresentativeImage = {
  src: imageCatalog.warehouse.src,
  alt: 'Unbranded bulk operating supplies shown as representative consumables marketplace imagery',
  caption: representativeCaption,
}

const supplyCategories = [
  {
    title: 'Packaging & compliance',
    body: 'Child-resistant, tamper-evident and compliant packaging for licensed cannabis retail, medical and wholesale formats.',
    image: imageCatalog.packaging,
  },
  {
    title: 'Lab & testing',
    body: 'Analytical supplies, reagents, consumable labware and quality assurance inputs for licensed testing programs.',
    image: imageCatalog.labQa,
  },
  {
    title: 'Cultivation inputs',
    body: 'Growing media, nutrients, IPM products, propagation supplies and cultivation consumables for licensed facilities.',
    image: imageCatalog.cultivation,
  },
  {
    title: 'Processing & sanitation',
    body: 'Extraction consumables, post-harvest inputs, sanitation chemicals and maintenance supplies for licensed operators.',
    image: imageCatalog.facility,
  },
]

function getListingRepresentativeImage(listing: PublicListing): RepresentativeImage {
  const searchText = [listing.product_type, listing.title, listing.description].filter(Boolean).join(' ').toLowerCase()

  if (/lab|qa|quality|test|sample|analytical|reagent/.test(searchText)) return imageCatalog.labQa
  if (/cultivation|grow|nutrient|media|propagation|greenhouse/.test(searchText)) return imageCatalog.cultivation
  if (/warehouse|logistics|shipping|carton|pallet|retail|dispensary|label|fulfilment|fulfillment/.test(searchText)) return imageCatalog.warehouse
  if (/processing|sanitation|ppe|glove|maintenance|facility|post-harvest|extraction/.test(searchText)) return imageCatalog.facility

  return imageCatalog.packaging
}

function RepresentativeImageFrame({ image, eager = false }: { image: RepresentativeImage; eager?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-sm border border-gold/10 bg-[#071425]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#071425]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          loading={eager ? "eager" : undefined}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-90 saturate-[0.88] transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,0.02)_0%,rgba(2,8,20,0.42)_100%)]" />
      </div>
      <figcaption className="border-t border-gold/10 px-4 py-3 text-[11px] leading-5 text-white/42">
        {image.caption}
      </figcaption>
    </figure>
  )
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = (specs?.cta_label as string) ?? 'Request qualification'
  const image = getListingRepresentativeImage(listing)

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <RepresentativeImageFrame image={image} />
      <div className="flex flex-1 flex-col p-6">
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
          href={getPublicListingHref(listing, 'consumables')}
          className="btn-marketplace mt-6 justify-center text-center text-sm"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" />
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No supply listed</p>
      <p className="mb-6 text-sm leading-7 text-white/54">
        Consumable supply is sourced through Harbourview review on request. Submit supply
        or request a routed inquiry for volume requirements.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace/sell" className="btn-marketplace text-sm">
          Submit supply
        </Link>
        <Link href="/intake" className="btn-intelligence text-sm">
          Request routed inquiry
        </Link>
      </div>
    </div>
  )
}

export default async function ConsumablesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string; q?: string }>
}) {
  const params = await searchParams
  const allListings = await getPublicListingsByCategoryFiltered('consumables', {})
  const listings = await getPublicListingsByCategoryFiltered('consumables', {
    region: params.region,
    productType: params.type,
    search: params.q,
  })

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
                {' '}/ Consumables &amp; Operating Supplies
              </p>
              <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
                Bulk and recurring supply for licensed cannabis operations.
              </h1>
              <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
                <p>
                  Packaging, lab consumables, cultivation inputs, processing supplies and operating
                  materials for licensed cannabis facilities. Volume, region, timing and specification
                  requirements are reviewed through Harbourview before any introduction is routed.
                </p>
              </div>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                  Request routed inquiry
                </Link>
                <Link href="/marketplace/sell" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
                  Offer supply for review
                </Link>
              </div>
            </div>
            <div className="group lg:pt-2">
              <RepresentativeImageFrame image={heroImage} eager />
            </div>
          </div>
        </div>
      </section>

      {/* Supply categories */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-14">
        <div className="page-container">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Supply categories
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
              Buying consumables at volume?
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {supplyCategories.map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <RepresentativeImageFrame image={item.image} />
                <div className="p-6">
                  <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                  <h3 className="mb-3 text-base font-semibold text-[#f4f1eb]">{item.title}</h3>
                  <p className="text-sm leading-7 text-white/58">{item.body}</p>
                </div>
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
              Routed inquiry only
            </p>
            <p className="text-sm leading-7 text-white/62">
              Contact details are not public. Public summaries do not guarantee availability,
              pricing, minimum order quantities or transaction terms. Submit volume, region, timing
              and specification requirements. Harbourview reviews before coordinating any introduction.
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
              <div className="mb-6 sm:mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                  Reviewed supply
                </p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                  Current approved listings.
                </h2>
              </div>
              <Suspense>
                <ConsumablesFilterBar totalCount={allListings.length} filteredCount={listings.length} />
              </Suspense>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <div className="mt-10">
                <ListingNotifyWidget category="consumables" />
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
                Have supply to offer?
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                Submit consumables for Harbourview review.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Recurring and bulk consumable supply relevant to licensed cannabis production.
                Review and qualification before any introduction pathway.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/sell/consumables" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                Submit consumables supply
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
