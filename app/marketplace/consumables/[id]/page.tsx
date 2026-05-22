import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { consumables } from '@/lib/fixtures/consumables'

type Props = { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  return consumables.map((listing) => ({ id: listing.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = consumables.find((l) => l.id === id)
  if (!listing) return { title: 'Listing not found | Harbourview Network' }
  return {
    title: `${listing.title} | Harbourview Network`,
    description: `${listing.description.slice(0, 140)} — Inquire to buy through Harbourview.`,
  }
}

export default async function ConsumableDetailPage({ params }: Props) {
  const { id } = await params
  const listing = consumables.find((l) => l.id === id)

  if (!listing) {
    notFound()
  }

  const inquiryHref = `/marketplace/quote?listing=${encodeURIComponent(listing.title)}`

  return (
    <>
      <section className="bg-navy text-white py-10">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link>
            {' / '}
            <Link href="/marketplace/consumables" className="hover:underline">Consumables &amp; Operating Supplies</Link>
            {' /'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-3">{listing.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {listing.tags.map((tag) => (
              <span key={tag} className="text-xs bg-white/10 text-white px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image / representative notice */}
              {listing.image && (
                <figure className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  <Image src={listing.image.src} alt={listing.image.alt} className="w-full h-52 object-cover" width={800} height={208} unoptimized />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
                    Representative image
                  </span>
                  {listing.image.caption && (
                    <figcaption className="px-4 py-2 text-xs text-gray-400">{listing.image.caption}</figcaption>
                  )}
                </figure>
              )}

              {/* Description */}
              <div className="card p-6">
                <h2 className="font-semibold text-navy text-base mb-3">About this category</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
              </div>

              {/* What buyers should include */}
              <div className="card p-6">
                <h2 className="font-semibold text-navy text-base mb-3">What to include in your inquiry</h2>
                <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>Listing or category of interest</li>
                  <li>Quantity or estimated order volume</li>
                  <li>Location and whether shipping is required</li>
                  <li>Timeline — when you need delivery</li>
                  <li>Budget or target price if you are comfortable sharing</li>
                  <li>Intended use and any compliance requirements</li>
                  <li>Specification, certification or format requirements</li>
                </ul>
              </div>

              {/* What sellers can submit */}
              <div className="card p-6">
                <h2 className="font-semibold text-navy text-base mb-3">Have supply to sell?</h2>
                <p className="text-sm text-gray-600 mb-4">
                  If you supply this category and want to reach reviewed buyers through Harbourview, submit your supply for review.
                </p>
                <Link href="/marketplace/sell" className="btn-outline text-sm">
                  List Similar Supply for Sale
                </Link>
              </div>

              {/* Screening note */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-700">Compliance and screening:</strong> Restricted chemicals, controlled solvents, pesticides, prescription products, unverified cannabis inventory and genetics or seeds without licence-review clearance are excluded from Harbourview Network. Harbourview reviews all submissions before any introduction or routing.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="card p-6">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Price</p>
                  <p className="text-lg font-semibold text-navy">{listing.price || 'Price on request'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Availability</p>
                  <p className="text-sm text-gray-600">Availability reviewed by inquiry</p>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Region</p>
                  <p className="text-sm text-gray-600">{listing.location}</p>
                </div>

                <Link href={inquiryHref} className="btn-primary w-full text-center block mb-3">
                  Inquire to Buy
                </Link>
                <Link href="/marketplace/sell" className="btn-outline w-full text-center block text-sm mb-3">
                  List Similar Item
                </Link>
                <Link href="/marketplace/sell?type=wanted" className="btn-outline w-full text-center block text-sm text-gray-500">
                  Post What You Want to Buy
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Seller contact details are not public. Harbourview reviews buyer inquiries before coordinating introductions or transaction follow-up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
