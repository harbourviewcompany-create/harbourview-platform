import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { getPublicListingBySlug } from '@/lib/server/listingsQuery'

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

const CATEGORY_LABELS: Record<string, string> = {
  new_products: 'New Products',
  used_surplus: 'Used / Surplus Equipment',
  cannabis_inventory: 'Cannabis Inventory',
  services: 'Services',
  consumables: 'Consumables',
  cultivation_equipment: 'Cultivation Equipment',
  business_opportunity: 'Business Opportunity',
  business_opportunities: 'Business Opportunities',
  distressed_inventory: 'Distressed Inventory',
  distressed_businesses: 'Distressed Businesses',
}

function labelFor(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return 'Available on request'
  return labels[value] ?? value.replace(/_/g, ' ')
}

function formatPrice(amount: number | null, currency: string) {
  if (amount === null) return 'Confirm through Harbourview'

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateStaticParams() {
  return []
}

export default async function MarketplaceListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) notFound()

  const listingType = labelFor(listing.category, CATEGORY_LABELS)
  const region = labelFor(listing.region, REGION_LABELS)
  const ctaLabel =
    typeof listing.high_level_specs?.cta_label === 'string'
      ? listing.high_level_specs.cta_label
      : 'Request Harbourview review'

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          Back to listings
        </Link>

        <div className="mt-8 rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-[#C6A55A]">{labelFor(listing.marketplace_section, CATEGORY_LABELS)}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{listing.title}</h1>

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Category</span>
              {listingType}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Type</span>
              {listing.product_type || listingType}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Price</span>
              {formatPrice(listing.price_amount, listing.price_currency)}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Region</span>
              {region}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#F5F1E8]/82">{listing.description}</p>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Buyer fit</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                Qualified operators, buyers or partners seeking controlled introductions for this listing category.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Harbourview qualification note</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                Harbourview handles introduction requests through a controlled review process. Counterparty fit, commercial terms and required seller engagement are confirmed before a handoff is made.
              </p>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#inquiry"
              className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
            >
              {ctaLabel}
            </a>
            <Link
              href="/marketplace/listings"
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-medium text-[#F5F1E8] transition hover:border-[#C6A55A]/45 hover:text-[#D8BC73]"
            >
              View other listings
            </Link>
          </div>
        </div>

        <InquiryForm listingSlug={listing.slug ?? slug} listingTitle={listing.title} ctaLabel={ctaLabel} />
      </article>
    </main>
  )
}
