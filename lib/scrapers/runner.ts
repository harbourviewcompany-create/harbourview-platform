// lib/scrapers/runner.ts
// Orchestrates a full scrape run: fetch → parse → deduplicate → normalise → ingest.
// Called by the Vercel Cron route. Returns a ScrapeRunSummary for digest emails.

import { getEnabledSources } from './sources'
import { fetchSourceHtml } from './fetcher'
import { parseSource } from './parser'
import { normaliseWithAI } from './normaliser'
import { deduplicateItems } from './deduplication'
import { fetchExistingFingerprints, insertCandidates } from './ingestor'
import type { ScrapeRunResult, ScrapeRunSummary } from './types'

const MAX_ITEMS_PER_SOURCE = 10 // throttle AI calls per run
const INTER_SOURCE_DELAY_MS = 800 // polite delay between site fetches

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runId() {
  return `run_${Date.now().toString(36)}`
}

export async function runScrapeEngine(): Promise<ScrapeRunSummary> {
  const startedAt = new Date().toISOString()
  const id = runId()

  const sources = getEnabledSources()
  const existingFingerprints = await fetchExistingFingerprints()

  const sourceResults: ScrapeRunResult[] = []
  let totalInserted = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const source of sources) {
    const t0 = Date.now()

    // Fetch
    const url = source.searchUrl ?? source.url
    const fetchResult = await fetchSourceHtml(url)

    if (!fetchResult.ok) {
      sourceResults.push({
        source,
        status: fetchResult.status === 429 ? 'rate_limited' : 'failed',
        candidatesFound: 0,
        candidatesInserted: 0,
        candidatesSkipped: 0,
        durationMs: Date.now() - t0,
        error: fetchResult.error,
      })
      totalFailed++
      await sleep(INTER_SOURCE_DELAY_MS)
      continue
    }

    // Parse — dispatches to rss-feed, html-table, or html-card parser
    const rawItems = parseSource(fetchResult.html!, source).slice(0, MAX_ITEMS_PER_SOURCE)

    // Deduplicate
    const { fresh, duplicateCount } = deduplicateItems(rawItems, existingFingerprints)

    if (fresh.length === 0) {
      sourceResults.push({
        source,
        status: 'ok',
        candidatesFound: rawItems.length,
        candidatesInserted: 0,
        candidatesSkipped: duplicateCount,
        durationMs: Date.now() - t0,
      })
      await sleep(INTER_SOURCE_DELAY_MS)
      continue
    }

    // Normalise via AI (with automatic passthrough fallback if key is missing/invalid)
    const normalisedItems = await normaliseWithAI(fresh)

    // Pair raw + normalised, filter low-confidence
    const pairs = fresh
      .slice(0, normalisedItems.length)
      .map((raw, i) => ({ raw, normalised: normalisedItems[i] }))
      .filter(({ normalised }) => normalised.confidence >= 0.25) // 0.25 catches passthrough items too

    // Ingest
    const { inserted, errors } = await insertCandidates(pairs)

    sourceResults.push({
      source,
      status: errors > 0 && inserted === 0 ? 'failed' : 'ok',
      candidatesFound: rawItems.length,
      candidatesInserted: inserted,
      candidatesSkipped: duplicateCount + (fresh.length - pairs.length),
      durationMs: Date.now() - t0,
      error: errors > 0 ? `${errors} insert error(s)` : undefined,
    })

    totalInserted += inserted
    totalSkipped += duplicateCount
    if (errors > 0) totalFailed++

    await sleep(INTER_SOURCE_DELAY_MS)
  }

  return {
    runId: id,
    startedAt,
    completedAt: new Date().toISOString(),
    totalCandidates: sourceResults.reduce((n, r) => n + r.candidatesFound, 0),
    totalInserted,
    totalSkipped,
    totalFailed,
    sourceResults,
  }
}
