// lib/scrapers/normaliser.ts
// AI-powered normaliser. Sends raw scraped items to Claude and returns
// structured, public-safe listing fields.
// Falls back to raw passthrough if the API key is missing, unpaid, or errors.

import type { RawScrapedItem, AINormalisedListing, ScraperCategory } from './types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

const SYSTEM = `You are a listing normalisation engine for Harbourview, a regulated cannabis market intelligence platform.
Your job is to take raw scraped text from equipment dealer, packaging supplier, lab, or logistics websites and return a clean, public-safe listing record.

Rules:
- NEVER include the source site name, seller name, seller contact, price details from small private sellers, or any personally identifiable information in public fields
- Rewrite title and description to be generic, professional, and Harbourview-style (no hype, no claims)
- Map category to one of: used_surplus, processing_equipment, cultivation_equipment, packaging, consumables, labs_testing, logistics, professional_services, genetics, cannabis_inventory, new_products, services, business_opportunities, export_ready, import_demand, distressed_inventory, distressed_businesses
- Map region to one of: north_america, europe, asia_pacific, latin_america, middle_east_africa, global
- Set publicSafe=false if: the listing contains seller identity, private contact info, proprietary pricing from a small operator, or anything that should be gated
- Respond ONLY with valid JSON, no markdown, no explanation`

const USER_TEMPLATE = (item: RawScrapedItem) => `
Raw listing data:
Title: ${item.rawTitle}
Description: ${item.rawDescription}
Price: ${item.rawPrice ?? 'not specified'}
Location: ${item.rawLocation ?? 'not specified'}
Condition: ${item.rawCondition ?? 'not specified'}
Category hint: ${item.sourceId}

Return JSON with this exact shape:
{
  "title": "string — public-safe listing title",
  "description": "string — 1-2 sentence public-safe description",
  "category": "used_surplus | processing_equipment | cultivation_equipment | packaging | consumables | labs_testing | logistics | professional_services | genetics | cannabis_inventory | new_products | services | business_opportunities | export_ready | import_demand | distressed_inventory | distressed_businesses",
  "productType": "string — e.g. 'CO2 Extraction System' or 'Child-Resistant Packaging'",
  "region": "north_america | europe | asia_pacific | latin_america | middle_east_africa | global",
  "locationCountry": "string or null",
  "priceAmount": number or null,
  "priceCurrency": "USD | EUR | CAD | GBP or null",
  "condition": "new | used | refurbished | surplus or null",
  "sellerType": "licensed_producer | distributor | wholesaler | investor | other",
  "tags": ["array", "of", "relevant", "tags"],
  "confidence": 0.0-1.0,
  "publicSafe": true or false,
  "redactionNote": "string or null — if publicSafe=false, brief reason"
}
`

/** Heuristic category mapping from source ID — used in raw passthrough mode */
function inferCategory(sourceId: string): ScraperCategory {
  if (sourceId.includes('packaging') || sourceId.includes('dragon') || sourceId.includes('mj-wholesale') || sourceId.includes('medlock')) return 'packaging'
  if (sourceId.includes('lab') || sourceId.includes('certified') || sourceId.includes('labstat') || sourceId.includes('anab')) return 'labs_testing'
  if (sourceId.includes('logistic') || sourceId.includes('transport') || sourceId.includes('ziing') || sourceId.includes('mmm')) return 'logistics'
  if (sourceId.includes('service') || sourceId.includes('strateg') || sourceId.includes('holland') || sourceId.includes('verdant')) return 'professional_services'
  if (sourceId.includes('cultivation') || sourceId.includes('grower') || sourceId.includes('horticulture')) return 'cultivation_equipment'
  if (sourceId.includes('processing') || sourceId.includes('machinio') || sourceId.includes('bidspotter')) return 'processing_equipment'
  if (sourceId.includes('eu-gmp') || sourceId.includes('export')) return 'export_ready'
  return 'used_surplus'
}

/** Raw passthrough — no AI, requires manual review before anything publishes */
function rawPassthrough(items: RawScrapedItem[], reason: string): AINormalisedListing[] {
  console.warn(`scraper_normaliser: passthrough mode — ${reason}`)
  return items.map((item) => ({
    title: item.rawTitle,
    description: item.rawDescription || item.rawTitle,
    category: inferCategory(item.sourceId),
    productType: item.rawTitle.split(' ').slice(0, 5).join(' '),
    region: 'north_america',
    locationCountry: item.rawLocation ?? null,
    priceAmount: item.rawPrice
      ? parseFloat(item.rawPrice.replace(/[^0-9.]/g, '')) || null
      : null,
    priceCurrency: item.rawPrice?.includes('CAD')
      ? 'CAD'
      : item.rawPrice?.includes('EUR')
      ? 'EUR'
      : item.rawPrice
      ? 'USD'
      : null,
    condition: item.rawCondition ?? null,
    sellerType: 'other',
    tags: [],
    confidence: 0.25,
    publicSafe: false,
    redactionNote: `Raw passthrough (${reason}) — manual review required before publishing.`,
  }))
}

/** Check whether an HTTP status means the API key is dead/unpaid */
function isAuthOrBillingError(status: number): boolean {
  return status === 401 || status === 402 || status === 403
}

export async function normaliseWithAI(
  items: RawScrapedItem[],
): Promise<AINormalisedListing[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return rawPassthrough(items, 'no ANTHROPIC_API_KEY set')
  }

  const results: AINormalisedListing[] = []

  for (const item of items) {
    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          system: SYSTEM,
          messages: [{ role: 'user', content: USER_TEMPLATE(item) }],
        }),
      })

      // API key dead or unpaid — fall back entire remaining batch immediately
      if (isAuthOrBillingError(response.status)) {
        const errText = await response.text().catch(() => '')
        console.warn(
          `scraper_normaliser: API key invalid or unpaid (HTTP ${response.status}) — switching to raw passthrough for remaining ${items.length - results.length} items`,
          errText.slice(0, 200),
        )
        const remaining = items.slice(results.length)
        return [...results, ...rawPassthrough(remaining, `API key error ${response.status}`)]
      }

      // Other non-2xx (rate limit, server error) — skip this item, continue
      if (!response.ok) {
        console.warn(`scraper_normaliser: API error ${response.status} for "${item.rawTitle}" — skipping item`)
        // Push a passthrough for just this item so we don't lose it
        results.push(...rawPassthrough([item], `API error ${response.status}`))
        continue
      }

      const data = await response.json()
      const text = data?.content?.[0]?.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean) as AINormalisedListing
      results.push(parsed)
    } catch (err) {
      console.warn(
        `scraper_normaliser: exception for "${item.rawTitle}" — pushing raw passthrough:`,
        err instanceof Error ? err.message : String(err),
      )
      results.push(...rawPassthrough([item], 'exception during normalisation'))
    }
  }

  return results
}
