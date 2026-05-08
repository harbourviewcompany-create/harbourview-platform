import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Reviewed Network Listings | Harbourview Network',
  description:
    'A safe public entry point for Harbourview Network listing categories, wanted requests and opportunity submissions.',
  openGraph: {
    title: 'Reviewed Network Listings | Harbourview Network',
    description:
      'Explore Harbourview Network categories and submit commercial opportunities through controlled review pathways.',
  },
}

const accessCards = [
  {
    title: 'Explore the Network',
    href: '/marketplace',
    eyebrow: 'Network overview',
    body: 'Review the public Harbourview Network categories for regulated products, inputs, services, wanted requests and commercial access pathways.',
  },
  {
    title: 'Review Wanted Requests',
    href: '/marketplace/wanted',
    eyebrow: 'Buyer demand',
    body: 'View public summaries of operator requirements and buyer-side demand that can be routed through Harbourview review.',
  },
  {
    title: 'Submit an Opportunity',
    href: '/marketplace/sell',
    eyebrow: 'Controlled intake',
    body: 'Submit supply, services, assets or commercial opportunities for Harbourview review before any publication or introduction pathway.',
  },
]

const guardrails = [
  'Public pages show controlled summaries only.',
  'Private counterparty details are not published on this route.',
  'Availability, terms and introduction fit remain subject to Harbourview review.',
]

export default function MarketplaceListingsPage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-5xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Network Listings
            </p>

            <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Reviewed commercial pathways for qualified network opportunities.
            </h1>

            <div className="mt-8 h-px w-20 bg-gradient-to-r from-gold to-gold-light"></div>

            <p className="mt-8 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Harbourview Network organizes public access around controlled category
              summaries, wanted requests and reviewed submission pathways. Sensitive
              counterparty information, commercial terms and internal review context
              remain private unless a separate qualified introduction is appropriate.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace" className="btn-marketplace">
                Explore Harbourview Network
              </Link>

              <Link href="/marketplace/wanted" className="btn-intelligence">
                View Wanted Requests
              </Link>

              <Link href="/marketplace/sell" className="btn-intelligence">
                Submit Opportunity
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Public Access Routes
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Start from the appropriate reviewed pathway.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {accessCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.95)_0%,rgba(5,12,22,1)_100%)] p-7 transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626]"
              >
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">
                  {card.eyebrow}
                </p>

                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100"></div>

                <h3 className="mb-4 text-xl font-semibold text-[#f4f1eb]">
                  {card.title}
                </h3>

                <p className="text-sm leading-7 text-white/58">{card.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Review Standard
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Public visibility is intentionally limited.
            </h2>
          </div>

          <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-7 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <ul className="space-y-5">
              {guardrails.map((item) => (
                <li key={item} className="flex gap-4 text-sm leading-7 text-white/62">
                  <span className="mt-3 h-px w-8 shrink-0 bg-gradient-to-r from-gold to-gold-light" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
