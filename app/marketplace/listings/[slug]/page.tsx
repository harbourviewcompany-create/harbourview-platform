import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { getPublicListingBySlug, type PublicListing } from '@/lib/server/listingsQuery'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)
  if (!listing) return { title: 'Listing Not Found | Harbourview Marketplace' }
  return {
    title: `${listing.title} | Harbourview Marketplace`,
    description: listing.description?.slice(0, 155) ?? 'Reviewed marketplace listing on Harbourview. Enquiries are handled through controlled intake.',
  }
}

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
  used_surplus: 'Used & Surplus Equipment',
  cannabis_inventory: 'Cannabis Inventory',
  consumables: 'Consumables',
  cultivation_equipment: 'Cultivation Equipment',
  distressed_inventory: 'Distressed Inventory',
  distressed_businesses: 'Distressed Businesses',
  services: 'Services',
  business_opportunities: 'Business Opportunities',
  genetics: 'Genetics',
}

function formatPublicLabel(value: string | null | undefined, labels: Record<string, string> = {}) {
  if (!value) return 'Available on request'
  return labels[value] ?? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatPrice(listing: PublicListing) {
  if (listing.price_amount === null) return 'Confirm through Harbourview'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.price_currency || 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price_amount)
}

function getStringSpec(listing: PublicListing, key: string) {
  const value = listing.high_level_specs?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function DetailVisual({ listing }: { listing: PublicListing }) {
  const label = formatPublicLabel(listing.category, CATEGORY_LABELS)
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#C6A55A]/20 bg-[radial-gradient(circle_at_72%_18%,rgba(198,165,90,0.18),transparent_32%),linear-gradient(135deg,rgba(245,241,232,0.08),rgba(8,20,35,0.94))] p-6">
      <span className="inline-flex rounded-full border border-[#C6A55A]/30 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8BC73]">
        Representative public image slot
      </span>
      <div className="mt-16 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C6A55A]">Harbourview</p>
          <p className="mt-2 text-2xl font-semibold text-[#F5F1E8]">{label}</p>
          <p className="mt-2 max-w-xl text-xs leading-5 text-[#F5F1E8]/52">
            Static safe fallback. Public imagery is category-level only and does not disclose supplier identity, source materials, evidence, documents or private review context.
          </p>
        </div>
        <div className="hidden items-end gap-2 opacity-75 sm:flex" aria-hidden="true">
          <div className="h-14 w-7 rounded-b-sm rounded-t-full border border-[#C6A55A]/45 bg-white/10" />
          <div className="h-20 w-9 rounded-b-sm rounded-t-full border border-[#C6A55A]/55 bg-white/15" />
          <div className="h-12 w-7 rounded-b-sm rounded-t-full border border-[#C6A55A]/35 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export default async function MarketplaceListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) return notFound()

  const ctaLabel = getStringSpec(listing, 'cta_label') ?? 'Request Harbourview review'
  const buyerFit = getStringSpec(listing, 'buyer_fit')
  const complianceNote = getStringSpec(listing, 'compliance_note')

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          Back to listings
        </Link>

        <div className="mt-8 rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-[#C6A55A]">
            {formatPublicLabel(listing.marketplace_section)}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{listing.title}</h1>

          <DetailVisual listing={listing} />

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Category</span>
              {formatPublicLabel(listing.category, CATEGORY_LABELS)}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Type</span>
              {formatPublicLabel(listing.product_type)}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Price</span>
              {formatPrice(listing)}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Location</span>
              {listing.location_country || formatPublicLabel(listing.region, REGION_LABELS)}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#F5F1E8]/82">{listing.description}</p>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Buyer fit</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                {buyerFit ?? 'Qualified operators, buyers, service partners or counterparties whose requirements match this reviewed public summary.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Harbourview qualification note</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                Harbourview handles introduction requests through a controlled review process. Availability, counterparty fit, commercial terms and any required seller engagement are confirmed before a handoff is made.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                {complianceNote ?? 'Public pages show safe summaries only. Private documents, counterparty identity, source materials, diligence context and non-public review records are not disclosed here.'}
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
              href={`/marketplace/deals/new?listing=${encodeURIComponent(listing.id)}&title=${encodeURIComponent(listing.title)}`}
              className="rounded-full border border-[#C6A55A]/40 px-5 py-3 text-center text-sm font-medium text-[#C6A55A] transition hover:border-[#C6A55A]/70 hover:bg-[#C6A55A]/10"
            >
              Open private deal room →
            </Link>
          </div>

          <InquiryForm listingSlug={listing.slug ?? slug} listingTitle={listing.title} ctaLabel={ctaLabel} />
        </div>
      </article>
    </main>
  )
}
