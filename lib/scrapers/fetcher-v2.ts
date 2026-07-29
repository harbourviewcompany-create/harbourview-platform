// lib/scrapers/fetcher-v2.ts
// Enhanced fetcher with Playwright fallback for JS-rendered sites.
// Primary: fast fetch() → Fallback: Playwright for SPA/content-heavy pages.

import { fetchSourceHtml } from './fetcher'
import { fetchWithPlaywright } from '@/lib/intelligence-engine/adapters/playwright-fetcher'
import type { ScraperSource } from './types'
import { structuredLog } from '@/lib/observability/structuredLog'

const PLAYWRIGHT_CACHE_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

interface FetchResult {
  ok: boolean
  html?: string
  status?: number
  error?: string
  usedPlaywright: boolean
}

/** Check if we have a recent cached Playwright result */
async function getCachedPlaywright(url: string): Promise<string | null> {
  // Simple in-memory cache; replace with Redis/Upstash for multi-instance
  // For now, always fetch fresh — caching layer to be added in v2.1
  return null
}

/** Enhanced fetch with Playwright fallback for JS-rendered sources */
export async function fetchSourceHtmlV2(
  source: ScraperSource,
  options: { usePlaywright?: boolean } = {},
): Promise<FetchResult> {
  const url = source.searchUrl ?? source.url

  // Step 1: Always try fast fetch first
  const fastResult = await fetchSourceHtml(url)
  if (fastResult.ok && fastResult.html && fastResult.html.length > 500) {
    return { ok: true, html: fastResult.html, status: fastResult.status, usedPlaywright: false }
  }

  // Step 2: If source is tagged JS-rendered or fast fetch returned minimal content, use Playwright
  const shouldUsePlaywright =
    options.usePlaywright ||
    source.jsRendered ||
    (fastResult.ok && (!fastResult.html || fastResult.html.length < 500))

  if (!shouldUsePlaywright) {
    return {
      ok: fastResult.ok,
      html: fastResult.html,
      status: fastResult.status,
      error: fastResult.error,
      usedPlaywright: false,
    }
  }

  structuredLog('fetcher.playwright.fallback', {
    sourceId: source.id,
    url,
    reason: fastResult.ok ? 'minimal_content' : 'fetch_failed',
  })

  try {
    const cached = await getCachedPlaywright(url)
    if (cached) {
      structuredLog('fetcher.playwright.cache_hit', { sourceId: source.id, url })
      return { ok: true, html: cached, usedPlaywright: true }
    }

    const playwrightHtml = await fetchWithPlaywright(url, {
      waitForSelector: source.selectors?.container ?? 'body',
      timeout: 20000,
    })

    if (playwrightHtml && playwrightHtml.length > 500) {
      return { ok: true, html: playwrightHtml, usedPlaywright: true }
    }

    return {
      ok: false,
      error: 'Playwright returned empty or minimal content',
      usedPlaywright: true,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    structuredLog('fetcher.playwright.error', { sourceId: source.id, url, error })
    return {
      ok: false,
      error: `Playwright fallback failed: ${error}`,
      usedPlaywright: true,
    }
  }
}
