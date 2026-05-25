import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

export const metadata: Metadata = {
  title: 'Cannabis Professional Services | Harbourview',
  description: 'Reviewed professional services for regulated cannabis operators — legal, compliance, regulatory affairs, quality, finance and commercial advisory. Introduction via Harbourview.',
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
      <Link href={`/contact?ref=${listing.slug ?? listing.id}&type=professional-services`} className="btn-marketplace mt-6 justify-center text-center text-sm">{ctaLabel}</Link>
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

export default async function ProfessionalservicesPage() {
  const listings = await getPublicListingsByCategory('professional_services')
  return (
    <>
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>{' / Professional Services'}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Professional services for regulated cannabis operators.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>Legal, regulatory affairs, compliance, GMP consultancy, quality management, financial advisory and commercial development services for licensed cannabis operators and investors. All providers reviewed before introduction.</p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit service</Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Request introduction</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-gold/10 bg-[#030b16] py-10">
        <div className="page-container grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div key="Legal and regulatory affairs" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Legal and regulatory affairs</h3>
              <p className="text-sm leading-7 text-white/52">Cannabis law, licensing applications, import/export regulatory advice, IP and commercial contract services.</p>
            </div>
          <div key="Quality and GMP consultancy" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Quality and GMP consultancy</h3>
              <p className="text-sm leading-7 text-white/52">GMP implementation, audit preparation, quality management systems, GACP and documentation programme development.</p>
            </div>
          <div key="Financial advisory and M&A" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Financial advisory and M&A</h3>
              <p className="text-sm leading-7 text-white/52">Cannabis-sector financial advisory, M&A support, due diligence, valuation and investor-readiness services.</p>
            </div>
          <div key="Commercial and market-access advisory" className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
              <h3 className="mb-2 text-sm font-semibold text-[#f5f1e8]">Commercial and market-access advisory</h3>
              <p className="text-sm leading-7 text-white/52">Market-entry strategy, BD support, distributor and buyer identification, and commercial pathway development.</p>
            </div>
        </div>
      </section>
      <section className="border-b border-gold/10 bg-[#020814] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">Reviewed introductions — not legal or regulatory advice</p>
            <p className="text-sm leading-7 text-white/62">Professional service listings show reviewed public summaries. Provider identity, credentials, engagement terms and service scope are not disclosed without qualification. Harbourview introductions do not constitute legal, regulatory or financial advice.</p>
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Professional services provider?</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Submit for Harbourview review.</h2>
            <p className="mt-4 text-sm leading-7 text-white/58">Legal, regulatory, GMP, financial and commercial advisory services for regulated cannabis operators. Review and qualification before any operator introduction.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Submit service</Link>
            <Link href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Speak confidentially</Link>
          </div>
        </div>
      </section>
    </>
  )
}
