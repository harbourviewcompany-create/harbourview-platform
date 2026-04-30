import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace | Harbourview',
  description:
    'Browse reviewed listings across equipment, cannabis inventory, services, consumables and business opportunities.',
}

const categories = [
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
]

export default function MarketplacePage() {
  return (
    <section className="py-14">
      <div className="page-container">
        <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
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
