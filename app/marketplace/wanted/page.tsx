import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import type { WantedRequest } from '@/lib/fixtures/types'

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview Network',
  description:
    'Create a wanted request through Harbourview Network. Describe buyer or operator demand and Harbourview will review before routing supplier responses privately.',
  openGraph: {
    title: 'Wanted Requests | Harbourview Network',
    description:
      'Create a wanted request and Harbourview will review before routing supplier responses privately.',
  },
}

const workflow = [
  {
    title: 'Describe the requirement',
    body: 'Submit category, quantity, target market, timing, budget range and any licence, documentation or compliance requirements.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Wanted requests are reviewed for fit, commercial relevance and routing context before any supplier response is coordinated.',
  },
  {
    title: 'Private supplier routing',
    body: 'Harbourview may route requests privately. Submission does not guarantee supplier response, availability, pricing or transaction terms.',
  },
]

const visualRules = [
  { terms: ['extraction', 'co2', 'ethanol', 'processing equipment'], label: 'Extraction equipment', shape: 'processing system' },
  { terms: ['mylar', 'pouch', 'exit bags', 'packaging'], label: 'Mylar pouches', shape: 'pouches' },
  { terms: ['pos', 'technology', 'retail', 'metrc', 'biotrack'], label: 'Retail POS system', shape: 'retail technology' },
  { terms: ['facility', 'real estate', 'cultivation', 'lease', 'warehouse'], label: 'Commercial facility', shape: 'facility request' },
]

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getWantedVisual(listing: WantedRequest) {
  const haystack = `${listing.title} ${listing.description} ${listing.tags.join(' ')}`.toLowerCase()
  const match = visualRules.find((rule) => rule.terms.some((term) => haystack.includes(term)))

  if (match) return match

  const firstUsefulTag = listing.tags.find((tag) => !['wanted', 'bulk'].includes(tag.toLowerCase()))

  if (firstUsefulTag) {
    return {
      label: titleCase(firstUsefulTag),
      shape: 'wanted request',
    }
  }

  return {
    label: 'Wanted Request',
    shape: 'commercial requirement',
  }
}

function WantedBudget({ budget }: { budget?: string }) {
  if (!budget) return null

  if (budget === '$3,000–$8,000') {
    return (
      <>
        <span>$</span>3,000–<span>$</span>8,000
      </>
    )
  }

  return <>{budget}</>
}

function WantedVisual({ listing }: { listing: WantedRequest }) {
  const visual = getWantedVisual(listing)

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gold-pale via-white to-gray-100 p-4">
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
        Representative image
      </span>
      <div className="flex h-full items-end justify-between gap-3 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">Harbourview</p>
          <p className="mt-1 text-sm font-semibold text-navy">{visual.label}</p>
          <p className="text-xs text-gray-500">{visual.shape}</p>
        </div>
        <div className="flex items-end gap-1.5 opacity-80" aria-hidden="true">
          <div className="h-10 w-5 rounded-t-full rounded-b-sm border border-gold/50 bg-white/80" />
          <div className="h-14 w-7 rounded-t-full rounded-b-sm border border-gold/50 bg-white/90" />
          <div className="h-8 w-5 rounded-t-full rounded-b-sm border border-gold/50 bg-white/75" />
        </div>
      </div>
    </div>
  )
}

function WantedListingCard({ listing }: { listing: WantedRequest }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-white/80 bg-[#f8f4ea] p-5 text-navy shadow-[0_22px_60px_rgba(0,0,0,0.24)]">
      <WantedVisual listing={listing} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-semibold leading-snug text-navy">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-500">{listing.location || 'Location available on request'}</p>
        </div>
        {listing.budget && (
          <p className="shrink-0 rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-navy shadow-sm">
            <WantedBudget budget={listing.budget} />
          </p>
        )}
      </div>

      <p className="line-clamp-4 text-sm leading-6 text-gray-700">{listing.description}</p>

      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-gray-600">
        Public summary only. Contact details are private and inquiries are reviewed before routing.
      </p>

      <div className="mt-auto border-t border-gold/25 pt-4">
        <Link href={`/marketplace/quote?listing=${encodeURIComponent(listing.title)}`} className="btn-outline px-4 py-2 text-xs">
          Respond to Request
        </Link>
      </div>
    </article>
  )
}

export default function WantedPage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Network Wanted Requests
            </p>
            <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Buyer and operator demand routed through controlled review.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Describe buyer or operator demand for equipment, inventory, inputs,
              services or market-specific requirements. Harbourview reviews wanted
              requests before any supplier routing. Contact details remain private
              unless Harbourview coordinates a routed response.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/sell?type=wanted" className="btn-marketplace justify-center">
                Create Wanted Request
              </Link>
              <Link href="/marketplace" className="btn-intelligence justify-center">
                Explore Network
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.title}
                className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light"></div>
                <h3 className="mb-3 text-base font-semibold text-[#f4f1eb]">{item.title}</h3>
                <p className="text-sm leading-7 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container">
          {wantedRequests.length === 0 ? (
            <div className="rounded-sm border border-gold/10 bg-[#071425] px-6 py-16 text-center shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
              <p className="mb-4 text-lg text-white/68">No wanted requests are currently listed.</p>
              <Link href="/marketplace/sell?type=wanted" className="btn-marketplace justify-center">
                Create Wanted Request
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                    Current Wanted Requests
                  </p>
                  <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                    Reviewed public summaries. Private routing only.
                  </h2>
                </div>
                <Link href="/marketplace/sell?type=wanted" className="btn-intelligence justify-center">
                  Add Requirement
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wantedRequests.map((listing) => (
                  <WantedListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}

          <div className="mt-12 flex flex-col gap-5 border-t border-gold/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-white/56">
              Have supply that may fit a request? Submit the opportunity or request
              confidential support. Harbourview review is required before any supplier
              response, buyer introduction or commercial routing.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/marketplace/sell" className="btn-intelligence justify-center text-sm">
                Submit Opportunity
              </Link>
              <Link href="/intake" className="btn-marketplace justify-center text-sm">
                Confidential Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
