// lib/scrapers/fetcher-v2.ts
// Enhanced fetcher with optional Playwright-style fallback for JS-rendered sites.
// Primary: fast fetch() → optional heavy fetch when jsRendered / minimal content.

import { fetchSourceHtml } from './fetcher'
import type { ScraperSource } from './types'
import { structuredLog } from '@/lib/observability/structuredLog'

interface FetchResult {
  ok: boolean
  html?: string
  status?: number
  error?: string
  usedPlaywright: boolean
}

/**
 * Heavy-render fallback. Playwright adapter is not always present in this repo;
 * keep a safe stub so the rest of the pipeline typechecks and degrades cleanly.
 */
async function fetchHeavyRender(url: string, waitForSelector: string): Promise<string | null> {
  void waitForSelector
  try {
    // Prefer a dynamic import if the adapter lands later without breaking typecheck.
    const mod = await import('@/lib/intelligence-engine/adapters/playwright-fetcher').catch(
      () => null,
    )
    const fn =
      mod &&
      'fetchWithPlaywright' in mod &&
      typeof (mod as { fetchWithPlaywright?: unknown }).fetchWithPlaywright === 'function'
        ? (mod as { fetchWithPlaywright: (u: string, o?: { waitForSelector?: string; timeout?: number }) => Promise<string> })
            .fetchWithPlaywright
        : null
    if (!fn) return null
    return await fn(url, { waitForSelector, timeout: 20000 })
  } catch {
    return null
  }
}

/** Enhanced fetch with optional heavy-render fallback for JS-rendered sources */
export async function fetchSourceHtmlV2(
  source: ScraperSource,
  options: { usePlaywright?: boolean } = {},
): Promise<FetchResult> {
  const url = source.searchUrl ?? source.url

  const fastResult = await fetchSourceHtml(url)
  if (fastResult.ok && fastResult.html && fastResult.html.length > 500) {
    return {
      ok: true,
      html: fastResult.html,
      status: fastResult.status,
      usedPlaywright: false,
    }
  }

  const shouldUsePlaywright =
    options.usePlaywright ||
    !!source.jsRendered ||
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
    const playwrightHtml = await fetchHeavyRender(
      url,
      source.selectors?.container ?? 'body',
    )

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
