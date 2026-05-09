import type { UsedSurplusListing } from '@/lib/fixtures/types'

export type ScraperParserType = 'json-ld-product' | 'html-card' | 'manual-html'

export type ScraperSourceStatus = 'enabled' | 'disabled' | 'needs-review'

export interface ScraperSource {
  id: string
  name: string
  url: string
  category: 'used-surplus'
  parserType: ScraperParserType
  status: ScraperSourceStatus
  cadenceHours: number
  notes?: string
}

export interface ScrapedListingCandidate {
  sourceId: string
  sourceName: string
  sourceUrl: string
  title: string
  description: string
  price?: string
  currency?: string
  location?: string
  condition?: 'used' | 'refurbished' | 'surplus'
  imageUrl?: string
  tags: string[]
  discoveredAt: string
  confidence: number
}

export interface ScrapeResult {
  source: ScraperSource
  status: 'skipped' | 'fetched' | 'failed'
  reason?: string
  candidates: ScrapedListingCandidate[]
}

export type PublicUsedSurplusProjection = Omit<UsedSurplusListing, 'contactEmail'>
