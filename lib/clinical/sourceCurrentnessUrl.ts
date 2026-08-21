/**
 * Clinical source-currentness — URL fetch with conditional GET (Phase B)
 */

import { errorMessage } from './errorMessage'

const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 2_000_000

function userAgent(): string {
  return process.env.CROSSREF_MAILTO
    ? `HarbourviewClinicalSourceCheck/1.1 (mailto:${process.env.CROSSREF_MAILTO})`
    : 'HarbourviewClinicalSourceCheck/1.1 (clinical evidence provenance; +https://harbourview.vercel.app)'
}

export interface UrlCheckResult {
  ok: boolean
  statusCode: number | null
  finalUrl: string
  redirected: boolean
  body: Buffer | null
  contentType: string | null
  etag?: string | null
  lastModified?: string | null
  notModified?: boolean
  error?: string
}

export async function checkUrl(
  url: string,
  conditional?: { etag?: string | null; lastModified?: string | null }
): Promise<UrlCheckResult> {
  let current = url
  let redirects = 0
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    while (redirects <= MAX_REDIRECTS) {
      const headers: Record<string, string> = {
        'User-Agent': userAgent(),
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
      }
      if (conditional?.etag) headers['If-None-Match'] = conditional.etag
      if (conditional?.lastModified) headers['If-Modified-Since'] = conditional.lastModified
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers,
      })
      if (res.status === 304) {
        return {
          ok: true,
          statusCode: 304,
          finalUrl: current,
          redirected: redirects > 0,
          body: null,
          contentType: res.headers.get('content-type'),
          etag: res.headers.get('etag'),
          lastModified: res.headers.get('last-modified'),
          notModified: true,
        }
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) {
          return {
            ok: false,
            statusCode: res.status,
            finalUrl: current,
            redirected: redirects > 0,
            body: null,
            contentType: null,
            error: 'Redirect without Location',
          }
        }
        current = new URL(loc, current).toString()
        redirects++
        continue
      }
      if (res.status < 200 || res.status >= 400) {
        return {
          ok: false,
          statusCode: res.status,
          finalUrl: current,
          redirected: redirects > 0,
          body: null,
          contentType: res.headers.get('content-type'),
          error: `HTTP ${res.status}`,
        }
      }
      let body = Buffer.from(await res.arrayBuffer())
      if (body.length > MAX_BODY_BYTES) body = body.subarray(0, MAX_BODY_BYTES)
      return {
        ok: true,
        statusCode: res.status,
        finalUrl: current,
        redirected: redirects > 0,
        body,
        contentType: res.headers.get('content-type'),
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      }
    }
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: true,
      body: null,
      contentType: null,
      error: 'Too many redirects',
    }
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: redirects > 0,
      body: null,
      contentType: null,
      error: err instanceof Error && err.name === 'AbortError' ? 'Timeout' : errorMessage(err),
    }
  } finally {
    clearTimeout(timer)
  }
}
