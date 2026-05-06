import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Harbourview Network',
  description:
    'Harbourview Network is a controlled commercial access layer for qualified opportunities, inputs, services and market-specific pathways.',
  openGraph: {
    title: 'Harbourview Network',
    description:
      'A controlled commercial access layer for qualified opportunities, inputs, services and market-specific pathways.',
  },
}

const categories = [
  {
    label: 'Used & Surplus Equipment',
    href: '/marketplace/used-surplus',
    description: 'Surplus equipment, liquidation packages and operational assets.',
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
    label: 'Services',
    href: '/marketplace/services',
    description: 'Compliance, logistics, QA and operational providers.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted',
    description: 'Demand signals across equipment, inputs and services.',
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
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
              Harbourview Network
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              Controlled commercial access for qualified opportunities, inputs, services and market pathways.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
              Harbourview Network organizes reviewed categories behind a qualification-first access process. Public pages are structured for category discovery. Commercial follow-up is handled privately after review.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/sell" className="btn-primary text-center">
                Submit Opportunity
              </Link>
              <Link
                href="#categories"
                className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy"
              >
                Browse Network
              </Link>
              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-outline border-white/40 text-center text-white hover:bg-white hover:text-navy"
              >
                Post Wanted Request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 py-12">
        <div className="page-container">
          <h2 className="mb-6 text-lg font-semibold text-navy">How the Network works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Submit</h3>
              <p className="text-sm text-gray-500">
                Operators submit available products, assets, services or opportunities for review. Publication is not automatic.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Browse</h3>
              <p className="text-sm text-gray-500">
                Qualified users browse categories and send structured inquiries through Harbourview.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Review</h3>
              <p className="text-sm text-gray-500">
                Harbourview reviews submissions and inquiries before any counterparty contact.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="mb-2 text-base font-semibold text-navy">Coordinate</h3>
              <p className="text-sm text-gray-500">
                Introductions and follow-up are handled privately through a controlled process.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="py-12">
        <div className="page-container">
          <h2 className="mb-6 text-lg font-semibold text-navy">Network categories</h2>
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
              Post Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
