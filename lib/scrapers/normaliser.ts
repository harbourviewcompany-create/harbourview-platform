// lib/scrapers/normaliser.ts
// AI-powered normaliser. Sends raw scraped items to Claude and returns
// structured, public-safe listing fields.
// Uses claude-sonnet-4-20250514 via the Anthropic API.

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

export async function normaliseWithAI(
  items: RawScrapedItem[],
): Promise<AINormalisedListing[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('scraper_normaliser: ANTHROPIC_API_KEY not set — returning empty normalisations')
    return []
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

      if (!response.ok) {
        console.warn(`scraper_normaliser: API error ${response.status} for item "${item.rawTitle}"`)
        continue
      }

      const data = await response.json()
      const text = data?.content?.[0]?.text ?? ''

      // Strip any accidental markdown fences
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean) as AINormalisedListing
      results.push(parsed)
    } catch (err) {
      console.warn(
        `scraper_normaliser: failed to normalise "${item.rawTitle}":`,
        err instanceof Error ? err.message : String(err),
      )
    }
  }

  return results
}
