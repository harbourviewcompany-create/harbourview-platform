import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Distressed Inventory | Harbourview',
  description:
    'Reviewed distressed cannabis inventory, overstock and liquidation opportunities for regulated buyers. Confidential intake and private routing through Harbourview.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America', europe: 'Europe', asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America', middle_east_africa: 'Middle East & Africa', global: 'Global',
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const specs = listing.high_level_specs as Record<string, unknown>
  const ctaLabel = (specs?.cta_label as string) ?? 'Request qualification'
  return (
    <div className="group flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      {listing.is_featured && (
        <span className="mb-3 inline-flex w-fit rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Featured</span>
      )}
      {listing.product_type && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{listing.product_type}</p>}
      <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {listing.region && <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">{REGION_LABELS[listing.region] ?? listing.region}</span>}
      </div>
      <Link href={`/contact?ref=${listing.slug ?? listing.id}&type=distressed_inventory`} className="btn-marketplace mt-6 justify-center text-center text-sm">{ctaLabel}</Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" />
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No public listings available</p>
      <p className="mb-6 text-sm leading-7 text-white/54">Distressed inventory is sourced confidentially. Submit or speak with Harbourview directly.</p>
      <Link href="/intake" className="btn-marketplace text-sm">Speak confidentially</Link>
    </div>
  )
}

export default async function DistressedInventoryPage() {
  const listings = await getPublicListingsByCategory('distressed_inventory')
  return (
    <>
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
            {' / Distressed Inventory'}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Distressed inventory and liquidation opportunities.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>Overstock, distressed product, time-sensitive inventory and liquidation opportunities from regulated operators. All submissions reviewed before any public summary or buyer introduction.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit confidentially</Link>
            <Link href="/marketplace/wanted" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Post a wanted request</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-gold/10 bg-[#020814] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">Confidential intake — public summaries only</p>
            <p className="text-sm leading-7 text-white/62">Seller identity, product details, pricing and diligence materials are never disclosed without qualification and party approval.</p>
          </div>
        </div>
      </section>
      <section className="bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          {listings.length === 0 ? <EmptyState /> : (
            <>
              <div className="mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Reviewed listings</p>
                <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Current approved opportunities.</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
            </>
          )}
        </div>
      </section>
      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Holding distressed inventory?</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Speak confidentially with Harbourview.</h2>
            <p className="mt-4 text-sm leading-7 text-white/58">Overstock, distressed product, liquidations and time-sensitive supply. Review and confidential routing before any buyer introduction.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit confidentially</Link>
            <Link href="/marketplace/sell" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Submit opportunity</Link>
          </div>
        </div>
      </section>
    </>
  )
}
