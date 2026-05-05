import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Harbourview Network | Global Cannabis Commercial Access',
  description:
    'Explore regulated cannabis supply, wanted requests, category pathways and qualified commercial opportunities through Harbourview Network.',
  openGraph: {
    title: 'Harbourview Network',
    description:
      'Explore regulated cannabis supply, wanted requests, category pathways and qualified commercial opportunities through Harbourview Network.',
  },
}

const categories = [
  {
    label: 'Featured Opportunities',
    href: '/marketplace/listings',
    description:
      'Reviewed commercial opportunities across products, inputs, equipment, services and structured cannabis-sector demand signals.',
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
      'Buyer-side demand signals from operators looking for equipment, inputs, inventory, genetics or services.',
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
    label: 'Request Introduction',
    href: '/intake',
    description:
      'Ask Harbourview to screen fit, protect counterparty identity and route qualified introductions where appropriate.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Harbourview Network
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              Surface supply, buyer demand and qualified cannabis-sector opportunities through one controlled global network.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
              Harbourview Network connects regulated cannabis products, inputs, genetics, services, wanted requests and country-specific access pathways through a controlled commercial discovery layer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/marketplace/sell"
                className="btn-primary text-center"
                data-testid="marketplace-submit-supply"
              >
                Submit Opportunity
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
                Request Introduction
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-navy">Network categories</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Explore public category paths, then use inquiry-first capture when an opportunity, request or introduction needs Harbourview review.
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
                Suppliers and buyers: get reviewed for Harbourview Network visibility
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Suppliers, buyers and operators can submit opportunities for Harbourview review. Early submissions may be considered for category visibility, wanted-request matching or confidential counterparty routing where appropriate. Supplier identity, contact details and sourcing records remain private unless Harbourview approves disclosure through a qualified introduction.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-navy">Accepted examples</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Consumables & operating supplies</li>
                    <li>Used and surplus equipment</li>
                    <li>Commercial services</li>
                    <li>Featured commercial opportunities</li>
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
                Submit Opportunity for Review
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
