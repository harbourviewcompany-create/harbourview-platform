import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'
import { MARKETPLACE_CONFIDENTIALITY_CAVEAT } from '@/lib/content/complianceCopy'
import { getPublicListings, type PublicListing } from '@/lib/server/listingsQuery'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Exchange Listings | Harbourview',
  description:
    'A safe public entry point for Harbourview Network listing categories, wanted requests and opportunity submissions.',
  openGraph: {
    title: 'Exchange Listings | Harbourview',
    description:
      'Explore Harbourview Network categories and submit commercial opportunities through controlled review pathways.',
  },
}

const accessCards = [
  {
    title: 'Explore the Network',
    href: '/marketplace',
    eyebrow: 'Network overview',
    body: 'Review the public Harbourview Network categories for regulated products, inputs, services, wanted requests and commercial access pathways.',
  },
  {
    title: 'Review Wanted Requests',
    href: '/marketplace/wanted',
    eyebrow: 'Buyer demand',
    body: 'View public summaries of operator requirements and buyer-side demand that can be routed through Harbourview review.',
  },
  {
    title: 'Submit an Opportunity',
    href: '/marketplace/sell',
    eyebrow: 'Controlled intake',
    body: 'Submit supply, services, assets or commercial opportunities for Harbourview review before any publication or introduction pathway.',
  },
]

const guardrails = [
  'Public pages show controlled summaries only.',
  `Route-specific boundary: ${MARKETPLACE_CONFIDENTIALITY_CAVEAT}`,
  'Availability, terms and introduction fit remain subject to Harbourview review.',
]

const CATEGORY_LABELS: Record<string, string> = {
  new_products: 'New Products',
  used_surplus: 'Used & Surplus Equipment',
  cannabis_inventory: 'Cannabis Inventory',
  consumables: 'Consumables',
  cultivation_equipment: 'Cultivation Equipment',
  distressed_inventory: 'Distressed Inventory',
  distressed_businesses: 'Distressed Businesses',
  services: 'Services',
  business_opportunities: 'Business Opportunities',
  genetics: 'Genetics',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

function formatPublicLabel(value: string | null | undefined, labels: Record<string, string> = {}) {
  if (!value) return null
  return labels[value] ?? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStringSpec(listing: PublicListing, key: string) {
  const value = listing.high_level_specs?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function ListingGridCard({ listing }: { listing: PublicListing }) {
  const href = getPublicListingHref(listing, listing.category || 'listing')
  const ctaLabel = getStringSpec(listing, 'cta_label') ?? (listing.slug ? 'View reviewed listing' : 'Request Harbourview review')
  const category = formatPublicLabel(listing.category, CATEGORY_LABELS) ?? 'Marketplace listing'
  const region = listing.location_country || formatPublicLabel(listing.region, REGION_LABELS)

  return (
    <article className="group flex h-full flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/76">
        <span>{category}</span>
        {listing.is_featured ? <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-gold">Featured</span> : null}
      </div>
      {listing.product_type ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{listing.product_type}</p>
      ) : null}
      <h3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>
      {region ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44">{region}</span>
        </div>
      ) : null}
      <Link href={href} className="btn-marketplace mt-6 justify-center text-center text-sm">
        {ctaLabel}
      </Link>
    </article>
  )
}

export default async function MarketplaceListingsPage() {
  const listings = await getPublicListings()

  return (
    <>
      <PublicHero
        eyebrow="Exchange Listings"
        title="Reviewed commercial pathways for qualified network opportunities."
        actions={[
          { label: 'Explore Network', href: '/marketplace' },
          { label: 'View Wanted Requests', href: '/marketplace/wanted', variant: 'secondary' },
          { label: 'Submit Opportunity', href: '/marketplace/sell', variant: 'secondary' },
        ]}
      >
        <p>
          Harbourview Network organizes public access around controlled category summaries, wanted requests and reviewed submission pathways.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Sensitive counterparty information, commercial terms and internal review context remain private unless a separate qualified introduction is appropriate.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Current reviewed listings" title="Approved public summaries across marketplace categories." />
        {listings.length === 0 ? (
          <PublicCard className="p-7">
            <p className="text-sm leading-7 text-white/62">
              No approved public listings are currently available. Category orientation pages and intake routes remain live for reviewed submissions and qualified requests.
            </p>
          </PublicCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingGridCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Public access routes" title="Start from the appropriate reviewed pathway." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {accessCards.map((card) => (
            <PublicLinkCard key={card.href} href={card.href} eyebrow={card.eyebrow} title={card.title}>
              {card.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader eyebrow="Review standard" title="Public visibility is intentionally limited." className="mb-0" />
          <PublicCard className="p-7">
            <ul className="space-y-5">
              {guardrails.map((item) => (
                <li key={item} className="flex gap-4 text-sm leading-7 text-white/62">
                  <span className="mt-3 h-px w-8 shrink-0 bg-gradient-to-r from-gold to-gold-light" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
