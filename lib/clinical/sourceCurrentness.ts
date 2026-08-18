/**
 * Clinical Evidence — source-metadata currentness (Phase B)
 *
 * Source-metadata only. Never publishes clinical-synthesis or invents claims.
 * D4 / credential-bound clinical reviewer remains the only path for synthesis.
 *
 * Phase B additions vs A:
 * - OpenAlex metadata + retraction-aware secondary signal
 * - PubMed publication-type / retraction flag via NCBI
 * - Priority ordering (review-required / source-degraded / stale first)
 * - Conditional GET with ETag / Last-Modified when prior snapshot has them
 * - Internet Archive availability probe on source-degraded
 * - Bounded concurrency
 * - Richer run summary (duration, archiveHits, notModified)
 */

import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type FreshnessStatus = 'current' | 'stale' | 'review-required' | 'source-degraded'

export interface EvidenceRow {
  id: string
  slug: string
  primary_source_url: string
  primary_source_title: string | null
  primary_source_publisher: string | null
  primary_source_id: string | null
  review_status: string
  freshness_status: FreshnessStatus
  source_registry_id: string | null
  source_currentness_checked_at?: string | null
}

export interface RunOptions {
  limit?: number
  dryRun?: boolean
  concurrency?: number
  supabase?: SupabaseClient
  /** Prefer rows already in non-current states */
  priorityFirst?: boolean
}

export interface RunSummary {
  ok: boolean
  total: number
  current: number
  stale: number
  'review-required': number
  'source-degraded': number
  notModified?: number
  archiveHits?: number
  durationMs?: number
  skippedLock?: boolean
  error?: string
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

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function extractDoi(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m = c.match(/10\.\d{4,9}\/[^\s"'<>]+/i)
    if (m) return m[0].replace(/[.,;)]+$/, '')
  }
  return null
}

export function extractPmid(primarySourceId: string | null, url: string): string | null {
  const candidates = [primarySourceId, url].filter(Boolean) as string[]
  for (const c of candidates) {
    const m =
      c.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|pmid[=:\s]?)(\d{5,9})/i) ||
      c.match(/^pmid[:\s]?(\d{5,9})$/i)
    if (m) return m[1]
  }
  return null
}

/** Strip scripts/styles/comments and collapse whitespace for stable hashing. */
export function normalizeHtmlForHash(html: string): string {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  const mainMatch =
    s.match(/<main[\s\S]*?<\/main>/i) ||
    s.match(/<article[\s\S]*?<\/article>/i) ||
    s.match(/<div[^>]+role=["']main["'][\s\S]*?<\/div>/i)
  if (mainMatch) s = mainMatch[0]
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/&[a-z]+;/gi, ' ')
  s = s.replace(/\s+/g, ' ').trim().toLowerCase()
  return s
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

export function titlesLikelyMatch(
  stored: string | null | undefined,
  remote: string | null | undefined
): boolean {
  if (!stored || !remote) return true
  const norm = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const a = norm(stored)
  const b = norm(remote)
  if (!a || !b) return true
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  const ta = new Set(a.split(' ').filter((w) => w.length > 2))
  const tb = new Set(b.split(' ').filter((w) => w.length > 2))
  if (ta.size === 0 || tb.size === 0) return true
  let inter = 0
  for (const w of ta) if (tb.has(w)) inter++
  const union = ta.size + tb.size - inter
  return inter / union >= 0.45
}

export function decideFreshness(input: {
  urlOk: boolean
  urlError?: string
  firstCheck: boolean
  hashChanged: boolean
  notModified?: boolean
  retracted: boolean
  titleMismatch: boolean
  idNotes: string[]
  archiveAvailable?: boolean
}): { status: FreshnessStatus; reason: string } {
  if (input.retracted) {
    return {
      status: 'review-required',
      reason: input.idNotes.join('; ') || 'Retraction signal on primary identifier',
    }
  }
  if (!input.urlOk) {
    const archiveNote = input.archiveAvailable
      ? 'Internet Archive has a capture (source may be temporarily offline)'
      : undefined
    return {
      status: 'source-degraded',
      reason: [input.urlError || 'URL unreachable', archiveNote, ...input.idNotes]
        .filter(Boolean)
        .join('; '),
    }
  }
  if (input.titleMismatch) {
    return {
      status: 'review-required',
      reason: ['Stored title does not match identifier registry metadata', ...input.idNotes]
        .filter(Boolean)
        .join('; '),
    }
  }
  if (input.notModified) {
    return {
      status: 'current',
      reason: ['HTTP 304 Not Modified; prior snapshot still valid', ...input.idNotes]
        .filter(Boolean)
        .join('. '),
    }
  }
  if (input.firstCheck) {
    return {
      status: 'current',
      reason: ['First currentness check; snapshot recorded', ...input.idNotes]
        .filter(Boolean)
        .join('. '),
    }
  }
  if (input.hashChanged) {
    return {
      status: 'stale',
      reason: ['Primary source content hash changed since last snapshot', ...input.idNotes]
        .filter(Boolean)
        .join('; '),
    }
  }
  return {
    status: 'current',
    reason: ['URL OK; content hash unchanged', ...input.idNotes].filter(Boolean).join('. '),
  }
}
