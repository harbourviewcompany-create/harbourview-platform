// lib/scrapers/parser.ts
// Lightweight HTML/RSS/table parser for extracting raw listing candidates from source pages.
// Uses regex + structural heuristics — no heavy DOM dependency (edge-compatible).

import type { ScraperSource, RawScrapedItem } from './types'

const MAX_CANDIDATES_PER_SOURCE = 20

// ── Shared utilities ──────────────────────────────────────────────────────────

/** Extract text content from an HTML/XML tag, removing nested tags. */
function innerText(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')  // unwrap CDATA
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

// ── HTML Card Parser ──────────────────────────────────────────────────────────

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
        rawCondition: undefined,
        rawHtml: ctx.slice(0, 1200),
        discoveredAt: now,
      })
    }
    return results.slice(0, MAX_CANDIDATES_PER_SOURCE)
  }

  for (const block of blocks.slice(0, MAX_CANDIDATES_PER_SOURCE)) {
    const titleMatch =
      block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) ??
      block.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/\w+>/i) ??
      block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
    const rawTitle = titleMatch ? innerText(titleMatch[1]) : ''
    if (!rawTitle || rawTitle.length < 4) continue

    const descMatch =
      block.match(/<p[^>]*>([\s\S]*?)<\/p>/i) ??
      block.match(/class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/\w+>/i)
    const rawDescription = descMatch
      ? innerText(descMatch[1]).slice(0, 500)
      : innerText(block).slice(0, 500)

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

// ── RSS / Atom Feed Parser ────────────────────────────────────────────────────

/**
 * Parses RSS 2.0 and Atom 1.0 feeds. Handles CDATA-wrapped content.
 * Extracts items/entries and maps them to RawScrapedItem.
 */
export function parseRssFeed(
  xml: string,
  source: ScraperSource,
): RawScrapedItem[] {
  const results: RawScrapedItem[] = []
  const now = new Date().toISOString()

  // Support both RSS <item> and Atom <entry>
  const itemPattern = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi
  const blocks = xml.match(itemPattern) ?? []

  for (const block of blocks.slice(0, MAX_CANDIDATES_PER_SOURCE)) {
    // Title
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const rawTitle = titleMatch ? innerText(titleMatch[1]) : ''
    if (!rawTitle || rawTitle.length < 4) continue

    // Description / summary / content
    const descMatch =
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ??
      block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ??
      block.match(/<content(?::encoded)?[^>]*>([\s\S]*?)<\/content(?::encoded)?>/i)
    const rawDescription = descMatch
      ? innerText(descMatch[1]).slice(0, 600)
      : ''

    // Link — RSS uses <link> text content or Atom uses <link href="..."/>
    let sourceUrl = source.searchUrl ?? source.url
    const linkHrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i)
    const linkTextMatch = block.match(/<link[^>]*>([^<]+)<\/link>/i)
    if (linkHrefMatch) sourceUrl = linkHrefMatch[1]
    else if (linkTextMatch) {
      const candidate = linkTextMatch[1].trim()
      if (candidate.startsWith('http')) sourceUrl = candidate
    }

    // Publication date — used to detect freshness later
    const dateMatch =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ??
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ??
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)
    const pubDate = dateMatch ? innerText(dateMatch[1]) : undefined

    // Categories / tags
    const catMatches = [...block.matchAll(/<category[^>]*>([^<]+)<\/category>/gi)]
    const tags = catMatches.map((m) => innerText(m[1])).filter(Boolean).join(', ')

    const combined = [rawDescription, tags].filter(Boolean).join(' — ')

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl,
      rawTitle,
      rawDescription: combined.slice(0, 600),
      rawPrice: undefined,
      rawLocation: undefined,
      rawCondition: undefined,
      rawHtml: block.slice(0, 1200),
      discoveredAt: pubDate ?? now,
    })
  }

  return results
}

// ── HTML Table Parser ─────────────────────────────────────────────────────────

/**
 * Parses regulatory-style HTML tables (licensee databases, etc).
 * Extracts the first <table>, reads headers from <th>, rows from <tr>/<td>.
 * Heuristically maps columns to title, description, location fields.
 */
export function parseHtmlTable(
  html: string,
  source: ScraperSource,
): RawScrapedItem[] {
  const results: RawScrapedItem[] = []
  const now = new Date().toISOString()

  // Find first substantial table
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
  if (!tableMatch) {
    // Fallback to card parser if no table found
    return parseHtmlCards(html, source)
  }

  const tableHtml = tableMatch[0]

  // Extract headers
  const headerRow = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i)
  const headers: string[] = []
  if (headerRow) {
    const thPattern = /<th[^>]*>([\s\S]*?)<\/th>/gi
    let m
    while ((m = thPattern.exec(headerRow[1])) !== null) {
      headers.push(innerText(m[1]).toLowerCase())
    }
  }

  // Extract data rows
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  let rowIndex = 0

  while (
    (rowMatch = rowPattern.exec(tableHtml)) !== null &&
    results.length < MAX_CANDIDATES_PER_SOURCE
  ) {
    rowIndex++
    if (rowIndex === 1) continue // skip header row

    const rowHtml = rowMatch[1]
    const cells: string[] = []
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let tdMatch
    while ((tdMatch = tdPattern.exec(rowHtml)) !== null) {
      cells.push(innerText(tdMatch[1]))
    }

    if (cells.length === 0 || cells.every((c) => !c)) continue

    // Map cells to fields using header hints
    const getCell = (hints: string[]): string | undefined => {
      for (const hint of hints) {
        const idx = headers.findIndex((h) => h.includes(hint))
        if (idx !== -1 && cells[idx]) return cells[idx]
      }
      return undefined
    }

    // Try to find name/title column
    const rawTitle =
      getCell(['name', 'business', 'company', 'licensee', 'operator', 'applicant']) ??
      getCell(['licence', 'license', 'number']) ??
      cells[0] ??
      ''

    if (!rawTitle || rawTitle.length < 2) continue

    // Build description from remaining useful columns
    const descParts: string[] = []
    const licenceNum = getCell(['licence', 'license', 'number', 'registration'])
    const licenceType = getCell(['type', 'category', 'class', 'activity'])
    const status = getCell(['status', 'state', 'active'])
    const city = getCell(['city', 'municipality', 'town'])
    const province = getCell(['province', 'state', 'region'])
    const country = getCell(['country'])
    const expiry = getCell(['expir', 'valid', 'renewal', 'date'])

    if (licenceNum) descParts.push(`Licence: ${licenceNum}`)
    if (licenceType) descParts.push(`Type: ${licenceType}`)
    if (status) descParts.push(`Status: ${status}`)
    if (expiry) descParts.push(`Valid: ${expiry}`)

    const location = [city, province, country].filter(Boolean).join(', ')

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: extractHref(rowHtml, source.url) ?? source.searchUrl ?? source.url,
      rawTitle,
      rawDescription: descParts.join(' | '),
      rawPrice: undefined,
      rawLocation: location || undefined,
      rawCondition: undefined,
      rawHtml: rowHtml.slice(0, 1200),
      discoveredAt: now,
    })
  }

  return results
}

// ── Unified Dispatcher ────────────────────────────────────────────────────────

/**
 * Route parsing to the correct parser based on source.parserType.
 * This is the single entry point called by runner.ts.
 */
export function parseSource(
  content: string,
  source: ScraperSource,
): RawScrapedItem[] {
  switch (source.parserType) {
    case 'rss-feed':
      return parseRssFeed(content, source)

    case 'html-table':
      return parseHtmlTable(content, source)

    case 'html-card':
    case 'json-ld-product':
    case 'manual-html':
    default:
      return parseHtmlCards(content, source)
  }
}
