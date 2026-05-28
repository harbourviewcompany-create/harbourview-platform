import type { Metadata } from 'next'
import Link from 'next/link'
import { businessOpportunities } from '@/lib/fixtures/business-opportunities'
import type { BusinessOpportunity } from '@/lib/fixtures/types'
import { getLiveBusinessOpportunities } from '@/lib/marketplace/liveOpportunities'

export const metadata: Metadata = {
  title: 'Business Opportunities | Harbourview',
  description:
    'Licensed facility acquisitions, brand acquisitions, equity opportunities and strategic commercial pathways for regulated cannabis operators.',
}

const opportunityTypes = [
  {
    title: 'Facility acquisitions',
    body: 'Licensed production facilities, processing sites and distribution assets available through structured confidential process.',
  },
  {
    title: 'Brand and IP transactions',
    body: 'Cannabis brand acquisitions, IP transfers, white-label arrangements and licensing structures for regulated markets.',
  },
  {
    title: 'Equity and investment access',
    body: 'Equity opportunities, strategic investment rounds and partnership structures in regulated cannabis operators.',
  },
  {
    title: 'Distribution mandates',
    body: 'Exclusive and non-exclusive distribution mandates, import agent arrangements and market-access partnerships.',
  },
]

function ListingCard({ listing }: { listing: BusinessOpportunity }) {
  const ctaLabel = 'Request qualification'

  return (
    <div className="group flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {listing.opportunityType.replaceAll('-', ' ')}
      </p>
      <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
          {listing.location}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">
          {listing.state}
        </span>
      </div>
      <Link
        href={`/contact?ref=${listing.id}&type=business_opportunity`}
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
      <p className="mb-2 text-lg font-semibold text-[#f5f1e8]">No opportunities listed</p>
      <p className="mb-6 text-sm leading-7 text-white/54">
        Business opportunities are surfaced through Harbourview review. Submit an opportunity or speak confidentially to discuss what you are looking for.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace/sell" className="btn-marketplace text-sm">
          Submit an opportunity
        </Link>
        <Link href="/intake" className="btn-intelligence text-sm">
          Speak confidentially
        </Link>
      </div>
    </div>
  )
}

export default async function BusinessOpportunitiesPage() {
  const opportunityFeed = await getLiveBusinessOpportunities(businessOpportunities)
  const listings = opportunityFeed.listings

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>
            {' '}/ Business Opportunities
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Structured commercial opportunities in regulated cannabis markets.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>
              Facility acquisitions, brand transactions, equity access and distribution mandates.
              All opportunities are subject to confidential Harbourview qualification before
              any introduction or disclosure.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
              Speak confidentially
            </Link>
            <Link href="/marketplace/sell" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">
              Submit an opportunity
            </Link>
          </div>
        </div>
      </section>

      {/* Opportunity types */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-14">
        <div className="page-container">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Opportunity types
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
              Confidential review before any disclosure.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {opportunityTypes.map((item) => (
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
              Confidential review before disclosure
            </p>
            <p className="text-sm leading-7 text-white/62">
              Parties, transaction terms, assets, distress context, diligence packs and dealroom access
              are private unless explicitly approved for public-safe summary. Public pages show controlled
              summaries only. Harbourview reviews all qualification requests before any counterparty
              contact or introduction is coordinated.
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
                    Reviewed opportunities
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
                Have an opportunity to submit?
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
                Submit for Harbourview review.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Facility transactions, M&amp;A, equity access and distribution mandates in regulated markets.
                Submission does not guarantee publication or introduction. All opportunities require
                Harbourview qualification.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">
                Submit opportunity
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
