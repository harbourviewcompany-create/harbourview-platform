import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { describe, expect, it, vi } from 'vitest'
import {
  MARKET_TABS,
  type NormalizedListing,
} from '@/components/dashboard/mobile-command/contracts'
import { getRepresentativeMarketplaceMedia } from '@/lib/dashboard/marketplaceMediaProjection'

vi.mock('@/components/marketplace/DynamicMarketplaceIntakeForm', () => ({
  DynamicMarketplaceIntakeForm: () => null,
}))

vi.mock('@/app/marketplace/financing/FinancingInquiryForm', () => ({
  default: () => null,
}))

import {
  MarketplaceSection,
  resolveListingMediaStage,
} from '@/components/dashboard/mobile-command/sections/MarketplaceSections'

function listing(overrides: Partial<NormalizedListing> = {}): NormalizedListing {
  return {
    id: 'listing-123',
    title: 'EU-GMP Certified Dried Flower — 100kg Lot',
    summary: 'Reviewed Canadian export supply.',
    jurisdiction: 'CA',
    category: 'Dried Flower',
    status: 'Pending Review',
    channel: 'Mediated',
    confidence: 62,
    view: 'cannabis',
    media: {
      src: 'https://cdn.example.com/listing-123.webp',
      altText: 'Sealed EU-GMP dried flower lot prepared for export',
      kind: 'actual',
      caption: 'Approved listing image.',
      fallbackSrc: '/marketplace/images/product-inventory.webp',
      fallbackAltText: 'Representative cannabis product inventory image',
      fallbackCaption: 'Representative category image.',
    },
    ...overrides,
  }
}

function renderMarket(row: NormalizedListing) {
  const markup = renderToStaticMarkup(createElement(MarketplaceSection, {
    sectionRef: () => undefined,
    activeMarketView: row.view,
    marketQuery: '',
    marketRows: [row],
    filteredRows: [row],
    activeTool: null,
    selectedListing: null,
    onMarketViewChange: () => undefined,
    onMarketQueryChange: () => undefined,
    onOpenTool: () => undefined,
    onCloseTool: () => undefined,
    onViewSubmissions: () => undefined,
    commandHref: () => '#',
  }))
  return parseHTML(`<!doctype html><html><body>${markup}</body></html>`).document
}

describe('mobile marketplace listing media', () => {
  it('renders approved listing-specific media directly from the safe projection', () => {
    const document = renderMarket(listing())
    const media = document.querySelector('.hvm2-listing-media')
    const image = media?.querySelector('img')

    expect(media?.getAttribute('data-media-kind')).toBe('actual')
    expect(image?.getAttribute('src')).toBe('https://cdn.example.com/listing-123.webp')
    expect(image?.getAttribute('alt')).toBe('Sealed EU-GMP dried flower lot prepared for export')
    expect(image?.getAttribute('data-fallback-src')).toBe('/marketplace/images/product-inventory.webp')
    expect(image?.getAttribute('loading')).toBe('lazy')
    expect(document.body.textContent).not.toContain('Representative image')
    expect(document.body.textContent).toContain('Approved listing image.')
  })

  it('labels representative media visually without duplicating the label for assistive technology', () => {
    const representative = getRepresentativeMarketplaceMedia('equipment')
    const document = renderMarket(listing({ view: 'equipment', category: 'Equipment', media: representative }))
    const badge = document.querySelector('.hvm2-listing-media-badge')

    expect(document.querySelector('.hvm2-listing-media')?.getAttribute('data-media-kind')).toBe('representative')
    expect(badge?.textContent).toBe('Representative image')
    expect(badge?.getAttribute('aria-hidden')).toBe('true')
    expect(document.querySelector('.hvm2-listing-media img')?.getAttribute('alt')).toBe(representative.altText)
  })

  it('falls back from a broken primary asset to explicit representative media', () => {
    const row = listing()
    expect(resolveListingMediaStage(row, 'primary')).toMatchObject({
      src: 'https://cdn.example.com/listing-123.webp',
      kind: 'actual',
    })
    expect(resolveListingMediaStage(row, 'fallback')).toEqual({
      src: '/marketplace/images/product-inventory.webp',
      altText: 'Representative cannabis product inventory image',
      kind: 'representative',
      caption: 'Representative category image.',
    })
    expect(resolveListingMediaStage(row, 'empty')).toBeNull()
  })

  it('preserves an accessible stable image region when a row has no projected media', () => {
    const document = renderMarket(listing({ media: null }))
    const media = document.querySelector('.hvm2-listing-media')
    const unavailable = media?.querySelector('[role="img"]')

    expect(media).not.toBeNull()
    expect(media?.getAttribute('data-media-kind')).toBe('none')
    expect(media?.textContent).toContain('Image unavailable')
    expect(media?.querySelector('img')).toBeNull()
    expect(unavailable?.getAttribute('aria-label')).toBe('Listing image unavailable')
  })

  it('defines a representative fallback for every marketplace category', () => {
    for (const tab of MARKET_TABS) {
      const media = getRepresentativeMarketplaceMedia(tab.id)
      expect(media.kind).toBe('representative')
      expect(media.src).toMatch(/^\/marketplace\/images\/.+\.webp$/)
      expect(media.altText.length).toBeGreaterThan(10)
      expect(media.fallbackSrc).toBe(media.src)
    }
  })

  it('keeps private provenance and review fields out of the mobile media contract', () => {
    const serialized = JSON.stringify(listing().media)
    for (const forbidden of [
      'sourceUrl',
      'sourceName',
      'sourceEvidence',
      'provenanceSummary',
      'internalReviewNotes',
      'reviewedBy',
      'lastReviewedAt',
      'nextReviewDueAt',
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
