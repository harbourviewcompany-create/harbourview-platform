import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'
import type { PublicListing } from '@/lib/server/listingsQuery'
import { getPublicListingHref } from '@/lib/marketplace/publicListingHref'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Business Opportunities | Harbourview',
  description:
    'Licensed facility acquisitions, brand acquisitions, equity opportunities and strategic commercial pathways for regulated cannabis operators.',
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East \u0026 Africa',
  global: 'Global',
}

const opportunityTypes = [
  {
    title: 'Facility acquisitions',
    body: 'Licensed production facilities, processing sites and distribution assets available through structured confidential process.',
  },
  {
    title: 'Brand and IP transactions',
    body: 'Cannabis brand acquisitions, IP transfers, white-label arrangements and licensing structures for regulated markets.',
  },
  {
    title: 'Equity and investment access',
    body: 'Equity opportunities, strategic investment rounds and partnership structures in regulated cannabis operators.',
  },
  {
    title: 'Distribution mandates',
    body: 'Exclusive and non-exclusive distribution mandates, import agent arrangements and market-access partnerships.',
  },
]

function getStringSpec(listing: PublicListing, key: string) {
  const value = listing.high_level_specs?.[key]
  return typeof value === 'string' \u0026\u0026 value.trim() ? value.trim() : null
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const ctaLabel = getStringSpec(listing, 'cta_label') ?? 'Request qualification'
  const region = listing.location_country || REGION_LABELS[listing.region] || listing.region

  return (
    \u003cdiv className="group flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30"\u003e
      \u003cdiv className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" /\u003e
      {listing.is_featured \u0026\u0026 (
        \u003cspan className="mb-3 inline-flex w-fit rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold"\u003eFeatured\u003c/span\u003e
      )}
      {listing.product_type \u0026\u0026 (
        \u003cp className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"\u003e{listing.product_type}\u003c/p\u003e
      )}
      \u003ch3 className="mb-3 text-lg font-semibold leading-snug text-[#f5f1e8]"\u003e{listing.title}\u003c/h3\u003e
      \u003cp className="flex-1 text-sm leading-7 text-white/58"\u003e{listing.description}\u003c/p\u003e
      {region \u0026\u0026 (
        \u003cdiv className="mt-4 flex flex-wrap gap-2"\u003e
          \u003cspan className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/44"\u003e{region}\u003c/span\u003e
        \u003c/div\u003e
      )}
      \u003cLink href={getPublicListingHref(listing, 'business_opportunities')} className="btn-marketplace mt-6 justify-center text-center text-sm"\u003e
        {ctaLabel}
      \u003c/Link\u003e
    \u003c/div\u003e
  )
}

function EmptyState() {
  return (
    \u003cdiv className="flex flex-col items-center justify-center py-20 text-center"\u003e
      \u003cdiv className="mb-6 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-40" /\u003e
      \u003cp className="mb-2 text-lg font-semibold text-[#f5f1e8]"\u003eNo opportunities listed\u003c/p\u003e
      \u003cp className="mb-6 text-sm leading-7 text-white/54"\u003e
        Business opportunities are surfaced through Harbourview review. Submit an opportunity or speak confidentially about what you are looking for.
      \u003c/p\u003e
      \u003cdiv className="flex flex-col gap-3 sm:flex-row"\u003e
        \u003cLink href="/marketplace/sell" className="btn-marketplace text-sm"\u003eSubmit an opportunity\u003c/Link\u003e
        \u003cLink href="/intake" className="btn-intelligence text-sm"\u003eSpeak confidentially\u003c/Link\u003e
      \u003c/div\u003e
    \u003c/div\u003e
  )
}

export default async function BusinessOpportunitiesPage() {
  const listings = await getPublicListingsByCategory('business_opportunities')

  return (
    \u003c\u003e
      \u003csection className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20"\u003e
        \u003cdiv className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" /\u003e
        \u003cdiv className="page-container relative z-10"\u003e
          \u003cp className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72"\u003e
            \u003cLink href="/marketplace" className="transition-colors hover:text-gold"\u003eExchange\u003c/Link\u003e
            {' '}/Business Opportunities
          \u003c/p\u003e
          \u003ch1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl"\u003e
            Structured commercial opportunities in regulated cannabis markets.
          \u003c/h1\u003e
          \u003cdiv className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg"\u003e
            \u003cp\u003e
              Facility acquisitions, brand transactions, equity access and distribution mandates.
              All opportunities subject to confidential Harbourview qualification before any introduction or disclosure.
            \u003c/p\u003e
          \u003c/div\u003e
          \u003cdiv className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap"\u003e
            \u003cLink href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm"\u003eSpeak confidentially\u003c/Link\u003e
            \u003cLink href="/marketplace/sell" className="btn-intelligence min-h-[52px] justify-center text-center text-sm"\u003eSubmit an opportunity\u003c/Link\u003e
          \u003c/div\u003e
        \u003c/div\u003e
      \u003c/section\u003e

      \u003csection className="border-b border-gold/10 bg-[#020814] py-12 sm:py-14"\u003e
        \u003cdiv className="page-container"\u003e
          \u003cdiv className="mb-8"\u003e
            \u003cp className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72"\u003eOpportunity types\u003c/p\u003e
            \u003ch2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl"\u003eConfidential review before any disclosure.\u003c/h2\u003e
          \u003c/div\u003e
          \u003cdiv className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"\u003e
            {opportunityTypes.map((item) =\u003e (
              \u003cdiv key={item.title} className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"\u003e
                \u003cdiv className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" /\u003e
                \u003ch3 className="mb-3 text-base font-semibold text-[#f4f1eb]"\u003e{item.title}\u003c/h3\u003e
                \u003cp className="text-sm leading-7 text-white/58"\u003e{item.body}\u003c/p\u003e
              \u003c/div\u003e
            ))}
          \u003c/div\u003e
        \u003c/div\u003e
      \u003c/section\u003e

      \u003csection className="border-b border-gold/10 bg-[#030b16] py-8"\u003e
        \u003cdiv className="page-container"\u003e
          \u003cdiv className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6"\u003e
            \u003cp className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72"\u003eConfidential review before disclosure\u003c/p\u003e
            \u003cp className="text-sm leading-7 text-white/62"\u003e
              Parties, transaction terms, assets, distress context, diligence packs and dealroom access are private unless explicitly approved for public-safe summary.
              Public pages show controlled summaries only. Harbourview reviews all qualification requests before any counterparty contact or introduction is coordinated.
            \u003c/p\u003e
          \u003c/div\u003e
        \u003c/div\u003e
      \u003c/section\u003e

      \u003csection className="bg-[#020814] py-12 sm:py-16 lg:py-18"\u003e
        \u003cdiv className="page-container"\u003e
          {listings.length === 0 ? \u003cEmptyState /\u003e : (
            \u003c\u003e
              \u003cdiv className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between"\u003e
                \u003cdiv\u003e
                  \u003cp className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72"\u003eReviewed opportunities\u003c/p\u003e
                  \u003ch2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl"\u003eCurrent approved listings.\u003c/h2\u003e
                \u003c/div\u003e
              \u003c/div\u003e
              \u003cdiv className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"\u003e
                {listings.map((listing) =\u003e \u003cListingCard key={listing.id} listing={listing} /\u003e)}
              \u003c/div\u003e
            \u003c/\u003e
          )}
        \u003c/div\u003e
      \u003c/section\u003e

      \u003csection className="border-t border-gold/10 bg-[#030b16] py-12 sm:py-16"\u003e
        \u003cdiv className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"\u003e
          \u003cdiv className="max-w-2xl"\u003e
            \u003cp className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72"\u003eHave an opportunity to submit?\u003c/p\u003e
            \u003ch2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl"\u003eSubmit for Harbourview review.\u003c/h2\u003e
            \u003cp className="mt-4 text-sm leading-7 text-white/58"\u003e
              Facility transactions, M\u0026amp;A, equity access and distribution mandates in regulated markets.
              All opportunities require Harbourview qualification before introduction.
            \u003c/p\u003e
          \u003c/div\u003e
          \u003cdiv className="flex flex-col gap-3 sm:flex-row"\u003e
            \u003cLink href="/marketplace/sell" className="btn-marketplace min-h-[52px] justify-center text-center text-sm"\u003eSubmit opportunity\u003c/Link\u003e
            \u003cLink href="/intake" className="btn-intelligence min-h-[52px] justify-center text-center text-sm"\u003eSpeak confidentially\u003c/Link\u003e
          \u003c/div\u003e
        \u003c/div\u003e
      \u003c/section\u003e
    \u003c/\u003e
  )
}

