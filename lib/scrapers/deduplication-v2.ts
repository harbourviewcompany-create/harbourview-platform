// lib/scrapers/deduplication-v2.ts
// SHA-256 fingerprinting + semantic near-duplicate detection.
// Replaces djb2 hash with collision-resistant crypto and adds Jaccard similarity.

import type { RawScrapedItem } from './types'

const SEMANTIC_THRESHOLD = 0.85
const SHINGLE_SIZE = 3

/** SHA-256 fingerprint for exact deduplication */
export async function generateFingerprint(item: RawScrapedItem): Promise<string> {
  const normalised = `${item.sourceId}::${item.rawTitle.toLowerCase().trim()}`
  const encoder = new TextEncoder()
  const data = encoder.encode(normalised)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${item.sourceId}_${hashHex.slice(0, 16)}`
}

/** Generate character shingles for similarity comparison */
function getShingles(text: string, k: number): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  const shingles = new Set<string>()
  for (let i = 0; i <= clean.length - k; i++) {
    shingles.add(clean.slice(i, i + k))
  }
  return shingles
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)))
  const union = new Set([...a, ...b])
  return intersection.size / union.size
}

/** Check if two items are near-duplicates using title similarity */
function isNearDuplicate(a: RawScrapedItem, b: RawScrapedItem): boolean {
  if (a.sourceId !== b.sourceId) return false
  const shinglesA = getShingles(a.rawTitle, SHINGLE_SIZE)
  const shinglesB = getShingles(b.rawTitle, SHINGLE_SIZE)
  const sim = jaccardSimilarity(shinglesA, shinglesB)
  return sim >= SEMANTIC_THRESHOLD
}

/**
 * Deduplicate items using SHA-256 exact match + Jaccard semantic similarity.
 * existingFingerprints is fetched per-source-batch, not the entire table.
 */
export async function deduplicateItemsV2(
  items: RawScrapedItem[],
  existingFingerprints: Set<string>,
): Promise<{ fresh: RawScrapedItem[]; duplicateCount: number }> {
  const fresh: RawScrapedItem[] = []
  let duplicateCount = 0

  for (const item of items) {
    const fp = await generateFingerprint(item)

    if (existingFingerprints.has(fp)) {
      duplicateCount++
      continue
    }

    // Check semantic similarity against items already accepted this run
    const isSemanticDup = fresh.some((f) => isNearDuplicate(f, item))
    if (isSemanticDup) {
      duplicateCount++
      continue
    }

    existingFingerprints.add(fp)
    fresh.push(item)
  }

  return { fresh, duplicateCount }
}
