'use client'

import { useState } from 'react'
import type { Listing, ListingImageStatus } from '@/lib/fixtures/types'
import { representativeListingImages } from '@/lib/fixtures/representativeImages'
import { validateDealListing } from '@/lib/fixtures/listingQuality'
import InquiryLink from './InquiryLink'

interface ListingCardProps {
  listing: Listing & {
    category?: string
    budget?: string
    weightAvailable?: string
  }
}

const visualRules = [
  { terms: ['pre-roll tubes', 'tube'], label: 'Pre-roll tubes', shape: 'packaging supply' },
  { terms: ['mylar', 'pouch', 'exit bags'], label: 'Mylar pouches', shape: 'packaging supply' },
  { terms: ['glass jars', 'jar'], label: 'Glass jars', shape: 'packaging supply' },
  { terms: ['flower', 'mixed hybrid'], label: 'Bulk flower', shape: 'inventory lot' },
  { terms: ['biomass', 'hemp'], label: 'CBD biomass', shape: 'extraction input' },
  { terms: ['live resin', 'concentrate'], label: 'Concentrate lot', shape: 'wholesale inventory' },
  { terms: ['tincture', 'bottle'], label: 'Tincture bottles', shape: 'packaging supply' },
  { terms: ['cones', 'pre-rolled cones'], label: 'Pre-rolled cones', shape: 'packaging supply' },
  { terms: ['humidity'], label: 'Humidity packs', shape: 'facility supply' },
  { terms: ['labels', 'tamper', 'shrink'], label: 'Labels & seals', shape: 'compliance packaging' },
  { terms: ['vape', 'cartridge'], label: 'Vape packaging', shape: 'hardware packaging' },
  { terms: ['gloves', 'sanitation', 'parchment'], label: 'Facility supplies', shape: 'operating supply' },
  { terms: ['cartons', 'shipping'], label: 'Shipping cartons', shape: 'logistics supply' },
  { terms: ['bundle', 'bulk procurement'], label: 'Consumables bundle', shape: 'supply package' },
  { terms: ['extraction', 'co2', 'ethanol', 'processing equipment'], label: 'Extraction equipment', shape: 'processing system' },
  { terms: ['pos', 'technology', 'retail', 'metrc', 'biotrack'], label: 'Retail POS system', shape: 'retail technology' },
  { terms: ['facility', 'real estate', 'cultivation', 'lease', 'warehouse'], label: 'Commercial facility', shape: 'facility request' },
]

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getSpecificFallback(listing: ListingCardProps['listing']) {
  const firstUsefulTag = listing.tags.find((tag) => !['wanted', 'bulk'].includes(tag.toLowerCase()))

  if (firstUsefulTag) {
    return {
      label: titleCase(firstUsefulTag),
      shape: listing.category === 'wanted-requests' ? 'wanted request' : 'product category',
    }
  }

  const category = listing.category ? titleCase(listing.category) : listing.title

  return {
    label: category,
    shape: listing.category === 'wanted-requests' ? 'wanted request' : 'commercial supply category',
  }
}

function getVisual(listing: ListingCardProps['listing']) {
  const haystack = `${listing.title} ${listing.description} ${listing.tags.join(' ')}`.toLowerCase()
  const match = visualRules.find((rule) => rule.terms.some((term) => haystack.includes(term)))

  if (match) return match

  return getSpecificFallback(listing)
}

function getBadge(status?: ListingImageStatus) {
  if (status === 'verified') return 'Image reviewed'
  if (status === 'supplier-provided') return 'Supplier image'
  return 'Public summary'
}

function getProductClass(listing: ListingCardProps['listing']) {
  return getVisual(listing).label
}

function getOrderLabel(listing: ListingCardProps['listing'], isWantedRequest: boolean) {
  if (isWantedRequest && listing.budget) return listing.budget
  if (listing.weightAvailable) return listing.weightAvailable
  if (listing.price) return listing.price
  return 'Terms on request'
}

function RepresentativeFallback({ listing, badge }: { listing: ListingCardProps['listing']; badge: string }) {
  const visual = getVisual(listing)

  return (
    <div className="relative h-28 overflow-hidden rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(7,20,36,0.98)_0%,rgba(13,25,42,0.96)_55%,rgba(198,165,90,0.16)_100%)] p-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/48 to-transparent" />
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full border border-gold/10" aria-hidden="true" />
      <div className="absolute bottom-3 right-4 flex items-end gap-1.5 opacity-80" aria-hidden="true">
        <div className="h-8 w-7 rounded-sm border border-gold/35 bg-white/[0.04]" />
        <div className="h-12 w-7 rounded-sm border border-gold/45 bg-white/[0.055]" />
        <div className="h-6 w-7 rounded-sm border border-gold/30 bg-white/[0.035]" />
      </div>
      <div className="relative z-10 max-w-[70%]">
        <span className="inline-flex rounded-full border border-gold/18 bg-black/22 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-pale">
          {badge}
        </span>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/72">Harbourview</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-[#f4f1eb]">{visual.label}</p>
        <p className="text-xs text-white/46">{visual.shape}</p>
      </div>
    </div>
  )
}

function ListingVisual({ listing }: { listing: ListingCardProps['listing'] }) {
  const [hasImageError, setHasImageError] = useState(false)
  const representativeImage = representativeListingImages[listing.id]
  const listingImage = listing.image || representativeImage
  const badge = getBadge(listingImage?.status)
  const imageSrc = listingImage?.src

  if (imageSrc && !hasImageError) {
    return (
      <figure className="relative h-28 overflow-hidden rounded-sm border border-gold/12 bg-[#071425]">
        <img
          src={imageSrc}
          alt={listingImage?.alt || listing.title}
          className="h-full w-full object-cover opacity-[0.88] saturate-[0.82]"
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010711]/72 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-gold/18 bg-[#010711]/78 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-pale shadow-sm backdrop-blur">
          {badge}
        </span>
        {listingImage?.caption && (
          <figcaption className="sr-only">{listingImage.caption}</figcaption>
        )}
      </figure>
    )
  }

  return <RepresentativeFallback listing={listing} badge={badge} />
}

export default function ListingCard({ listing }: ListingCardProps) {
  if (process.env.NODE_ENV === 'development') {
    const quality = validateDealListing(listing)
    if (quality.warnings.length > 0) {
      console.warn(
        `[Harbourview ListingCard] Quality warnings for "${listing.id}":`,
        quality.warnings.map((w) => `${w.signal}: ${w.message}`)
      )
    }
  }

  const isWantedRequest = listing.category === 'wanted-requests'
  const inquiryLabel = isWantedRequest ? 'Respond to Request' : 'Request introduction'
  const inquirySubject = isWantedRequest
    ? `Harbourview Wanted Request Response: ${listing.title}`
    : `Harbourview Network Inquiry: ${listing.title}`
  const productClass = getProductClass(listing)
  const orderLabel = getOrderLabel(listing, isWantedRequest)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-gold/12 bg-[#f4efe3] text-navy shadow-[0_18px_54px_rgba(0,0,0,0.3)] transition duration-200 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[0_26px_70px_rgba(0,0,0,0.38)]">
      <div className="p-4 pb-0">
        <ListingVisual listing={listing} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">{productClass}</p>
            <h3 className="mt-2 text-[1.02rem] font-semibold leading-snug tracking-[-0.012em] text-[#061120]">
              {listing.title}
            </h3>
          </div>
          <p className="shrink-0 rounded-full border border-gold/16 bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#071425] shadow-sm">
            {orderLabel}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-sm border border-[#d8cda9]/55 bg-white/45 px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.16em] text-[#9b7b2d]">Region</p>
            <p className="mt-1 text-[#384354]">{listing.location || 'On request'}</p>
          </div>
          <div className="rounded-sm border border-[#d8cda9]/55 bg-white/45 px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.16em] text-[#9b7b2d]">Access</p>
            <p className="mt-1 text-[#384354]">Licensed only</p>
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[#384354]">{listing.description}</p>

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#d8cda9]/70 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-[#384354]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-[#d6c99f]/65 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
            <span>Reviewed summary</span>
            <span>Private routing</span>
          </div>
          <InquiryLink
            subject={inquirySubject}
            listingTitle={listing.title}
            label={inquiryLabel}
          />
          <p className="mt-3 text-xs leading-5 text-[#5f6876]">
            Public summary only. Contact details and transaction-specific materials are handled through reviewed Harbourview intake.
          </p>
        </div>
      </div>
    </article>
  )
}
