// lib/scrapers/ingestor.ts
// Inserts normalised candidates into marketplace_candidates with status='needs_review'.
// Uses raw PostgREST fetch with service-role key — no @supabase/supabase-js dependency.

import 'server-only'
import type { RawScrapedItem, AINormalisedListing } from './types'
import { generateFingerprint } from './deduplication'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing for scraper ingestor')
  return { url, key }
}

function serviceHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

/** Fetch all existing fingerprints from the DB for deduplication. */
export async function fetchExistingFingerprints(): Promise<Set<string>> {
  const { url, key } = getSupabaseConfig()
  const res = await fetch(
    `${url}/rest/v1/marketplace_candidates?select=source_fingerprint&source_fingerprint=not.is.null`,
    { headers: serviceHeaders(key), cache: 'no-store' },
  )
  if (!res.ok) {
    console.warn('scraper_ingestor: failed to fetch fingerprints:', res.status)
    return new Set()
  }
  const data = (await res.json()) as { source_fingerprint: string }[]
  return new Set(data.map((r) => r.source_fingerprint))
}

export interface InsertResult {
  inserted: number
  errors: number
}

// ── Per-source scraper state ──────────────────────────────────────────────────

export interface SourceState {
  last_run_at: string | null
  last_success_at: string | null
  consecutive_failures: number
}

export async function fetchSourceStates(): Promise<Map<string, SourceState>> {
  const { url, key } = getSupabaseConfig()
  const res = await fetch(
    `${url}/rest/v1/scraper_source_state?select=source_id,last_run_at,last_success_at,consecutive_failures`,
    { headers: serviceHeaders(key), cache: 'no-store' },
  )
  if (!res.ok) {
    console.warn('scraper_ingestor: failed to fetch source states:', res.status)
    return new Map()
  }
  const rows = (await res.json()) as Array<{
    source_id: string
    last_run_at: string | null
    last_success_at: string | null
    consecutive_failures: number
  }>
  return new Map(rows.map((r) => [r.source_id, {
    last_run_at: r.last_run_at,
    last_success_at: r.last_success_at,
    consecutive_failures: r.consecutive_failures,
  }]))
}

/** Upsert per-source run state. prevFailures is the count already in the DB (from fetchSourceStates). */
export async function persistSourceState(
  sourceId: string,
  cadenceHours: number,
  success: boolean,
  prevFailures: number,
  error?: string,
): Promise<void> {
  const { url, key } = getSupabaseConfig()
  const now = new Date().toISOString()
  const record: Record<string, unknown> = {
    source_id: sourceId,
    cadence_hours: cadenceHours,
    last_run_at: now,
    consecutive_failures: success ? 0 : prevFailures + 1,
    last_error: success ? null : (error ?? null),
    updated_at: now,
  }
  if (success) record.last_success_at = now

  await fetch(`${url}/rest/v1/scraper_source_state?on_conflict=source_id`, {
    method: 'POST',
    headers: serviceHeaders(key, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(record),
  }).catch(() => {/* non-blocking — state persistence must not abort the run */})
}

export async function insertCandidates(
  pairs: Array<{ raw: RawScrapedItem; normalised: AINormalisedListing }>,
): Promise<InsertResult> {
  if (pairs.length === 0) return { inserted: 0, errors: 0 }

  const { url, key } = getSupabaseConfig()
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
      // A scraped candidate only ever reaches the human review queue once it has
      // the basics a reviewer needs to make a call on: a real price and a real
      // title. Before this, ~527 of 529 pending candidates had no price at all --
      // review work was actually enrichment work wearing a review-queue costume.
      // Anything short of that goes to 'captured' -- lib/marketplace/candidates.ts's
      // own CANDIDATE_STATUSES/ALLOWED_TRANSITIONS state machine already defines
      // this as the pre-review entry point (captured -> needs_review once ready),
      // so this reuses the existing status rather than inventing a new one that
      // the admin UI's transition logic wouldn't recognize.
      status: (normalised.priceAmount != null && normalised.title && normalised.title.trim().length >= 5)
        ? 'needs_review'
        : 'captured',
      discovered_at: raw.discoveredAt,
    }

    // PostgREST upsert: on_conflict= specifies the unique column; ignore-duplicates
    // means conflicting rows are silently skipped (equivalent to ignoreDuplicates: true).
    const res = await fetch(
      `${url}/rest/v1/marketplace_candidates?on_conflict=source_fingerprint`,
      {
        method: 'POST',
        headers: serviceHeaders(key, {
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        }),
        body: JSON.stringify(record),
      },
    )

    if (!res.ok) {
      const text = await res.text()
      console.warn(`scraper_ingestor: insert error for "${raw.rawTitle}":`, text)
      errors++
    } else {
      inserted++
    }
  }

  return { inserted, errors }
}
