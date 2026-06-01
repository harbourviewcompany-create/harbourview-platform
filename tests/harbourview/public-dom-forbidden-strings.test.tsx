import React from 'react'
;(globalThis as { React?: typeof React }).React = React

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountrySearchOverlay } from '@/components/globe/CountrySearchOverlay'
import { IntentCardGrid } from '@/components/globe/IntentCardGrid'
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard'
import { publicMarketplaceListings } from '@/lib/marketplace/publicListings'
import { FORBIDDEN_PUBLIC_FIELD_NAMES } from '@/lib/intelligence-os/publicSafety'

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
      <CountrySearchOverlay onSelectCountry={() => undefined} />,
    )
    const resultHtml = renderToStaticMarkup(
      <IntentCardGrid countryName="Germany" countryIso2="DE" mode="single_market" roleId="importer" selectedIntentId="view_market_signals" onSelectIntent={() => undefined} />,
    )

    assertNoForbiddenStrings(searchHtml, 'homepage globe search overlay')
    assertNoForbiddenStrings(resultHtml, 'homepage globe intent results')
  })

  it('keeps marketplace card DOM public-safe', () => {
    const cardHtml = renderToStaticMarkup(<MarketplaceListingCard listing={publicMarketplaceListings[0]} />)
    assertNoForbiddenStrings(cardHtml, 'marketplace listing card')
  })

  it('covers homepage and marketplace surfaces as route-level DOM checks', () => {
    const homepageSearchHtml = renderToStaticMarkup(<CountrySearchOverlay onSelectCountry={() => undefined} />)
    const homepageResultsHtml = renderToStaticMarkup(<IntentCardGrid countryName="Germany" countryIso2="DE" mode="single_market" roleId="importer" selectedIntentId="view_market_signals" onSelectIntent={() => undefined} />)
    const marketCardHtml = renderToStaticMarkup(<MarketplaceListingCard listing={publicMarketplaceListings[1]} />)

    assertNoForbiddenStrings(homepageSearchHtml, '/ homepage globe search')
    assertNoForbiddenStrings(homepageResultsHtml, '/ homepage globe results')
    assertNoForbiddenStrings(marketCardHtml, '/marketplace market-card')
  })
})
