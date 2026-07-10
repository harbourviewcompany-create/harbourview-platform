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

// Vercel Pro caps this route's execution at maxDuration = 300s. With 300+ enabled
// sources, the inter-source delay alone (301 * 800ms ≈ 241s) leaves no headroom for
// fetch/parse/AI work, so the function gets hard-killed mid-run before it can
// persist a response. Stop pulling new sources once we're within this budget so the
// run always returns a normal (partial) summary; per-source cadence state already
// persisted this tick means skipped sources are simply picked up on the next run.
const TIME_BUDGET_MS = 240_000

// Hard ceiling on a single source's fetch+AI work. Without this, one slow site or
// slow AI response can blow straight through the remaining budget on its own —
// the loop-level budget check only guards against starting a *new* source, it does
// nothing to bound one already in flight.
const SOURCE_TIMEOUT_MS = 15_000

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

// Races a promise against a hard deadline so one slow call can never consume more
// than SOURCE_TIMEOUT_MS of run budget. Does not cancel the underlying call — it
// simply stops waiting on it, which is sufficient here since the caller only cares
// about bounding wall time, not the leaked in-flight request.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

export async function runScrapeEngine(): Promise<ScrapeRunSummary> {
  const runStart = Date.now()
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
  let budgetExceeded = false

  for (const source of sources) {
    if (Date.now() - runStart >= TIME_BUDGET_MS) {
      budgetExceeded = true
      break
    }

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

    try {
      // Fetch — bounded so a hung/slow site can't consume the run's remaining budget.
      const url = source.searchUrl ?? source.url
      const fetchResult = await withTimeout(fetchSourceHtml(url), SOURCE_TIMEOUT_MS, 'fetchSourceHtml')

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
      // — also bounded, for the same reason as the fetch above.
      const normalisedItems = await withTimeout(normaliseWithAI(fresh), SOURCE_TIMEOUT_MS, 'normaliseWithAI')

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
    } catch (err) {
      // Any failure in fetch/parse/AI/ingest for this source — including a
      // withTimeout rejection — is contained here. Without this catch, one bad
      // source throws out of the loop entirely and the whole run 500s, discarding
      // every source already processed this tick.
      const error = err instanceof Error ? err.message : String(err)
      sourceResults.push({
        source,
        status: 'failed',
        candidatesFound: 0,
        candidatesInserted: 0,
        candidatesSkipped: 0,
        durationMs: Date.now() - t0,
        error,
      })
      totalFailed++
      await persistSourceState(source.id, source.cadenceHours, false, prevFailures, error)
    }

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
    budgetExceeded,
  }
}
