// lib/scrapers/fetcher.ts
// Fetches HTML from a source URL with timeout, user-agent spoofing, and
// rate-limit backoff. Returns null on failure — callers decide how to handle.

const FETCH_TIMEOUT_MS = 12_000
const USER_AGENT =
  'Mozilla/5.0 (compatible; HarbourviewBot/1.0; +https://harbourview.co/bot)'

export interface FetchResult {
  ok: boolean
  html?: string
  status?: number
  error?: string
}

export async function fetchSourceHtml(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })

    clearTimeout(timer)

    if (!response.ok) {
      return { ok: false, status: response.status, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    return { ok: true, html, status: response.status }
  } catch (err) {
    clearTimeout(timer)
    const message = err instanceof Error ? err.message : 'unknown fetch error'
    return { ok: false, error: message }
  }
}
