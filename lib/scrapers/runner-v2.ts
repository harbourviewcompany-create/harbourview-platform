// lib/scrapers/runner-v2.ts
// Next-generation scrape engine. Batched AI, sharded execution, circuit breakers,
// structured logging, and model fallback chain.
//
// To shard: create 4 cron routes (scraper-partition-0..3) each calling
// runScrapeEngine({ partitionCount: 4, partitionIndex: N })

import { getEnabledSources } from './sources'
import { fetchSourceHtml } from './fetcher'
import { parseSource } from './parser'
import { normaliseWithAI, normaliseWithFallback } from './normaliser-v2'
import { deduplicateItemsV2 } from './deduplication-v2'
import { fetchExistingFingerprintsV2, insertCandidates, fetchSourceStates, persistSourceState } from './ingestor'
import { structuredLog, ScraperMetrics } from '@/lib/observability/structuredLog'
import type { ScrapeRunResult, ScrapeRunSummary, ScraperSource } from './types'

const MAX_ITEMS_PER_SOURCE = 10
const INTER_SOURCE_DELAY_MS = 800
const TIME_BUDGET_MS = 240_000
const SOURCE_TIMEOUT_MS = 15_000
const MAX_BACKOFF_MULTIPLIER = 32
const AI_BATCH_SIZE = 5
const CIRCUIT_BREAKER_THRESHOLD = 3

interface RunnerOptions {
  partitionCount?: number
  partitionIndex?: number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runId() {
  return `run_${Date.now().toString(36)}`
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash
}

export async function runScrapeEngine(options: RunnerOptions = {}): Promise<ScrapeRunSummary> {
  const { partitionCount = 1, partitionIndex = 0 } = options
  const runStart = Date.now()
  const startedAt = new Date().toISOString()
  const id = runId()

  // Shard sources by partition
  const allSources = getEnabledSources()
  const sources = allSources.filter((s) => hashString(s.id) % partitionCount === partitionIndex)

  structuredLog('scraper.run.start', {
    runId: id,
    partitionIndex,
    partitionCount,
    totalSources: allSources.length,
    shardSources: sources.length,
  })

  const [existingFingerprints, sourceStates] = await Promise.all([
    fetchExistingFingerprintsV2(sources.map((s) => s.id)),
    fetchSourceStates(),
  ])

  const sourceResults: ScrapeRunResult[] = []
  let totalInserted = 0
  let totalSkipped = 0
  let totalFailed = 0
  let budgetExceeded = false
  let aiCircuitOpen = false
  let consecutiveAiFailures = 0

  const metrics: ScraperMetrics = {
    runId: id,
    totalSources: sources.length,
    processed: 0,
    failed: 0,
    avgFetchLatencyMs: 0,
    avgNormaliseLatencyMs: 0,
    aiApiCalls: 0,
    aiTokensConsumed: 0,
    passthroughRate: 0,
    topErrors: [],
  }

  const errorCounts = new Map<string, number>()

  for (const source of sources) {
    if (Date.now() - runStart >= TIME_BUDGET_MS) {
      budgetExceeded = true
      break
    }

    const state = sourceStates.get(source.id)
    const prevFailures = state?.consecutive_failures ?? 0

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
    let fetchLatency = 0
    let normaliseLatency = 0

    try {
      // Fetch with retry
      const url = source.searchUrl ?? source.url
      const fetchResult = await withTimeout(
        fetchWithRetry(url, 3),
        SOURCE_TIMEOUT_MS,
        'fetchSourceHtml',
      )
      fetchLatency = Date.now() - t0

      if (!fetchResult.ok) {
        const error = fetchResult.error
        const isHardFailure = fetchResult.status && fetchResult.status < 500
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
        errorCounts.set(error, (errorCounts.get(error) ?? 0) + 1)
        await persistSourceState(source.id, source.cadenceHours, !isHardFailure, prevFailures, error)
        await sleep(INTER_SOURCE_DELAY_MS)
        continue
      }

      // Parse
      const rawItems = parseSource(fetchResult.html!, source).slice(0, MAX_ITEMS_PER_SOURCE)

      // Deduplicate (SHA-256 + semantic)
      const { fresh, duplicateCount } = deduplicateItemsV2(rawItems, existingFingerprints)

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

      // Normalise via AI (batched) with circuit breaker
      const normT0 = Date.now()
      let normalisedItems

      if (aiCircuitOpen) {
        normalisedItems = await normaliseWithFallback(fresh, 'circuit_breaker_open')
      } else {
        try {
          normalisedItems = await withTimeout(
            normaliseWithAI(fresh, { batchSize: AI_BATCH_SIZE }),
            SOURCE_TIMEOUT_MS,
            'normaliseWithAI',
          )
          consecutiveAiFailures = 0
          metrics.aiApiCalls += Math.ceil(fresh.length / AI_BATCH_SIZE)
        } catch (err) {
          consecutiveAiFailures++
          if (consecutiveAiFailures >= CIRCUIT_BREAKER_THRESHOLD) {
            aiCircuitOpen = true
            structuredLog('scraper.ai.circuit_open', { runId: id, consecutiveFailures: consecutiveAiFailures })
          }
          normalisedItems = await normaliseWithFallback(fresh, 'ai_failure')
        }
      }
      normaliseLatency = Date.now() - normT0

      // Pair and filter by confidence
      const pairs = fresh
        .slice(0, normalisedItems.length)
        .map((raw, i) => ({ raw, normalised: normalisedItems[i] }))
        .filter(({ normalised }) =>
          normalised.isPassthrough
            ? true
            : (normalised.confidence ?? 0) >= 0.4,
        )

      const passthroughCount = pairs.filter((p) => p.normalised.isPassthrough).length

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
      if (!runSuccess) {
        totalFailed++
        errorCounts.set('insert_error', (errorCounts.get('insert_error') ?? 0) + 1)
      }

      metrics.processed++
      metrics.avgFetchLatencyMs = (metrics.avgFetchLatencyMs * (metrics.processed - 1) + fetchLatency) / metrics.processed
      metrics.avgNormaliseLatencyMs = (metrics.avgNormaliseLatencyMs * (metrics.processed - 1) + normaliseLatency) / metrics.processed
      metrics.passthroughRate = (metrics.passthroughRate * (metrics.processed - 1) + passthroughCount / fresh.length) / metrics.processed

      await persistSourceState(
        source.id,
        source.cadenceHours,
        runSuccess,
        prevFailures,
        runSuccess ? undefined : `${errors} insert error(s)`,
      )
    } catch (err) {
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
      errorCounts.set(error, (errorCounts.get(error) ?? 0) + 1)
      await persistSourceState(source.id, source.cadenceHours, false, prevFailures, error)
    }

    await sleep(INTER_SOURCE_DELAY_MS)
  }

  metrics.failed = totalFailed
  metrics.topErrors = Array.from(errorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }))

  structuredLog('scraper.run.complete', { ...metrics, budgetExceeded })

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
    avgFetchLatencyMs: Math.round(metrics.avgFetchLatencyMs),
    avgNormaliseLatencyMs: Math.round(metrics.avgNormaliseLatencyMs),
    aiApiCalls: metrics.aiApiCalls,
    passthroughRate: Math.round(metrics.passthroughRate * 100) / 100,
    topErrors: metrics.topErrors,
  }
}

/** Fetch with exponential backoff retry for transient failures */
async function fetchWithRetry(url: string, maxRetries: number) {
  const { fetchSourceHtml } = await import('./fetcher')
  for (let i = 0; i <= maxRetries; i++) {
    const result = await fetchSourceHtml(url)
    if (result.ok) return result
    if (result.status && result.status >= 500 && i < maxRetries) {
      await sleep(1000 * Math.pow(3, i))
      continue
    }
    return result
  }
  return { ok: false, error: 'Max retries exceeded' }
}
