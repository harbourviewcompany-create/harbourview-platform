import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Browse the Harbourview B2B cannabis marketplace. Equipment, inventory, services, and business opportunities.',
}

const categories = [
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description:
      'New commercial equipment, packaging, and supplies from verified vendors.',
    accent: 'border-l-4 border-gold',
  },
  {
    label: 'Used & Surplus',
    href: '/marketplace/used-surplus',
    description:
      'Pre-owned extraction systems, grow equipment, and surplus inventory.',
    accent: 'border-l-4 border-gold',
  },
  {
    label: 'Cannabis Inventory',
    href: '/marketplace/cannabis-inventory',
    description:
      'Wholesale flower, biomass, concentrates, and genetics for licensed operators.',
    accent: 'border-l-4 border-gold',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted-requests',
    description:
      'Active buy-side requests from operators seeking equipment and inventory.',
    accent: 'border-l-4 border-gold',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description:
      'Compliance consulting, facility design, logistics, and professional services.',
    accent: 'border-l-4 border-gold',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description:
      'License transfers, facility leases, acquisitions, and partnership opportunities.',
    accent: 'border-l-4 border-gold',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Marketplace</h1>
          <p className="text-gray-300 max-w-2xl">
            B2B listings for the regulated cannabis industry. Browse by category below
            or submit a listing through our{' '}
            <Link href="/intake" className="text-gold underline hover:text-gold-light">
              intake form
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`card p-6 group hover:border-gold transition-colors ${cat.accent}`}
              >
                <h2 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                  {cat.label}
                </h2>
                <p className="text-gray-500 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Don&apos;t see what you need?{' '}
              <Link href="/marketplace/wanted-requests" className="text-navy underline hover:text-gold">
                Post a Wanted Request
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="text-navy underline hover:text-gold">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
