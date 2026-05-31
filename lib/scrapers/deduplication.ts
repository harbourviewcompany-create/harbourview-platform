// lib/scrapers/deduplication.ts
// Fingerprinting and deduplication for scraped candidates.

import type { RawScrapedItem } from './types'

/**
 * Generate a stable fingerprint for a raw scraped item.
 * Uses a combination of source ID + normalised title to catch duplicates
 * even when URLs differ between scrape runs.
 */
export function generateFingerprint(item: RawScrapedItem): string {
  const normalised = `${item.sourceId}::${item.rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80)}`
  // Simple djb2 hash — no crypto needed, just stable string identity
  let hash = 5381
  for (let i = 0; i < normalised.length; i++) {
    hash = ((hash << 5) + hash) ^ normalised.charCodeAt(i)
    hash = hash >>> 0 // keep 32-bit unsigned
  }
  return `${item.sourceId}_${hash.toString(16).padStart(8, '0')}`
}

/**
 * Filter out items whose fingerprints already exist in the DB.
 * existingFingerprints is fetched once per cron run.
 */
export function deduplicateItems(
  items: RawScrapedItem[],
  existingFingerprints: Set<string>,
): { fresh: RawScrapedItem[]; duplicateCount: number } {
  const fresh: RawScrapedItem[] = []
  let duplicateCount = 0

  for (const item of items) {
    const fp = generateFingerprint(item)
    if (existingFingerprints.has(fp)) {
      duplicateCount++
    } else {
      existingFingerprints.add(fp) // prevent dupes within the same run
      fresh.push(item)
    }
  }

  return { fresh, duplicateCount }
}
