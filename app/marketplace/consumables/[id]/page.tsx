import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InquiryForm } from '@/components/marketplace/InquiryForm'
import { ProofOfAvailabilityForm } from '@/components/marketplace/ProofOfAvailabilityForm'
import { getPublicListingBySlug, type PublicListing } from '@/lib/server/listingsQuery'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getPublicListingBySlug(id)
  if (!listing) return { title: 'Listing not found | Harbourview Network' }
  return {
    title: `${listing.title} | Harbourview Network`,
    description: `${listing.description.slice(0, 140)} — Inquiry reviewed through Harbourview.`,
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

function getStringSpec(listing: PublicListing, key: string) {
  const value = listing.high_level_specs?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default async function ConsumableDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getPublicListingBySlug(id)

  if (!listing) notFound()

  const ctaLabel = getStringSpec(listing, 'cta_label') ?? 'Request qualification'
  const region = listing.location_country || REGION_LABELS[listing.region] || listing.region || 'Region confirmed by inquiry'

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <Link href="/marketplace/consumables" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          ← Back to Consumables
        </Link>

        <div className="mt-8 rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-[#C6A55A]">Consumables &amp; Operating Supplies</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{listing.title}</h1>

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Type</span>
              {listing.product_type ?? 'Consumables supply'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Price</span>
              {listing.price_amount
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: listing.price_currency || 'USD', maximumFractionDigits: 0 }).format(listing.price_amount)
                : 'Price on request'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Region</span>
              {region}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#F5F1E8]/82">{listing.description}</p>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">What to include in your inquiry</h2>
              <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm leading-6 text-[#F5F1E8]/70">
                <li>Category of supply or specific SKUs of interest</li>
                <li>Estimated order volume and cadence</li>
                <li>Region and whether international shipping is required</li>
                <li>Timing — when you need delivery</li>
                <li>Budget or target price range</li>
                <li>Specification, certification or format requirements</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Harbourview review note</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                Supplier contact details, pricing, minimum order quantities, delivery timelines and introduction fit are reviewed through Harbourview before any supplier response or introduction is coordinated.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                Restricted chemicals, controlled solvents, pesticides and prescription products are excluded from Harbourview Network.
              </p>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#inquiry" className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]">
              {ctaLabel}
            </a>
            <Link href="/marketplace/sell" className="rounded-full border border-[#C6A55A]/40 px-5 py-3 text-center text-sm font-medium text-[#C6A55A] transition hover:border-[#C6A55A]">
              Offer similar supply
            </Link>
          </div>

          <InquiryForm listingSlug={listing.slug ?? id} listingTitle={listing.title} ctaLabel={ctaLabel} />
          <ProofOfAvailabilityForm listingSlug={listing.slug ?? id} listingTitle={listing.title} />
        </div>
      </article>
    </main>
  )
}
