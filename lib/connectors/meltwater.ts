// lib/connectors/meltwater.ts
//
// Production-oriented Meltwater media-monitoring connector.
// Purpose: pull fresh regulatory / market / operator mentions and stage them
// into the canonical snapshot pipeline so intelligence-extract + quality
// promotion can process them like any other source.
//
// Canonical path this feeds:
//   source_registry (optional MELTWATER_SOURCE_ID)
//     → source_snapshots (processing_status='pending_extraction')
//     → trg_promote_snapshot / intelligence-extract
//     → signals → digests / personal briefings
//
// Safety:
//   - Returns empty array (no-op) when MELTWATER_API_KEY is unset.
//   - Content hashing for idempotent staging.
//   - Structured mapping into snapshot-compatible shape.

import 'server-only'
import crypto from 'crypto'

export interface MeltwaterMention {
  id: string
  title: string
  summary?: string
  url: string
  publishedAt: string
  sourceName?: string
  language?: string
  country?: string
  sentiment?: string
  raw: Record<string, unknown>
}

export interface MeltwaterFetchOptions {
  searchId: string
  since?: Date
  limit?: number
}

export interface MeltwaterClient {
  fetchNewMentions(opts: MeltwaterFetchOptions): Promise<MeltwaterMention[]>
}

/** Snapshot-compatible staging row (aligned with source_snapshots insert shape). */
export interface MeltwaterSnapshotRow {
  source_id: string
  captured_url: string
  captured_at: string
  captured_text: string
  raw_html_hash: string
  processing_status: 'pending_extraction'
  fetch_status: 'ok'
  changed: true
  error_message: null
  /** Extra metadata for downstream extract / admin review */
  metadata: {
    connector: 'meltwater'
    meltwater_id: string
    search_id: string
    title: string
    source_name: string | null
    language: string | null
    country_iso2: string | null
    sentiment: string | null
    published_at: string
  }
}

function getApiKey(): string | null {
  return process.env.MELTWATER_API_KEY?.trim() || null
}

export function contentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Build a stable, extract-friendly text body from a mention.
 * Prefer summary + title; fall back to title alone.
 */
export function mentionToCapturedText(m: MeltwaterMention): string {
  const parts = [
    m.title?.trim(),
    m.summary?.trim(),
    m.url ? `Source: ${m.url}` : null,
    m.sourceName ? `Outlet: ${m.sourceName}` : null,
    m.country ? `Country: ${m.country}` : null,
  ].filter(Boolean)
  return parts.join('\n\n')
}

/**
 * Map a mention into a source_snapshots-compatible row.
 * `sourceId` should be a real source_registry.id when available
 * (env MELTWATER_SOURCE_ID); otherwise a stable synthetic UUID can be used
 * by the caller for connector-only operation.
 */
export function mentionToSnapshotRow(
  m: MeltwaterMention,
  opts: { sourceId: string; searchId: string },
): MeltwaterSnapshotRow {
  const text = mentionToCapturedText(m)
  const hash = contentHash(text)

  return {
    source_id: opts.sourceId,
    captured_url: m.url || `meltwater://${m.id}`,
    captured_at: m.publishedAt || new Date().toISOString(),
    captured_text: text,
    raw_html_hash: hash,
    processing_status: 'pending_extraction',
    fetch_status: 'ok',
    changed: true,
    error_message: null,
    metadata: {
      connector: 'meltwater',
      meltwater_id: m.id,
      search_id: opts.searchId,
      title: m.title,
      source_name: m.sourceName ?? null,
      language: m.language ?? null,
      country_iso2: m.country ?? null,
      sentiment: m.sentiment ?? null,
      published_at: m.publishedAt,
    },
  }
}

/**
 * Create a Meltwater client. Returns a no-op client when the key is missing
 * so callers can always import and call without feature-flag checks.
 */
export function createMeltwaterClient(): MeltwaterClient {
  const apiKey = getApiKey()

  if (!apiKey) {
    return {
      async fetchNewMentions() {
        console.info('meltwater: MELTWATER_API_KEY not set — skipping fetch')
        return []
      },
    }
  }

  return {
    async fetchNewMentions(opts: MeltwaterFetchOptions): Promise<MeltwaterMention[]> {
      const limit = Math.min(opts.limit ?? 40, 100)
      const sinceIso = opts.since?.toISOString()

      // Production HTTP call against Meltwater Data / Export API.
      // Endpoint shape varies by product tier; adjust base path once credentials
      // and exact product (Explore / Data Streams / Export) are confirmed.
      // Docs: https://developer.meltwater.com
      try {
        const url = new URL('https://api.meltwater.com/v3/search/docs')
        url.searchParams.set('search_id', opts.searchId)
        url.searchParams.set('limit', String(limit))
        if (sinceIso) url.searchParams.set('published_after', sinceIso)

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            apikey: apiKey,
            Accept: 'application/json',
          },
          // Vercel serverless: keep timeouts tight
          signal: AbortSignal.timeout(25_000),
        })

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          console.error(
            `meltwater: fetch failed ${res.status} for search ${opts.searchId}: ${body.slice(0, 300)}`,
          )
          return []
        }

        const data = (await res.json()) as {
          documents?: Array<Record<string, unknown>>
          data?: Array<Record<string, unknown>>
        }

        const docs = data.documents ?? data.data ?? []
        return docs.map((doc): MeltwaterMention => {
          const id = String(doc.id ?? doc.document_id ?? crypto.randomUUID())
          return {
            id,
            title: String(doc.title ?? doc.headline ?? 'Untitled'),
            summary: doc.summary ? String(doc.summary) : doc.opening_text ? String(doc.opening_text) : undefined,
            url: String(doc.url ?? doc.link ?? ''),
            publishedAt: String(doc.published_date ?? doc.published_at ?? new Date().toISOString()),
            sourceName: doc.source_name ? String(doc.source_name) : doc.source ? String(doc.source) : undefined,
            language: doc.language ? String(doc.language) : undefined,
            country: doc.country_code ? String(doc.country_code) : doc.country ? String(doc.country) : undefined,
            sentiment: doc.sentiment ? String(doc.sentiment) : undefined,
            raw: doc,
          }
        })
      } catch (err) {
        console.error(
          'meltwater: unexpected fetch error',
          err instanceof Error ? err.message : err,
        )
        return []
      }
    },
  }
}
