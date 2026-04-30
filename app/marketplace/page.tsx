import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace | Harbourview',
  description:
    'Browse reviewed listings across equipment, cannabis inventory, services, and business opportunities. Post wanted requests or submit your listing for qualification.',
  openGraph: {
    title: 'Harbourview Marketplace',
    description:
      'Browse reviewed listings across equipment, cannabis inventory, services, and business opportunities. Post wanted requests or submit your listing for qualification.',
  },
}

const categories = [
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description:
      'New equipment, packaging, automation, cultivation, processing and operating supplies.',
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
    href: '/marketplace/wanted-requests',
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
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">Marketplace Index</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">Find the right commercial lane.</h1>
          <p className="text-gray-300 max-w-3xl">
            Browse active Harbourview marketplace sections. Listings are reviewed before publication and marketplace inquiries route through Harbourview so buyer, seller and supplier introductions can be handled with control.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/sell" className="btn-primary">
              Submit a Listing
            </Link>
            <Link href="/marketplace/wanted" className="btn-outline border-gold text-gold hover:bg-gold hover:text-navy">
              View Wanted Requests
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="card border-l-4 border-l-gold p-6 group hover:border-gold transition-colors"
              >
                <h2 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                  {cat.label}
                </h2>
                <p className="text-gray-500 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-navy mb-2">Need something not listed?</h2>
            <p className="text-gray-500 text-sm mb-4">
              Post a wanted request or contact Harbourview directly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/wanted" className="btn-secondary">
                Post a Wanted Request
              </Link>
              <Link href="/intake" className="btn-outline">
                Confidential Intake
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
