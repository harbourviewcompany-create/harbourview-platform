// lib/scrapers/parser-dom.ts
// DOM-based parser using linkedom. Replaces regex-based parsing.
// Handles JSON-LD structured data and source-specific selectors.

import type { ScraperSource, RawScrapedItem } from './types'

const MAX_CANDIDATES_PER_SOURCE = 20

function getText(el: Element | null): string {
  if (!el) return ''
  return el.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function getHref(el: Element | null, baseUrl: string): string | undefined {
  if (!el) return undefined
  const anchor = el.querySelector('a')
  if (!anchor) return undefined
  const href = anchor.getAttribute('href')
  if (!href) return undefined
  if (href.startsWith('http')) return href
  try {
    return new URL(href, baseUrl).href
  } catch {
    return undefined
  }
}

function extractPrice(text: string): string | undefined {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?|\d[\d,]+\s*(?:USD|CAD|EUR|GBP)/i)
  return match ? match[0].trim() : undefined
}

function extractJsonLd(document: Document, baseUrl: string, source: ScraperSource): RawScrapedItem[] {
  const results: RawScrapedItem[] = []
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '{}')
      const products = Array.isArray(data) ? data : [data]

      for (const item of products) {
        if (item['@type'] !== 'Product') continue
        const title = item.name || item.title || ''
        if (!title || title.length < 4) continue

        const description = item.description || ''
        const price = item.offers?.price
          ? `${item.offers.priceCurrency ?? 'USD'} ${item.offers.price}`
          : undefined
        const condition = item.itemCondition?.toLowerCase().includes('used') ? 'used' : 'new'

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: item.url || baseUrl,
          rawTitle: title,
          rawDescription: description.slice(0, 500),
          rawPrice: price,
          rawLocation: undefined,
          rawCondition: condition,
          rawHtml: JSON.stringify(item).slice(0, 1200),
          discoveredAt: new Date().toISOString(),
        })

        if (results.length >= MAX_CANDIDATES_PER_SOURCE) break
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return results
}

function parseWithSelectors(document: Document, baseUrl: string, source: ScraperSource): RawScrapedItem[] {
  const results: RawScrapedItem[] = []
  const selectors = source.selectors

  if (selectors?.container) {
    const containers = document.querySelectorAll(selectors.container)
    for (const container of containers) {
      const title = getText(
        selectors.title
          ? container.querySelector(selectors.title)
          : container.querySelector('h1, h2, h3, .title'),
      )
      if (!title || title.length < 4) continue

      const description = getText(
        selectors.description
          ? container.querySelector(selectors.description)
          : container.querySelector('p, .description'),
      )
      const price = extractPrice(
        getText(selectors.price ? container.querySelector(selectors.price) : container),
      )
      const location = getText(selectors.location ? container.querySelector(selectors.location) : null)
      const link = getHref(selectors.link ? container.querySelector(selectors.link) : container, baseUrl)

      results.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: link ?? baseUrl,
        rawTitle: title,
        rawDescription: description.slice(0, 500),
        rawPrice: price,
        rawLocation: location || undefined,
        rawCondition: undefined,
        rawHtml: (container as Element).outerHTML?.slice(0, 1200) ?? '',
        discoveredAt: new Date().toISOString(),
      })

      if (results.length >= MAX_CANDIDATES_PER_SOURCE) break
    }
    return results
  }

  const cardSelectors = [
    'article',
    '[class*="listing"]',
    '[class*="product"]',
    '[class*="item"]',
    '[class*="card"]',
    '[class*="result"]',
    'li',
  ]

  for (const selector of cardSelectors) {
    const cards = document.querySelectorAll(selector)
    for (const card of cards) {
      const title = getText(card.querySelector('h1, h2, h3, h4, .title, [class*="title"]'))
      if (!title || title.length < 4) continue

      const description = getText(card.querySelector('p, .description, [class*="desc"]'))
      const price = extractPrice(getText(card))
      const link = getHref(card, baseUrl)
      const text = getText(card)
      const condition = /used|refurb|pre.?own/i.test(text)
        ? 'used'
        : /new/i.test(text)
          ? 'new'
          : undefined

      results.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: link ?? baseUrl,
        rawTitle: title,
        rawDescription: description.slice(0, 500),
        rawPrice: price,
        rawLocation: undefined,
        rawCondition: condition,
        rawHtml: (card as Element).outerHTML?.slice(0, 1200) ?? '',
        discoveredAt: new Date().toISOString(),
      })

      if (results.length >= MAX_CANDIDATES_PER_SOURCE) break
    }
    if (results.length > 0) break
  }

  return results
}

/** Parse HTML using linkedom DOM */
export async function parseWithDom(
  html: string,
  source: ScraperSource,
): Promise<RawScrapedItem[]> {
  // linkedom is an optional runtime dependency — declare ambient types in types/linkedom.d.ts
  const { parseHTML } = await import('linkedom')
  const { document } = parseHTML(html)

  const jsonLdResults = extractJsonLd(document, source.url, source)
  if (jsonLdResults.length > 0) return jsonLdResults

  return parseWithSelectors(document, source.url, source)
}
