import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Inquiry-First Cannabis Marketplace | Harbourview',
  description:
    'Submit supply, post wanted requests and route reviewed cannabis-sector commercial opportunities through Harbourview inquiry-first marketplace.',
  openGraph: {
    title: 'Harbourview Marketplace',
    description:
      'Submit supply, post wanted requests and route reviewed cannabis-sector commercial opportunities through Harbourview inquiry-first marketplace.',
  },
}

const categories = [
  {
    label: 'Marketplace Listings',
    href: '/marketplace/listings',
    description:
      'Listing candidates across suppliers, equipment, operating supplies and commercial opportunities routed through Harbourview qualification before introduction.',
  },
  {
    label: 'Consumables & Operating Supplies',
    href: '/marketplace/consumables',
    description:
      'Packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance supply categories handled by inquiry.',
  },
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description:
      'New equipment, packaging, automation, cultivation, processing and operating-supply categories.',
  },
  {
    label: 'Used & Surplus',
    href: '/marketplace/used-surplus',
    description:
      'Used systems, surplus assets, discounted overstock, liquidations and facility closure packages.',
  },
  {
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
    description:
      'Wholesale flower, biomass, extracts and genetics for licensed, qualified counterparties.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted',
    description:
      'Buyer-side demand signals from operators looking for equipment, inputs, inventory or services.',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description:
      'Commercial, compliance, logistics, QA, facility, accounting and operational service providers.',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description:
      'Facilities, partnerships, acquisition targets, licensing routes and structured commercial opportunities.',
  },
  {
    label: 'Supplier Directory',
    href: '/supplier-directory',
    description:
      'Supplier profiles across equipment, packaging, services, testing, logistics and operator support.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Harbourview Marketplace
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              List supply, surface buyer demand and route qualified cannabis-sector opportunities through Harbourview.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
              Harbourview helps operators, suppliers and service providers surface reviewed supply, wanted requests and commercial opportunities through a controlled inquiry-first marketplace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/marketplace/sell"
                className="btn-primary text-center"
                data-testid="marketplace-submit-supply"
              >
                Submit Supply
              </Link>
              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy"
                data-testid="marketplace-post-wanted-request"
              >
                Post Wanted Request
              </Link>
              <Link
                href="/intake"
                className="btn-outline border-white/40 text-center text-white hover:bg-white hover:text-navy"
                data-testid="marketplace-request-confidential-support"
              >
                Request Confidential Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-navy">Marketplace categories</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Browse public category paths, then use inquiry-first capture when a listing, request or supplier opportunity needs Harbourview review.
            </p>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Submit</h3>
              <p className="text-sm text-gray-600">
                Suppliers, buyers or operators submit supply, wanted requests or inquiry details through structured capture.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Screen</h3>
              <p className="text-sm text-gray-600">
                Harbourview reviews category fit, basic commercial relevance and whether a private introduction or quote path is appropriate.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Route</h3>
              <p className="text-sm text-gray-600">
                Qualified opportunities are routed through inquiry-first follow-up. Public publication is not automatic.
              </p>
            </div>
          </div>

          <div className="mb-12 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <div className="max-w-4xl">
              <h2 className="text-lg font-semibold text-navy">
                Suppliers: get reviewed for marketplace visibility
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Suppliers of equipment, consumables, services and operating support can submit opportunities for Harbourview review. Early submissions may be considered for category visibility, wanted-request matching or confidential buyer routing where appropriate.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-navy">Accepted examples</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Consumables & operating supplies</li>
                    <li>Used and surplus equipment</li>
                    <li>Commercial services</li>
                    <li>Supplier directory profiles</li>
                    <li>Business opportunities</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy">Excluded examples</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Restricted chemicals, pesticides or controlled solvents</li>
                    <li>Prescription or medical products</li>
                    <li>Unverified cannabis inventory</li>
                    <li>Genetics, seeds or clones unless licence-review requirements are satisfied</li>
                  </ul>
                </div>
              </div>
              <Link
                href="/marketplace/sell"
                className="btn-primary mt-6 inline-flex"
                data-testid="marketplace-submit-supply-secondary"
              >
                Submit Supply for Review
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="card p-6">
                <h2 className="mb-2 text-lg font-semibold">{cat.label}</h2>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
