import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Harbourview — Cannabis Industry Marketplace',
  description:
    'B2B marketplace for the regulated cannabis industry. Source equipment, inventory, services, and business opportunities.',
}

const categories = [
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description: 'New equipment, packaging, and supplies from vetted vendors.',
  },
  {
    label: 'Used & Surplus',
    href: '/marketplace/used-surplus',
    description: 'Pre-owned equipment and excess inventory at competitive prices.',
  },
  {
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
    description: 'Bulk flower, biomass, concentrates, and genetics for licensed operators.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted-requests',
    description: 'Operators actively seeking specific equipment and inventory.',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description: 'Compliance, design, logistics, and professional services.',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description: 'Licenses, facilities, and acquisition opportunities.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white py-20">
        <div className="page-container text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            The Cannabis Industry&apos;s<br />
            <span className="text-gold">Professional Marketplace</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Harbourview connects operators, suppliers, and investors across the regulated
            cannabis industry. Source equipment, inventory, services, and opportunities —
            all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace" className="btn-primary text-base px-8 py-3">
              Browse Marketplace
            </Link>
            <Link href="/intake" className="btn-outline text-base px-8 py-3 border-gold text-gold hover:bg-gold hover:text-navy">
              Submit a Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="page-container">
          <h2 className="section-heading mb-2">Marketplace Categories</h2>
          <p className="text-gray-500 mb-8">
            Browse by category or{' '}
            <Link href="/marketplace" className="text-navy underline hover:text-gold">
              view all listings
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="card p-6 group hover:border-gold transition-colors"
              >
                <h3 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                  {cat.label}
                </h3>
                <p className="text-gray-500 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Directory CTA */}
      <section className="bg-gray-100 py-14">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="section-heading mb-1">Supplier Directory</h2>
            <p className="text-gray-500">
              Find verified suppliers, distributors, and service providers.
            </p>
          </div>
          <Link href="/supplier-directory" className="btn-secondary shrink-0">
            Browse Suppliers
          </Link>
        </div>
      </section>

      {/* Intake CTA */}
      <section className="bg-navy py-14">
        <div className="page-container text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Have something to list?
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Submit equipment, inventory, services, or a business opportunity through
            our intake form. Listings are reviewed before publication.
          </p>
          <Link href="/intake" className="btn-primary px-8 py-3 text-base">
            Submit a Listing
          </Link>
        </div>
      </section>
    </>
  )
}
