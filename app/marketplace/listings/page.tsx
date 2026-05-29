import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'
import { MARKETPLACE_CONFIDENTIALITY_CAVEAT } from '@/lib/content/complianceCopy'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'
import { getPublicListings } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'

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
  'Terms and introduction fit remain subject to Harbourview review.',
]

function ListingCard({ listing }: { listing: PublicListing }) {
  const ctaLabel =
    typeof listing.high_level_specs?.cta_label === 'string'
      ? listing.high_level_specs.cta_label
      : 'Request qualification'

  return (
    <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
        <span>{listing.marketplace_section.replace(/_/g, ' ')}</span>
        <span className="text-[#F5F1E8]/35">/</span>
        <span>{listing.category.replace(/_/g, ' ')}</span>
      </div>

      <h2 className="text-xl font-semibold leading-tight text-[#F5F1E8]">{listing.title}</h2>

      <div className="mt-4 space-y-2 text-sm text-[#F5F1E8]/68">
        <p>{listing.description}</p>
        <p>
          <span className="text-[#C6A55A]">Region:</span> {listing.region.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[#F5F1E8]/70">
        <p className="font-medium text-[#C6A55A]">Harbourview qualification required</p>
        <p>
          Introduction requests are handled through Harbourview review before counterparty contact or commercial handoff.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={getPublicListingHref(listing, listing.category)}
          className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]"
        >
          {ctaLabel}
        </Link>
      </div>
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
        <SectionHeader eyebrow="Live approved listings" title="Current public-safe opportunities." />
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <PublicCard className="p-7 text-sm leading-7 text-white/62">
            Live approved listings will appear here after Harbourview review. Use the category routes below or submit an opportunity for controlled intake.
          </PublicCard>
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
