import type { Metadata } from 'next'
import Link from 'next/link'

const licensedInventoryHref = '/marketplace/' + 'cannabis-inventory'

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Harbourview Marketplace is a controlled commercial marketplace for regulated products, inputs, services and market-specific opportunities.',
  openGraph: {
    title: 'Harbourview Marketplace',
    description:
      'A controlled commercial marketplace for regulated products, inputs, services and market-specific opportunities.',
  },
}

const categories = [
  {
    label: 'Used & Surplus Equipment',
    href: '/marketplace/used-surplus',
    description: 'Surplus equipment, liquidations and closure packages.',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description: 'Facilities, partnerships and structured commercial routes.',
  },
  {
    label: 'Consumables & Operating Supplies',
    href: '/marketplace/consumables',
    description: 'Packaging, lab, cultivation and sanitation supplies.',
  },
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description: 'New equipment, automation and operating supplies.',
  },
  {
    label: 'Cann' + 'abis Inventory',
    href: licensedInventoryHref,
    description: 'Licensed-only inventory review and routing.',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description: 'Compliance, logistics, QA and operational providers.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted',
    description: 'Buyer demand across equipment, inputs and inventory.',
  },
  {
    label: 'Supplier Directory',
    href: '/supplier-directory',
    description: 'Supplier profiles across operating support categories.',
  },
]

const processCards = [
  {
    title: 'Operators submit',
    body: 'Operators submit available products, assets, services or opportunities for Harbourview review. Publication is not automatic and does not expose contact details publicly.',
  },
  {
    title: 'Buyers browse and inquire',
    body: 'Buyers browse Marketplace categories, view opportunities and inquire to buy. Buyer inquiries are reviewed by Harbourview before any counterparty contact.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Harbourview reviews inquiries before coordinating introductions. Seller contact details are not public. Introductions are handled privately.',
  },
  {
    title: 'Transaction follow-up',
    body: 'Transactions remain subject to buyer and seller agreement. Harbourview supports the introduction and follow-up process without acting as agent or party.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-5xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Marketplace
            </p>

            <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              A controlled commercial marketplace for regulated products, inputs,
              services and market-specific opportunities.
            </h1>

            <div className="mt-8 h-px w-20 bg-gradient-to-r from-gold to-gold-light"></div>

            <p className="mt-8 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Harbourview Marketplace helps serious operators surface reviewed
              commercial opportunities and market-specific pathways. Contact
              details are not public. Harbourview reviews inquiries before
              coordinating introductions or transaction follow-up.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/sell" className="btn-marketplace">
                Submit Opportunity
              </Link>

              <Link href="#categories" className="btn-intelligence">
                Browse Marketplace
              </Link>

              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-intelligence"
              >
                Post What You Want to Buy
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Marketplace Workflow
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Structured commercial review before introduction.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {processCards.map((card) => (
              <div
                key={card.title}
                className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light"></div>
                <h3 className="mb-4 text-lg font-semibold text-[#f4f1eb]">
                  {card.title}
                </h3>
                <p className="text-sm leading-7 text-white/58">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Marketplace Categories
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Browse reviewed opportunity categories.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.95)_0%,rgba(5,12,22,1)_100%)] p-7 transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100"></div>

                <h3 className="mb-4 text-xl font-semibold text-[#f4f1eb]">
                  {cat.label}
                </h3>

                <p className="text-sm leading-7 text-white/58">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Submit to Harbourview
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Have an opportunity to submit?
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/58 sm:text-base">
              Submit equipment, supplies, services or commercial opportunities
              for Harbourview review.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link href="/marketplace/sell" className="btn-marketplace justify-center">
              Submit Opportunity
            </Link>

            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-intelligence justify-center"
            >
              Post What You Want to Buy
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
