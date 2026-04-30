import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Harbourview Marketplace',
  description:
    'A commercial marketplace for regulated cannabis operators to source equipment, inventory, services, suppliers and business opportunities.',
}

const categories = [
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description: 'Commercial equipment, packaging, consumables and operating supplies from suppliers.',
  },
  {
    label: 'Used & Surplus',
    href: '/marketplace/used-surplus',
    description: 'Used equipment, surplus assets, liquidation items and operator overstock.',
  },
  {
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
    description: 'Bulk flower, biomass, extracts and genetics for qualified licensed operators.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted-requests',
    description: 'Buyer demand from operators looking for specific assets, inventory or services.',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description: 'Compliance, logistics, QA, facility, sales and commercial support providers.',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description: 'Facilities, partnerships, acquisitions, licensing routes and strategic opportunities.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="bg-navy text-white py-20">
        <div className="page-container">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-gold">
              Harbourview Marketplace
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold mb-5 leading-tight">
              Source, list and route commercial cannabis opportunities.
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mb-8">
              A broad B2B marketplace for regulated cannabis operators, suppliers and serious commercial participants. Browse equipment, inventory, suppliers, services, wanted requests and business opportunities through a reviewed marketplace flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/marketplace" className="btn-primary text-base px-8 py-3">
                Browse Marketplace
              </Link>
              <Link href="/intake" className="btn-outline text-base px-8 py-3 border-gold text-gold hover:bg-gold hover:text-navy">
                Submit a Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-6">
        <div className="page-container grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-3">
          <p><span className="font-semibold text-navy">Reviewed listings.</span> Submissions are checked before publication.</p>
          <p><span className="font-semibold text-navy">Controlled introductions.</span> Inquiries route through Harbourview first.</p>
          <p><span className="font-semibold text-navy">Commercial focus.</span> Built for real buyer, seller and supplier activity.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="page-container">
          <h2 className="section-heading mb-2">Marketplace Categories</h2>
          <p className="text-gray-500 mb-8">
            Browse by category or{' '}
            <Link href="/marketplace" className="text-navy underline hover:text-gold">
              view the marketplace index
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

      <section className="bg-gray-100 py-14">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="section-heading mb-1">Supplier Directory</h2>
            <p className="text-gray-500">
              Find equipment, packaging, services and operating suppliers in one place.
            </p>
          </div>
          <Link href="/supplier-directory" className="btn-secondary shrink-0">
            Browse Suppliers
          </Link>
        </div>
      </section>

      <section className="bg-navy py-14">
        <div className="page-container text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Have something to sell, source or list?
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Submit a listing, wanted request, supplier profile or business opportunity. Harbourview reviews submissions before anything goes public.
          </p>
          <Link href="/intake" className="btn-primary px-8 py-3 text-base">
            Submit a Listing
          </Link>
        </div>
      </section>
    </>
  )
}
