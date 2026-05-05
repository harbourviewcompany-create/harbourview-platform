import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace | Harbourview',
  description:
    'List supply, surface buyer demand and route qualified cannabis-sector opportunities through Harbourview. Inquiry-first sourcing for operators, suppliers and service providers.',
  openGraph: {
    title: 'Harbourview Marketplace',
    description:
      'List supply, surface buyer demand and route qualified cannabis-sector opportunities through Harbourview. Inquiry-first sourcing for operators, suppliers and service providers.',
  },
}

const categories = [
  {
    label: 'Marketplace Listings',
    href: '/marketplace/listings',
    description:
      'Listing candidates across suppliers, equipment, operating supplies and commercial opportunities routed through Harbourview qualification before counterparty introduction.',
  },
  {
    label: 'Consumables & Operating Supplies',
    href: '/marketplace/consumables',
    description:
      'Packaging, lab, cultivation, processing, sanitation, logistics, retail and maintenance supply categories handled through inquiry-first sourcing and supplier qualification.',
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
      'Buyer-side demand signals from operators looking for equipment, inputs, inventory or services. Post a wanted request to surface supply through Harbourview.',
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
      {/* Hero */}
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            List supply, surface buyer demand and route qualified cannabis-sector opportunities through Harbourview.
          </h1>
          <p className="text-gray-300 max-w-2xl mb-8">
            Harbourview helps operators, suppliers and service providers surface reviewed supply, wanted requests and commercial opportunities through a controlled inquiry-first marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/marketplace/sell" className="btn-primary">
              Submit Supply
            </Link>
            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-outline border-gold text-gold hover:bg-gold hover:text-navy"
            >
              Post Wanted Request
            </Link>
            <Link
              href="/intake"
              className="btn-outline border-white/40 text-white hover:bg-white/10"
            >
              Request Confidential Support
            </Link>
          </div>
        </div>
      </section>

      {/* How Harbourview handles inquiries */}
      <section className="py-12 border-b border-gray-100">
        <div className="page-container">
          <h2 className="text-lg font-semibold text-navy mb-6">How Harbourview handles inquiries</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Submit</h3>
              <p className="text-gray-500 text-sm">
                Suppliers, buyers or operators submit supply listings, wanted requests or inquiry details through the intake form.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Screen</h3>
              <p className="text-gray-500 text-sm">
                Harbourview reviews category fit, basic commercial relevance and whether a private introduction or quote path is appropriate. Screened before any counterparty contact.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Route</h3>
              <p className="text-gray-500 text-sm">
                Qualified opportunities are routed through inquiry-first follow-up. Public publication is not automatic. Introductions are handled privately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supplier acquisition */}
      <section className="py-12 border-b border-gray-100">
        <div className="page-container">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-navy mb-3">
              Suppliers: get reviewed for marketplace visibility
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Suppliers of equipment, consumables, services and operating support can submit opportunities for Harbourview review. Early submissions may be considered for category visibility, wanted-request matching or confidential buyer routing where appropriate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy mb-2">Accepted categories</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Consumables &amp; operating supplies</li>
                  <li>Used and surplus equipment</li>
                  <li>Commercial services</li>
                  <li>Supplier directory profiles</li>
                  <li>Business opportunities</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy mb-2">Excluded from submission</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>Restricted chemicals or controlled solvents</li>
                  <li>Pesticides</li>
                  <li>Prescription or medical products</li>
                  <li>Unverified cannabis inventory</li>
                  <li>Genetics, seeds or clones unless licence-review requirements are satisfied</li>
                </ul>
              </div>
            </div>
            <Link href="/marketplace/sell" className="btn-primary">
              Submit Supply for Review
            </Link>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="py-12">
        <div className="page-container">
          <h2 className="text-lg font-semibold text-navy mb-6">Browse categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="card p-6">
                <h3 className="font-semibold text-lg mb-2">{cat.label}</h3>
                <p className="text-gray-500 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
