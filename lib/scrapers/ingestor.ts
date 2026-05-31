// lib/scrapers/ingestor.ts
// Inserts normalised candidates into marketplace_candidates with status='needs_review'.
// Uses service-role Supabase client — never anon.

import { createClient } from '@/lib/server/supabaseRestClient'
import type { RawScrapedItem, AINormalisedListing } from './types'
import { generateFingerprint } from './deduplication'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing for scraper ingestor')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Fetch all existing fingerprints from the DB for deduplication. */
export async function fetchExistingFingerprints(): Promise<Set<string>> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from<Array<{ source_fingerprint: string }>>('marketplace_candidates')
    .select('source_fingerprint')
    .not('source_fingerprint', 'is', null)

  if (error) {
    console.warn('scraper_ingestor: failed to fetch fingerprints:', error.message)
    return new Set()
  }

  return new Set((data ?? []).map((r: { source_fingerprint: string }) => r.source_fingerprint))
}

export interface InsertResult {
  inserted: number
  errors: number
}

export async function insertCandidates(
  pairs: Array<{ raw: RawScrapedItem; normalised: AINormalisedListing }>,
): Promise<InsertResult> {
  if (pairs.length === 0) return { inserted: 0, errors: 0 }

  const supabase = getServiceClient()
  let inserted = 0
  let errors = 0

  for (const { raw, normalised } of pairs) {
    const fingerprint = generateFingerprint(raw)

    const record = {
      source_id: raw.sourceId,
      source_name: raw.sourceName,
      source_url: raw.sourceUrl,
      source_fingerprint: fingerprint,
      candidate_type: 'scraped',
      marketplace_category: normalised.category,
      title_internal: raw.rawTitle,
      title_public_draft: normalised.title,
      description_internal: raw.rawDescription,
      description_public_draft: normalised.description,
      product_type: normalised.productType,
      region: normalised.region,
      country: normalised.locationCountry ?? null,
      price_raw: raw.rawPrice ?? null,
      price_amount: normalised.priceAmount ?? null,
      price_currency: normalised.priceCurrency ?? null,
      condition: normalised.condition ?? raw.rawCondition ?? null,
      seller_type: normalised.sellerType,
      tags: normalised.tags,
      raw_payload: raw as unknown as Record<string, unknown>,
      ai_normalised: normalised as unknown as Record<string, unknown>,
      confidence: normalised.confidence,
      status: 'needs_review',
      discovered_at: raw.discoveredAt,
    }

    const { error } = await supabase
      .from('marketplace_candidates')
      .upsert(record, { onConflict: 'source_fingerprint', ignoreDuplicates: true })

    if (error) {
      console.warn(`scraper_ingestor: insert error for "${raw.rawTitle}":`, error.message)
      errors++
    } else {
      inserted++
    }
  }

  return { inserted, errors }
}
