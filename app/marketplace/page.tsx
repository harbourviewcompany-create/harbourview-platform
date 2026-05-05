import type { Metadata } from 'next'
import Link from 'next/link'

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
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
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
    label: 'Marketplace Opportunities',
    href: '/marketplace/listings',
    description: 'Reviewed opportunities routed through Harbourview qualification.',
  },
  {
    label: 'Supplier Directory',
    href: '/supplier-directory',
    description: 'Supplier profiles across operating support categories.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Harbourview Marketplace
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              A controlled commercial marketplace for regulated products, inputs, services and market-specific opportunities.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
              Harbourview Marketplace helps serious operators surface reviewed commercial opportunities and market-specific pathways. Contact details are not public. Harbourview reviews inquiries before coordinating introductions or transaction follow-up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/sell" className="btn-primary text-center">
                Submit Opportunity
              </Link>
              <Link
                href="#categories"
                className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy"
              >
                Browse Marketplace
              </Link>
              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-outline border-white/40 text-center text-white hover:bg-white hover:text-navy"
              >
                Post What You Want to Buy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How the marketplace works */}
      <section className="border-b border-gray-100 py-12">
        <div className="page-container">
          <h2 className="mb-6 text-lg font-semibold text-navy">How the marketplace works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Operators submit</h3>
              <p className="text-sm text-gray-500">
                Operators submit available products, assets, services or opportunities for Harbourview review. Publication is not automatic and does not expose contact details publicly.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Buyers browse and inquire</h3>
              <p className="text-sm text-gray-500">
                Buyers browse Marketplace categories, view opportunities and inquire to buy. Buyer inquiries are reviewed by Harbourview before any counterparty contact.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Harbourview reviews</h3>
              <p className="text-sm text-gray-500">
                Harbourview reviews inquiries before coordinating introductions. Seller contact details are not public. Introductions are handled privately.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Transaction follow-up</h3>
              <p className="text-sm text-gray-500">
                Transactions remain subject to buyer and seller agreement. Harbourview supports the introduction and follow-up process without acting as agent or party.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="py-12">
        <div className="page-container">
          <h2 className="mb-6 text-lg font-semibold text-navy">Marketplace categories</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="card p-6">
                <h3 className="mb-2 font-semibold text-lg">{cat.label}</h3>
                <p className="text-gray-500 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA strip */}
      <section className="border-t border-gray-100 py-10">
        <div className="page-container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-navy">Have an opportunity to submit?</p>
            <p className="text-sm text-gray-500">
              Submit equipment, supplies, services or commercial opportunities for Harbourview review.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/sell" className="btn-primary shrink-0">
              Submit Opportunity
            </Link>
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-outline shrink-0 text-navy"
            >
              Post What You Want to Buy
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
