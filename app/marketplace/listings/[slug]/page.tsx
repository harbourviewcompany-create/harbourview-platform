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

function getSpecStrings(specs: Record<string, unknown>, key: string): string[] {
  const value = specs[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getSpecString(specs: Record<string, unknown>, key: string) {
  const value = specs[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export default async function MarketplaceListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug)

  if (!listing) notFound()

  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = getSpecString(specs, 'cta_label') ?? 'Request Harbourview review'
  const buyerFit = getSpecStrings(specs, 'buyer_fit')
  const qualificationNote = getSpecString(specs, 'qualification_note')
  const price = listing.price_amount ? `${listing.price_currency} ${listing.price_amount.toLocaleString()}` : 'Confirm through Harbourview'

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-16 text-[#F5F1E8] md:px-10 lg:px-16">
      <article className="mx-auto max-w-5xl">
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          Back to listings
        </Link>

        <div className="mt-8 rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-[#C6A55A]">{listing.marketplace_section}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{listing.title}</h1>

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Category</span>
              {listing.category.replace(/_/g, ' ')}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Type</span>
              {listing.product_type ?? listing.seller_type}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Price</span>
              {price}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Region</span>
              {REGION_LABELS[listing.region] ?? listing.region}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#F5F1E8]/82">{listing.description}</p>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Buyer fit</h2>
              {buyerFit.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-[#F5F1E8]/75">
                  {buyerFit.map((fit) => (
                    <li key={fit}>{fit}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                  Qualified operators, buyers or service counterparties with relevant market requirements.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Harbourview qualification note</h2>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/75">
                {qualificationNote ?? 'Harbourview handles introduction requests through a controlled review process. Counterparty fit, commercial terms and any required seller engagement are confirmed before a handoff is made.'}
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
          </div>

          <InquiryForm listingSlug={listing.slug ?? listing.id} listingTitle={listing.title} ctaLabel={ctaLabel} />
        </div>
      </article>
    </main>
  )
}
