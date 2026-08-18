/**
 * Clinical Evidence — source-metadata currentness orchestrator (Phase B)
 * Pure helpers: ./sourceCurrentnessHelpers
 * Source-metadata only. Never publishes clinical-synthesis or bypasses D4.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type EvidenceRow,
  type FreshnessStatus,
  type RunOptions,
  type RunSummary,
  decideFreshness,
  extractDoi,
  extractPmid,
  getServiceSupabase,
  normalizeHtmlForHash,
  sha256Hex,
  titlesLikelyMatch,
} from './sourceCurrentnessHelpers'

export type { EvidenceRow, FreshnessStatus, RunOptions, RunSummary }
export {
  decideFreshness,
  extractDoi,
  extractPmid,
  getServiceSupabase,
  normalizeHtmlForHash,
  sha256Hex,
  titlesLikelyMatch,
}

const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 2_000_000
const LOCK_KEY = 'clinical_source_currentness'
const LOCK_TTL_MS = 15 * 60 * 1000
const DEFAULT_CONCURRENCY = 3
const PER_RECORD_DELAY_MS = 250
const STATUS_PRIORITY: Record<FreshnessStatus, number> = {
  'review-required': 0,
  'source-degraded': 1,
  stale: 2,
  current: 3,
}

function userAgent(): string {
  return process.env.CROSSREF_MAILTO
    ? `HarbourviewClinicalSourceCheck/1.1 (mailto:${process.env.CROSSREF_MAILTO})`
    : 'HarbourviewClinicalSourceCheck/1.1 (clinical evidence provenance; +https://harbourview.vercel.app)'
}

interface UrlCheckResult {
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

async function checkUrl(
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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
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
  } catch (err: any) {
    return {
      ok: false,
      statusCode: null,
      finalUrl: current,
      redirected: redirects > 0,
      body: null,
      contentType: null,
      error: err?.name === 'AbortError' ? 'Timeout' : String(err?.message || err),
    }
  } finally {
    clearTimeout(timer)
  }
}

type IdResult = {
  valid: boolean | null
  title?: string
  publisher?: string
  retracted?: boolean
  notes?: string
}

async function resolveDoi(doi: string): Promise<IdResult> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) return { valid: false, notes: 'DOI not found in Crossref' }
    if (!res.ok) return { valid: null, notes: `Crossref HTTP ${res.status}` }
    const msg = ((await res.json()) as any)?.message
    if (!msg) return { valid: null, notes: 'Empty Crossref message' }
    const title = Array.isArray(msg.title) ? msg.title[0] : msg.title
    const updateTo = msg['update-to'] as Array<{ type?: string }> | undefined
    const retracted =
      Array.isArray(updateTo) &&
      updateTo.some((u) => /retract|withdraw|expression.of.concern/i.test(String(u.type || '')))
    return {
      valid: true,
      title,
      publisher: msg.publisher,
      retracted: Boolean(retracted),
      notes: retracted ? 'Crossref signals update/retraction-related status' : undefined,
    }
  } catch (err: any) {
    return { valid: null, notes: `Crossref error: ${err?.message || err}` }
  }
}
