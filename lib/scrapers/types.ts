// lib/scrapers/types.ts
// Unified type system for the Harbourview scraper ingestion engine.
// Covers all marketplace categories — not just used-surplus.

export type ScraperParserType = 'json-ld-product' | 'html-card' | 'html-table' | 'json-api' | 'rss-feed' | 'manual-html'

export type ScraperSourceStatus = 'enabled' | 'disabled' | 'needs-review'

export type ScraperCategory =
  | 'used_surplus'
  | 'processing_equipment'
  | 'cultivation_equipment'
  | 'packaging'
  | 'consumables'
  | 'labs_testing'
  | 'logistics'
  | 'professional_services'
  | 'genetics'
  | 'cannabis_inventory'
  | 'new_products'
  | 'services'
  | 'business_opportunities'
  | 'export_ready'
  | 'import_demand'
  | 'distressed_inventory'
  | 'distressed_businesses'
  // Intelligence & data categories (global cannabis market monitoring)
  | 'regulatory'
  | 'market_data'
  | 'policy'
  | 'financial'
  | 'science'
  | 'compliance'
  | 'product'

export interface ScraperSource {
  id: string
  name: string
  url: string
  searchUrl?: string          // URL to fetch for listings (may differ from homepage)
  category: ScraperCategory
  parserType: ScraperParserType
  status: ScraperSourceStatus
  cadenceHours: number
  region: string
  notes?: string
  /** When true, prefer Playwright after a minimal/failed fast fetch */
  jsRendered?: boolean
  selectors?: {               // CSS selectors for html-card parsers
    container?: string
    title?: string
    description?: string
    price?: string
    location?: string
    link?: string
  }
}

export interface RawScrapedItem {
  sourceId: string
  sourceName: string
  sourceUrl: string           // URL of the specific listing page (private — never public)
  rawTitle: string
  rawDescription: string
  rawPrice?: string
  rawLocation?: string
  rawCondition?: string
  rawHtml?: string            // trimmed HTML snippet for AI normalisation
  discoveredAt: string
}

export interface AINormalisedListing {
  title: string               // public-safe title
  description: string         // public-safe description (no source/seller identity)
  category: ScraperCategory
  productType: string
  region: string              // 'north_america' | 'europe' | etc
  locationCountry?: string
  priceAmount?: number
  priceCurrency?: string
  condition?: string
  sellerType: string          // 'other' | 'wholesaler' | 'distributor' etc
  tags: string[]
  confidence: number          // 0-1
  publicSafe: boolean         // AI judgement: is this safe to show without editing?
  redactionNote?: string      // if publicSafe=false, why
  isPassthrough?: boolean     // true when AI was unavailable and item was inserted as-is
}

export interface ScrapedCandidate {
  sourceId: string
  sourceName: string
  sourceUrl: string
  sourceFingerprint: string   // sha256 of sourceUrl — deduplication key
  raw: RawScrapedItem
  normalised: AINormalisedListing
  discoveredAt: string
}

export interface ScrapeRunResult {
  source: ScraperSource
  status: 'ok' | 'skipped' | 'due_later' | 'failed' | 'rate_limited'
  candidatesFound: number
  candidatesInserted: number
  candidatesSkipped: number   // deduplication hits
  durationMs: number
  error?: string
}

export interface ScrapeRunSummary {
  runId: string
  startedAt: string
  completedAt: string
  totalCandidates: number
  totalInserted: number
  totalSkipped: number
  totalFailed: number
  sourceResults: ScrapeRunResult[]
  budgetExceeded?: boolean // true if the run stopped early to stay under the route's maxDuration
  // Observability (runner-v2)
  avgFetchLatencyMs?: number
  avgNormaliseLatencyMs?: number
  aiApiCalls?: number
  passthroughRate?: number
  topErrors?: Array<{ error: string; count: number }>
}
