import type { Metadata } from 'next'
import Link from 'next/link'
import { wantedRequests } from '@/lib/fixtures/wanted-requests'
import ListingCard from '@/components/ListingCard'

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
                  <ListingCard key={listing.id} listing={listing} />
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
