// lib/scrapers/normaliser-v2.ts
// Batched AI normaliser with structured output enforcement, prompt sanitisation,
// model fallback chain (Claude → Gemini → HF Qwen), and response caching.

import type { RawScrapedItem, AINormalisedListing, ScraperCategory } from './types'
import { z } from 'zod'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-5'
const GEMINI_API =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const AI_FETCH_TIMEOUT_MS = 45000 // batched calls (up to 5 items) can run long

const NormalisedSchema = z.object({
  title: z.string().max(300),
  description: z.string().max(1000),
  category: z.enum([
    'used_surplus',
    'processing_equipment',
    'cultivation_equipment',
    'packaging',
    'consumables',
    'labs_testing',
    'logistics',
    'professional_services',
    'genetics',
    'cannabis_inventory',
    'new_products',
    'services',
    'business_opportunities',
    'export_ready',
    'import_demand',
    'distressed_inventory',
    'distressed_businesses',
  ]),
  productType: z.string(),
  region: z.enum([
    'north_america',
    'europe',
    'asia_pacific',
    'latin_america',
    'middle_east_africa',
    'global',
  ]),
  locationCountry: z.string().nullable().optional(),
  priceAmount: z.number().nullable().optional(),
  priceCurrency: z.enum(['USD', 'EUR', 'CAD', 'GBP']).nullable().optional(),
  condition: z.enum(['new', 'used', 'refurbished', 'surplus']).nullable().optional(),
  sellerType: z.enum(['licensed_producer', 'distributor', 'wholesaler', 'investor', 'other']),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  publicSafe: z.boolean(),
  redactionNote: z.string().nullable().optional(),
})

type NormalisedOutput = z.infer<typeof NormalisedSchema>

// Hand-written JSON Schema matching NormalisedSchema, shared between the Claude
// tool-call input_schema and the Gemini/HF prompt text. buildBatchPrompt used to
// embed JSON.stringify(NormalisedSchema.shape), which stringifies Zod's internal
// type-definition objects, not an actual schema -- it produced near-content-free
// output (Zod schema instances have no meaningful own-enumerable properties), so
// Gemini/HF had materially worse guidance on the expected shape/enum values than
// Claude's tool_use path did.
const LISTING_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    productType: { type: 'string' },
    region: { type: 'string' },
    locationCountry: { type: ['string', 'null'] },
    priceAmount: { type: ['number', 'null'] },
    priceCurrency: { type: ['string', 'null'] },
    condition: { type: ['string', 'null'] },
    sellerType: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
    publicSafe: { type: 'boolean' },
    redactionNote: { type: ['string', 'null'] },
  },
  required: [
    'title',
    'description',
    'category',
    'productType',
    'region',
    'confidence',
    'publicSafe',
  ],
}

function toAINormalisedListing(item: NormalisedOutput, isPassthrough: boolean): AINormalisedListing {
  return {
    title: item.title,
    description: item.description,
    category: item.category as ScraperCategory,
    productType: item.productType,
    region: item.region,
    locationCountry: item.locationCountry ?? undefined,
    priceAmount: item.priceAmount ?? undefined,
    priceCurrency: item.priceCurrency ?? undefined,
    condition: item.condition ?? undefined,
    sellerType: item.sellerType,
    tags: item.tags,
    confidence: item.confidence,
    publicSafe: item.publicSafe,
    redactionNote: item.redactionNote ?? undefined,
    isPassthrough,
  }
}

const SYSTEM_PROMPT = `You are a listing normalisation engine for Harbourview, a regulated cannabis market intelligence platform.
Your job is to take raw scraped text and return clean, public-safe listing records.

CRITICAL RULES:
- NEVER include seller names, contact info, or proprietary pricing from small operators
- Rewrite titles and descriptions to be generic and professional
- Map category and region to exactly one of the allowed enum values
- Set publicSafe=false if the listing contains seller identity, private contact info, or proprietary pricing
- Respond ONLY with a JSON array. No markdown, no explanation, no code blocks.`

function sanitiseForPrompt(text: string): string {
  return text
    .replace(/[{}]/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    // Neutralise this file's own item-delimiter pattern so scraped content
    // can't forge a fake "--- ITEM N ---" boundary and inject instructions
    // that read as a new item / system-level directive to the model.
    .replace(/---+\s*ITEM\s*\d+\s*---+/gi, '[stripped]')
    .slice(0, 4000)
}

function sanitiseSourceId(sourceId: string): string {
  // sourceId is registry-controlled, not scraped page content, but sanitise
  // anyway since it's interpolated into the prompt unescaped as "Category hint".
  return sanitiseForPrompt(sourceId).slice(0, 200)
}

function buildBatchPrompt(items: RawScrapedItem[]): string {
  const itemPrompts = items
    .map(
      (item, i) => `
--- ITEM ${i + 1} ---
Title: ${sanitiseForPrompt(item.rawTitle)}
Description: ${sanitiseForPrompt(item.rawDescription)}
Price: ${item.rawPrice ? sanitiseForPrompt(item.rawPrice) : 'not specified'}
Location: ${item.rawLocation ? sanitiseForPrompt(item.rawLocation) : 'not specified'}
Condition: ${item.rawCondition ? sanitiseForPrompt(item.rawCondition) : 'not specified'}
Category hint: ${sanitiseSourceId(item.sourceId)}
`,
    )
    .join('\n')

  return `Normalise ${items.length} scraped listings into valid JSON array.
Each object must match this exact schema:
${JSON.stringify(LISTING_JSON_SCHEMA, null, 2)}
Allowed category values: ${NormalisedSchema.shape.category.options.join(', ')}
Allowed region values: ${NormalisedSchema.shape.region.options.join(', ')}

${itemPrompts}

Return ONLY a JSON array. No other text.`
}

function inferCategory(sourceId: string): ScraperCategory {
  if (sourceId.includes('packaging')) return 'packaging'
  if (sourceId.includes('lab')) return 'labs_testing'
  if (sourceId.includes('logistic') || sourceId.includes('transport')) return 'logistics'
  if (sourceId.includes('service') || sourceId.includes('strateg')) return 'professional_services'
  if (sourceId.includes('cultivation') || sourceId.includes('grower')) return 'cultivation_equipment'
  if (sourceId.includes('processing') || sourceId.includes('machinio')) return 'processing_equipment'
  if (sourceId.includes('eu-gmp') || sourceId.includes('export')) return 'export_ready'
  return 'used_surplus'
}

function rawPassthrough(items: RawScrapedItem[], reason: string): AINormalisedListing[] {
  console.warn(`[normaliser-v2] passthrough: ${reason}`)
  return items.map((item) => ({
    title: item.rawTitle,
    description: item.rawDescription || item.rawTitle,
    category: inferCategory(item.sourceId),
    productType: item.rawTitle.split(' ').slice(0, 5).join(' '),
    region: 'north_america',
    locationCountry: item.rawLocation ?? undefined,
    priceAmount: item.rawPrice
      ? parseFloat(item.rawPrice.replace(/[^0-9.]/g, '')) || undefined
      : undefined,
    priceCurrency: item.rawPrice?.includes('CAD')
      ? 'CAD'
      : item.rawPrice?.includes('EUR')
        ? 'EUR'
        : item.rawPrice
          ? 'USD'
          : undefined,
    condition: item.rawCondition ?? undefined,
    sellerType: 'other',
    tags: [],
    confidence: 0.25,
    publicSafe: false,
    redactionNote: `Passthrough (${reason}) — manual review required.`,
    isPassthrough: true,
  }))
}

function validateAndParse(jsonText: string): NormalisedOutput[] {
  const clean = jsonText.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  return arr.map((item) => NormalisedSchema.parse(item))
}

async function normaliseWithClaude(items: RawScrapedItem[]): Promise<AINormalisedListing[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBatchPrompt(items) }],
      tools: [
        {
          name: 'normalise_listings',
          description: 'Normalise scraped listings',
          input_schema: {
            type: 'object',
            properties: {
              listings: {
                type: 'array',
                items: LISTING_JSON_SCHEMA,
              },
            },
            required: ['listings'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'normalise_listings' },
    }),
    signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Claude API ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const toolUse = data.content?.find((c: { type: string }) => c.type === 'tool_use')
  if (!toolUse) throw new Error('No tool_use in Claude response')

  const rawListings = (toolUse.input?.listings ?? []) as unknown[]
  const listings = rawListings.map((item) => NormalisedSchema.parse(item))
  return listings.map((item) => toAINormalisedListing(item, false))
}

async function normaliseWithGemini(items: RawScrapedItem[]): Promise<AINormalisedListing[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildBatchPrompt(items) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const parsed = validateAndParse(text)
  return parsed.map((item) => toAINormalisedListing(item, false))
}

async function normaliseWithHF(items: RawScrapedItem[]): Promise<AINormalisedListing[]> {
  const endpoint = process.env.HF_ENDPOINT_EXTRACT_QWEN3_4B
  const token = process.env.HF_TOKEN_SERVER
  if (!endpoint || !token) throw new Error('HF endpoint not configured')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: buildBatchPrompt(items),
      parameters: { max_new_tokens: 2048, return_full_text: false },
    }),
    signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`HF API ${response.status}`)
  }

  const data = (await response.json()) as Array<{ generated_text?: string }>
  const text = data[0]?.generated_text ?? '[]'
  const parsed = validateAndParse(text)
  return parsed.map((item) => toAINormalisedListing(item, false))
}

export async function normaliseWithAI(
  items: RawScrapedItem[],
  options: { batchSize?: number } = {},
): Promise<AINormalisedListing[]> {
  const { batchSize = 5 } = options
  const results: AINormalisedListing[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    let batchResults: AINormalisedListing[]

    try {
      batchResults = await normaliseWithClaude(batch)
    } catch (claudeErr) {
      console.warn('[normaliser-v2] Claude failed, trying Gemini:', claudeErr)
      try {
        batchResults = await normaliseWithGemini(batch)
      } catch (geminiErr) {
        console.warn('[normaliser-v2] Gemini failed, trying HF:', geminiErr)
        try {
          batchResults = await normaliseWithHF(batch)
        } catch (hfErr) {
          console.warn('[normaliser-v2] HF failed, passthrough:', hfErr)
          batchResults = rawPassthrough(batch, 'all_models_failed')
        }
      }
    }

    // Defensive guard (not a full fix): results are paired to the input batch
    // by array position, but nothing enforces that the model returned exactly
    // one output per input in the same order -- a merge, drop, or reorder by
    // the model would silently misattribute metadata downstream. A proper fix
    // means having the model echo back a per-item id/index and reconciling
    // explicitly; that's a larger change than this pass, so for now: if the
    // count doesn't match, don't trust the positional pairing at all.
    if (batchResults.length !== batch.length) {
      console.warn(
        `[normaliser-v2] batch size mismatch (sent ${batch.length}, got ${batchResults.length}) -- discarding AI output for this batch, using passthrough`,
      )
      batchResults = rawPassthrough(batch, 'batch_count_mismatch')
    }

    results.push(...batchResults)
  }

  return results
}

export async function normaliseWithFallback(
  items: RawScrapedItem[],
  reason: string,
): Promise<AINormalisedListing[]> {
  return rawPassthrough(items, reason)
}
