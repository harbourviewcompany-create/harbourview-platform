// lib/connectors/meltwater.ts
//
// Skeleton for Meltwater media-monitoring connector.
// Purpose: automatically enrich the Harbourview signals pipeline with
// fresh regulatory, market, and operator news from Meltwater searches.
//
// Usage (once MELTWATER_API_KEY is set):
//   const client = createMeltwaterClient()
//   const docs = await client.fetchNewMentions({ searchId: '...', since: lastPull })
//   // map to source_documents / signal_candidates and hand off to existing
//   // intelligence-extract / quality pipeline.
//
// This is deliberately thin so it can be driven by a new cron or by the
// existing intelligence-ingest / regulatory-watch jobs.

import 'server-only'

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

function getApiKey(): string | null {
  return process.env.MELTWATER_API_KEY?.trim() || null
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
      // Placeholder for real Meltwater Data Streams / Export API call.
      // See https://developer.meltwater.com for current endpoints.
      const limit = opts.limit ?? 50
      console.info(`meltwater: would fetch up to ${limit} mentions for search ${opts.searchId}`)

      // TODO: implement real HTTP call once credentials + search IDs are provisioned.
      // Example outline:
      // const res = await fetch(`https://api.meltwater.com/v3/...`, {
      //   headers: { apikey: apiKey, Accept: 'application/json' },
      //   ...
      // })
      // const data = await res.json()
      // return data.documents.map(mapToMention)

      return []
    },
  }
}

/** Map a Meltwater mention into a minimal source-document shape for the existing pipeline. */
export function mentionToSourceDocument(m: MeltwaterMention) {
  return {
    external_id: `meltwater:${m.id}`,
    title: m.title,
    summary: m.summary ?? null,
    url: m.url,
    published_at: m.publishedAt,
    source_name: m.sourceName ?? 'Meltwater',
    language: m.language ?? null,
    country_iso2: m.country ?? null,
    raw_payload: m.raw,
    connector: 'meltwater',
  }
}
