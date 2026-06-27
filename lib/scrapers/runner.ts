// lib/scrapers/runner.ts
// Orchestrates a full scrape run: fetch → parse → deduplicate → normalise → ingest.
// Called by the Vercel Cron route. Returns a ScrapeRunSummary for digest emails.
//
// Cadence-aware: each source is skipped if last_success_at + cadenceHours > now().
// State-persistent: last_run_at, consecutive_failures, last_error are written to
// scraper_source_state after every source so cadence is respected across cron ticks.

import { getEnabledSources } from './sources'
import { fetchSourceHtml } from './fetcher'
import { parseSource } from './parser'
import { normaliseWithAI } from './normaliser'
import { deduplicateItems } from './deduplication'
import { fetchExistingFingerprints, insertCandidates, fetchSourceStates, persistSourceState } from './ingestor'
import type { ScrapeRunResult, ScrapeRunSummary } from './types'

const MAX_ITEMS_PER_SOURCE = 10 // throttle AI calls per run
const INTER_SOURCE_DELAY_MS = 800 // polite delay between site fetches

// Exponential backoff cap: after 5 consecutive failures a source is retried
// only after 32× its normal cadence (e.g. a 24h source backs off to ~32 days).
const MAX_BACKOFF_MULTIPLIER = 32

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runId() {
  return `run_${Date.now().toString(36)}`
}

function isPassthrough(normalised: { isPassthrough?: boolean; redactionNote?: string }): boolean {
  return normalised.isPassthrough === true
}

export async function runScrapeEngine(): Promise<ScrapeRunSummary> {
  const startedAt = new Date().toISOString()
  const id = runId()

  const sources = getEnabledSources()
  const [existingFingerprints, sourceStates] = await Promise.all([
    fetchExistingFingerprints(),
    fetchSourceStates(),
  ])

  const sourceResults: ScrapeRunResult[] = []
  let totalInserted = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const source of sources) {
    const state = sourceStates.get(source.id)
    const prevFailures = state?.consecutive_failures ?? 0

    // Cadence check: skip if the source isn't due yet.
    // Anchor: use last_success_at when available; fall back to last_run_at so
    // sources with consecutive failures still back off instead of running every tick.
    const cadenceAnchor = state?.last_success_at ?? state?.last_run_at ?? null
    if (cadenceAnchor) {
      const backoffMultiplier = prevFailures > 0
        ? Math.min(Math.pow(2, prevFailures), MAX_BACKOFF_MULTIPLIER)
        : 1
      const effectiveCadenceMs = source.cadenceHours * backoffMultiplier * 3_600_000
      const nextDue = new Date(cadenceAnchor).getTime() + effectiveCadenceMs
      if (Date.now() < nextDue) {
        sourceResults.push({
          source,
          status: 'due_later',
          candidatesFound: 0,
          candidatesInserted: 0,
          candidatesSkipped: 0,
          durationMs: 0,
        })
        continue
      }
    }

    const t0 = Date.now()

    // Fetch
    const url = source.searchUrl ?? source.url
    const fetchResult = await fetchSourceHtml(url)

    if (!fetchResult.ok) {
      const error = fetchResult.error
      sourceResults.push({
        source,
        status: fetchResult.status === 429 ? 'rate_limited' : 'failed',
        candidatesFound: 0,
        candidatesInserted: 0,
        candidatesSkipped: 0,
        durationMs: Date.now() - t0,
        error,
      })
      totalFailed++
      await persistSourceState(source.id, source.cadenceHours, false, prevFailures, error)
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
      await persistSourceState(source.id, source.cadenceHours, true, prevFailures)
      await sleep(INTER_SOURCE_DELAY_MS)
      continue
    }

    // Normalise via AI (with automatic passthrough fallback if key is missing/invalid)
    const normalisedItems = await normaliseWithAI(fresh)

    // Pair raw + normalised, then apply confidence filtering:
    // - Passthrough items (AI unavailable): always keep — they land as needs_review
    // - Genuine AI results: require confidence >= 0.4 to filter out weak extractions
    const pairs = fresh
      .slice(0, normalisedItems.length)
      .map((raw, i) => ({ raw, normalised: normalisedItems[i] }))
      .filter(({ normalised }) =>
        isPassthrough(normalised)
          ? true
          : normalised.confidence >= 0.4,
      )

    // Ingest
    const { inserted, errors } = await insertCandidates(pairs)
    const runSuccess = !(errors > 0 && inserted === 0)

    sourceResults.push({
      source,
      status: runSuccess ? 'ok' : 'failed',
      candidatesFound: rawItems.length,
      candidatesInserted: inserted,
      candidatesSkipped: duplicateCount + (fresh.length - pairs.length),
      durationMs: Date.now() - t0,
      error: errors > 0 ? `${errors} insert error(s)` : undefined,
    })

    totalInserted += inserted
    totalSkipped += duplicateCount
    if (!runSuccess) totalFailed++

    await persistSourceState(
      source.id,
      source.cadenceHours,
      runSuccess,
      prevFailures,
      runSuccess ? undefined : `${errors} insert error(s)`,
    )

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
