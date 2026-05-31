// lib/scrapers/parser.ts
// Lightweight HTML parser for extracting raw listing candidates from source pages.
// Uses regex + structural heuristics — no heavy DOM dependency (edge-compatible).

import type { ScraperSource, RawScrapedItem } from './types'

const MAX_CANDIDATES_PER_SOURCE = 20

/** Extract text content from an HTML tag, removing nested tags. */
function innerText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract href from the first <a> in an HTML snippet. */
function extractHref(html: string, baseUrl: string): string | undefined {
  const match = html.match(/href=["']([^"']+)["']/)
  if (!match) return undefined
  const href = match[1]
  if (href.startsWith('http')) return href
  try {
    return new URL(href, baseUrl).href
  } catch {
    return undefined
  }
}

/** Heuristic price extraction from raw text. */
function extractPrice(text: string): string | undefined {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?|\d[\d,]+\s*(?:USD|CAD|EUR|GBP)/i)
  return match ? match[0].trim() : undefined
}

/**
 * Generic html-card parser. Splits the page HTML into "card" blocks using common
 * container patterns, then extracts title, description, price, location, and link
 * from each block. Works across most listing-grid sites with no site-specific tuning.
 */
export function parseHtmlCards(
  html: string,
  source: ScraperSource,
): RawScrapedItem[] {
  const results: RawScrapedItem[] = []
  const now = new Date().toISOString()

  // Split into card blocks — look for article, li, or div with class patterns
  const blockPattern =
    /<(?:article|li)[^>]*>[\s\S]*?<\/(?:article|li)>|<div[^>]*class="[^"]*(?:listing|product|item|card|result)[^"]*"[^>]*>[\s\S]*?<\/div>/gi
  const blocks = html.match(blockPattern) ?? []

  // Fallback: use h2/h3 headings as anchors and grab surrounding text
  if (blocks.length === 0) {
    const headingPattern = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi
    let m
    while ((m = headingPattern.exec(html)) !== null && results.length < MAX_CANDIDATES_PER_SOURCE) {
      const title = innerText(m[1])
      if (title.length < 8 || title.length > 200) continue
      // Grab 800 chars of surrounding context
      const ctx = html.slice(Math.max(0, m.index - 100), m.index + 800)
      const price = extractPrice(innerText(ctx))
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: extractHref(ctx, source.url) ?? source.searchUrl ?? source.url,
        rawTitle: title,
        rawDescription: innerText(ctx).slice(0, 500),
        rawPrice: price,
        rawLocation: undefined,
        rawCondition: /used|refurb/i.test(ctx) ? 'used' : /new/i.test(ctx) ? 'new' : undefined,
        rawHtml: ctx.slice(0, 1200),
        discoveredAt: now,
      })
    }
    return results.slice(0, MAX_CANDIDATES_PER_SOURCE)
  }

  for (const block of blocks.slice(0, MAX_CANDIDATES_PER_SOURCE)) {
    // Title: first h1/h2/h3/h4/strong or element with 'title' class
    const titleMatch =
      block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) ??
      block.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/\w+>/i) ??
      block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
    const rawTitle = titleMatch ? innerText(titleMatch[1]) : ''
    if (!rawTitle || rawTitle.length < 4) continue

    // Description: first <p> or element with 'desc' class
    const descMatch =
      block.match(/<p[^>]*>([\s\S]*?)<\/p>/i) ??
      block.match(/class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/\w+>/i)
    const rawDescription = descMatch ? innerText(descMatch[1]).slice(0, 500) : innerText(block).slice(0, 500)

    const price = extractPrice(innerText(block))
    const link = extractHref(block, source.url)
    const text = innerText(block)
    const condition = /used|refurb|pre.?own/i.test(text)
      ? 'used'
      : /new/i.test(text)
      ? 'new'
      : undefined

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: link ?? source.searchUrl ?? source.url,
      rawTitle,
      rawDescription,
      rawPrice: price,
      rawLocation: undefined,
      rawCondition: condition,
      rawHtml: block.slice(0, 1200),
      discoveredAt: now,
    })
  }

  return results
}
