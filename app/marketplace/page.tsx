import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace | Harbourview',
  description:
    'Browse reviewed listings across equipment, cannabis inventory, services, consumables and business opportunities. Post wanted requests or submit your listing for qualification.',
  openGraph: {
    title: 'Harbourview Marketplace',
    description:
      'Browse reviewed listings across equipment, cannabis inventory, services, consumables and business opportunities. Post wanted requests or submit your listing for qualification.',
  },
}

const categories = [
  {
    label: 'Source-Backed Listings',
    href: '/marketplace/listings',
    description:
      'Seller pages, supplier leads, used equipment opportunities and source-backed marketplace candidates requiring Harbourview verification before introduction.',
  },
  {
    label: 'Consumables',
    href: '/marketplace/consumables',
    description:
      'Packaging, production and facility consumables including tubes, jars, pouches, cones and supply inputs.',
  },
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
    <section className="py-14">
      <div className="page-container">
        <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
        <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
          <h2 className="text-navy font-semibold text-lg mb-2">Source-backed opportunity feed</h2>
          <p className="text-gray-600 text-sm max-w-3xl">
            Harbourview can publish sourced marketplace candidates as verification-stage listings without implying owned inventory, seller authorization or confirmed availability.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.href} href={cat.href} className="card p-6">
              <h2 className="font-semibold text-lg mb-2">{cat.label}</h2>
              <p className="text-gray-500 text-sm">{cat.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
