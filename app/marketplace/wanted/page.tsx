import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory, type PublicListing } from '@/lib/server/listingsQuery'
import { EmptyState, FooterCta, PublicCard, PublicCta, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

// ISR: marketplace listing data
export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Wanted Requests | Harbourview',
  description:
    'Create a wanted request through Harbourview Network. Describe buyer or operator demand and Harbourview will review before routing supplier responses privately.',
  openGraph: {
    title: 'Wanted Requests | Harbourview',
    description:
      'Create a wanted request and Harbourview will review before routing supplier responses privately.',
  },
}

const workflow = [
  {
    title: 'Describe the requirement',
    body: 'Submit category, quantity, target market, timing, budget range and any licence, documentation or compliance requirements.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Wanted requests are reviewed for fit, commercial relevance and routing context before any supplier response is coordinated.',
  },
  {
    title: 'Private supplier routing',
    body: 'Harbourview may route requests privately. Submission does not guarantee supplier response, availability, pricing or transaction terms.',
  },
]

const visualRules = [
  {
    terms: ['extraction', 'co2', 'ethanol', 'processing equipment'],
    label: 'Extraction equipment',
    shape: 'processing system',
  },
  {
    terms: ['mylar', 'pouch', 'exit bags', 'packaging'],
    label: 'Mylar pouches',
    shape: 'pouches',
  },
  {
    terms: ['pos', 'technology', 'retail', 'metrc', 'biotrack'],
    label: 'Retail POS system',
    shape: 'retail technology',
  },
  {
    terms: ['facility', 'real estate', 'cultivation', 'lease', 'warehouse'],
    label: 'Commercial facility',
    shape: 'facility request',
  },
]

function getWantedVisual(listing: PublicListing) {
  const tags = Array.isArray(listing.high_level_specs?.tags)
    ? (listing.high_level_specs.tags as string[])
    : []
  const haystack = `${listing.title} ${listing.description} ${tags.join(' ')}`.toLowerCase()
  const match = visualRules.find((rule) => rule.terms.some((term) => haystack.includes(term)))

  if (match) return match

  const firstUsefulTag = tags.find((tag) => !['wanted', 'bulk'].includes(tag.toLowerCase()))
  if (firstUsefulTag) {
    return {
      label: firstUsefulTag.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      shape: 'wanted request',
    }
  }

  return { label: 'Wanted Request', shape: 'commercial requirement' }
}

function WantedVisual({ listing }: { listing: PublicListing }) {
  const visual = getWantedVisual(listing)

  return (
    <div className="relative h-36 overflow-hidden rounded-sm border border-gold/20 bg-gradient-to-br from-gold-pale via-white to-gray-100 p-4">
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
        Representative image
      </span>
      <div className="flex h-full items-end justify-between gap-3 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Harbourview</p>
          <p className="mt-1 text-sm font-semibold text-navy">{visual.label}</p>
          <p className="text-xs text-gray-500">{visual.shape}</p>
        </div>
        <div className="flex items-end gap-1.5 opacity-80" aria-hidden="true">
          <div className="h-10 w-5 rounded-b-sm rounded-t-full border border-gold/50 bg-white/80" />
          <div className="h-14 w-7 rounded-b-sm rounded-t-full border border-gold/50 bg-white/90" />
          <div className="h-8 w-5 rounded-b-sm rounded-t-full border border-gold/50 bg-white/75" />
        </div>
      </div>
    </div>
  )
}

function WantedListingCard({ listing }: { listing: PublicListing }) {
  const budget =
    listing.price_display ??
    (typeof listing.high_level_specs?.budget === 'string' ? listing.high_level_specs.budget : null)
  const location =
    listing.location_country ??
    listing.location_region ??
    (typeof listing.high_level_specs?.location === 'string' ? listing.high_level_specs.location : null)
  const tags = Array.isArray(listing.high_level_specs?.tags)
    ? (listing.high_level_specs.tags as string[])
    : []

  return (
    <article className="flex h-full flex-col gap-4 rounded-sm border border-white/80 bg-[#f8f4ea] p-5 text-navy shadow-[0_22px_60px_rgba(0,0,0,0.24)]">
      <WantedVisual listing={listing} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-semibold leading-snug text-navy">{listing.title}</h3>
          <p className="text-xs text-gray-500">{location ?? 'Location available on request'}</p>
        </div>
        {budget && (
          <p className="shrink-0 rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-navy shadow-sm">
            {budget}
          </p>
        )}
      </div>

      <p className="line-clamp-4 text-sm leading-6 text-gray-700">{listing.description}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-gray-600">
        Public summary only. Contact details are private and inquiries are reviewed before routing.
      </p>

      <div className="mt-auto border-t border-gold/25 pt-4">
        <Link
          href={`/marketplace/quote?listing=${encodeURIComponent(listing.title)}`}
          className="btn-outline px-4 py-2 text-xs"
        >
          Respond to Request
        </Link>
      </div>
    </article>
  )
}

export default async function WantedPage() {
  const wantedListings = await getPublicListingsByCategory('wanted_requests')

  return (
    <>
      <PublicHero
        eyebrow="Exchange — Wanted Requests"
        title="Buyer and operator demand routed through controlled review."
        actions={[
          { label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted' },
          { label: 'Explore Network', href: '/marketplace', variant: 'secondary' },
        ]}
      >
        <p>
          Describe buyer or operator demand for equipment, inventory, inputs, services or
          market-specific requirements.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Harbourview reviews wanted requests before supplier routing. Contact details remain private
          unless Harbourview coordinates a routed response.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {workflow.map((item) => (
            <PublicCard key={item.title} className="p-6">
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
              <h3 className="mb-3 text-base font-semibold text-[#f4f1eb]">{item.title}</h3>
              <p className="text-sm leading-7 text-white/58">{item.body}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        {wantedListings.length === 0 ? (
          <EmptyState
            title="No wanted requests are currently listed."
            action={{ label: 'Create Wanted Request', href: '/marketplace/sell?type=wanted' }}
          >
            Harbourview can still review private buyer or operator requirements through controlled
            intake.
          </EmptyState>
        ) : (
          <>
            <SectionHeader
              eyebrow="Current wanted requests"
              title="Reviewed public summaries. Private routing only."
              action={
                <PublicCta
                  action={{
                    label: 'Add Requirement',
                    href: '/marketplace/sell?type=wanted',
                    variant: 'secondary',
                  }}
                />
              }
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wantedListings.map((listing) => (
                <WantedListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </PublicSection>

      <FooterCta
        eyebrow="Supplier response"
        title="Have supply that may fit a request?"
        actions={[
          { label: 'Confidential Support', href: '/intake' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        Submit the opportunity or request confidential support. Harbourview review is required before
        any supplier response, buyer introduction or commercial routing.
      </FooterCta>
    </>
  )
}
