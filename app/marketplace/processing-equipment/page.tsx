import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
export const dynamic = 'force-dynamic'
export const revalidate = 0


export const metadata: Metadata = {
  title: 'Cannabis Processing Equipment | Harbourview',
  description: 'Reviewed cannabis processing, extraction, post-harvest and packaging equipment for regulated operators. Harbourview introduction review before counterparty contact.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America', europe: 'Europe', asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America', middle_east_africa: 'Middle East & Africa', global: 'Global',
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = (specs?.cta_label as string) ?? 'Request information'
  return (
    <div className="group flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      {listing.is_featured && <span className="mb-3 inline-flex w-fit rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Featured</span>}
      {listing.product_type && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{listing.product_type}</p>}
      <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {listing.condition && <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">{listing.condition}</span>}
        {listing.region && <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">{REGION_LABELS[listing.region] ?? listing.region}</span>}
      </div>
      <Link href={`/contact?ref=${listing.slug ?? listing.id}&type=processing-equipment`} className="btn-marketplace mt-6 justify-center text-center text-sm">{ctaLabel}</Link>
    </div>
  )
}

function EmptyState({ submitHref = '/marketplace/sell', submitLabel = 'Submit listing' }: { submitHref?: string; submitLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" />
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No listings currently available</p>
      <p className="mb-6 text-sm leading-7 text-white/54">Opportunities in this category are sourced through Harbourview review. Submit an opportunity or request sourcing.</p>
      <Link href={submitHref} className="btn-marketplace text-sm">{submitLabel}</Link>
    </div>
  )
}

export default async function ProcessingequipmentPage() {
  const listings = await getPublicListingsByCategory('processing_equipment')
  return (
    <>
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>{' / Processing Equipment'}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Cannabis processing, extraction and post-harvest equipment.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>Extraction systems, post-harvest processing, distillation, formulation and automated packaging equipment for licensed cannabis operators. Equipment authority and availability reviewed before any introduction.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit equipment</Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Request sourcing</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-gold/10 bg-[#030b16] py-10">
        <div className="page-container grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div key="Extraction systems" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Extraction systems</h3>
              <p className="text-sm leading-7 text-white/52">CO₂, hydrocarbon, ethanol and solventless extraction systems at laboratory, pilot and commercial scale.</p>
            </div>
          <div key="Post-harvest processing" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Post-harvest processing</h3>
              <p className="text-sm leading-7 text-white/52">Trimming, drying, curing, bucking and automated post-harvest handling equipment.</p>
            </div>
          <div key="Distillation and formulation" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Distillation and formulation</h3>
              <p className="text-sm leading-7 text-white/52">Short-path and wiped-film distillation, winterisation, filtration and formulation systems.</p>
            </div>
          <div key="Filling and packaging" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Filling and packaging</h3>
              <p className="text-sm leading-7 text-white/52">Automated filling, cartridge, capsule, pre-roll and packaging line equipment for pharma and consumer formats.</p>
            </div>
        </div>
      </section>
      <section className="border-b border-gold/10 bg-[#020814] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">Public summaries only</p>
            <p className="text-sm leading-7 text-white/62">Listings show reviewed public summaries. Seller identity, pricing, equipment condition detail, service history and availability are not disclosed without qualification.</p>
          </div>
        </div>
      </section>
      <section className="bg-[#030b16] py-12 sm:py-16 lg:py-18">
        <div className="page-container">
          {listings.length === 0 ? <EmptyState /> : (
            <>
              <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Reviewed listings</p>
                  <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Current approved listings.</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </>
          )}
        </div>
      </section>
      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Selling or sourcing processing equipment?</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Submit for review.</h2>
            <p className="mt-4 text-sm leading-7 text-white/58">Extraction, post-harvest, formulation and packaging equipment. Harbourview reviews all submissions before any buyer introduction.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit equipment</Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Speak confidentially</Link>
          </div>
        </div>
      </section>
    </>
  )
}
