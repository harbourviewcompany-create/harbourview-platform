import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseHTML } from 'linkedom'
import { describe, expect, it, vi } from 'vitest'
import {
  MARKET_TABS,
  type NormalizedListing,
} from '@/components/dashboard/mobile-command/contracts'
import {
  getRepresentativeMarketplaceMedia,
  toRenderableMarketplaceMediaSrc,
} from '@/lib/dashboard/marketplaceMediaProjection'

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

const DRIED_FLOWER_SRC =
  'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/representative/v6/dried-flower.png'

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
      src: 'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/listing-123.webp',
      altText: 'Sealed EU-GMP dried flower lot prepared for export',
      kind: 'actual',
      badgeLabel: null,
      caption: 'Approved listing image.',
      fallbackSrc: DRIED_FLOWER_SRC,
      fallbackAltText: 'Representative dried medicinal flower in stainless sample tray with bulk pouch and amber jar',
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

function expectOptimizedImageSource(image: Element | null | undefined, expectedSource: string) {
  const renderedSource = image?.getAttribute('src')
  expect(renderedSource).toBeTruthy()
  const optimized = new URL(renderedSource!, 'https://harbourview.test')
  expect(optimized.pathname).toBe('/_next/image')
  expect(optimized.searchParams.get('url')).toBe(expectedSource)
}

describe('mobile marketplace listing media', () => {
  it('renders approved real-item evidence without a representative or catalogue qualifier', () => {
    const row = listing()
    const document = renderMarket(row)
    const media = document.querySelector('.hvm2-listing-media')
    const image = media?.querySelector('img')

    expect(media?.getAttribute('data-media-kind')).toBe('actual')
    expectOptimizedImageSource(image, row.media!.src)
    expect(image?.getAttribute('alt')).toBe('Sealed EU-GMP dried flower lot prepared for export')
    expect(image?.getAttribute('loading')).toBe('lazy')
    expect(document.querySelector('.hvm2-listing-media-badge')).toBeNull()
    expect(document.body.textContent).toContain('Approved listing image.')
  })

  it('renders manufacturer catalogue provenance as a controlled visible qualifier', () => {
    const document = renderMarket(listing({
      media: {
        ...listing().media!,
        kind: 'catalogue',
        badgeLabel: 'Manufacturer catalogue',
        caption: 'Manufacturer-supplied catalogue image.',
      },
    }))
    const badge = document.querySelector('.hvm2-listing-media-badge')

    expect(document.querySelector('.hvm2-listing-media')?.getAttribute('data-media-kind')).toBe('catalogue')
    expect(badge?.textContent).toBe('Manufacturer catalogue')
    expect(badge?.getAttribute('aria-hidden')).toBeNull()
  })

  it('labels representative media explicitly', () => {
    const representative = getRepresentativeMarketplaceMedia('equipment')
    const document = renderMarket(listing({ view: 'equipment', category: 'Equipment', media: representative }))
    const badge = document.querySelector('.hvm2-listing-media-badge')

    expect(document.querySelector('.hvm2-listing-media')?.getAttribute('data-media-kind')).toBe('representative')
    expect(badge?.textContent).toBe('Representative image')
    expect(document.querySelector('.hvm2-listing-media img')?.getAttribute('alt')).toBe(representative.altText)
  })

  it('falls back from a broken primary asset to explicit representative media', () => {
    const row = listing()
    expect(resolveListingMediaStage(row, 'primary')).toMatchObject({
      src: row.media?.src,
      kind: 'actual',
      badgeLabel: null,
    })
    expect(resolveListingMediaStage(row, 'fallback')).toEqual({
      src: DRIED_FLOWER_SRC,
      altText: 'Representative dried medicinal flower in stainless sample tray with bulk pouch and amber jar',
      kind: 'representative',
      badgeLabel: 'Representative image',
      caption: 'Representative category image.',
    })
    const emptyStage = resolveListingMediaStage(row, 'empty')
    expect(emptyStage?.kind).toBe('representative')
    expect(emptyStage?.src).toBe(DRIED_FLOWER_SRC)
  })

  it('uses representative category image when a row has no projected media', () => {
    const document = renderMarket(listing({ media: null }))
    const media = document.querySelector('.hvm2-listing-media')
    const image = media?.querySelector('img')

    expect(media).not.toBeNull()
    expect(media?.getAttribute('data-media-kind')).toBe('representative')
    expect(image).not.toBeNull()
    expectOptimizedImageSource(image, DRIED_FLOWER_SRC)
    expect(document.querySelector('.hvm2-listing-media-badge')?.textContent).toBe('Representative image')
    expect(media?.textContent).not.toContain('photo on inquiry')
  })

  it('defines a representative fallback for every marketplace category', () => {
    for (const tab of MARKET_TABS) {
      const media = getRepresentativeMarketplaceMedia(tab.id)
      expect(media.kind).toBe('representative')
      expect(media.badgeLabel).toBe('Representative image')
      expect(media.src).toContain('/storage/v1/object/public/marketplace-item-public/representative/')
      expect(media.altText.length).toBeGreaterThan(10)
      expect(media.fallbackSrc).toBe(media.src)
    }
  })

  it('allows only the public marketplace image bucket on the locked Supabase host', () => {
    expect(toRenderableMarketplaceMediaSrc(
      'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/item.webp',
    )).toContain('/storage/v1/object/public/marketplace-item-public/item.webp')
    expect(toRenderableMarketplaceMediaSrc(
      'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/sign/marketplace-item-private/original.webp?token=secret',
    )).toBeNull()
    expect(toRenderableMarketplaceMediaSrc(
      'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/other-public-bucket/item.webp',
    )).toBeNull()
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
