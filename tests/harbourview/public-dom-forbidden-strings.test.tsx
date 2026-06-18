import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountrySearchOverlay } from '@/components/globe/CountrySearchOverlay'
import { IntentCardGrid } from '@/components/globe/IntentCardGrid'
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard'
import type { PublicMarketplaceListing } from '@/lib/marketplace/publicListings'
import { FORBIDDEN_PUBLIC_FIELD_NAMES } from '@/lib/intelligence-os/publicSafety'

// publicMarketplaceListings is intentionally empty (live data comes from Supabase).
// Use inline fixtures for DOM leakage checks so the tests remain meaningful.
const fixtureListings: PublicMarketplaceListing[] = [
  {
    slug: 'test-eu-gmp-flower',
    title: 'EU-GMP Certified Flower — 100kg Available',
    section: 'Cannabis Inventory',
    category: 'Flower',
    listingType: 'supply',
    condition: 'New',
    price: 'Contact for pricing',
    location: 'Germany',
    publicSummary: 'Premium indoor-grown cannabis flower, EU-GMP certified.',
    buyerFit: ['Licensed importer', 'EU-GMP distributor'],
    complianceNote: 'Introduction via Harbourview review only.',
    ctaLabel: 'Request introduction',
  },
  {
    slug: 'test-extraction-equipment',
    title: 'CO₂ Extraction Equipment — Commercial Scale',
    section: 'Equipment',
    category: 'Extraction',
    listingType: 'equipment',
    condition: 'Used',
    price: 'Contact for pricing',
    location: 'Canada',
    publicSummary: 'Commercial-scale CO₂ extraction unit, maintained and operational.',
    buyerFit: ['Licensed processor', 'Extractor'],
    complianceNote: 'Introduction via Harbourview review only.',
    ctaLabel: 'Request introduction',
  },
]

const USER_PROVIDED_FORBIDDEN_LIST = ['sourceUrl', 'source_url', 'sourceName', 'source_name', 'buyer_demand']

const FORBIDDEN_PATTERNS = [...FORBIDDEN_PUBLIC_FIELD_NAMES, ...USER_PROVIDED_FORBIDDEN_LIST].map(
  (value) => new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
)

function assertNoForbiddenStrings(dom: string, label: string) {
  const hits = FORBIDDEN_PATTERNS.map((pattern) => pattern.source).filter((pattern) => new RegExp(pattern, 'i').test(dom))
  expect(hits, `${label} leaked forbidden strings`).toEqual([])
}

describe('public DOM forbidden string guardrails', () => {
  it('keeps homepage globe search and intent results DOM public-safe', () => {
    const searchHtml = renderToStaticMarkup(
      <CountrySearchOverlay onSelectCountry={() => undefined} onNotSure={() => undefined} />,
    )
    const resultHtml = renderToStaticMarkup(
      <IntentCardGrid countryName="Germany" countryIso2="DE" mode="single_market" roleId="importer" selectedIntentId="view_market_signals" onSelectIntent={() => undefined} />,
    )

    assertNoForbiddenStrings(searchHtml, 'homepage globe search overlay')
    assertNoForbiddenStrings(resultHtml, 'homepage globe intent results')
  })

  it('keeps marketplace card DOM public-safe', () => {
    const cardHtml = renderToStaticMarkup(<MarketplaceListingCard listing={fixtureListings[0]} />)
    assertNoForbiddenStrings(cardHtml, 'marketplace listing card')
  })

  it('covers homepage and marketplace surfaces as route-level DOM checks', () => {
    const homepageSearchHtml = renderToStaticMarkup(<CountrySearchOverlay onSelectCountry={() => undefined} onNotSure={() => undefined} />)
    const homepageResultsHtml = renderToStaticMarkup(<IntentCardGrid countryName="Germany" countryIso2="DE" mode="single_market" roleId="importer" selectedIntentId="view_market_signals" onSelectIntent={() => undefined} />)
    const marketCardHtml = renderToStaticMarkup(<MarketplaceListingCard listing={fixtureListings[1]} />)

    assertNoForbiddenStrings(homepageSearchHtml, '/ homepage globe search')
    assertNoForbiddenStrings(homepageResultsHtml, '/ homepage globe results')
    assertNoForbiddenStrings(marketCardHtml, '/marketplace market-card')
  })
})
