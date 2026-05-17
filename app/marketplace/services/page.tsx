import type { Metadata } from 'next'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import EmptyState from '@/components/EmptyState'
import { ContentStatusNotice } from '@/components/ContentStatusNotice'
import { getLiveServiceListings } from '@/lib/marketplace/liveServices'

export const metadata: Metadata = {
  title: 'Services | Harbourview Network',
  description:
    'Reviewed service providers and support partners for Harbourview Network participants. Introduction requests are reviewed before routing.',
}

const serviceSegments = [
  {
    title: 'Readiness and support',
    body: 'Specialist providers that support operating readiness, documentation, quality programs and market entry.',
  },
  {
    title: 'Logistics and access',
    body: 'Routing, distribution, warehousing, cross-border coordination and market-access support providers.',
  },
  {
    title: 'Operations and facilities',
    body: 'Facility support, engineering, sanitation, automation, security and operating-service providers.',
  },
  {
    title: 'Commercial advisory',
    body: 'Diligence, partnership development, buyer discovery and structured commercial routing support.',
  },
]

export default async function ServicesPage() {
  const serviceFeed = await getLiveServiceListings()
  const serviceListings = serviceFeed.listings

  return (
    <>
      <section className="bg-navy text-white py-12">
        <div className="page-container">
          <p className="text-gold text-sm font-medium mb-1">
            <Link href="/marketplace" className="hover:underline">Network</Link> /
          </p>
          <h1 className="text-3xl font-bold mb-2">Services</h1>
          <p className="text-gray-300 max-w-2xl">
            Reviewed service providers for Harbourview Network participants. Public summaries
            are introductory only. Harbourview reviews service inquiries before routing,
            introduction or commercial follow-up.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace/quote?listing=Services" className="btn-primary text-center">
              Request Service Introduction
            </Link>
            <Link href="/marketplace/sell" className="btn-outline border-gold text-center text-gold hover:bg-gold hover:text-navy">
              Submit Service Provider
            </Link>
            <Link href="/intake" className="btn-outline border-white/40 text-center text-white hover:bg-white hover:text-navy">
              Confidential Routing Request
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8">
            <ContentStatusNotice title={serviceFeed.publicLabel} status={serviceFeed.source === 'live-approved' ? 'admin-backed' : 'fallback-backed'} origin={serviceFeed.source}>
              {serviceFeed.reviewBoundary}
            </ContentStatusNotice>
          </div>

          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Reviewed introductions only</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Harbourview does not publish private contact details, guarantee provider
              availability or complete diligence on public pages. Fit, timing, geography and
              commercial context are reviewed before any introduction is routed.
            </p>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {serviceSegments.map((segment) => (
              <div key={segment.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 h-px w-12 bg-gold" />
                <h2 className="mb-3 text-base font-semibold text-navy">{segment.title}</h2>
                <p className="text-sm leading-6 text-gray-600">{segment.body}</p>
              </div>
            ))}
          </div>

          {serviceListings.length === 0 ? (
            <EmptyState category="Services" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-500 text-sm max-w-2xl">
              Need a provider in a specific region, or want a service provider reviewed for
              inclusion? Submit context through Harbourview so routing can remain private and controlled.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace/quote?listing=Services" className="btn-primary text-sm text-center">
                Request Introduction
              </Link>
              <Link href="/marketplace/sell" className="btn-outline text-sm text-center">
                Submit Provider
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
